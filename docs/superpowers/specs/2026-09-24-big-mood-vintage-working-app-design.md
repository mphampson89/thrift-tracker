# Big Mood Vintage — working app specification

**Status:** DRAFT for external audit, 2026-09-24. Not approved for build.
**Branch:** `codex/big-mood-review-handoff` in `mphampson89/thrift-tracker`.

## Plain-English summary

This describes the real app that replaces the clickable preview: Jenn's record of her resale business, from finding a piece to getting paid for it and seeing what made money. It keeps everything the preview demonstrated, but with real saved data, a login, and Patrick limited to viewing. It does not post to Instagram, talk to the bank, or take payments; she still does those by hand. Section 13 lists the choices this spec assumes that Patrick has not yet confirmed.

## 1. Sources of truth

- Agreed scope: `prototypes/big-mood/PRODUCT.md`. Visual direction: `prototypes/big-mood/DESIGN.md`. Session state: `prototypes/big-mood/HANDOFF.md`.
- Behaviour reference: the clickable prototype at https://preview.bigmoodvintage.com/?view=iphone (source `prototypes/big-mood/src`). The prototype's calculation shortcuts (whole-order restock, costs read live from items, bundle allocation at report time) are **not** to be copied; section 6 replaces them.
- Existing app: Thrifted, live at thrift-tracker-mph.netlify.app (Netlify site `f1beace9-…`), Neon project `rough-firefly-26516723`, table `items`, photos in Netlify Blobs store `item-photos`, Claude vision function `netlify/functions/analyze-photo.js`.

## 2. Users and roles

| Role | Who | Can |
|---|---|---|
| Owner | Jenn | Everything in this spec. |
| Viewer | Patrick | Read every screen and report, and export CSVs. Cannot create, edit, delete, confirm payments, or trigger paid AI. |

- Roles are enforced **on the server** for every write and every paid call. Hiding buttons is only a courtesy.
- Customer contact details and private flags are personal information: every read requires a signed-in session. No public endpoint returns business data.

## 3. Decisions already made (do not reopen)

| Topic | Decision | Date |
|---|---|---|
| Name | Big Mood Vintage; Thrifted retired | 2026-09-24 |
| Look | Clubhouse direction only (other two directions dropped) | 2026-09-22 |
| Logo | Her own original Instagram logo (blue circle, burgundy wordmark). File still to be supplied | 2026-09-24 |
| Photos | Kept as taken; optional per-photo Brighten. Original always retained; colours and flaws must stay true | 2026-09-24 |
| Local delivery | Fee agreed per order and typed on the order; no rate table | 2026-09-24 |
| Shipping (Canada) | Buyer pays actual quoted carrier cost, added to the order; app records amount charged and actual postage paid separately | 2026-09-24 |
| Sources | Editable store list, plus fixed Personal wardrobe and Not recorded | 2026-09-22 |
| Platforms | Editable list (starter: Instagram, Website, Poshmark) plus fixed Not recorded; add/rename/remove; removal keeps orders as Not recorded | 2026-09-24 |
| Payments | E-transfer only, manually confirmed against the bank | PRODUCT.md |
| Messaging | Stays in Instagram; app prepares text and images only | PRODUCT.md |
| Tax | GST off initially | PRODUCT.md |
| Currency / time | CAD; America/Edmonton | PRODUCT.md |

## 4. Out of scope

Automatic Instagram posting or DMs; bank connection or import; taking card payments; automatic repricing; automatic release of expired reservations; a public catalogue or checkout; GST/HST collection; multi-business or multi-owner support; the prototype's feedback tool, logo gallery, direction picker and phone frame; collections (later).

## 5. Features

Each feature lists what must be true when done. "Prototype screen" names where the preview shows it.

### 5.1 Capture and inventory (prototype: Today, Inventory, item detail)
- Quick capture from iPhone: one or more photos, cost, source, notes. Everything else can be filled later.
- Item fields: name, photos (ordered, first is cover), asking price (CAD), tagged size or "Unknown", condition, known flaws, status, source, acquisition type (Purchase / Personal contribution), cost; optional brand, fabric, measurements, storage location, notes, minimum target margin, preparation cost.
- **Ready to post** requires: price > 0, size (or Unknown), condition, flaws text (may be "No known flaws"). The app blocks marking Listed without them.
- Statuses: Preparing → Ready to list → Listed → Reserved → Sold; plus Archived. Status changes caused by orders (Reserved, Sold, back to Listed) are made by the server, not typed.
- Unknown cost stays unknown (`NULL`), never 0. Personal contributions record original retail cost and business transfer value separately; transfer value may be unknown.
- Inventory filters: status, source, text search. 30-day listing review: items Listed for 30+ days appear in a review list on Today; nothing reprices automatically.
- Item codes `BM-001…` assigned by the server, never reused.

### 5.2 Purchases and shopping trips (prototype: Shopping trip dialog)
- A purchase (receipt) has date, source, total, optional receipt image, and one or more items.
- Cost allocation across items: by entered amounts, or split equally; allocations must sum to the receipt total in whole cents (remainder to the last item). Mismatch blocks saving.
- Items inherit the purchase's source.

### 5.3 Photos and posts (prototype: Posts)
- Per-photo **Brighten** toggle: a fixed, mild exposure/contrast lift applied client-side; the original file is always stored and the brightened version is stored alongside only when chosen. No colour-changing filters, no background removal.
- Post prep: caption draft (from item fields, editable, saved), Post (square) and Story (9:16) image export with price, size and item code, copy caption, copy payment/pickup messages. "I've posted it" marks the item Listed with a listed date.
- No network call to Instagram.

### 5.4 Customers (prototype: Customers)
- Name, Instagram handle, optional email, phone, delivery address.
- Dated, factual private notes and flags (preset list from prototype `flags`, plus positive flags). A warning shows when reserving for a flagged customer; the owner decides whether to proceed.
- Order history per customer. Only the owner can see or edit notes; the viewer sees customer names and order history but **not** contact details or private notes. *(Assumption — see 13.)*

### 5.5 Orders (prototype: Orders, order detail, Reserve dialog)
- Reserve one or more items for a customer: platform, fulfilment method (Local pickup / Local delivery / Shipping), agreed discount, delivery or shipping fee charged, payment deadline (default 24 h, adjustable).
- Minimum-price warning when the agreed price is below cost + preparation + target margin; warning only.
- States: Awaiting payment → Paid → Completed; Cancelled; plus refunds (below). Paid and fulfilled are separate: fulfilment has its own status (Not started / Scheduled / Handed over / Shipped) with appointment time, instructions, tracking number.
- Confirm payment: the owner ticks "I checked the full amount arrived", optional bank reference. This records a payment row.
- Expired reservations appear in a review list; the owner chooses Release or Extend. Nothing expires automatically.
- Cancelling an unpaid reservation returns its items to Listed.
- Shipping: charged amount entered at reservation; actual postage entered when shipped; both kept.

### 5.6 Refunds and returns
- Full or partial refund amount, reason, date.
- **Item-level** return decisions: for each item, Restock (back to Listed, cost retained) or Not returned. Replaces the prototype's whole-order restock.
- Refunds never delete the original sale; they are separate rows.

### 5.7 Expenses (prototype: Money → expenses, receipt review)
- Ledger-style capture → review → confirm: photo of receipt, vendor, date, amount, category. Only confirmed expenses count.
- Owner funding (money she puts in) is recorded separately and is never revenue.

### 5.8 Sources and platforms
- As built in the prototype (`src/Sources.jsx`, `src/Platforms.jsx`): add, rename (propagates via stable IDs), and for platforms remove with a warning naming how many orders become Not recorded. Sources cannot be removed while items reference them *(assumption — see 13)*.
- Name rules: trimmed, collapsed spaces, case-insensitive unique including fixed options; 70 chars (source) / 40 chars (platform).

### 5.9 Money and reports (prototype: Money)
- Totals for a chosen period: money received (net of refunds), item cost of goods sold, preparation, actual postage, confirmed expenses, profit, unpaid reservations (shown separately, not counted), stock on hand at cost, and a count of sold items with unknown cost (profit shown as incomplete when > 0).
- Source comparison and platform comparison as in the prototype, using the stored allocations from section 6.
- CSV export: items, orders (one row per order item), expenses.

### 5.10 AI assistance (optional, capped)
- **Photo draft:** from a photo, suggest name, brand, era, description and a CAD price range with confidence. Clearly labelled as an AI estimate. Reuses `analyze-photo.js`, corrected to CAD and a current model.
- **Sold-price research** and **receipt reading**: *deferred* unless Patrick confirms (see 13).
- Every paid call: owner only, shows its cost before running, counts toward a monthly cap (default C$5) stored in settings; at the cap the button is disabled with an explanation. Insufficient evidence is shown as insufficient, never as a price.

### 5.11 Offline capture
- If the phone has no signal in a store, quick capture (photos + cost + source + note) is saved on the device and uploaded when back online, with a visible "waiting to upload" count. Only new captures queue; editing existing records requires a connection. *(Assumption — see 13.)*

### 5.12 Public page
- bigmoodvintage.com shows the brand page from the prototype (logo, tagline, "message us on Instagram", pickup/delivery/shipping summary). Static, no business data. *(Scope assumption — see 13.)*

## 6. Money rules (these replace the prototype's shortcuts)

1. All amounts are stored as **integer cents**.
2. When an order is confirmed paid, the server writes one `order_items` row per item with: allocated sale amount, allocated discount, allocated fee, and a **snapshot** of item cost and preparation cost at that moment. Later edits to an item's cost do not change past sales; a correction is a separate adjustment row.
3. Allocation of order total across items: by asking-price weight, equal split if all are zero, whole cents, remainder to the last item — same algorithm as `prototypes/big-mood/src/sources-model.js` `allocate`, with its existing checks ported to tests.
4. Refunds are allocated to the returned items if item-level; otherwise by the same weights.
5. Actual postage is a cost of the order, allocated the same way for source/platform reports.
6. Unpaid reservations never count as revenue.
7. A sold item with unknown cost makes profit "incomplete" in every report that includes it; it is never treated as zero.
8. Owner funding is not revenue. Personal contribution transfer value is its cost basis only once confirmed.

## 7. Data model (Neon Postgres)

New database (or new schema) — the Thrifted `items` table is not altered. Tables:

`settings` (hold hours, AI monthly cap, GST flag) · `app_users` (role, password hash) · `sessions` · `sources` · `platforms` · `items` (code, fields from 5.1, `source_id`, `acquisition_type`, `cost_cents` nullable, `original_cost_cents`, `transfer_value_cents`, `prep_cents`, status, listed_at) · `item_photos` (item, position, blob key original, blob key brightened nullable) · `purchases` + `purchase_items` (allocated cost) · `customers` · `customer_notes` (dated, flag type) · `orders` (customer, platform_id nullable→Not recorded, method, discount, fee charged, deadline, status, fulfilment status, tracking, actual postage) · `order_items` (sale snapshot, section 6) · `payments` · `refunds` + `refund_items` (restock flag) · `expenses` (status draft/confirmed, receipt blob key) · `owner_funding` · `ai_calls` (feature, cost_cents, month) · `audit_log` (who, what, when for every write).

Platform removal sets `orders.platform_id` to NULL (displayed Not recorded). Sources use `ON DELETE RESTRICT`.

## 8. Architecture

- Same stack as Thrifted: React + Vite front end, Netlify Functions API, Neon Postgres, Netlify Blobs for photos and receipts. No new paid services.
- **New Netlify site** for Big Mood Vintage (proposed `app.bigmoodvintage.com`); Thrifted keeps running untouched until cut-over (section 11).
- Auth: two accounts (owner, viewer), password login, HttpOnly Secure SameSite=Strict session cookie, sessions stored server-side, login rate-limited. Every function checks the session and role first.
- Photos served only through an authenticated function (not public Blob URLs), resized on upload to a max edge of 2048 px; HEIC converted to JPEG on the phone before upload.
- Offline queue: IndexedDB on the device, uploads with an idempotency key so a retry never creates a duplicate item.
- Server writes that span tables (payment confirmation, refunds, purchases) run in a single transaction.
- CSP as strict as the prototype except `connect-src 'self'`.

## 9. Design

Clubhouse direction from the prototype (tokens in `prototypes/big-mood/src/style.css`), her original logo, DM Serif Display for the wordmark and headings only, system sans for controls. 16 px mobile fields, 44 px targets, visible keyboard focus, reduced motion respected. iPhone-first for capture; laptop layout for listing and books.

## 10. Testing and acceptance

- Unit tests for every rule in section 6, including the prototype's `verify-sources.mjs` cases, item-level restock, cost snapshot immutability, and unknown-cost propagation.
- Server tests proving the viewer role is refused on every write endpoint and every paid AI endpoint, and that unauthenticated requests get no data.
- Browser checks of every flow in section 5 on a phone-width and a laptop-width viewport.
- **Acceptance by Jenn on her own iPhone**: capture in a store (including offline), post prep, a reservation through payment and pickup, a refund with restock, an expense, and the Money page.

## 11. Existing data and cut-over

- Thrifted's current inventory is test data. Default: leave it untouched; do not migrate. Thrifted stays live until Jenn accepts the new app, then its site is retired (not deleted) on Patrick's say-so.
- No deletion of Thrifted data, photos or site without explicit approval.

## 12. Cost

Target C$25/month total. Expected: Netlify free tier, Neon free tier, Blobs within free allowance, AI capped at C$5 by default. Domain already owned. To be validated during build.

## 13. Assumptions awaiting Patrick's confirmation

1. **Separate new site and database**, Thrifted left running until cut-over (vs rebuilding Thrifted in place).
2. **Thrifted test inventory is not migrated.**
3. **Patrick as viewer cannot see customer contact details or private notes.**
4. **AI scope for first release:** photo draft only; sold-price research and receipt reading deferred.
5. **Offline capture included** in the first release (new captures only).
6. **Public brand page included** in this build (vs later).
7. **Sources cannot be deleted while in use** (rename only).
8. **Login by password** for both accounts (vs email magic link).

## 14. Before build

Audit of this spec → revisions → implementation plan → ADR in the Obsidian vault `/Architecture/` → Patrick's approval. Her logo file must be in `public/` before the design pass.
