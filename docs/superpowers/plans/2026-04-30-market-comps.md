# Market Comps Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** After AI identifies an item, show tappable platform-search links (eBay, Poshmark, Depop, Mercari, Google Shopping) so the user can see real market comps without leaving the app permanently.

**Architecture:** The Netlify function returns an optimized `searchQuery` string; it's saved to a new `search_query` column in Supabase. A new `CompsPanel` component renders per-session-toggleable platform pills, and is used in both `AIPanel` (right after identification) and `EditItem` (for later reference). Inactive pills show strikethrough and can be re-enabled; active pills open the search in a new browser tab.

**Tech Stack:** React (Vite), Tailwind v4, Supabase, Netlify Functions, Claude API (existing)

---

## File Map

| Action | File | Purpose |
|---|---|---|
| Modify | `netlify/functions/analyze-photo.js` | Add `searchQuery` to the Claude prompt |
| Modify | `src/pages/AddItem.jsx` | Save `search_query` to Supabase on insert |
| Create | `src/components/CompsPanel.jsx` | Reusable platform-link pill row with per-session toggle |
| Modify | `src/components/AIPanel.jsx` | Render `CompsPanel` below the dark AI card |
| Modify | `src/pages/EditItem.jsx` | Render `CompsPanel` above Save/Delete buttons |

---

## Task 1: Add `search_query` column in Supabase

This is a manual step in the Supabase dashboard — no code needed.

- [ ] **Step 1: Open the Supabase SQL editor**

  Go to https://supabase.com → your project → SQL Editor.

- [ ] **Step 2: Run the migration**

  ```sql
  ALTER TABLE items ADD COLUMN search_query text;
  ```

- [ ] **Step 3: Verify**

  In Table Editor, confirm `search_query` appears as a nullable text column on the `items` table. Existing rows will have `null` — that's correct.

---

## Task 2: Update Netlify function to return `searchQuery`

**Files:**
- Modify: `netlify/functions/analyze-photo.js`

- [ ] **Step 1: Replace the file contents**

  Open `netlify/functions/analyze-photo.js` and replace the entire file with:

  ```js
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
  ```

  Changes vs the original: `max_tokens` bumped from 700 → 900, and `searchQuery` added as the last field in the JSON schema.

- [ ] **Step 2: Commit**

  ```bash
  git add netlify/functions/analyze-photo.js
  git commit -m "feat: return searchQuery from analyze-photo function"
  ```

---

## Task 3: Save `search_query` when adding an item

**Files:**
- Modify: `src/pages/AddItem.jsx` (the `supabase.from('items').insert({...})` call, around line 84)

- [ ] **Step 1: Add `search_query` to the insert**

  **Before:**
  ```js
  await supabase.from('items').insert({
    name,
    cost: parseFloat(cost),
    listing_price: listing ? parseFloat(listing) : null,
    ai_suggested_price: suggestedAvg ? parseFloat(suggestedAvg) : null,
    status,
    listed_on: platform || null,
    notes: notes || null,
    photo_url: photoUrl,
  })
  ```

  **After:**
  ```js
  await supabase.from('items').insert({
    name,
    cost: parseFloat(cost),
    listing_price: listing ? parseFloat(listing) : null,
    ai_suggested_price: suggestedAvg ? parseFloat(suggestedAvg) : null,
    status,
    listed_on: platform || null,
    notes: notes || null,
    photo_url: photoUrl,
    search_query: aiResult?.searchQuery ?? null,
  })
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add src/pages/AddItem.jsx
  git commit -m "feat: persist search_query from AI result to Supabase"
  ```

---

## Task 4: Build the `CompsPanel` component

**Files:**
- Create: `src/components/CompsPanel.jsx`

- [ ] **Step 1: Create the file**

  Create `src/components/CompsPanel.jsx` with this content:

  ```jsx
  import { useState } from 'react'
  import { Label, PALETTE } from '../lib/ui'

  const COMP_PLATFORMS = [
    { key: 'ebay-active', label: 'eBay Active',    url: q => `https://www.ebay.com/sch/i.html?_nkw=${q}` },
    { key: 'ebay-sold',   label: 'eBay Sold',       url: q => `https://www.ebay.com/sch/i.html?_nkw=${q}&LH_Sold=1&LH_Complete=1` },
    { key: 'poshmark',    label: 'Poshmark',        url: q => `https://poshmark.com/search?query=${q}` },
    { key: 'depop',       label: 'Depop',           url: q => `https://www.depop.com/search/?q=${q}` },
    { key: 'mercari',     label: 'Mercari',         url: q => `https://www.mercari.com/search/?keyword=${q}` },
    { key: 'google',      label: 'Google Shopping', url: q => `https://www.google.com/search?q=${q}&tbm=shop` },
  ]

  export default function CompsPanel({ searchQuery, style = {} }) {
    const [active, setActive] = useState(() => new Set(COMP_PLATFORMS.map(p => p.key)))

    function toggle(key) {
      setActive(prev => {
        const next = new Set(prev)
        if (next.has(key)) next.delete(key)
        else next.add(key)
        return next
      })
    }

    const q = encodeURIComponent(searchQuery || '')

    return (
      <div style={{ margin: '14px 18px 0', ...style }}>
        <Label style={{ marginBottom: 8 }}>Shop comps</Label>
        <div
          className="no-scrollbar"
          style={{
            display: 'flex',
            gap: 6,
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
            paddingBottom: 2,
          }}
        >
          {COMP_PLATFORMS.map(({ key, label, url }) => {
            const isActive = active.has(key)
            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  if (isActive) window.open(url(q), '_blank', 'noopener,noreferrer')
                  else toggle(key)
                }}
                style={{
                  all: 'unset',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '7px 12px',
                  borderRadius: 999,
                  fontSize: 12.5,
                  fontWeight: 600,
                  letterSpacing: -0.1,
                  whiteSpace: 'nowrap',
                  background: isActive ? PALETTE.blush50 : 'transparent',
                  color: isActive ? PALETTE.blush700 : PALETTE.ink2,
                  border: isActive
                    ? `1px solid ${PALETTE.blush100}`
                    : `1px solid ${PALETTE.hairline}`,
                  opacity: isActive ? 1 : 0.45,
                  textDecoration: isActive ? 'none' : 'line-through',
                }}
              >
                {label}
                {isActive && (
                  <span
                    onClick={e => { e.stopPropagation(); toggle(key) }}
                    style={{ fontSize: 11, opacity: 0.45, lineHeight: 1 }}
                  >×</span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    )
  }
  ```

  **How it works:**
  - All 6 platforms start active.
  - Tapping an active pill calls `window.open()` to open the search in a new browser tab.
  - The `×` on each active pill deactivates it (strikethrough + dimmed). `stopPropagation` prevents the parent button's `onClick` from also firing, so the link doesn't open.
  - Tapping a deactivated pill re-activates it.
  - The `style` prop lets callers override the outer margin (needed in `EditItem` where the parent already provides horizontal padding).

- [ ] **Step 2: Commit**

  ```bash
  git add src/components/CompsPanel.jsx
  git commit -m "feat: add CompsPanel component with per-session platform toggles"
  ```

---

## Task 5: Add `CompsPanel` to `AIPanel`

**Files:**
- Modify: `src/components/AIPanel.jsx`

The current `AIPanel` returns a single `<div>`. We need it to return a Fragment so `CompsPanel` can sit below the dark card at the same layout level — avoiding double horizontal margins (AIPanel's dark card already uses `margin: '14px 18px 0'`; `CompsPanel` does too by default).

- [ ] **Step 1: Replace the full file contents**

  Replace `src/components/AIPanel.jsx` with:

  ```jsx
  import { Label, PALETTE } from '../lib/ui'
  import CompsPanel from './CompsPanel'

  export default function AIPanel({ result, onAccept, accepted }) {
    if (!result) return null
    const { name, era, description, priceLow, priceHigh, suggestedPrice, confidence, searchQuery } = result
    const lo = priceLow ?? suggestedPrice
    const hi = priceHigh ?? suggestedPrice
    const conf = confidence || 'Medium'

    return (
      <>
        <div style={{
          margin: '14px 18px 0',
          background: PALETTE.ink,
          borderRadius: 22,
          overflow: 'hidden',
          position: 'relative',
          color: PALETTE.blush50,
        }}>
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(circle at 10% 0%, rgba(244,168,180,0.14) 0%, transparent 60%)',
          }}/>
          <div style={{ position: 'relative', padding: '14px 16px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{
                width: 18,
                height: 18,
                borderRadius: 999,
                background: PALETTE.blush300,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <svg width="10" height="10" viewBox="0 0 10 10">
                  <path d="M5 1L6 4L9 5L6 6L5 9L4 6L1 5L4 4Z" fill={PALETTE.ink}/>
                </svg>
              </span>
              <Label color={PALETTE.blush300}>Identified</Label>
            </div>

            <div style={{
              fontFamily: 'Georgia, serif',
              fontSize: 22,
              fontWeight: 600,
              letterSpacing: -0.4,
              lineHeight: 1.15,
            }}>
              {name}
              {era && (
                <>
                  <br/>
                  <span style={{ fontStyle: 'italic', color: PALETTE.blush300 }}>{era}</span>
                </>
              )}
            </div>

            {description && (
              <p style={{
                margin: '12px 0 0',
                fontSize: 13.2,
                lineHeight: 1.55,
                color: '#e8c5cc',
                letterSpacing: -0.1,
              }}>{description}</p>
            )}

            <div style={{
              marginTop: 14,
              padding: '12px 14px',
              borderRadius: 14,
              background: 'rgba(244,168,180,0.14)',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
            }}>
              <div>
                <Label color={PALETTE.blush300}>Suggested resale</Label>
                <div style={{
                  marginTop: 2,
                  fontFamily: 'Georgia, serif',
                  fontSize: 26,
                  fontWeight: 700,
                  letterSpacing: -0.6,
                }}>
                  <span style={{ opacity: 0.6, fontSize: 16 }}>$</span>
                  {Math.round(lo)}
                  {hi !== lo && <><span style={{ opacity: 0.5 }}>–</span>{Math.round(hi)}</>}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <Label color={PALETTE.blush300}>Confidence</Label>
                <div style={{ marginTop: 2, fontSize: 14, fontWeight: 600 }}>{conf}</div>
              </div>
            </div>

            {!accepted && onAccept && (
              <button
                type="button"
                onClick={onAccept}
                style={{
                  all: 'unset',
                  cursor: 'pointer',
                  marginTop: 12,
                  padding: '11px 14px',
                  width: '100%',
                  boxSizing: 'border-box',
                  background: PALETTE.blush50,
                  color: PALETTE.ink,
                  borderRadius: 14,
                  fontWeight: 700,
                  fontSize: 14,
                  textAlign: 'center',
                  letterSpacing: -0.1,
                }}
              >Looks right →</button>
            )}
          </div>
        </div>

        <CompsPanel searchQuery={searchQuery ?? name} />
      </>
    )
  }
  ```

  The only meaningful changes vs the original:
  - Wraps the return in a `<>` Fragment instead of a single `<div>`
  - Adds `import CompsPanel from './CompsPanel'`
  - Destructures `searchQuery` from `result`
  - Renders `<CompsPanel searchQuery={searchQuery ?? name} />` after the dark card, both at 18px horizontal margin

- [ ] **Step 2: Commit**

  ```bash
  git add src/components/AIPanel.jsx
  git commit -m "feat: show CompsPanel in AIPanel after item identification"
  ```

---

## Task 6: Add `CompsPanel` to `EditItem`

**Files:**
- Modify: `src/pages/EditItem.jsx`

`EditItem`'s content lives inside `<div style={{ padding: '16px 20px 0' }}>`, so `CompsPanel`'s default 18px horizontal margin would stack on top of the 20px padding (38px total). Pass `style={{ margin: '14px 0 0' }}` to remove the horizontal margin and align the pills with the rest of the form.

- [ ] **Step 1: Import CompsPanel**

  At the top of `src/pages/EditItem.jsx`, add the import alongside the existing component imports:

  ```jsx
  import CompsPanel from '../components/CompsPanel'
  ```

- [ ] **Step 2: Render CompsPanel above the Save button**

  Find the Save button (around line 213). Insert `<CompsPanel>` directly before it:

  **Before:**
  ```jsx
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          style={{
            all: 'unset',
            cursor: 'pointer',
            marginTop: 8,
  ```

  **After:**
  ```jsx
        <CompsPanel searchQuery={item.search_query ?? name} style={{ margin: '14px 0 0' }} />

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          style={{
            all: 'unset',
            cursor: 'pointer',
            marginTop: 8,
  ```

  `item` is loaded from Supabase (includes `search_query`). `name` is the controlled state variable already in scope. The fallback `item.search_query ?? name` uses the AI-optimized query when available, and the item name otherwise.

- [ ] **Step 3: Commit**

  ```bash
  git add src/pages/EditItem.jsx
  git commit -m "feat: show CompsPanel on EditItem page"
  ```

---

## Task 7: Deploy and verify

- [ ] **Step 1: Deploy to production**

  Open PowerShell, navigate to the project folder, and run:

  ```powershell
  cd "C:\Users\phampson\OneDrive\Documents\claude-sandbox\thrift-tracker"
  netlify deploy --build --prod
  ```

  Expected: Build succeeds, no errors, deploy URL printed.

- [ ] **Step 2: Verify on a new item (AIPanel flow)**

  1. Open https://thrift-tracker-mph.netlify.app
  2. Tap "Log find" → upload a photo → tap "Identify with AI"
  3. After the AI result appears, confirm:
     - "Shop comps" label visible below the dark AI card
     - 6 platform pills: eBay Active, eBay Sold, Poshmark, Depop, Mercari, Google Shopping
     - Tapping a pill opens the correct site in a new browser tab with the `searchQuery` as search terms (not just the item name)
     - Tapping `×` on a pill dims it and shows strikethrough
     - Tapping the dimmed pill re-activates it

- [ ] **Step 3: Verify on an existing AI-identified item (EditItem)**

  1. Open Inventory → tap an item that was identified by AI
  2. Confirm "Shop comps" section appears above "Save changes"
  3. Open eBay Active — confirm the search terms are the refined `search_query` (e.g. "Fendi zucca canvas tote"), not just the raw item name

- [ ] **Step 4: Verify on a manually logged item (EditItem fallback)**

  1. Open Inventory → tap an item that was logged without AI (or create one manually)
  2. Confirm "Shop comps" section still appears
  3. Open eBay Active — confirm the search terms match the item's name field

- [ ] **Step 5: Verify `search_query` is saved to Supabase**

  In Supabase Table Editor → `items` table → find the newly AI-identified item. Confirm `search_query` is populated with a concise string, not null.
