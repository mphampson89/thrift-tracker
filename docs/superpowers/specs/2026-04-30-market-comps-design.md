# Market Comps Feature — Design Spec
*2026-04-30*

## Summary

After the AI identifies an item, show the user tappable links to live marketplace searches so she can see what similar items are currently listed or sold for. Links open in the browser. No new paid APIs required.

---

## Problem

The AI suggests a price based on its training data, but it can't see what's actually listed for sale *right now*. Real market comps give the user a more grounded sense of what to charge.

---

## Approach

Use Claude to return an optimized `searchQuery` string alongside the existing AI fields. Construct pre-built search URLs from that query for six platforms and render them as a tappable button row in two places: the AI result panel (immediately after identification) and the item detail/edit page (for later reference).

---

## Backend Changes

### Netlify Function — `netlify/functions/analyze-photo.js`

Add `searchQuery` to the JSON schema Claude is asked to return:

```
searchQuery: 3–6 word string optimized for finding this exact item on resale marketplaces.
Include brand, model, material, and era if relevant.
Example: "Fendi zucca monogram canvas tote"
```

The function already parses a JSON response from Claude — `searchQuery` slots in alongside `name`, `description`, `priceLow`, `priceHigh`.

### Supabase — `items` table

Add one column:

| Column | Type | Nullable |
|---|---|---|
| `search_query` | text | yes |

### AddItem.jsx — save flow

When inserting to Supabase, include `search_query: aiResult?.searchQuery ?? null`.

---

## Frontend Changes

### New component — `src/components/CompsPanel.jsx`

**Props:** `searchQuery` (string) — the query to use. Callers pass `item.search_query ?? item.name`.

**State:** `activeplatformss` — a `Set` of platform keys, initialised to all six. Each pill button toggles its platform in/out of the set. Deselected platforms are visually dimmed but remain tappable to re-enable. State resets when the component unmounts (per-session).

**Renders:** A label ("Shop comps") and a horizontally scrollable row of pill buttons, one per platform:

| Label | URL pattern |
|---|---|
| eBay Active | `https://www.ebay.com/sch/i.html?_nkw={query}` |
| eBay Sold | `https://www.ebay.com/sch/i.html?_nkw={query}&LH_Sold=1&LH_Complete=1` |
| Poshmark | `https://poshmark.com/search?query={query}` |
| Depop | `https://www.depop.com/search/?q={query}` |
| Mercari | `https://www.mercari.com/search/?keyword={query}` |
| Google Shopping | `https://www.google.com/search?q={query}&tbm=shop` |

Each button is an `<a target="_blank" rel="noopener noreferrer">` link when active, and a plain `<button>` that re-enables the platform when deselected. Query is `encodeURIComponent`-encoded. Styling matches the app's existing pill button style (same border-radius, font weight, PALETTE colors). Deselected pills use a dimmed/strikethrough treatment to signal they're off.

### AIPanel.jsx

Add `<CompsPanel searchQuery={result.searchQuery ?? result.name} />` below the price suggestion block. Visible as soon as the AI result is shown — before the user accepts or fills in the form.

### EditItem.jsx

Add `<CompsPanel searchQuery={item.search_query ?? item.name} />` near the bottom of the page, above the save/delete buttons. Always visible (every item has a name).

---

## Edge Cases

| Scenario | Behaviour |
|---|---|
| Item logged manually (no AI) | `search_query` is null → `CompsPanel` uses `item.name` as fallback |
| AI runs but omits `searchQuery` | Same fallback to `item.name` |
| Item has no name yet (mid-form) | `CompsPanel` not shown in `AIPanel` until `result.name` exists |

---

## Out of Scope

- Embedding live listing data inside the app (requires paid API)
- Saving which platform links were tapped
- Persistent platform preferences across sessions
