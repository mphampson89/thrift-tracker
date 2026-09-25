# Big Mood Vintage — working app specification

**Status:** REVISION 2, 2026-09-24. Revised after external audit by five reviewers (ChatGPT, Claude Opus, Gemini, Grok, Kimi); triage in section 16. Not approved for build.
**Branch:** `codex/big-mood-review-handoff` in `mphampson89/thrift-tracker`.

## Plain-English summary

This describes the real app that replaces the clickable preview: Jenn's record of her resale business, from finding a piece to getting paid and seeing what made money. Jenn and Patrick each have their own login with the same full access. It does not post to Instagram, talk to the bank, or take payments; she still does those by hand. Revision 2 tightens the money rules so every number adds up (including returns, partial payments and Poshmark fees), stops two people from selling the same piece at once, and adds nightly backups, account recovery and customer-privacy handling. Sold-price research was dropped from the first version.

## 1. Sources of truth and precedence

1. **This spec is normative.** Where it is silent, ask; do not infer from other files.
2. `prototypes/big-mood/PRODUCT.md` and `DESIGN.md` give background and intent only. Where they conflict with this spec, this spec wins (for example, Patrick is not read-only; sold-price research is not in release 1).
3. The prototype (`prototypes/big-mood/src`, commit `f40c34c` or later on this branch; live at https://preview.bigmoodvintage.com/?view=iphone) is a **visual and interaction reference**. Only these parts may be ported as code: the cumulative-rounding `allocate` function (`src/sources-model.js`) and its cases in `verify-sources.mjs`; name rules in `validateSource` / `validatePlatform`; Clubhouse CSS tokens in `src/style.css`. Everything else is rebuilt against this spec. The prototype's accounting shortcuts (whole-order restock, costs read live from items, report-time allocation) must not be copied.
4. Existing app, for reference only: Thrifted at thrift-tracker-mph.netlify.app (Netlify site `f1beace9-…`), Neon project `rough-firefly-26516723`. Nothing in this build reads, writes or reuses its database, blob store, API key or site.

## 2. Users, access and privacy

- Two accounts, **Jenn and Patrick, identical full access**. No viewer role; no `role` column.
- Every read of business data requires a signed-in session. No public endpoint returns business data, photos or receipts.
- Every write and every paid AI call is attributed to an account in the audit log (section 7.4).
- Privacy contact: Jenn (named on the public page's short privacy notice, with how to ask for access, correction or deletion).

## 3. Decisions already made (do not reopen)

| Topic | Decision | Date |
|---|---|---|
| Name | Big Mood Vintage; Thrifted retired | 2026-09-24 |
| Look | Clubhouse direction only | 2026-09-22 |
| Logo | Her own original Instagram logo; file to be supplied | 2026-09-24 |
| Photos | Kept as taken; optional per-photo Brighten; unbrightened version always kept; colours and flaws stay true | 2026-09-24 |
| Local delivery | Fee agreed per order and typed on the order | 2026-09-24 |
| Shipping | Buyer pays the actual quoted carrier cost; amount charged and actual postage recorded separately | 2026-09-24 |
| Sources | Editable store list + fixed Personal wardrobe and Not recorded; delete only when unused | 2026-09-24 |
| Platforms | Editable list (starter Instagram, Website, Poshmark) + fixed Not recorded; removal keeps orders as Not recorded | 2026-09-24 |
| Payment methods | E-transfer (confirmed by hand against the bank) **or platform payout** (Poshmark etc., with platform fee recorded) | 2026-09-24 |
| Messaging | Stays in Instagram; app prepares text and images only | PRODUCT.md |
| Access | Both accounts identical full access | 2026-09-24 |
| AI, release 1 | Photo draft and receipt reading only, under one monthly cap. Sold-price research dropped | 2026-09-24 |
| Offline | New captures only | 2026-09-24 |
| Public page | Static brand page at bigmoodvintage.com | 2026-09-24 |
| Hosting | New Netlify site + new Neon project; Thrifted untouched; no data migration | 2026-09-24 |
| Sign-in | Email + password per person, 30-day session | 2026-09-24 |
| Backups | Nightly, to Cloudflare R2 on Patrick's existing account | 2026-09-24 |
| Addresses | Kept until she deletes them (no automatic expiry) | 2026-09-24 |
| Tax / currency / time | GST off; CAD; America/Edmonton for all dates, periods and months | PRODUCT.md |

## 4. Out of scope

Automatic Instagram posting or DMs; bank connection; taking card payments; automatic repricing; automatic release of reservations; public catalogue or checkout; GST collection; sold-price research; historical (period-end) stock valuation; multi-business support; the prototype's feedback tool, logo gallery, direction picker and phone frame; collections.

## 5. Features

### 5.1 Items

- **Fields:** code, name, photos (ordered, first is cover, max 10), asking price, size (tagged or "Unknown"), condition, known flaws, status, source, acquisition type (Purchase / Personal contribution), cost, preparation cost, minimum target margin (**dollars**, added to cost + prep to give the minimum price), optional brand, fabric, measurements, storage location, notes; `first_listed_at`, `listed_at` (current listing cycle).
- **Codes** `BM-001…` come from a Postgres sequence. Gaps are acceptable; codes are never reused.
- **Cost authority (one writer):**
  - Item on a purchase → cost is the purchase line's allocated cost; editable only on the purchase.
  - Personal contribution → source is forced to Personal wardrobe; cost basis is the transfer value **only after** "Confirm transfer value" (sets `transfer_value_confirmed_at`); before that it is unknown. Original retail cost is informational.
  - Otherwise → the item's own cost field.
  - Unknown is `NULL`; zero only when entered as zero.
- **Listing requirements:** asking price > 0, size, condition, flaws text ("No known flaws" allowed). Enforced on every transition into Listed and on every edit while Listed or Reserved.
- **Status transitions** (U = user action, S = server side-effect only):

| From | To | By | Condition |
|---|---|---|---|
| Preparing | Ready to list | U | listing requirements met |
| Ready to list | Preparing | U | — |
| Ready to list / Listed | Listed | U "Mark listed" | requirements met; sets `listed_at`=now and `first_listed_at` if empty |
| Listed | Ready to list | U "Unlist" | — |
| Ready to list / Listed | Reserved | S | added to an order (5.5) |
| Reserved | Ready to list or Listed (its status before reserving) | S | order line cancelled / reservation released (keeps `listed_at`) |
| Sold | Reserved | S | payment voided (5.5) |
| Reserved | Sold | S | order paid (5.5) |
| Sold | Ready to list | S | return with Restock (5.6); next "Mark listed" starts a new cycle |
| Sold | Archived | S | return with Write-off (5.6) |
| Preparing / Ready to list / Listed | Archived | U | reason required |
| Archived | Preparing | U | only if never sold, or archived by write-off |

  Reserved and Sold items cannot be archived, deleted, or have price/cost edited except through the flows below.
- **30-day review:** Today lists items whose `listed_at` is 30+ days ago. Nothing reprices automatically.
- Filters: status, source, text search.

### 5.2 Purchases (receipts and shopping trips)

- Fields: date, source, receipt total, **excluded amount** (not for resale: personal items, anything she keeps), optional receipt image. Inventory amount = total − excluded. Tax on the receipt is part of the inventory amount and is spread with it.
- Lines: one per item, allocated cost in cents. Split by entered amounts or equally (cumulative rounding, 6.3). Lines must sum to the inventory amount; mismatch blocks saving.
- Items can be created from the purchase, or existing quick-captured items attached to it (no duplicates). Attaching sets the item's source to the purchase's source.
- A purchase is **never** an expense. Inventory spending enters profit only as cost of goods sold (6.7).
- Editing a purchase line on an item that has a sold, un-returned sale line writes a cost adjustment (6.6).

### 5.3 Photos and posts

- **Upload pipeline (on the phone):** decode, apply orientation, resize to max 2048 px long edge, re-encode JPEG (quality ~0.85; this strips EXIF including GPS), create a 400 px thumbnail, upload **one image per request**. Process photos one at a time. If a photo cannot be decoded (e.g. an unsupported HEIC from the Files app), show a clear message and skip it; never fail the whole capture.
- "Original" means this normalised, unbrightened JPEG. The camera file is not kept.
- **Brighten:** per photo, fixed brightness ×1.09 (the prototype's value), no saturation or colour change. Stored as a second JPEG alongside the original; toggling off returns to the original. Must work on iPhone Safari; do not rely on `CanvasRenderingContext2D.filter` without verifying Safari support; per-pixel adjustment is acceptable.
- **Post prep:** caption draft from item fields (editable, saved); Post (1080×1080) and Story (1080×1920) image export using the chosen photo, with logo, item code, size and price in a fixed band that never overlaps the garment area (layout copied from the prototype's `downloadPost`); copy caption; copy payment and pickup messages. "I've posted it" = "Mark listed" (5.1).
- No network call to Instagram.

### 5.4 Customers

- Fields: name, Instagram handle, optional email, phone, delivery address.
- Notes: dated, factual, private. Flag types: Reliable buyer, Late payment, Missed pickup, Difficult communication, Rude behaviour, Review before accepting another order. UI hint: "Record facts, not opinions. Customers can ask to see this."
- Reserving for a customer with a caution flag shows the latest note; the user decides.
- **Anonymise** (for deletion requests): replaces name with "Former customer #n", clears handle, contact fields, notes and flags; keeps orders and all money rows. Irreversible; confirmation required.
- **Customer export** (for access requests): one file with that customer's fields, notes and order list.
- Delivery address is kept until deleted by the user (decision).
- A customer with no orders may be deleted (soft delete, 7.3); otherwise anonymise only.

### 5.5 Orders

**Lines.** Reserving creates the order **and its lines immediately**. Each line: item, `agreed_price_cents` (defaults to asking price, editable), position (stable order for rounding). An item can be on at most one *active* line (enforced by a partial unique index; active = order not Cancelled and line not cancelled/returned). Reserving uses a conditional update (`status IN ('Ready to list','Listed')` → Reserved); if zero rows change the server returns a conflict naming who reserved it and when. Items must meet listing requirements to be reserved; a line may have agreed price 0 (free add-on).

**Order fields:** customer, platform (nullable = Not recorded), payment method (E-transfer / Platform payout), fulfilment method (Local pickup / Local delivery / Shipping), discount, fee charged (delivery or shipping charged to buyer), payment deadline (default now + 24 h), plus for platform payouts: platform fee and payout amount.

**Amount due** = Σ agreed prices − discount + fee charged. Discount must be ≥ 0 and ≤ Σ agreed prices. Lines, prices, discount and fee are editable while Awaiting payment (each edit bumps the order version); they are **locked** once Paid.

**Minimum-price warning** when a line's share of (agreed − allocated discount) is below cost + prep + target margin; unknown cost shows "cost unknown" instead. Warning only.

**Order states:**

| From | To | By | Condition / effect |
|---|---|---|---|
| — | Awaiting payment | U reserve | items → Reserved |
| Awaiting payment | Paid | U confirm | e-transfer: Σ payments ≥ amount due; platform: sale confirmed with fee entered. Effects in one transaction: allocations (6.3) and snapshots (6.4) written, items → Sold |
| Awaiting payment | Cancelled | U | items → Listed. If any payment was received, the order shows **money to return** until a refund row settles it |
| Paid | Awaiting payment | U "Void payment" | only if fulfilment not started and no refunds; reason required; reverses snapshots; items → Reserved |
| Paid | Completed | S | fulfilment reaches Handed over (pickup/delivery) or Shipped (shipping) |
| Paid / Completed | — | — | never cancelled; use refunds (5.6) |

Refund status (None / Partial / Full) is derived from refund rows, not a separate state.

**Payments (e-transfer):** each payment row has amount received, date received, optional bank reference, and the checkbox "I checked this amount arrived in the bank". Balance owing is shown. Overpayment is recorded and shown as money to return until refunded.

**Platform payout orders:** the buyer's price is the amount due; the platform fee and payout (amount due − fee) are recorded; profit uses the payout. Payout received date is optional and informational. Actual postage may be marked **Not applicable** (platform-supplied label).

**Fulfilment:** Not started → Scheduled (appointment, instructions) → Handed over (pickup/delivery) or Shipped (tracking). Actual postage for Shipping orders is Unknown until entered or marked Not applicable.

**Expired reservations:** appear on Today when the deadline has passed; they stay Reserved until the user chooses **Release** (cancels the order) or **Extend** (default +24 h, editable). A payment that arrives after Release requires re-reserving (if the items are still available) or refunding.

### 5.6 Refunds and returns

A refund row: date money was sent, reason, and components:
- **Per-line merchandise amount.** The user may assign it to specific lines (e.g. a concession for a stain on one piece); default split is by remaining line net, cumulative rounding.
- **Fee amount** (refund of delivery/shipping charged).
- **Return decision per line:** Not returned (item stays Sold) / Returned – Restock / Returned – Write-off.
- Optional **return postage** cost paid by the business.

Limits: each line's cumulative merchandise refunds ≤ its net sale (agreed − allocated discount); cumulative fee refunds ≤ fee charged; total refunds ≤ total received. A line can be returned once per sale.

Return effects:
- **Restock:** writes a cost reversal equal to that line's snapshot cost (plus its adjustments), dated the refund date; item → Ready to list with its cost basis unchanged. Preparation spent on the first sale is **not** reversed; the item's prep field resets to 0 for the next cycle.
- **Write-off:** no cost reversal (the cost stays recognised); item → Archived with reason.
- A later resale snapshots cost again. Net effect over the item's life: cost counted exactly once.

### 5.7 Expenses and owner funding

- Ledger-style: capture receipt photo → review (optionally AI-filled, 5.10) → confirm. Only confirmed expenses count. Fields: vendor, receipt date, amount, category, receipt image.
- Inventory purchases, postage for orders and preparation recorded on items are **not** entered as expenses. The capture screen asks "Is this stock for resale?" and routes to a purchase if yes.
- Owner funding: money Jenn puts into the business; date received, amount, note. Never revenue; shown on a separate cash-in line.

### 5.8 Sources and platforms

As built in the prototype: add, rename (stable IDs), platform removal with a warning naming how many orders become Not recorded; source deletion only when no items or purchases reference it. Name rules: trimmed, internal spaces collapsed, unique case-insensitively including fixed options; 70 characters (source), 40 (platform). New sources cannot be created offline.

### 5.9 Money and reports

Period filter (month, quarter, year, custom; Edmonton dates). Dating rules are in 6.8.

- **Totals:** merchandise sales (net of discounts), fees charged, platform fees, refunds, cost of goods sold (net of reversals and adjustments), preparation, actual postage (incl. return postage), confirmed expenses by category, profit; owner funding (cash-in line, not profit); unpaid reservations (count and amount due, not counted).
- **Completeness:** profit is marked incomplete, with counts, when the period includes a sold line with unknown effective cost, a Shipping order with postage Unknown, or a personal contribution with unconfirmed transfer value. A "Missing information" list on Today links to each.
- **Stock on hand** (current only): known cost total, plus "N items with unknown cost".
- **Source and platform comparisons:** per source (sale-time snapshot, 6.4) and per platform: paid lines/orders, merchandise net sales, net refunds, cost of goods sold, platform fees, profit before shared expenses. Fees charged and actual postage are **excluded** from comparisons (they are delivery economics, shown in totals). Ranked by merchandise net sales.
- **GST watch:** rolling four-quarter revenue with a notice at C$25,000 (small-supplier threshold C$30,000). Informational.
- **Exports:** everyday CSVs (items, order lines, expenses); a **full export** zip with every business table as CSV (stable IDs), photos and receipts; a yearly summary (revenue, refunds, cost of goods sold, expenses by category, owner funding).

### 5.10 AI assistance (capped)

- **Photo draft:** from one photo, suggest name, brand, era, description, CAD price range and confidence. Adapted from Thrifted's `analyze-photo.js` (CAD, current model).
- **Receipt reading:** from a receipt photo, suggest vendor, date, total, category.
- Both return JSON validated against a schema on the server; invalid output is discarded. Results appear as **suggestions** beside empty or existing fields; nothing is saved until the user saves. All model text is rendered as plain text; no links.
- **Cap enforcement (server):** monthly cap in CAD in settings (default C$5), a USD→CAD rate in settings (default 1.40, conservative). Month = Edmonton calendar month. Before each call, in one transaction that locks that month's budget row: compute worst-case cost (bounded input image size + `max_tokens` output at list price, converted to CAD); refuse if spent + pending + worst case > cap; insert a pending `ai_calls` row with a request ID. After the call, record actual cost from the response's usage (stored in micro-dollars, not rounded cents). A call that fails or times out without usage stays counted at worst case. No automatic retries; a duplicate request ID returns the stored result.
- **Dedicated API key** for Big Mood Vintage only, with a spend limit set in the Anthropic console as a backstop. Never reuse Thrifted's key.
- Model per feature: the cheapest current Claude model that passes a fixed fixture set (10 garment photos, 10 receipts, expected fields written down) before the feature is wired.

### 5.11 Offline capture

- Supported only in the app **installed to the Home Screen** (Safari tab use is online-only; the app says so). On first launch the app requests persistent storage.
- The service worker caches the app shell and the sources list. It never caches API responses containing business data, photos or receipts.
- Capture offline: photos (already resized, 5.3), cost, source, note. The phone generates a `capture_id` and a `photo_id` per photo.
- Upload happens **only while the app is open**: on launch, on returning to the foreground, on regaining connection, and via a Retry button. A banner shows "N finds waiting to upload" until all are acknowledged. iOS gives no background upload; the banner says to keep the app open.
- Order: each photo uploads idempotently by `photo_id`; then the item is created idempotently by `capture_id` referencing them. A capture leaves the device only after the server confirms item and all photos. Photos not attached to an item after 7 days are deleted by a cleanup job.
- If the chosen source no longer exists, the item is created with Not recorded and appears in Missing information.
- The queue survives sign-out and expired sessions; the app asks to sign in, then resumes. Storage-full errors are shown immediately at capture time.

### 5.12 Public page

bigmoodvintage.com: logo, tagline, "Message us on Instagram" link, pickup/delivery/shipping summary, short privacy notice. Static, no business data, no scripts that call the app.

## 6. Money rules

1. **Cents.** All money is integer cents (CAD). AI costs use micro-dollars.
2. **Allocation algorithm** (port of prototype `allocate`): given a total T and non-negative weights w₁…wₙ in line position order: if Σw = 0 use equal weights; for each line i, target_i = round(T × Σ_{j≤i} w_j / Σw), share_i = target_i − target_{i−1}; the last target is exactly T. Shares are never negative and always sum to T.
3. **At payment**, per line: `allocated_discount` = allocation of the order discount by agreed-price weights; `net_sale` = agreed − allocated_discount. Fee charged is **not** allocated to lines. For platform orders, `allocated_platform_fee` = allocation of the platform fee by `net_sale` weights. Identity (tested): Σ net_sale + fee charged = amount due.
4. **Snapshots at payment** on each line: cost basis (5.1 rules; may be NULL), prep cost, source ID. Never updated afterwards.
5. **Postage** (actual, and return postage) is allocated to lines by `net_sale` weight only where a per-line view needs it; comparisons exclude it (5.9).
6. **Cost adjustments.** Entering or changing cost or prep on an item with a sold, un-returned line prompts "Apply to the sale on <date>?"; yes writes a `cost_adjustments` row (line, old effective cost, new, reason, who). Effective cost = snapshot + Σ adjustments. An unknown snapshot becomes known through an adjustment. No adjustment ⇒ the past sale is unchanged.
7. **Cost of goods sold** for a period = Σ effective cost of lines paid in the period − Σ restock reversals dated in the period. Prep is reported separately.
8. **Dates** (Edmonton): merchandise sales, fees charged, platform fees, cost of goods sold, prep, actual postage and cost adjustments are dated to the order's **payment date** (a late postage entry or cost adjustment restates that period). Refunds, return postage and restock reversals are dated to the **refund date**. Expenses: receipt date. Owner funding: date received.
9. **Unpaid reservations** never count as revenue.
10. **Unknown is never zero** (see completeness, 5.9).
11. **No destructive edits to money.** Payments, refunds, adjustments, confirmed expenses and owner funding are corrected by a void (with reason) and a new row, never edited or deleted.

## 7. Data and integrity

### 7.1 Tables (new Neon project; no schema sharing with Thrifted)

`settings` (hold hours, AI cap CAD, USD→CAD rate, GST flag default false) · `app_users` (email, password hash, must_change_password) · `sessions` (token hash, user, created, expires, last seen, revoked) · `login_attempts` · `sources` · `platforms` · `items` (5.1 fields, version, deleted_at) · `item_photos` (item, position, photo_id, original key, thumbnail key, brightened key nullable) · `purchases` (version) + `purchase_lines` · `customers` (version, anonymised_at, deleted_at) · `customer_notes` · `orders` (5.5 fields, version) · `order_lines` (5.5 + 6.3/6.4 fields) · `payments` (voided_at) · `refunds` + `refund_lines` · `cost_adjustments` · `expenses` (draft/confirmed, voided_at) · `owner_funding` (voided_at) · `ai_budget_months` + `ai_calls` (request id, feature, worst-case, actual micro-USD, CAD, status) · `idempotency_keys` · `audit_log` · `capture_uploads` (capture_id, photo_ids, status).

### 7.2 Concurrency

- Every write carries a client request ID; the server stores the result for 24 h and returns it for repeats (payment, cancel, refund, return, void, capture and all edits).
- Items, orders, customers, purchases and expenses carry a `version`; edits send the version they started from; a mismatch returns a conflict and the app offers to reload.
- Reservation: conditional update + partial unique index (5.5). Payment confirmation checks the order version and state inside the transaction.
- Multi-table writes (reserve, pay, void, refund/return, purchase, capture) run in one transaction.

### 7.3 Deletion

Soft delete (`deleted_at`) only for: items never on an order line, customers with no orders, draft expenses, unused sources. Everything else is archived, anonymised or voided.

### 7.4 Audit log

Append-only (the app's database role has INSERT but not UPDATE/DELETE on it). Each entry: time, account, request ID, entity and ID, action, changed fields with before/after values, reason where required. For customer contact fields and note bodies only the field names are logged, not the values.

## 8. Architecture and security

- **Stack:** React + Vite, Netlify Functions, Neon Postgres, Netlify Blobs; new Netlify site (proposed `app.bigmoodvintage.com`) and new Neon project. Netlify Blobs store names are new and site-scoped.
- **Environments:** production secrets (database URL, API key, R2 credentials) exist only in the production deploy context. Deploy previews and local development use a separate Neon branch/project, a separate blob store, and a separate AI key with a C$1 cap. Tests never touch production.
- **Accounts:** created by a seed script; there is no signup endpoint.
- **Passwords:** Node's built-in `crypto.scrypt` with a per-user salt (parameters documented in code); minimum 10 characters.
- **Sessions:** 32 random bytes, stored hashed; cookie `HttpOnly; Secure; SameSite=Lax; Path=/`, host-only; 30-day expiry. Every write checks the `Origin` header against the site origin. Settings shows active sessions with Revoke and "Sign out all devices". Password change or reset revokes the target's other sessions.
- **Login rate limit (in Postgres):** per email and per IP, increasing delay after 5 failures; no permanent lockout.
- **Password reset:** a signed-in owner sets a one-time temporary password for the other account (forced change at next sign-in; audited). Break-glass when both are locked out: a documented local script run by Patrick against production that sets a temporary password (steps written in the repo README).
- **Photos and receipts:** served only by an authenticated function that looks the file up by database record ID (never an arbitrary key), with `Cache-Control: private, max-age=31536000, immutable`. Lists use thumbnails. Receipt images follow the same rules.
- **Sign-out:** clears the session, sends `Clear-Site-Data: "cache"`, clears in-memory data; the offline capture queue is kept.
- **CSP:** as strict as the prototype, `connect-src 'self'`.
- **Backups:** a nightly scheduled job writes an encrypted full export (all tables + new/changed photos and receipts) to a Cloudflare R2 bucket on Patrick's account, using a credential that can write but not delete. Retention: daily for 30 days, monthly for 7 years. Targets: lose at most 24 h; restore within a day. A written restore procedure is tested once into a fresh Neon project before acceptance. Neon's own history is a first line, not the backup.
- **Privacy:** data is stored with Neon, Netlify, Cloudflare (backups) and processed by Anthropic (photos and receipts for AI suggestions); the public-page notice says so. Breach procedure (README): revoke all sessions, rotate secrets, assess whether there is a real risk of significant harm, and if so notify the Alberta Privacy Commissioner and affected people as Alberta PIPA requires.

## 9. Design

Clubhouse direction (tokens from `prototypes/big-mood/src/style.css`), her original logo, DM Serif Display for wordmark and headings only, system sans for controls. 16 px mobile fields, 44 px targets, visible keyboard focus, reduced motion respected. iPhone-first for capture; laptop layout for listing and books. Conflicts (section 7.2) and blocked transitions show plain-English messages naming what happened and what to do.

## 10. Testing and acceptance

**Unit tests (money):** every rule in section 6, including:
- allocation identity with cent remainders; a zero-price free add-on beside priced lines; all-zero weights;
- discount $10 + fee $15 on $80/$20 lines: Σ net_sale + fee = amount due;
- sell → full refund + restock → resell: lifetime cost of goods sold = one cost;
- refund with Not returned keeps cost; write-off keeps cost and archives;
- concession assigned to one line; repeated partial refunds never exceed limits;
- unknown cost → later adjustment → profit complete; snapshot unchanged;
- platform payout profit uses payout; postage Not applicable vs Unknown;
- purchase with excluded amount; item cost read-only when on a purchase;
- report dating across a month boundary (sale in September, refund in October).

**Server tests:** no data and no writes without a session on every endpoint; Origin check on writes; login rate limit; two simultaneous reservations of one item → exactly one succeeds; repeated payment request → one payment; stale version → conflict; AI cap with two concurrent calls near the limit → never exceeds cap; audit log is append-only.

**Browser tests:** every flow in section 5 at phone and laptop widths; interrupted capture upload (item created, photo 3 fails, retry) → no duplicates, no lost photos.

**Restore drill:** restore the latest backup into a fresh Neon project and open the app against it.

**Acceptance on Jenn's own iPhone (Home Screen app):** airplane-mode capture of several finds, reopen next day, upload; post prep and export; reservation → e-transfer → pickup; a Poshmark sale with fee; a refund with restock and resale; an expense via receipt reading; Money page totals checked by hand against the underlying rows.

## 11. Existing data and cut-over

- Thrifted's inventory is test data and is not migrated; Jenn enters current real stock in the new app as part of acceptance.
- Thrifted stays live until Jenn accepts the new app; then its site is retired (not deleted) on Patrick's say-so. No deletion of Thrifted data, photos or site without explicit approval.
- At launch, preview.bigmoodvintage.com (fake sample data on her brand domain) is taken down or password-protected.

## 12. Cost

Target C$25/month. **Before the implementation plan is approved:** confirm the actual Netlify account plan and how it meters function calls, bandwidth and blob storage; confirm Neon plan limits; set spending alerts. AI capped at C$5 (settings) with an Anthropic console limit as backstop. R2 backup storage expected to be within the free allowance.

## 13. Build order

1. Accounts, sessions, audit log, backups and full export.
2. Money core: items, purchases, orders, payments, refunds/returns, adjustments, reports (sections 5.1, 5.2, 5.5–5.7, 5.9, 6).
3. Capture, photos, posts, customers, sources/platforms.
4. Offline capture, AI features, public page.

## 14. Scope choices confirmed by Patrick, 2026-09-24

1. New separate site and database; Thrifted untouched until cut-over.
2. Thrifted's test inventory not migrated.
3. Patrick has the same full access as Jenn.
4. AI in release 1: photo draft and receipt reading. Sold-price research dropped after audit.
5. Offline capture of new finds included.
6. Public brand page included.
7. Sources: delete only when unused.
8. Email + password sign-in, 30-day session.
9. Poshmark and other platform sales recorded as platform payouts with the platform fee.
10. Nightly backups to Cloudflare R2 on Patrick's account.
11. Delivery addresses kept until deleted by hand.

## 15. Before build

Implementation plan → ADR in the Obsidian vault `/Architecture/` → Patrick's approval. Her logo file must be in `public/` before the design pass.

## 16. Audit triage (2026-09-24)

Five reviews: ChatGPT, Claude Opus, Gemini, Grok, Kimi. All returned "needs revision first".

**Accepted and folded in** (reviewer convergence in brackets): reservation lines and frozen agreed prices [ChatGPT, Opus, Kimi]; allocation contract and identity [all five]; restock reverses cost of goods sold [all five]; cost adjustments table [Opus, Gemini, Grok, Kimi]; double-reservation and double-payment guards, idempotency, versions [all five]; AI cap reservation, micro-dollars, FX, Edmonton month [all five]; backups, restore drill, full export [ChatGPT, Opus, Kimi, Grok]; state-transition tables [all five]; partial payments, overpayment, no cancel after paid [ChatGPT, Opus, Grok, Kimi]; purchase excluded amount and single cost writer [all five]; report dating [ChatGPT, Opus, Grok, Kimi]; unknown postage and unknown stock marked incomplete [ChatGPT, Grok, Kimi]; sale-time source snapshot [ChatGPT]; refund components, per-line concessions and limits [ChatGPT, Gemini, Grok, Kimi]; purchase-vs-expense double counting [ChatGPT]; iPhone offline limits, Home Screen requirement, capture/photo idempotency, orphan cleanup [all five]; photo pipeline, EXIF stripping, one photo per request, thumbnails [ChatGPT, Opus, Kimi]; auth (DB rate limit, no signup, hashed tokens, peer reset, Lax + Origin, sessions screen) [all five]; customer anonymise and export, breach procedure, provider disclosure [all five]; audit before/after and append-only, soft delete, voids [ChatGPT, Opus]; environment separation and dedicated AI key [ChatGPT, Opus]; document precedence [ChatGPT, Opus]; target margin in dollars [ChatGPT]; listing-cycle dates [ChatGPT, Gemini, Grok]; Extend/Release semantics [Gemini]; platform fees for Poshmark [Opus] (Patrick chose to record them); GST watch, return postage, write-off on damaged returns, preview site at launch, gaps in codes allowed [Opus]; brighten value and post layout from the prototype [Grok]; drop `role` column [Grok]; cost validation before plan approval [ChatGPT, Opus].

**Resolved by Patrick's decision:** sold-price research findings (cap blow-out, unverifiable sold prices, prompt injection from web pages, function time limits) [all five] — feature dropped from release 1. Address retention [Opus] — Patrick chose to keep addresses until deleted.

**Rejected:**
- *Use signed direct Blob URLs to avoid function concurrency limits* [Gemini]: Netlify Blobs does not offer signed public URLs, and the concurrency figure was not verified; thumbnails plus long private caching address the load instead.
- *Gapless codes via a sequence* [Gemini]: sequences are not gapless; gaps are explicitly acceptable [Opus].
- *Refund with Not returned archives the item* [Grok]: the buyer kept the item, so it stays Sold with its cost recognised.
- *Drop owner funding* [Grok]: PRODUCT.md requires it; it is now defined as a cash-in line.
- *Use eBay Browse API for sold prices* [Gemini]: moot (research dropped); the Browse API does not return sold listings in any case.
- *Put AI behind a flag so it can slip first* [Opus, Kimi]: that reopens a decided scope item; handled instead by build order (section 13).
- *Specific Netlify time and payload limits* [several, conflicting figures]: the spec no longer depends on them (one photo per request, AI calls are single short requests); the plan must confirm current limits for the account.

**Noted outside this spec:** Thrifted's live `analyze-photo` function has no login and spends the shared Anthropic key [Opus]. This is an existing risk in the live app, raised with Patrick separately.
