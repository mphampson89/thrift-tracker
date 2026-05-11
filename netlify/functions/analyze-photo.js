export const handler = async (event) => {
  const { base64, mediaType, context } = JSON.parse(event.body)

  const userNote = context && context.trim()
    ? `\n\nThe user added these notes — take them seriously when identifying and pricing, especially condition flaws or details not visible in the photo:\n"${context.trim()}"`
    : ''

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.CLAUDE_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 900,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: base64 },
            },
            {
              type: 'text',
              text: `You are an expert thrift store and resale stylist. Identify the item in the photo and respond ONLY with a JSON object, no prose, no code fence:

{
  "name": "Item name with brand if visible (e.g. Pendleton Wool Throw)",
  "era": "Optional short italicized context like 'park series, c. 1970s' or 'late-90s' (omit field if unknown)",
  "description": "One stylish sentence in the voice of a knowledgeable shop owner — read the condition and a market signal (e.g. 'Heavyweight wool with original woven label; small fade on the binding consistent with age. Strong demand on eBay; auction-style listings clear quickly.').",
  "priceLow": 140,
  "priceHigh": 165,
  "confidence": "Low" | "Medium" | "High",
  "searchQuery": "brand model material — 3 to 6 words optimized for resale marketplace search (e.g. \\"Fendi zucca canvas tote\\")"
}

Prices are realistic USD resale values, no dollar signs, integers only. Lower the price range if the user-reported condition is rough.${userNote}`,
            },
          ],
        },
      ],
    }),
  })

  const data = await response.json()
  const text = data.content[0].text
  const json = JSON.parse(text.match(/\{[\s\S]*\}/)[0])

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(json),
  }
}
