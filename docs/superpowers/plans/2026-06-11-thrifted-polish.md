# thrifted. Polish-to-Mockup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring the live `thrifted.` UI into alignment with the four approved mobile mockups via four surgical visual/UX changes.

**Architecture:** Pure frontend polish on a React (Vite) app. No backend, routes, schema, or dependencies change. Changes are scoped to four existing files. The DB-facing `status` values (`unsold`/`listed`/`sold`) and all AI result fields stay wired exactly as today; only presentation changes.

**Tech Stack:** React 19 + Vite, inline-style design system in `src/lib/ui.jsx`, `react-router-dom`. No test runner — verification is `npm run build` + browser preview against the mockups.

**Spec:** `docs/superpowers/specs/2026-06-11-thrifted-polish-design.md`

---

## File Structure

| File | Responsibility | Change |
|------|----------------|--------|
| `src/lib/ui.jsx` | Shared design-system primitives | `SelectRow` accepts `{value,label}` options (strings still work) |
| `src/pages/AddItem.jsx` | New-find flow (photo → AI → form) | Friendly status labels; pass `thumb` to `AIPanel`; bottom "Save find" CTA |
| `src/components/AIPanel.jsx` | AI identification result card | Light restyle + thumbnail + "Fair resale range"; keep all content |
| `src/pages/Dashboard.jsx` | "Ledger" overview | Remove trailing mini-stat divider |

**Pre-flight (run once before Task 1):**
- [ ] Confirm the build command. Run: `cat package.json` and note the `scripts.build` (expected `vite build`) and `scripts.dev` (expected `vite`). Use those exact commands wherever this plan says `npm run build` / `npm run dev`.

---

## Task 1: Friendly status labels in `SelectRow`

Makes `SelectRow` render a human label while selecting on a separate value, then feeds the AddItem status row "In stock / Listed / Sold" instead of the raw lowercase keys.

**Files:**
- Modify: `src/lib/ui.jsx` (the `SelectRow` function, currently ~lines 149-178)
- Modify: `src/pages/AddItem.jsx` (the status `SelectRow`, currently ~lines 244-250)

- [ ] **Step 1: Update `SelectRow` to normalize options**

Replace the entire `SelectRow` function in `src/lib/ui.jsx` with:

```jsx
export function SelectRow({ value, onChange, options = PLATFORMS }) {
  const opts = options.map(o => (typeof o === 'string' ? { value: o, label: o } : o))
  return (
    <div className="no-scrollbar" style={{
      display: 'flex',
      gap: 6,
      overflowX: 'auto',
      WebkitOverflowScrolling: 'touch',
    }}>
      {opts.map(o => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          style={{
            all: 'unset',
            cursor: 'pointer',
            padding: '8px 12px',
            borderRadius: 999,
            fontSize: 12.5,
            fontWeight: 600,
            whiteSpace: 'nowrap',
            background: value === o.value ? PALETTE.blush700 : PALETTE.card,
            color: value === o.value ? PALETTE.blush50 : PALETTE.ink2,
            border: `1px solid ${value === o.value ? 'transparent' : PALETTE.hairline}`,
          }}
        >{o.label}</button>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Use friendly labels in AddItem's status row**

In `src/pages/AddItem.jsx`, replace the status `SelectRow` (inside the `Field label="Status"`):

```jsx
          <Field label="Status">
            <SelectRow
              value={status}
              onChange={setStatus}
              options={[
                { value: 'unsold', label: 'In stock' },
                { value: 'listed', label: 'Listed' },
                { value: 'sold', label: 'Sold' },
              ]}
            />
          </Field>
```

- [ ] **Step 3: Build to verify no syntax errors**

Run: `npm run build`
Expected: build completes, no errors.

- [ ] **Step 4: Visual check**

Run `npm run dev`, open `/add`, upload any photo, run Identify (or reach the form). The Status row must read **In stock / Listed / Sold**. Verify the Platform row (appears when status is Listed/Sold) still shows eBay/Poshmark/etc. and selects correctly — this confirms the string-options path still works.

- [ ] **Step 5: Commit**

```bash
git add src/lib/ui.jsx src/pages/AddItem.jsx
git commit -m "feat: friendly status labels in SelectRow"
```

---

## Task 2: AI result card light restyle

Rebuilds `AIPanel` as the light blush card from mockup screen 3 — thumbnail + "AI identified" + name/era + "Fair resale range" + description + confidence pill — keeping every field the dark card showed, with the comps row unchanged below.

**Files:**
- Modify: `src/components/AIPanel.jsx` (full rewrite of the component body)
- Modify: `src/pages/AddItem.jsx` (pass `thumb={photo}` into `<AIPanel/>`, ~lines 223-229)

- [ ] **Step 1: Rewrite `AIPanel.jsx`**

Replace the entire file `src/components/AIPanel.jsx` with:

```jsx
import { Label, PALETTE } from '../lib/ui'
import CompsPanel from './CompsPanel'

export default function AIPanel({ result, onAccept, accepted, thumb }) {
  if (!result) return null
  const { name, era, description, priceLow, priceHigh, suggestedPrice, confidence, searchQuery } = result
  const lo = priceLow ?? suggestedPrice
  const hi = priceHigh ?? suggestedPrice
  const conf = confidence || 'Medium'

  return (
    <>
      <div style={{
        margin: '14px 18px 0',
        background: PALETTE.blush50,
        border: `1px solid ${PALETTE.blush100}`,
        borderRadius: 18,
        overflow: 'hidden',
        padding: '14px 16px 16px',
      }}>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{
            width: 64,
            height: 64,
            flexShrink: 0,
            borderRadius: 13,
            overflow: 'hidden',
            background: 'linear-gradient(135deg, #fbe4e8 0%, #f0aab8 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {thumb ? (
              <img src={thumb} alt={name || 'Item'} style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
            ) : (
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={PALETTE.blush700} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4 Q11 2 13 2 Q15 2 15 4"/>
                <path d="M3 10 L13 4 L23 10"/>
                <line x1="2" y1="10" x2="24" y2="10"/>
              </svg>
            )}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
                <path d="M6 1L7.2 4.8L11 6L7.2 7.2L6 11L4.8 7.2L1 6L4.8 4.8Z" fill={PALETTE.blush700}/>
              </svg>
              <Label color={PALETTE.blush700} size={9.5}>AI identified</Label>
            </div>

            <div style={{
              fontFamily: 'Georgia, serif',
              fontSize: 15.5,
              fontWeight: 600,
              letterSpacing: -0.2,
              lineHeight: 1.2,
              color: PALETTE.ink,
            }}>
              {name}
              {era && <span style={{ fontStyle: 'italic', color: PALETTE.blush700 }}> · {era}</span>}
            </div>

            <div style={{ marginTop: 6, display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{
                fontFamily: 'Georgia, serif',
                fontSize: 18,
                fontWeight: 700,
                letterSpacing: -0.3,
                color: PALETTE.blush700,
              }}>
                <span style={{ opacity: 0.55, fontSize: 12 }}>$</span>{Math.round(lo)}
                {hi !== lo && <><span style={{ opacity: 0.5 }}>–</span>{Math.round(hi)}</>}
              </span>
              <span style={{ fontSize: 11, color: PALETTE.ink3 }}>fair resale range</span>
            </div>
          </div>
        </div>

        {description && (
          <p style={{
            margin: '12px 0 0',
            fontSize: 13,
            lineHeight: 1.5,
            color: PALETTE.ink2,
            letterSpacing: -0.1,
          }}>{description}</p>
        )}

        <div style={{
          marginTop: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
        }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            background: PALETTE.blush100,
            color: PALETTE.blush700,
            padding: '4px 10px',
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: 0.3,
            whiteSpace: 'nowrap',
          }}>Confidence · {conf}</span>

          {!accepted && onAccept && (
            <button
              type="button"
              onClick={onAccept}
              style={{
                all: 'unset',
                cursor: 'pointer',
                padding: '10px 16px',
                background: PALETTE.blush700,
                color: PALETTE.blush50,
                borderRadius: 12,
                fontWeight: 700,
                fontSize: 13.5,
                textAlign: 'center',
                letterSpacing: -0.1,
                whiteSpace: 'nowrap',
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

- [ ] **Step 2: Pass the photo thumbnail from AddItem**

In `src/pages/AddItem.jsx`, update the `<AIPanel/>` usage:

```jsx
        <AIPanel
          result={aiResult}
          thumb={photo}
          onAccept={() => setStep(STEPS.FORM)}
          accepted={step === STEPS.FORM}
        />
```

(`photo` is the existing object-URL state set in `handlePhotoChange`.)

- [ ] **Step 3: Build to verify no syntax errors**

Run: `npm run build`
Expected: build completes, no errors.

- [ ] **Step 4: Visual check against mockup screen 3**

Run `npm run dev`, go to `/add`, upload a photo, run Identify. Confirm the result card is now the **light blush card** with: the photo thumbnail (top-left), `AI identified` eyebrow, serif name (+ era if present), **"Fair resale range" $lo–$hi**, the description paragraph, a `Confidence · …` pill, the `Looks right →` button, and the **Shop comps** row still rendered below. Nothing from the old dark card is missing. Tap `Looks right →` and confirm the button disappears (accepted state) while the pill remains.

- [ ] **Step 5: Commit**

```bash
git add src/components/AIPanel.jsx src/pages/AddItem.jsx
git commit -m "feat: restyle AI result card to light mockup design"
```

---

## Task 3: Bottom "Save find" CTA on AddItem

Adds a thumb-reachable primary Save button at the end of the form, alongside the existing header Save.

**Files:**
- Modify: `src/pages/AddItem.jsx` (inside the `(step === STEPS.RESULT || step === STEPS.FORM)` form block, after the Notes `Field`, ~line 258)

- [ ] **Step 1: Add the bottom CTA**

In `src/pages/AddItem.jsx`, inside the form block that ends with the Notes `Field`, add the button immediately after the closing `</Field>` of Notes and before that block's closing `</div>`:

```jsx
          <Field label="Notes">
            <TextArea value={notes} onChange={setNotes} placeholder="Condition, provenance, buyer notes…"/>
          </Field>

          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave || saving}
            style={{
              all: 'unset',
              cursor: canSave && !saving ? 'pointer' : 'default',
              marginTop: 16,
              padding: '15px 18px',
              width: '100%',
              boxSizing: 'border-box',
              background: canSave && !saving ? PALETTE.ink : PALETTE.warmStone,
              color: canSave && !saving ? PALETTE.blush50 : PALETTE.ink3,
              borderRadius: 14,
              fontWeight: 700,
              fontSize: 15,
              textAlign: 'center',
              letterSpacing: -0.1,
            }}
          >{saving ? 'Saving…' : 'Save find'}</button>
```

(`handleSave`, `canSave`, `saving`, and `PALETTE` are all already in scope in this component.)

- [ ] **Step 2: Build to verify no syntax errors**

Run: `npm run build`
Expected: build completes, no errors.

- [ ] **Step 3: Visual + functional check**

Run `npm run dev`, reach the AddItem form. Confirm a dark **Save find** button sits below Notes. Fill name + paid, tap it, and confirm the item saves and navigates to `/inventory` (same behavior as the header Save). While saving, the label reads `Saving…`.

- [ ] **Step 4: Commit**

```bash
git add src/pages/AddItem.jsx
git commit -m "feat: add bottom Save find CTA to AddItem form"
```

---

## Task 4: Remove trailing mini-stat divider on Ledger

The Dashboard hero's three mini-stats each have a right divider, leaving a dangling rule after "Margin". Remove it on the last cell.

**Files:**
- Modify: `src/pages/Dashboard.jsx` (the `MiniStat` component ~lines 7-28, and the `Margin` usage ~line 128)

- [ ] **Step 1: Add a `last` prop to `MiniStat`**

In `src/pages/Dashboard.jsx`, update the `MiniStat` component's wrapper `div` style:

```jsx
function MiniStat({ label, value, fg, suffix, last }) {
  return (
    <div style={{ textAlign: 'center', borderRight: last ? 'none' : '1px solid rgba(244,168,180,0.14)' }}>
```

(Leave the rest of the component unchanged.)

- [ ] **Step 2: Mark the Margin cell as last**

In the same file, update the third `MiniStat` usage:

```jsx
            <MiniStat label="Margin" value={stats.margin} suffix="%" fg={PALETTE.blush300} last />
```

- [ ] **Step 3: Build to verify no syntax errors**

Run: `npm run build`
Expected: build completes, no errors.

- [ ] **Step 4: Visual check**

Run `npm run dev`, open `/dashboard`. In the dark hero's stat row, confirm there is **no vertical rule to the right of the Margin value** (dividers remain between Invested|Earned and Earned|Margin).

- [ ] **Step 5: Commit**

```bash
git add src/pages/Dashboard.jsx
git commit -m "fix: remove trailing divider on Ledger mini-stats"
```

---

## Task 5: Final whole-flow verification

Confirm all four screens match their mockups with no regressions.

- [ ] **Step 1: Full build**

Run: `npm run build`
Expected: clean build.

- [ ] **Step 2: Walk the flow in preview**

Run `npm run dev` and verify, screen by screen:
- **Inventory** (`/inventory`) — unchanged, still matches mockup 1 (grid, profit card, filter pills).
- **Log find** (`/add`) — status row reads In stock / Listed / Sold; bottom Save find present.
- **AI result** — light card with thumbnail + Fair resale range + description + confidence + comps; `Looks right →` works.
- **Ledger** (`/dashboard`) — no trailing divider after Margin; Best find + tiles unchanged.

- [ ] **Step 3: Regression spot-checks**
- Save a new find end-to-end (photo → identify → edit a field → Save find) and confirm it appears in Inventory with the correct status.
- Open an existing item (`/item/:id`) and confirm the Platform `SelectRow` still works (string-options regression).

- [ ] **Step 4: Confirm deploy path**

This is a visual change only. Deploy per the repo's process (`netlify deploy --build --prod`, or Git-CD if connected) only when the user asks — do not deploy automatically.

---

## Self-Review Notes

- **Spec coverage:** Spec §1 → Task 1; §2 → Task 2; §3 → Task 3; §4 (mini-stat divider) → Task 4; Inventory/Ledger "no change" → confirmed in Task 5. All spec sections mapped.
- **Type consistency:** `SelectRow` selects on `o.value` everywhere; AddItem status options use `{value,label}`; Platform options remain strings (normalized to `{value,label}` internally). `AIPanel` prop `thumb` defined in Task 2 and supplied from AddItem's existing `photo` state. `MiniStat`'s new `last` prop defined and used in Task 4.
- **No placeholders:** every code step shows complete code; no TODO/TBD.
