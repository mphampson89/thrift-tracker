# thrifted. — Polish-to-Mockup Design Spec

**Date:** 2026-06-11
**Repo:** thrift-tracker (`mphampson89/...`, live at thrift-tracker-mph.netlify.app)
**Scope:** Visual/UX polish only. Bring the live UI into alignment with the four approved mobile mockups (Inventory → Log find → AI result → Ledger). No backend, no new routes, no schema/data changes, no new dependencies.

## Context

The live app already implements every screen in the mockups (Inventory, AddItem with AI identify, Dashboard/"Ledger", EditItem). A source audit found the app matches the mockups closely; this spec captures only the genuine deltas. The stack is React (Vite) + a Supabase-shaped shim (`src/lib/supabase.js`) → Netlify Functions → Neon + Netlify Blobs. Single-user app (Patrick's wife) — skip compliance/scale machinery.

Design system (already in `src/lib/ui.jsx` / `src/index.css`), unchanged by this spec:
- Palette: canvas `#fdf5f4`, card `#fff`, ink `#3a1d29`, blush 50 `#fdeef0` / 100 `#fad6db` / 300 `#f4a8b4` / 700 `#c25a78` / 900 `#7a2c45`, hairline `#f1dfe1`.
- Type: Georgia serif for display numerals/headlines; system sans for UI; uppercase tracked `Label`.

## Changes

### 1. Friendly status labels in `SelectRow` (AddItem)

**Problem:** `SelectRow` renders each option string verbatim as its button label. AddItem calls it with raw status keys:
```jsx
<SelectRow value={status} onChange={setStatus} options={['unsold', 'listed', 'sold']} />
```
so the New-find status buttons read **"unsold / listed / sold"** (lowercase) instead of friendly labels.

**Fix:** Extend `SelectRow` (in `src/lib/ui.jsx`) to accept options as either strings (current behavior, unchanged) **or** `{ value, label }` objects. When an option is an object, compare/select on `value` and render `label`.

In `AddItem.jsx`, pass friendly labels that match the existing `StatusPill` map:
```jsx
options={[
  { value: 'unsold', label: 'In stock' },
  { value: 'listed', label: 'Listed' },
  { value: 'sold', label: 'Sold' },
]}
```

**Constraints:**
- The Platform `SelectRow` call sites (AddItem + EditItem, using `PLATFORMS` strings) must keep working unchanged — string options stay supported.
- No change to `status` values persisted to the DB (`unsold` / `listed` / `sold`).

### 2. AI result card — light restyle (`AIPanel.jsx`)

**Decision:** Restyle the live dark `AIPanel` into the lighter blush card from mockup screen 3, **re-homing all existing functional content so nothing is lost** (era, description, confidence, comps).

**New layout** (light card: `background: blush50`, `border: 1px blush100`, `borderRadius: 18`, padding ~`14px 16px`):
- **Thumbnail:** 64×64 rounded (`radius 13`) image of the captured photo at the card's top-left, with the text block beside it. AddItem passes the photo object-URL via a new `thumb` prop. If `thumb` is absent, render the existing blush hanger placeholder tile instead.
- **Eyebrow:** `✦` sparkle glyph (reuse the existing inline sparkle SVG) + `AI IDENTIFIED` label in `blush700`.
- **Name:** serif, `~15px`, ink. If `era` present, show it italic in `blush700` beside/under the name (as today).
- **Resale range:** label renamed **"Suggested resale" → "Fair resale range"**; value `$lo–$hi` in serif `blush700` (~18px), with the muted "fair resale range" hint text to its right (matches mockup).
- **Description:** existing `description` paragraph, `ink2`, below the header row (kept).
- **Confidence:** rendered as a small pill (`blush100` bg, `blush700` text) reading `Confidence · {level}` (re-homed from the dark card's right column).
- **Accept button:** keep `Looks right →`; restyle to the light context (blush700 fill, blush50 text) so it reads as the primary affordance on a light card.
- **Comps:** `CompsPanel` ("Shop comps") stays rendered below the card exactly as today — not absorbed into the card.

**Props:** `AIPanel` gains an optional `thumb` (string URL). Existing `result`, `onAccept`, `accepted` unchanged. `AddItem` passes `thumb={photo}`.

**Constraints:**
- All fields the dark card displayed (`name`, `era`, `description`, `priceLow`/`priceHigh`/`suggestedPrice`, `confidence`, `searchQuery`) must remain visible or wired exactly as before. The `lo`/`hi`/`conf` fallbacks in the current component are preserved.
- No change to `CompsPanel`.

### 3. Bottom "Save find" CTA (AddItem)

**Add** a dark ink **"Save find"** button (ink `#3a1d29` bg, `blush50` text, `radius 14`) at the end of the AddItem form (after Notes), per mockup screen 3, so the primary action is reachable at the bottom of a long form.
- Wires to the existing `handleSave`.
- Disabled (and visibly muted) until `canSave` (i.e. `step === RESULT || FORM`) and not `saving`; label shows `Saving…` while in flight, matching the header Save.
- **Keep** the existing header Save button — both trigger the same handler.

### 4. Minor cosmetics

- **Dashboard mini-stats:** remove the trailing right divider on the last (`Margin`) cell — currently every `MiniStat` has `borderRight`, leaving a dangling rule. Apply the border to the first two cells only (or drop it on `:last-child`).
- No changes to Inventory or the Ledger hero — they already match the mockups.

## Out of scope (explicitly not in this spec)

- Item detail / EditItem redesign, empty/first-run state, native mobile build (separate efforts if wanted).
- Any backend, Netlify Function, Neon, or Blobs change.
- New themes, icons, or PWA manifest work.

## Files touched

| File | Change |
|------|--------|
| `src/lib/ui.jsx` | `SelectRow`: support `{value,label}` options (strings still work). |
| `src/components/AIPanel.jsx` | Light restyle, `thumb` prop, "Fair resale range" wording, confidence pill; keep all content + comps. |
| `src/pages/AddItem.jsx` | Friendly status labels; pass `thumb={photo}` to `AIPanel`; add bottom "Save find" CTA. |
| `src/pages/Dashboard.jsx` | Remove trailing mini-stat divider. |

## Verification

No automated test suite exists in this repo, so verification is **build-clean + visual preview against the mockups**:

1. `npm run build` (or the repo's build) completes with no errors.
2. Run the dev server / preview and check each touched screen:
   - **AddItem status row** reads **In stock / Listed / Sold** (not lowercase keys); selecting one still persists the correct underlying status on save.
   - **AI result card** is the light blush card with a thumbnail of the photo, eyebrow `AI IDENTIFIED`, serif name (+ era), **"Fair resale range" $lo–$hi**, the description paragraph, a Confidence pill, the `Looks right →` button, and the Shop-comps row below — i.e. no content lost vs. the old dark card.
   - **Bottom "Save find"** button appears after Notes, is disabled until a result/form step, and saves correctly.
   - **Ledger** mini-stats no longer show a dangling divider after Margin.
3. Platform `SelectRow` (AddItem + EditItem) still renders eBay/Poshmark/etc. and selects correctly (regression check for the string-options path).

## Success criteria

All four screens visually match their approved mockups; no functional regressions in identify → review → save; the Platform selector and persisted status values are unchanged.
