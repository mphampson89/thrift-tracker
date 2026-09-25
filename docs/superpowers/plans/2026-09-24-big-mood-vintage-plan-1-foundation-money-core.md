# Big Mood Vintage — Plan 1 of 3: Foundation and Money Core

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Honor the **Agent assignment** table (agent-routed-plans).

**Plain-English summary:** This first plan builds the parts of the app nobody sees but everything depends on: sign-in, the change log, nightly backups, and the rules that keep every dollar correct (items, orders, payments, refunds, reports). It ends with a working, tested back end on its own website address, with no screens yet. Plan 2 builds the screens; Plan 3 adds offline capture, AI and the public page, then Jenn's acceptance on her phone.

**Goal:** A deployed, tested Big Mood Vintage API (spec sections 13 steps 1–2) with backups proven by a restore drill.

**Architecture:** New repo `mphampson89/big-mood-vintage` (local `C:\dev\big-mood-vintage`, outside OneDrive). One Netlify Functions v2 router function serves `/api/*`; plain JavaScript (ESM) service modules take an injected database adapter, so tests run the real SQL against in-process Postgres (PGlite) and production uses Neon. A scheduled function writes encrypted nightly backups to Cloudflare R2.

**Tech stack:** Node 22, Netlify Functions v2, Neon Postgres (`@neondatabase/serverless` Pool), PGlite (tests), Vitest, `fflate` (zip), `aws4fetch` (R2). No React in this plan.

**Spec:** `docs/superpowers/specs/2026-09-24-big-mood-vintage-working-app-design.md` (revision 2) in `mphampson89/thrift-tracker`, branch `codex/big-mood-review-handoff`. Every executor reads the spec sections named in its task.

**Plans 2 and 3** are written after this plan lands, so they can use its real API names.

## Global Constraints

- All money is integer cents (CAD). Never floats for money. AI costs (Plan 3) use micro-dollars.
- All dates, periods and months use `America/Edmonton`.
- Unknown cost is `NULL`, never 0.
- Payments, refunds, refund lines, cost adjustments, confirmed expenses and owner funding are never updated or deleted except to void (enforced by database triggers).
- Every write request: signed-in session, `Origin` equal to the site origin, `Idempotency-Key` header, and an audit-log entry. Every edit of a versioned record sends the `version` it started from.
- Customer contact fields (`email`, `phone`, `address`) and note bodies are never written into the audit log's before/after values; only field names.
- Nothing in this repo touches Thrifted (site `f1beace9-…`, Neon project `rough-firefly-26516723`, its API key or blob store).
- Production secrets exist only in Netlify's production context. Tests never touch Neon.
- `git push` to `main` of the new repo deploys the new site only after Task 19 connects it; before then nothing deploys.
- Plain JavaScript ESM, no TypeScript, no ORM. 2-space indent, no semicolons (match Thrifted's style).
- Inside `db.tx(async q => …)` use only `q`, never `ctx.db` (PGlite would wait forever; Neon would run the query outside the transaction).
- Cast every aggregate in SQL: `COALESCE(sum(x), 0)::int`, `count(*)::int`. Return `date` columns as `YYYY-MM-DD` strings (`col::text`) and timestamps as ISO strings in every response. PGlite (tests) and Neon (production) parse raw types differently; casting makes them identical.
- Work happens on branch `plan-1` of the new repo; `main` only receives it in Task 19 with Patrick's go-ahead.

## Agent assignment (cost/quality routing)

| Task | Executor | Why |
|---|---|---|
| 0 ADR, repo, Neon project, R2 bucket | main session (inline) | creates outward-facing accounts/resources; needs Patrick for Cloudflare steps |
| 1 Scaffold | Haiku subagent | every file given verbatim |
| 2 Schema + DB adapter + test harness | Sonnet subagent | SQL and adapter code written out; transcription plus given tests |
| 3 Money helpers | Sonnet subagent | exact code and complete tests given |
| 4 HTTP layer (router, Origin, idempotency, audit) | Opus subagent | security invariants; a plausible wrong version passes shallow review |
| 5 Auth | Opus subagent | password, session and rate-limit semantics |
| 6 Sources and platforms | Sonnet subagent | conventional CRUD, rules and tests given |
| 7 Items | Opus subagent | state machine and cost-authority invariants |
| 8 Customers | Sonnet subagent | conventional CRUD, anonymise rules and tests given |
| 9 Orders: reserve, edit, cancel, extend | Opus subagent | double-reservation guard, allocation inputs |
| 10 Payments and void | Opus subagent | money snapshot transaction |
| 11 Fulfilment and postage | Sonnet subagent | small state machine, tests given |
| 12 Refunds and returns | Opus subagent | cost-reversal and limit rules |
| 13 Cost adjustments | Opus subagent | effective-cost semantics |
| 14 Purchases | Opus subagent | allocation + cost authority + sale decisions |
| 15 Expenses and owner funding | Sonnet subagent | conventional, void rules via triggers, tests given |
| 16 Reports | Opus subagent | period dating and profit arithmetic |
| 17 Exports | Sonnet subagent | CSV/zip formatting, tests given |
| 18 Backup and restore | Opus subagent | encryption and restore correctness |
| 19 Deploy, seed, restore drill | main session (inline) | production database, secrets, deploy, live probes |
| Final review | Opus subagent (superpowers:requesting-code-review) | whole-branch review before Task 19's deploy |

Dispatch each subagent with: the task text verbatim, the spec path, and Global Constraints. Review each task's diff (and run `npm test`) before dispatching the next. Each dispatch ends with the executor writing "What the next task needs to know"; paste that into the next dispatch.

## File map (new repo `C:\dev\big-mood-vintage`)

| Path | Responsibility |
|---|---|
| `package.json`, `netlify.toml`, `vitest.config.js`, `.gitignore`, `README.md` | project setup, deploy config, runbooks (break-glass, restore, breach) |
| `public/index.html` | placeholder page until Plan 2 |
| `db/migrations/0001_init.sql` | full schema, triggers, seeds |
| `db/migrate.mjs` | applies migrations to `DATABASE_URL` |
| `server/db.js` | Neon adapter: `query`, `exec`, `tx`, `end` |
| `server/migrations.js` | `applyMigrations(db)` shared by runner and tests |
| `server/money.js` | allocation and cents helpers (shared with Plan 2's UI) |
| `server/http.js` | `HttpError`, router, JSON/Origin/idempotency/session wrapper |
| `server/audit.js` | `audit(q, entry)` with redaction |
| `server/auth.js` | passwords, sessions, rate limit, auth routes |
| `server/sources.js`, `platforms.js`, `items.js`, `customers.js`, `orders.js`, `payments.js`, `fulfilment.js`, `refunds.js`, `adjustments.js`, `purchases.js`, `expenses.js`, `reports.js`, `exports.js`, `backup.js` | one service each; each exports `routes` (array of route definitions) plus helpers named in its task |
| `server/app.js` | assembles all `routes` into `handle(req, env)` |
| `netlify/functions/api.mjs` | Netlify entry for `/api/*` |
| `netlify/functions/backup-nightly.mjs` | scheduled backup |
| `scripts/seed-users.mjs`, `scripts/reset-password.mjs`, `scripts/restore.mjs` | one-off operator scripts |
| `test/helpers.js` | PGlite adapter, `makeApp()`, fixtures |
| `test/*.test.js` | one test file per service |

---

### Task 0: ADR, repository, Neon project, R2 bucket (main session, inline)

- [ ] **Step 1: Write ADR-181** in `C:\Users\phampson\OneDrive\Obsidian-Vault\Architecture\ADR-181-big-mood-vintage-new-app-beside-thrifted.md` (next free number; check `ADR-INDEX.md` first) and add it to `ADR-INDEX.md`. Content: decision = new repo, new Netlify site, new Neon project, same stack as Thrifted; Thrifted untouched until cut-over; single router function; PGlite for tests; nightly encrypted backups to R2 with bucket-lock retention; link to the spec. Open with a 2–3 line plain-English summary.
- [ ] **Step 2: Ask Patrick** to confirm creating GitHub repo `mphampson89/big-mood-vintage` (private). On yes: `gh repo create mphampson89/big-mood-vintage --private`, then `git clone` into `C:\dev\big-mood-vintage`.
- [ ] **Step 3: Neon.** List regions (`mcp__neon__list_regions`); prefer a Canadian region if listed, else `aws-us-east-2`. Create project `big-mood-vintage` in org `org-holy-star-58875250` (Launch plan). Create branch `dev` for development and previews. Record project ID, both connection strings (pooled) — do not print them into chat or commit them.
- [ ] **Step 4: Cloudflare R2** (Patrick does this; use the BLOCKED template): create bucket `big-mood-vintage-backups`; add bucket lock rules: prefix `daily/` retain 30 days, prefix `monthly/` retain 7 years; add lifecycle rule deleting `daily/` objects after 31 days; create an R2 API token with Object Read & Write on this bucket only. Patrick sends back: account ID and confirmation the token exists (he pastes the key ID/secret straight into Netlify in Task 19, not into chat).
- [ ] **Step 5: Backup encryption key** — generated in Task 19 Step 2, when it is first needed: 32 random bytes, base64. Patrick stores it in his password manager as "Big Mood Vintage backup key"; without it backups cannot be restored.

### Task 1: Scaffold

**Files:** Create `package.json`, `netlify.toml`, `vitest.config.js`, `.gitignore`, `public/index.html`, `README.md`.

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "big-mood-vintage",
  "private": true,
  "type": "module",
  "engines": { "node": ">=22" },
  "scripts": {
    "test": "vitest run",
    "migrate": "node db/migrate.mjs"
  }
}
```

- [ ] **Step 2: Install dependencies**

Run: `npm install @neondatabase/serverless fflate aws4fetch` then `npm install -D vitest @electric-sql/pglite`
Expected: installs without errors; `package.json` gains `dependencies` and `devDependencies`.

- [ ] **Step 3: Create `netlify.toml`**

```toml
[build]
  command = "echo 'no build step in plan 1'"
  publish = "public"

[build.environment]
  NODE_VERSION = "22"

[functions]
  directory = "netlify/functions"
  node_bundler = "esbuild"

[[headers]]
  for = "/*"
  [headers.values]
    X-Robots-Tag = "noindex, nofollow"
    Referrer-Policy = "no-referrer"
    X-Content-Type-Options = "nosniff"
    Content-Security-Policy = "default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; script-src 'self'; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'"
```

- [ ] **Step 4: Create `vitest.config.js`**

```js
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: { include: ['test/**/*.test.js'], testTimeout: 20000, pool: 'forks' },
})
```

- [ ] **Step 5: Create `.gitignore`**

```
node_modules
.netlify
.env
*.bmv
```

- [ ] **Step 6: Create `public/index.html`**

```html
<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Big Mood Vintage</title></head>
<body><p>Big Mood Vintage is being set up.</p></body></html>
```

- [ ] **Step 7: Create `README.md`** with a 3-line plain-English summary ("Jenn's resale business app. Back end only in plan 1. See the spec link.") and empty headings `## Break-glass password reset`, `## Restore from backup`, `## If data may have leaked` (filled by Tasks 5 and 18).

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "chore: scaffold big mood vintage"
```

### Task 2: Schema, database adapter and test harness

**Spec:** sections 5.1–5.9, 6, 7.

**Files:** Create `db/migrations/0001_init.sql`, `server/db.js`, `server/migrations.js`, `db/migrate.mjs`, `test/helpers.js`, `test/schema.test.js`.

**Interfaces — Produces:**
- `db` adapter shape (Neon and PGlite alike): `query(text, params) → {rows, rowCount}`, `exec(sqlText)`, `tx(async q => …)` where `q` has `query` and `exec`, `end()`.
- `applyMigrations(db)`; `testDb()`; constants `PERSONAL_SOURCE_ID = '00000000-0000-0000-0000-000000000001'`.

- [ ] **Step 1: Create `db/migrations/0001_init.sql`**

```sql
CREATE SEQUENCE item_code_seq;

CREATE TABLE settings (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  hold_hours int NOT NULL DEFAULT 24 CHECK (hold_hours BETWEEN 1 AND 336),
  ai_cap_cad_cents int NOT NULL DEFAULT 500 CHECK (ai_cap_cad_cents >= 0),
  usd_cad_rate numeric(6,4) NOT NULL DEFAULT 1.40,
  gst_enabled boolean NOT NULL DEFAULT false
);
INSERT INTO settings DEFAULT VALUES;

CREATE TABLE app_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE CHECK (email = lower(email)),
  name text NOT NULL,
  password_hash text NOT NULL,
  must_change_password boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES app_users,
  token_hash text NOT NULL UNIQUE,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz
);
CREATE TABLE login_attempts (
  id bigserial PRIMARY KEY,
  email text NOT NULL,
  ip text NOT NULL,
  success boolean NOT NULL,
  at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX login_attempts_email_at ON login_attempts (email, at);
CREATE INDEX login_attempts_ip_at ON login_attempts (ip, at);
CREATE TABLE idempotency_keys (
  key text NOT NULL,
  user_id uuid NOT NULL REFERENCES app_users,
  route text NOT NULL,
  status int,
  response jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (key, user_id)
);
CREATE TABLE audit_log (
  id bigserial PRIMARY KEY,
  at timestamptz NOT NULL DEFAULT now(),
  user_id uuid REFERENCES app_users,
  request_id text,
  entity text NOT NULL,
  entity_id text NOT NULL,
  action text NOT NULL,
  changes jsonb NOT NULL DEFAULT '{}',
  reason text
);

CREATE FUNCTION forbid_change() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION '% on % is not allowed', TG_OP, TG_TABLE_NAME; END $$;

CREATE FUNCTION void_only() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN RAISE EXCEPTION 'DELETE on % is not allowed', TG_TABLE_NAME; END IF;
  IF OLD.voided_at IS NOT NULL THEN RAISE EXCEPTION 'voided rows in % cannot change', TG_TABLE_NAME; END IF;
  IF (to_jsonb(NEW) - 'voided_at' - 'void_reason') IS DISTINCT FROM (to_jsonb(OLD) - 'voided_at' - 'void_reason') THEN
    RAISE EXCEPTION 'only voiding is allowed on %', TG_TABLE_NAME;
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER audit_log_append_only BEFORE UPDATE OR DELETE ON audit_log FOR EACH ROW EXECUTE FUNCTION forbid_change();

CREATE TABLE sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  fixed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
CREATE UNIQUE INDEX sources_name ON sources (lower(name)) WHERE deleted_at IS NULL;
INSERT INTO sources (id, name, fixed) VALUES ('00000000-0000-0000-0000-000000000001', 'Personal wardrobe', true);

CREATE TABLE platforms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX platforms_name ON platforms (lower(name));
INSERT INTO platforms (id, name) VALUES
  ('00000000-0000-0000-0000-000000000101', 'Instagram'),
  ('00000000-0000-0000-0000-000000000102', 'Website'),
  ('00000000-0000-0000-0000-000000000103', 'Poshmark');

CREATE TABLE items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE DEFAULT ('BM-' || lpad(nextval('item_code_seq')::text, 3, '0')),
  name text NOT NULL DEFAULT '',
  asking_cents int CHECK (asking_cents >= 0),
  size text NOT NULL DEFAULT '',
  condition text NOT NULL DEFAULT '',
  flaws text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'preparing' CHECK (status IN ('preparing','ready','listed','reserved','sold','archived')),
  prev_status text CHECK (prev_status IN ('ready','listed')),
  archived_via text CHECK (archived_via IN ('user','writeoff')),
  archived_reason text,
  source_id uuid REFERENCES sources ON DELETE RESTRICT,
  acquisition text NOT NULL DEFAULT 'purchase' CHECK (acquisition IN ('purchase','personal')),
  own_cost_cents int CHECK (own_cost_cents >= 0),
  original_retail_cents int CHECK (original_retail_cents >= 0),
  transfer_value_cents int CHECK (transfer_value_cents >= 0),
  transfer_value_confirmed_at timestamptz,
  prep_cents int NOT NULL DEFAULT 0 CHECK (prep_cents >= 0),
  target_margin_cents int NOT NULL DEFAULT 0 CHECK (target_margin_cents >= 0),
  brand text NOT NULL DEFAULT '',
  fabric text NOT NULL DEFAULT '',
  measurements text NOT NULL DEFAULT '',
  location text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  capture_id uuid UNIQUE,
  first_listed_at timestamptz,
  listed_at timestamptz,
  version int NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchased_on date NOT NULL,
  source_id uuid REFERENCES sources ON DELETE RESTRICT,
  total_cents int NOT NULL CHECK (total_cents >= 0),
  excluded_cents int NOT NULL DEFAULT 0 CHECK (excluded_cents >= 0 AND excluded_cents <= total_cents),
  notes text NOT NULL DEFAULT '',
  receipt_blob_key text,
  version int NOT NULL DEFAULT 1,
  created_by uuid REFERENCES app_users,
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
CREATE TABLE purchase_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id uuid NOT NULL REFERENCES purchases,
  item_id uuid NOT NULL UNIQUE REFERENCES items,
  allocated_cents int NOT NULL CHECK (allocated_cents >= 0)
);

CREATE TABLE customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number serial UNIQUE,
  name text NOT NULL,
  handle text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  anonymised_at timestamptz,
  deleted_at timestamptz,
  version int NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE customer_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers,
  noted_on date NOT NULL,
  flag text CHECK (flag IN ('Reliable buyer','Late payment','Missed pickup','Difficult communication','Rude behaviour','Review before accepting another order')),
  body text NOT NULL DEFAULT '',
  created_by uuid REFERENCES app_users,
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number serial UNIQUE,
  customer_id uuid NOT NULL REFERENCES customers,
  platform_id uuid REFERENCES platforms ON DELETE SET NULL,
  payment_method text NOT NULL CHECK (payment_method IN ('etransfer','platform')),
  fulfilment_method text NOT NULL CHECK (fulfilment_method IN ('pickup','delivery','shipping')),
  discount_cents int NOT NULL DEFAULT 0 CHECK (discount_cents >= 0),
  fee_cents int NOT NULL DEFAULT 0 CHECK (fee_cents >= 0),
  deadline timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'awaiting' CHECK (status IN ('awaiting','paid','completed','cancelled')),
  paid_on date,
  cancelled_at timestamptz,
  cancel_reason text,
  platform_fee_cents int CHECK (platform_fee_cents >= 0),
  payout_received_on date,
  fulfilment_status text NOT NULL DEFAULT 'not_started' CHECK (fulfilment_status IN ('not_started','scheduled','handed_over','shipped')),
  appointment_at timestamptz,
  instructions text NOT NULL DEFAULT '',
  tracking text NOT NULL DEFAULT '',
  postage_state text NOT NULL DEFAULT 'na' CHECK (postage_state IN ('unknown','entered','na')),
  postage_cents int CHECK (postage_cents >= 0),
  version int NOT NULL DEFAULT 1,
  created_by uuid REFERENCES app_users,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE order_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders,
  item_id uuid NOT NULL REFERENCES items,
  position int NOT NULL,
  agreed_cents int NOT NULL CHECK (agreed_cents >= 0),
  active boolean NOT NULL DEFAULT true,
  cancelled_at timestamptz,
  allocated_discount_cents int,
  net_sale_cents int,
  allocated_platform_fee_cents int,
  snap_cost_cents int,
  snap_prep_cents int,
  snap_source_id uuid,
  UNIQUE (order_id, position)
);
CREATE UNIQUE INDEX one_active_line_per_item ON order_lines (item_id) WHERE active;

CREATE TABLE payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders,
  kind text NOT NULL CHECK (kind IN ('etransfer','platform')),
  amount_cents int NOT NULL CHECK (amount_cents > 0),
  received_on date NOT NULL,
  bank_ref text NOT NULL DEFAULT '',
  created_by uuid REFERENCES app_users,
  created_at timestamptz NOT NULL DEFAULT now(),
  voided_at timestamptz,
  void_reason text
);
CREATE TRIGGER payments_void_only BEFORE UPDATE OR DELETE ON payments FOR EACH ROW EXECUTE FUNCTION void_only();

CREATE TABLE refunds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders,
  refunded_on date NOT NULL,
  reason text NOT NULL CHECK (reason <> ''),
  fee_refund_cents int NOT NULL DEFAULT 0 CHECK (fee_refund_cents >= 0),
  unallocated_cents int NOT NULL DEFAULT 0 CHECK (unallocated_cents >= 0),
  return_postage_cents int NOT NULL DEFAULT 0 CHECK (return_postage_cents >= 0),
  created_by uuid REFERENCES app_users,
  created_at timestamptz NOT NULL DEFAULT now(),
  voided_at timestamptz,
  void_reason text
);
CREATE TRIGGER refunds_void_only BEFORE UPDATE OR DELETE ON refunds FOR EACH ROW EXECUTE FUNCTION void_only();
CREATE TABLE refund_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  refund_id uuid NOT NULL REFERENCES refunds,
  order_line_id uuid NOT NULL REFERENCES order_lines,
  amount_cents int NOT NULL CHECK (amount_cents >= 0),
  decision text NOT NULL CHECK (decision IN ('kept','restock','writeoff')),
  reversal_cents int
);
CREATE TRIGGER refund_lines_frozen BEFORE UPDATE OR DELETE ON refund_lines FOR EACH ROW EXECUTE FUNCTION forbid_change();

CREATE TABLE cost_adjustments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_line_id uuid NOT NULL REFERENCES order_lines,
  field text NOT NULL CHECK (field IN ('cost','prep')),
  old_cents int,
  new_cents int NOT NULL CHECK (new_cents >= 0),
  reason text NOT NULL CHECK (reason <> ''),
  created_by uuid REFERENCES app_users,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE TRIGGER cost_adjustments_frozen BEFORE UPDATE OR DELETE ON cost_adjustments FOR EACH ROW EXECUTE FUNCTION forbid_change();

CREATE TABLE expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','confirmed')),
  vendor text NOT NULL DEFAULT '',
  receipt_date date,
  amount_cents int CHECK (amount_cents >= 0),
  category text CHECK (category IN ('Packaging','Cleaning and repairs','Supplies','Fees and subscriptions','Marketing','Travel','Other')),
  receipt_blob_key text,
  notes text NOT NULL DEFAULT '',
  version int NOT NULL DEFAULT 1,
  created_by uuid REFERENCES app_users,
  created_at timestamptz NOT NULL DEFAULT now(),
  confirmed_at timestamptz,
  voided_at timestamptz,
  void_reason text,
  deleted_at timestamptz,
  CHECK (status = 'draft' OR (vendor <> '' AND receipt_date IS NOT NULL AND amount_cents > 0 AND category IS NOT NULL))
);
CREATE FUNCTION expense_guard() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN RAISE EXCEPTION 'DELETE on expenses is not allowed'; END IF;
  IF OLD.status = 'confirmed' THEN
    IF OLD.voided_at IS NOT NULL THEN RAISE EXCEPTION 'voided rows in expenses cannot change'; END IF;
    IF (to_jsonb(NEW) - 'voided_at' - 'void_reason') IS DISTINCT FROM (to_jsonb(OLD) - 'voided_at' - 'void_reason') THEN
      RAISE EXCEPTION 'only voiding is allowed on confirmed expenses';
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER expenses_guard BEFORE UPDATE OR DELETE ON expenses FOR EACH ROW EXECUTE FUNCTION expense_guard();

CREATE TABLE owner_funding (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  received_on date NOT NULL,
  amount_cents int NOT NULL CHECK (amount_cents > 0),
  note text NOT NULL DEFAULT '',
  created_by uuid REFERENCES app_users,
  created_at timestamptz NOT NULL DEFAULT now(),
  voided_at timestamptz,
  void_reason text
);
CREATE TRIGGER owner_funding_void_only BEFORE UPDATE OR DELETE ON owner_funding FOR EACH ROW EXECUTE FUNCTION void_only();

-- Effective cost/prep of a sale line: the latest adjustment wins, else the payment-time snapshot.
CREATE VIEW line_effective AS
SELECT l.id AS order_line_id,
  COALESCE((SELECT a.new_cents FROM cost_adjustments a WHERE a.order_line_id = l.id AND a.field = 'cost' ORDER BY a.created_at DESC, a.id DESC LIMIT 1), l.snap_cost_cents) AS cost_cents,
  COALESCE((SELECT a.new_cents FROM cost_adjustments a WHERE a.order_line_id = l.id AND a.field = 'prep' ORDER BY a.created_at DESC, a.id DESC LIMIT 1), l.snap_prep_cents) AS prep_cents
FROM order_lines l;

CREATE TABLE schema_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now());
```

Note for the executor: the spec says "effective cost = snapshot + Σ adjustments"; adjustments store absolute old/new values and the **latest one wins**, which is the same result and also works when the snapshot is unknown. Task 13 relies on the `line_effective` view.

- [ ] **Step 2: Create `server/db.js`**

```js
import { Pool, types } from '@neondatabase/serverless'

// 20 = int8. Return bigint results (counts, sums, bigserial ids) as numbers, as PGlite does in tests.
types.setTypeParser(20, v => Number(v))

// One pool per request; call end() when the request finishes.
export function neonDb(url = process.env.DATABASE_URL) {
  const pool = new Pool({ connectionString: url })
  return {
    query: (text, params) => pool.query(text, params),
    exec: (text) => pool.query(text),
    async tx(fn) {
      const client = await pool.connect()
      try {
        await client.query('BEGIN')
        const q = { query: (t, p) => client.query(t, p), exec: (t) => client.query(t) }
        const result = await fn(q)
        await client.query('COMMIT')
        return result
      } catch (e) {
        await client.query('ROLLBACK')
        throw e
      } finally {
        client.release()
      }
    },
    end: () => pool.end(),
  }
}
```

- [ ] **Step 3: Create `server/migrations.js`**

```js
import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

export async function applyMigrations(db, dir = fileURLToPath(new URL('../db/migrations/', import.meta.url))) {
  const files = (await readdir(dir)).filter(f => f.endsWith('.sql')).sort()
  let applied = new Set()
  try {
    applied = new Set((await db.query('SELECT name FROM schema_migrations')).rows.map(r => r.name))
  } catch { /* first run: table does not exist yet */ }
  for (const f of files) {
    if (applied.has(f)) continue
    const sql = await readFile(join(dir, f), 'utf8')
    await db.tx(async q => {
      await q.exec(sql)
      await q.query('INSERT INTO schema_migrations (name) VALUES ($1)', [f])
    })
  }
}
```

- [ ] **Step 4: Create `db/migrate.mjs`**

```js
import { neonDb } from '../server/db.js'
import { applyMigrations } from '../server/migrations.js'

if (!process.env.DATABASE_URL) throw new Error('Set DATABASE_URL')
const db = neonDb()
try {
  await applyMigrations(db)
  console.log('Migrations applied.')
} finally {
  await db.end()
}
```

- [ ] **Step 5: Create `test/helpers.js` (adapter part; Task 4 extends this file with `makeApp`)**

```js
import { PGlite } from '@electric-sql/pglite'
import { applyMigrations } from '../server/migrations.js'

export const PERSONAL_SOURCE_ID = '00000000-0000-0000-0000-000000000001'

const wrap = r => ({ rows: r.rows, rowCount: r.affectedRows || r.rows.length })

export async function testDb() {
  const pg = new PGlite()
  const db = {
    pg,
    query: async (t, p) => wrap(await pg.query(t, p)),
    exec: t => pg.exec(t),
    tx: fn => pg.transaction(async t => fn({ query: async (q, p) => wrap(await t.query(q, p)), exec: q => t.exec(q) })),
    end: () => pg.close(),
  }
  await applyMigrations(db)
  return db
}
```

- [ ] **Step 6: Write `test/schema.test.js`**

```js
import { describe, it, expect, beforeEach } from 'vitest'
import { testDb } from './helpers.js'

let db
beforeEach(async () => { db = await testDb() })

describe('schema', () => {
  it('converts to Edmonton dates', async () => {
    const r = await db.query(`SELECT (('2026-10-01T05:30:00Z'::timestamptz AT TIME ZONE 'America/Edmonton')::date)::text AS d`)
    expect(r.rows[0].d).toBe('2026-09-30')
  })

  it('assigns BM codes from a sequence', async () => {
    const a = await db.query(`INSERT INTO items DEFAULT VALUES RETURNING code`)
    const b = await db.query(`INSERT INTO items DEFAULT VALUES RETURNING code`)
    expect([a.rows[0].code, b.rows[0].code]).toEqual(['BM-001', 'BM-002'])
  })

  it('keeps the audit log append-only', async () => {
    await db.query(`INSERT INTO audit_log (entity, entity_id, action) VALUES ('x','1','create')`)
    await expect(db.query(`UPDATE audit_log SET action = 'y'`)).rejects.toThrow(/not allowed/)
    await expect(db.query(`DELETE FROM audit_log`)).rejects.toThrow(/not allowed/)
  })

  it('allows only voiding on payments', async () => {
    const c = await db.query(`INSERT INTO customers (name) VALUES ('A') RETURNING id`)
    const o = await db.query(`INSERT INTO orders (customer_id, payment_method, fulfilment_method, deadline) VALUES ($1,'etransfer','pickup', now()) RETURNING id`, [c.rows[0].id])
    const p = await db.query(`INSERT INTO payments (order_id, kind, amount_cents, received_on) VALUES ($1,'etransfer',100,'2026-09-01') RETURNING id`, [o.rows[0].id])
    await expect(db.query(`UPDATE payments SET amount_cents = 5`)).rejects.toThrow(/only voiding/)
    await expect(db.query(`DELETE FROM payments`)).rejects.toThrow(/not allowed/)
    await db.query(`UPDATE payments SET voided_at = now(), void_reason = 'typo' WHERE id = $1`, [p.rows[0].id])
    await expect(db.query(`UPDATE payments SET void_reason = 'again'`)).rejects.toThrow(/cannot change/)
  })

  it('allows one active order line per item', async () => {
    const i = await db.query(`INSERT INTO items DEFAULT VALUES RETURNING id`)
    const c = await db.query(`INSERT INTO customers (name) VALUES ('A') RETURNING id`)
    const mk = async () => (await db.query(`INSERT INTO orders (customer_id, payment_method, fulfilment_method, deadline) VALUES ($1,'etransfer','pickup', now()) RETURNING id`, [c.rows[0].id])).rows[0].id
    const o1 = await mk(), o2 = await mk()
    await db.query(`INSERT INTO order_lines (order_id, item_id, position, agreed_cents) VALUES ($1,$2,0,100)`, [o1, i.rows[0].id])
    await expect(db.query(`INSERT INTO order_lines (order_id, item_id, position, agreed_cents) VALUES ($1,$2,0,100)`, [o2, i.rows[0].id])).rejects.toThrow()
  })

  it('lets drafts change but only voids on confirmed expenses', async () => {
    const e = await db.query(`INSERT INTO expenses (vendor) VALUES ('') RETURNING id`)
    await db.query(`UPDATE expenses SET vendor='Tape Co', receipt_date='2026-09-01', amount_cents=500, category='Packaging', status='confirmed' WHERE id=$1`, [e.rows[0].id])
    await expect(db.query(`UPDATE expenses SET amount_cents = 50000 WHERE id=$1`, [e.rows[0].id])).rejects.toThrow(/only voiding/)
  })

  it('records applied migrations so re-running is a no-op', async () => {
    const { applyMigrations } = await import('../server/migrations.js')
    await applyMigrations(db)
    expect((await db.query('SELECT count(*)::int AS n FROM schema_migrations')).rows[0].n).toBe(1)
  })
})
```

- [ ] **Step 7: Run the tests**

Run: `npm test -- test/schema.test.js`
Expected: 7 passed. If the Edmonton-date test fails because PGlite lacks time-zone data, stop and report: Task 16 depends on SQL time-zone conversion and the plan must switch to computing Edmonton dates in JavaScript.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: schema, database adapters and test harness"
```

### Task 3: Money helpers

**Spec:** section 6.2–6.3.

**Files:** Create `server/money.js`, `test/money.test.js`.

**Interfaces — Produces:** `allocate(totalCents, weights) → int[]`; `orderAllocations({agreed, discountCents, platformFeeCents}) → [{allocatedDiscountCents, netSaleCents, allocatedPlatformFeeCents}]`; `amountDue({agreed, discountCents, feeCents}) → int`; `edmontonDate(date) → 'YYYY-MM-DD'`; `isCents(n) → boolean`.

- [ ] **Step 1: Write `test/money.test.js`**

```js
import { describe, it, expect } from 'vitest'
import { allocate, orderAllocations, amountDue, edmontonDate, isCents } from '../server/money.js'

describe('allocate', () => {
  it('splits by weight with the remainder landing so the sum is exact', () => {
    expect(allocate(1000, [1, 1, 1])).toEqual([333, 334, 333])
    expect(allocate(1000, [1, 1, 1]).reduce((a, b) => a + b)).toBe(1000)
  })
  it('splits equally when every weight is zero', () => {
    expect(allocate(10, [0, 0])).toEqual([5, 5])
  })
  it('gives a zero-weight line nothing when others have weight', () => {
    expect(allocate(1000, [8000, 0, 2000])).toEqual([800, 0, 200])
  })
  it('never returns a negative share', () => {
    for (let t = 0; t < 300; t++) expect(allocate(t, [7, 0, 3, 1]).every(s => s >= 0)).toBe(true)
  })
  it('rejects bad input', () => {
    expect(() => allocate(1.5, [1])).toThrow()
    expect(() => allocate(-1, [1])).toThrow()
    expect(() => allocate(5, [])).toThrow()
    expect(() => allocate(5, [-1, 2])).toThrow()
    expect(allocate(0, [])).toEqual([])
  })
})

describe('order allocations', () => {
  it('reconciles discount and fee to the amount due (spec 10: $80/$20, $10 off, $15 fee)', () => {
    const agreed = [8000, 2000]
    const lines = orderAllocations({ agreed, discountCents: 1000, platformFeeCents: 0 })
    expect(lines.map(l => l.allocatedDiscountCents)).toEqual([800, 200])
    expect(lines.map(l => l.netSaleCents)).toEqual([7200, 1800])
    const due = amountDue({ agreed, discountCents: 1000, feeCents: 1500 })
    expect(due).toBe(10500)
    expect(lines.reduce((s, l) => s + l.netSaleCents, 0) + 1500).toBe(due)
  })
  it('gives a free add-on no discount', () => {
    const lines = orderAllocations({ agreed: [5000, 0], discountCents: 999, platformFeeCents: 0 })
    expect(lines[1]).toEqual({ allocatedDiscountCents: 0, netSaleCents: 0, allocatedPlatformFeeCents: 0 })
    expect(lines[0].netSaleCents).toBe(4001)
  })
  it('spreads a platform fee by net sale', () => {
    const lines = orderAllocations({ agreed: [3000, 1000], discountCents: 0, platformFeeCents: 800 })
    expect(lines.map(l => l.allocatedPlatformFeeCents)).toEqual([600, 200])
  })
  it('rejects a discount above the merchandise total', () => {
    expect(() => orderAllocations({ agreed: [100], discountCents: 101, platformFeeCents: 0 })).toThrow(/discount/)
  })
})

describe('helpers', () => {
  it('formats Edmonton dates across UTC midnight', () => {
    expect(edmontonDate(new Date('2026-10-01T05:30:00Z'))).toBe('2026-09-30')
    expect(edmontonDate(new Date('2026-10-01T07:30:00Z'))).toBe('2026-10-01')
  })
  it('recognises cents', () => {
    expect(isCents(0)).toBe(true)
    expect(isCents(12)).toBe(true)
    expect(isCents(-1)).toBe(false)
    expect(isCents(1.2)).toBe(false)
    expect(isCents('5')).toBe(false)
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- test/money.test.js`
Expected: FAIL, cannot find module `../server/money.js`.

- [ ] **Step 3: Create `server/money.js`**

```js
export const isCents = n => Number.isInteger(n) && n >= 0

// Cumulative rounding: shares are never negative and always sum to the total.
export function allocate(totalCents, weights) {
  if (!isCents(totalCents)) throw new Error('total must be non-negative integer cents')
  if (weights.length === 0) {
    if (totalCents !== 0) throw new Error('cannot allocate to zero lines')
    return []
  }
  if (!weights.every(isCents)) throw new Error('weights must be non-negative integers')
  const sum = weights.reduce((a, b) => a + b, 0)
  const w = sum ? weights : weights.map(() => 1)
  const s = sum || weights.length
  let cumulative = 0
  let previous = 0
  return w.map((wi, i) => {
    cumulative += wi
    const target = i === w.length - 1 ? totalCents : Math.round(totalCents * cumulative / s)
    const share = target - previous
    previous = target
    return share
  })
}

export function amountDue({ agreed, discountCents, feeCents }) {
  return agreed.reduce((a, b) => a + b, 0) - discountCents + feeCents
}

export function orderAllocations({ agreed, discountCents, platformFeeCents }) {
  const subtotal = agreed.reduce((a, b) => a + b, 0)
  if (discountCents > subtotal) throw new Error('discount exceeds merchandise total')
  const discounts = subtotal ? allocate(discountCents, agreed) : agreed.map(() => 0)
  const net = agreed.map((a, i) => a - discounts[i])
  const netTotal = net.reduce((a, b) => a + b, 0)
  const fees = netTotal ? allocate(platformFeeCents || 0, net) : allocate(platformFeeCents || 0, net.map(() => 0))
  return agreed.map((_, i) => ({ allocatedDiscountCents: discounts[i], netSaleCents: net[i], allocatedPlatformFeeCents: fees[i] }))
}

const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Edmonton', year: 'numeric', month: '2-digit', day: '2-digit' })
export const edmontonDate = d => fmt.format(d)
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -- test/money.test.js`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add server/money.js test/money.test.js
git commit -m "feat: money allocation helpers"
```

### Task 4: HTTP layer — router, Origin check, idempotency, versions, audit

**Spec:** sections 2, 7.2, 7.4, 8 (Sessions, CSP).

**Files:** Create `server/sessions.js`, `server/http.js`, `server/audit.js`, `server/app.js`, `netlify/functions/api.mjs`, `test/http.test.js`; modify `test/helpers.js` (add `makeApp`).

**Interfaces — Produces (every later task uses these exact names):**
- `HttpError(status, code, message?, extra?)`.
- Route definition: `{ method, path: '/api/things/:id', handler: async ctx => plainObject, auth?: false, idempotent?: false, allowWhilePasswordChange?: true }`. Handlers return a plain object (sent as 200 JSON) or a `Response` (only for `idempotent: false` routes and GETs).
- `ctx`: `{ db, req, url, params, body, session, user: {id,email,name}|null, now: () => Date, requestId, ip }`.
- `lockVersioned(q, table, id, version) → row` (throws 404 `not_found`, 409 `stale` with `{ currentVersion }`); only for tables with `version` (and `deleted_at` where present).
- `audit(q, ctx, { entity, entityId, action, before, after, reason })`; `diff(before, after)`.
- `sessions.js`: `COOKIE`, `hashToken`, `newToken`, `readCookie`, `getSession(db, cookieHeader, now)`, `createSession(q, userId, userAgent, now) → {token, id, expires}`, `sessionCookie(token, expires)`, `clearCookie()`.
- `app.js`: `routes` array and `handle = createHandler(routes)`. Each later task appends its service's `routes` here.
- `test/helpers.js`: `ORIGIN`, `makeApp({ routes }?) → { db, call, clock, users, cookies }`; `call(method, path, body?, { as='jenn', key, origin, cookie, raw })`.

- [ ] **Step 1: Create `server/sessions.js`**

```js
import { createHash, randomBytes } from 'node:crypto'

export const COOKIE = 'bmv_session'
const DAY = 864e5

export const hashToken = t => createHash('sha256').update(t).digest('hex')
export const newToken = () => randomBytes(32).toString('base64url')

export function readCookie(header, name = COOKIE) {
  for (const part of (header || '').split(';')) {
    const [k, ...v] = part.trim().split('=')
    if (k === name) return v.join('=')
  }
  return null
}

export async function getSession(db, cookieHeader, now) {
  const token = readCookie(cookieHeader)
  if (!token) return null
  const r = await db.query(
    `SELECT s.id, s.last_seen_at, u.id AS user_id, u.email, u.name, u.must_change_password
       FROM sessions s JOIN app_users u ON u.id = s.user_id
      WHERE s.token_hash = $1 AND s.revoked_at IS NULL AND s.expires_at > $2`,
    [hashToken(token), now])
  const row = r.rows[0]
  if (!row) return null
  if (now - new Date(row.last_seen_at) > 3600e3) await db.query('UPDATE sessions SET last_seen_at = $2 WHERE id = $1', [row.id, now])
  return { id: row.id, mustChangePassword: row.must_change_password, user: { id: row.user_id, email: row.email, name: row.name } }
}

export async function createSession(q, userId, userAgent, now) {
  const token = newToken()
  const expires = new Date(now.getTime() + 30 * DAY)
  const r = await q.query(
    `INSERT INTO sessions (user_id, token_hash, user_agent, expires_at, created_at, last_seen_at)
     VALUES ($1, $2, $3, $4, $5, $5) RETURNING id`,
    [userId, hashToken(token), userAgent || '', expires, now])
  return { token, id: r.rows[0].id, expires }
}

export const sessionCookie = (token, expires) => `${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Expires=${expires.toUTCString()}`
export const clearCookie = () => `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`
```

- [ ] **Step 2: Create `server/audit.js`**

```js
// Personal details and note bodies are recorded as "changed" only, never their values.
const REDACT = new Set(['email', 'phone', 'address', 'body', 'password_hash'])
const SKIP = new Set(['version', 'updated_at'])

export function diff(before, after) {
  const out = {}
  for (const k of new Set([...Object.keys(before || {}), ...Object.keys(after || {})])) {
    if (SKIP.has(k)) continue
    const b = before?.[k] ?? null
    const a = after?.[k] ?? null
    if (JSON.stringify(b) === JSON.stringify(a)) continue
    out[k] = REDACT.has(k) ? { changed: true } : { before: b, after: a }
  }
  return out
}

export async function audit(q, ctx, { entity, entityId, action, before, after, reason }) {
  await q.query(
    `INSERT INTO audit_log (user_id, request_id, entity, entity_id, action, changes, reason)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [ctx.user?.id ?? null, ctx.requestId, entity, String(entityId), action, JSON.stringify(diff(before, after)), reason ?? null])
}
```

- [ ] **Step 3: Create `server/http.js`**

```js
import { getSession } from './sessions.js'

export class HttpError extends Error {
  constructor(status, code, message, extra = {}) {
    super(message || code)
    this.status = status
    this.code = code
    this.extra = extra
  }
}

export const json = (status, body, headers = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store', ...headers } })

const toResponse = r => r instanceof Response ? r : json(200, r ?? { ok: true })

function match(pattern, pathname) {
  const p = pattern.split('/')
  const a = pathname.split('/')
  if (p.length !== a.length) return null
  const params = {}
  for (let i = 0; i < p.length; i++) {
    if (p[i].startsWith(':')) params[p[i].slice(1)] = decodeURIComponent(a[i])
    else if (p[i] !== a[i]) return null
  }
  return params
}

const TABLES_WITH_DELETED_AT = new Set(['items', 'customers', 'purchases', 'expenses'])

export async function lockVersioned(q, table, id, version) {
  const deleted = TABLES_WITH_DELETED_AT.has(table) ? ' AND deleted_at IS NULL' : ''
  const r = await q.query(`SELECT * FROM ${table} WHERE id = $1${deleted} FOR UPDATE`, [id])
  const row = r.rows[0]
  if (!row) throw new HttpError(404, 'not_found')
  if (!Number.isInteger(version) || row.version !== version) throw new HttpError(409, 'stale', 'Someone changed this since you opened it. Reload to see the latest.', { currentVersion: row.version })
  return row
}

export function createHandler(routes) {
  return async function handle(req, env) {
    const now = env.now ?? (() => new Date())
    const url = new URL(req.url)
    let route = null
    let params = null
    for (const r of routes) {
      if (r.method !== req.method) continue
      const m = match(r.path, url.pathname)
      if (m) { route = r; params = m; break }
    }
    if (!route) return json(404, { error: 'not_found' })
    const write = req.method !== 'GET'
    let claimed = null
    try {
      if (write && req.headers.get('origin') !== url.origin) throw new HttpError(403, 'bad_origin')
      let body = {}
      if (write) {
        const text = await req.text()
        if (text) { try { body = JSON.parse(text) } catch { throw new HttpError(400, 'bad_json') } }
      }
      const session = route.auth === false ? null : await getSession(env.db, req.headers.get('cookie'), now())
      if (route.auth !== false && !session) throw new HttpError(401, 'signed_out')
      if (session?.mustChangePassword && !route.allowWhilePasswordChange) throw new HttpError(403, 'must_change_password')
      const ctx = { db: env.db, req, url, params, body, session, user: session?.user ?? null, now, requestId: crypto.randomUUID(), ip: env.ip ?? '' }
      if (!write || route.idempotent === false) return toResponse(await route.handler(ctx))

      const key = req.headers.get('idempotency-key')
      if (!key) throw new HttpError(400, 'missing_idempotency_key')
      const routeKey = `${req.method} ${url.pathname}`
      const claim = await env.db.query(
        'INSERT INTO idempotency_keys (key, user_id, route) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING RETURNING key',
        [key, session.user.id, routeKey])
      if (!claim.rowCount) {
        const prior = (await env.db.query('SELECT status, response, route FROM idempotency_keys WHERE key = $1 AND user_id = $2', [key, session.user.id])).rows[0]
        if (prior.route !== routeKey) throw new HttpError(422, 'idempotency_key_reused')
        if (prior.status == null) throw new HttpError(409, 'in_progress')
        return json(prior.status, prior.response)
      }
      claimed = { key, userId: session.user.id }
      const result = (await route.handler(ctx)) ?? { ok: true }
      await env.db.query('UPDATE idempotency_keys SET status = 200, response = $3 WHERE key = $1 AND user_id = $2', [key, session.user.id, JSON.stringify(result)])
      return json(200, result)
    } catch (e) {
      if (claimed) await env.db.query('DELETE FROM idempotency_keys WHERE key = $1 AND user_id = $2', [claimed.key, claimed.userId]).catch(() => {})
      if (e instanceof HttpError) return json(e.status, { error: e.code, message: e.message, ...e.extra })
      if (e?.code === '23505') return json(409, { error: 'conflict', message: 'That already exists or is already in use.' })
      console.error(e)
      return json(500, { error: 'server_error', message: 'Something went wrong. Nothing was saved.' })
    }
  }
}
```

- [ ] **Step 4: Create `server/app.js`**

```js
import { createHandler } from './http.js'

const health = { method: 'GET', path: '/api/health', auth: false, handler: async ctx => ({ ok: true, time: ctx.now().toISOString() }) }

// Later tasks append their service routes here, e.g. ...auth.routes
export const routes = [health]
export const handle = createHandler(routes)
```

Note for later tasks: `handle` is created once at module load from `routes`, so add imports and spread each service's `routes` into the array above; do not mutate `routes` at runtime.

- [ ] **Step 5: Create `netlify/functions/api.mjs`**

```js
import { neonDb } from '../../server/db.js'
import { handle } from '../../server/app.js'

export default async (req, context) => {
  const db = neonDb()
  try {
    return await handle(req, { db, ip: context.ip })
  } finally {
    await db.end()
  }
}

export const config = { path: '/api/*' }
```

- [ ] **Step 6: Append `makeApp` to `test/helpers.js`**

```js
import { createHandler } from '../server/http.js'
import { createSession, COOKIE } from '../server/sessions.js'

export const ORIGIN = 'https://bmv.test'

export async function makeApp({ routes } = {}) {
  const db = await testDb()
  const clock = { now: new Date('2026-09-15T18:00:00Z') }
  const handle = routes ? createHandler(routes) : (await import('../server/app.js')).handle
  const users = {}
  const cookies = {}
  for (const [as, name] of [['jenn', 'Jenn'], ['patrick', 'Patrick']]) {
    const u = await db.query(`INSERT INTO app_users (email, name, password_hash) VALUES ($1, $2, 'unset') RETURNING id`, [`${as}@test`, name])
    users[as] = u.rows[0].id
    const s = await createSession(db, users[as], 'test', clock.now)
    cookies[as] = `${COOKIE}=${s.token}`
  }
  let n = 0
  async function call(method, path, body, { as = 'jenn', key, origin = ORIGIN, cookie, raw = false } = {}) {
    const headers = { origin }
    if (body !== undefined) headers['content-type'] = 'application/json'
    const c = cookie !== undefined ? cookie : cookies[as]
    if (c) headers.cookie = c
    if (method !== 'GET') headers['idempotency-key'] = key ?? `key-${++n}`
    const res = await handle(new Request(ORIGIN + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) }), { db, ip: '203.0.113.9', now: () => clock.now })
    if (raw) return res
    const text = await res.text()
    return { status: res.status, body: text ? JSON.parse(text) : null, headers: res.headers }
  }
  return { db, call, clock, users, cookies }
}
```

(Move the new `import` lines to the top of the file with the existing ones.)

- [ ] **Step 7: Write `test/http.test.js`**

```js
import { describe, it, expect } from 'vitest'
import { makeApp } from './helpers.js'
import { HttpError, lockVersioned } from '../server/http.js'
import { diff } from '../server/audit.js'

function counterRoutes(state) {
  return [
    { method: 'GET', path: '/api/ping', handler: async ctx => ({ user: ctx.user.name }) },
    { method: 'POST', path: '/api/count', handler: async () => ({ n: ++state.n }) },
    { method: 'POST', path: '/api/other', handler: async () => ({ other: true }) },
    { method: 'POST', path: '/api/fail-once', handler: async () => { if (!state.failed) { state.failed = true; throw new HttpError(422, 'nope') } return { ok: 'second' } } },
    { method: 'POST', path: '/api/boom', handler: async () => { throw new Error('secret detail') } },
  ]
}

describe('http layer', () => {
  it('returns 404 for unknown paths', async () => {
    const { call } = await makeApp({ routes: counterRoutes({ n: 0 }) })
    expect((await call('GET', '/api/nope')).status).toBe(404)
  })

  it('requires a session', async () => {
    const { call } = await makeApp({ routes: counterRoutes({ n: 0 }) })
    expect((await call('GET', '/api/ping', undefined, { cookie: '' })).status).toBe(401)
    expect((await call('GET', '/api/ping', undefined, { cookie: 'bmv_session=forged' })).status).toBe(401)
    expect((await call('GET', '/api/ping')).body).toEqual({ user: 'Jenn' })
  })

  it('rejects expired and revoked sessions', async () => {
    const { call, clock, db } = await makeApp({ routes: counterRoutes({ n: 0 }) })
    await db.query(`UPDATE sessions SET revoked_at = now() WHERE user_id = (SELECT id FROM app_users WHERE email = 'patrick@test')`)
    expect((await call('GET', '/api/ping', undefined, { as: 'patrick' })).status).toBe(401)
    clock.now = new Date(clock.now.getTime() + 31 * 864e5)
    expect((await call('GET', '/api/ping')).status).toBe(401)
  })

  it('rejects writes from another origin or with no origin', async () => {
    const { call } = await makeApp({ routes: counterRoutes({ n: 0 }) })
    expect((await call('POST', '/api/count', {}, { origin: 'https://evil.test' })).body.error).toBe('bad_origin')
    expect((await call('POST', '/api/count', {}, { origin: null })).status).toBe(403)
  })

  it('requires an idempotency key and replays the first result', async () => {
    const state = { n: 0 }
    const { call } = await makeApp({ routes: counterRoutes(state) })
    const r1 = await call('POST', '/api/count', {}, { key: 'same' })
    const r2 = await call('POST', '/api/count', {}, { key: 'same' })
    expect(r1.body).toEqual({ n: 1 })
    expect(r2.body).toEqual({ n: 1 })
    expect(state.n).toBe(1)
    expect((await call('POST', '/api/other', {}, { key: 'same' })).body.error).toBe('idempotency_key_reused')
  })

  it('keys are per user', async () => {
    const state = { n: 0 }
    const { call } = await makeApp({ routes: counterRoutes(state) })
    await call('POST', '/api/count', {}, { key: 'k', as: 'jenn' })
    await call('POST', '/api/count', {}, { key: 'k', as: 'patrick' })
    expect(state.n).toBe(2)
  })

  it('frees the key when the handler fails so a retry runs', async () => {
    const { call } = await makeApp({ routes: counterRoutes({ n: 0 }) })
    const a = await call('POST', '/api/fail-once', {}, { key: 'r' })
    expect([a.status, a.body.error]).toEqual([422, 'nope'])
    expect((await call('POST', '/api/fail-once', {}, { key: 'r' })).body).toEqual({ ok: 'second' })
  })

  it('hides unexpected errors', async () => {
    const { call } = await makeApp({ routes: counterRoutes({ n: 0 }) })
    const r = await call('POST', '/api/boom', {})
    expect(r.status).toBe(500)
    expect(JSON.stringify(r.body)).not.toContain('secret')
  })

  it('detects stale versions', async () => {
    const { db } = await makeApp({ routes: [] })
    const i = (await db.query('INSERT INTO items DEFAULT VALUES RETURNING id')).rows[0].id
    await expect(db.tx(q => lockVersioned(q, 'items', i, 2))).rejects.toMatchObject({ status: 409, code: 'stale', extra: { currentVersion: 1 } })
    await expect(db.tx(q => lockVersioned(q, 'items', i, 1))).resolves.toMatchObject({ id: i })
  })

  it('redacts personal fields in audit diffs and skips versions', () => {
    const d = diff({ name: 'A', email: 'a@x', version: 1, body: 'late' }, { name: 'B', email: 'b@x', version: 2, body: 'on time' })
    expect(d).toEqual({ name: { before: 'A', after: 'B' }, email: { changed: true }, body: { changed: true } })
  })

  it('serves the health check without a session', async () => {
    const { call } = await makeApp()
    expect((await call('GET', '/api/health', undefined, { cookie: '' })).body.ok).toBe(true)
  })
})
```

Note: `call(..., { origin: null })` sends the header value `null`; Request drops a null header value? It sends the string "null", which also fails the check — both count as rejection.

- [ ] **Step 8: Run tests** — `npm test` — Expected: all pass (schema, money, http).

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: http layer with origin, idempotency, versions and audit"
```

### Task 5: Accounts, passwords, sessions and rate limiting

**Spec:** section 8 (Accounts, Passwords, Sessions, Login rate limit, Password reset); section 2.

**Files:** Create `server/passwords.js`, `server/auth.js`, `scripts/seed-users.mjs`, `scripts/reset-password.mjs`, `test/auth.test.js`; modify `server/app.js` (add `...auth.routes`), `README.md` (break-glass section).

**Interfaces — Produces:** `hashPassword(pw) → Promise<string>`, `verifyPassword(pw, stored) → Promise<boolean>`; `auth.routes`.

**Rules (the executor implements exactly these):**
- `hashPassword`: `crypto.scrypt` N=16384, r=8, p=1, keylen 64, 16-byte random salt; stored as `scrypt$16384$8$1$<salt b64>$<hash b64>`. `verifyPassword` uses `timingSafeEqual`; returns false for any malformed stored value (including `'unset'`).
- Passwords: minimum 10 characters, maximum 200 → 422 `weak_password`.
- `POST /api/auth/login` (`auth: false`, `idempotent: false`) body `{ email, password }`. Lower-case and trim the email. Rate limit before checking the password: count failed attempts in the last 15 minutes for this email, and separately for this IP; take the larger, `fails`. If `fails >= 5`, required wait = `min(2 ** (fails - 5), 60)` seconds after the latest failure (for whichever key produced `fails`); if still inside the wait → 429 `slow_down` with `{ retryAfterSeconds }`. Never lock out permanently. Record every attempt that reaches the password check in `login_attempts` (email, ip, success); throttled (429) attempts are not recorded. Unknown email and wrong password both → 401 `bad_credentials` (same message; still run `verifyPassword` against a fixed dummy hash so timing is similar). On success: `createSession`, respond `Response` 200 JSON `{ user: {id,email,name}, mustChangePassword }` with `Set-Cookie: sessionCookie(...)`; audit `{entity:'session', action:'login'}`.
- `POST /api/auth/logout` (`idempotent: false`, `allowWhilePasswordChange`): revoke the current session; respond with `Set-Cookie: clearCookie()` and header `Clear-Site-Data: "cache"`.
- `GET /api/auth/me` (`allowWhilePasswordChange`): `{ user, mustChangePassword }`.
- `POST /api/auth/change-password` (`allowWhilePasswordChange`) `{ currentPassword, newPassword }`: verify current (401 `bad_credentials`), strength check, store hash, clear `must_change_password`, revoke all of this user's **other** sessions; audit (no password values).
- `POST /api/auth/reset-other` `{ userId }`: target must be the other account (not self → 422 `use_change_password`); generate a temporary password of 16 characters from `randomBytes(12).toString('base64url')`; set it, `must_change_password = true`, revoke all the target's sessions; audit; return `{ temporaryPassword }` once.
- `GET /api/auth/sessions`: this user's sessions that are not revoked and not expired: `{ sessions: [{ id, userAgent, createdAt, lastSeenAt, current }] }`.
- `POST /api/auth/sessions/:id/revoke`: only own sessions (404 otherwise).
- `POST /api/auth/sessions/revoke-all`: revoke all own sessions except the current one.
- No signup route exists.
- `scripts/seed-users.mjs`: usage `node scripts/seed-users.mjs "Jenn" jenn@example.com "Patrick" patrick@example.com`; refuses if `app_users` already has rows; generates a temporary password per user (as in reset-other), sets `must_change_password = true`, prints each temporary password once to the terminal.
- `scripts/reset-password.mjs`: usage `node scripts/reset-password.mjs <email>` with `DATABASE_URL` set; sets a temporary password as above, revokes that user's sessions, writes an audit row (`user_id` NULL, `action 'break_glass_reset'`), prints the password once.
- README "Break-glass password reset": plain-English steps for Patrick: open a terminal in `C:\dev\big-mood-vintage`, copy the production database connection string from the Neon console, run the two commands, sign in with the printed password, change it.

- [ ] **Step 1: Write `test/auth.test.js`**

```js
import { describe, it, expect } from 'vitest'
import { makeApp } from './helpers.js'
import { hashPassword, verifyPassword } from '../server/passwords.js'

async function appWithPasswords() {
  const app = await makeApp()
  await app.db.query(`UPDATE app_users SET password_hash = $1 WHERE email = 'jenn@test'`, [await hashPassword('jenn password 1')])
  await app.db.query(`UPDATE app_users SET password_hash = $1 WHERE email = 'patrick@test'`, [await hashPassword('patrick password 1')])
  return app
}
const login = (call, email, password) => call('POST', '/api/auth/login', { email, password }, { cookie: '' })

describe('passwords', () => {
  it('hashes and verifies', async () => {
    const h = await hashPassword('a long password')
    expect(h.startsWith('scrypt$16384$8$1$')).toBe(true)
    expect(await verifyPassword('a long password', h)).toBe(true)
    expect(await verifyPassword('wrong password!', h)).toBe(false)
    expect(await verifyPassword('anything at all', 'unset')).toBe(false)
  })
})

describe('login', () => {
  it('signs in and sets a secure cookie', async () => {
    const { call } = await appWithPasswords()
    const r = await login(call, ' JENN@test ', 'jenn password 1')
    expect(r.status).toBe(200)
    const cookie = r.headers.get('set-cookie')
    expect(cookie).toMatch(/HttpOnly/)
    expect(cookie).toMatch(/Secure/)
    expect(cookie).toMatch(/SameSite=Lax/)
    const me = await call('GET', '/api/auth/me', undefined, { cookie: cookie.split(';')[0] })
    expect(me.body.user.email).toBe('jenn@test')
  })

  it('gives the same answer for unknown email and wrong password', async () => {
    const { call } = await appWithPasswords()
    const a = await login(call, 'nobody@test', 'whatever password')
    const b = await login(call, 'jenn@test', 'wrong password!!')
    expect([a.status, a.body.error]).toEqual([401, 'bad_credentials'])
    expect([b.status, b.body.error]).toEqual([401, 'bad_credentials'])
  })

  it('slows down after five failures and recovers after the wait', async () => {
    const { call, clock } = await appWithPasswords()
    for (let i = 0; i < 5; i++) await login(call, 'jenn@test', 'wrong password!!')
    const slowed = await login(call, 'jenn@test', 'jenn password 1')
    expect([slowed.status, slowed.body.error]).toEqual([429, 'slow_down'])
    expect(slowed.body.retryAfterSeconds).toBe(1)
    clock.now = new Date(clock.now.getTime() + 2000)
    expect((await login(call, 'jenn@test', 'jenn password 1')).status).toBe(200)
  })

  it('has no signup route', async () => {
    const { call } = await appWithPasswords()
    expect((await call('POST', '/api/auth/signup', { email: 'x@test', password: 'long enough pw' }, { cookie: '' })).status).toBe(404)
  })
})

describe('sessions and passwords', () => {
  it('logout revokes the session and clears caches', async () => {
    const { call } = await appWithPasswords()
    const r = await call('POST', '/api/auth/logout', {})
    expect(r.headers.get('clear-site-data')).toBe('"cache"')
    expect((await call('GET', '/api/auth/me')).status).toBe(401)
  })

  it('change-password revokes other sessions but keeps this one', async () => {
    const { call } = await appWithPasswords()
    const other = (await login(call, 'jenn@test', 'jenn password 1')).headers.get('set-cookie').split(';')[0]
    const r = await call('POST', '/api/auth/change-password', { currentPassword: 'jenn password 1', newPassword: 'brand new password' })
    expect(r.status).toBe(200)
    expect((await call('GET', '/api/auth/me', undefined, { cookie: other })).status).toBe(401)
    expect((await call('GET', '/api/auth/me')).status).toBe(200)
    expect((await call('POST', '/api/auth/change-password', { currentPassword: 'brand new password', newPassword: 'short' })).body.error).toBe('weak_password')
  })

  it('one owner can reset the other; the other must change it before doing anything else', async () => {
    const { call, users } = await appWithPasswords()
    const r = await call('POST', '/api/auth/reset-other', { userId: users.patrick })
    expect(r.body.temporaryPassword).toHaveLength(16)
    expect((await call('GET', '/api/auth/me', undefined, { as: 'patrick' })).status).toBe(401)
    const cookie = (await login(call, 'patrick@test', r.body.temporaryPassword)).headers.get('set-cookie').split(';')[0]
    expect((await call('GET', '/api/health', undefined, { cookie })).status).toBe(200)
    expect((await call('GET', '/api/auth/sessions', undefined, { cookie })).body.error).toBe('must_change_password')
    await call('POST', '/api/auth/change-password', { currentPassword: r.body.temporaryPassword, newPassword: 'patrick new password' }, { cookie })
    expect((await call('GET', '/api/auth/sessions', undefined, { cookie })).status).toBe(200)
    expect((await call('POST', '/api/auth/reset-other', { userId: users.jenn }, { as: 'jenn' })).body.error).toBe('use_change_password')
  })

  it('lists and revokes own sessions only', async () => {
    const { call, users, db } = await appWithPasswords()
    const list = await call('GET', '/api/auth/sessions')
    expect(list.body.sessions).toHaveLength(1)
    expect(list.body.sessions[0].current).toBe(true)
    const patrickSession = (await db.query('SELECT id FROM sessions WHERE user_id = $1', [users.patrick])).rows[0].id
    expect((await call('POST', `/api/auth/sessions/${patrickSession}/revoke`, {})).status).toBe(404)
    await login(call, 'jenn@test', 'jenn password 1')
    await call('POST', '/api/auth/sessions/revoke-all', {})
    expect((await call('GET', '/api/auth/sessions')).body.sessions).toHaveLength(1)
  })

  it('never writes passwords into the audit log', async () => {
    const { call, db } = await appWithPasswords()
    await call('POST', '/api/auth/change-password', { currentPassword: 'jenn password 1', newPassword: 'brand new password' })
    const all = JSON.stringify((await db.query('SELECT * FROM audit_log')).rows)
    expect(all).not.toContain('brand new password')
    expect(all).not.toContain('scrypt$')
  })
})
```

- [ ] **Step 2: Run to verify it fails** — `npm test -- test/auth.test.js` — Expected: FAIL (modules missing).
- [ ] **Step 3: Implement** `server/passwords.js`, `server/auth.js` (exporting `routes`), the two scripts and the README section, following the rules above. Add `import * as auth from './auth.js'` and `...auth.routes` to `server/app.js`.
- [ ] **Step 4: Run** — `npm test` — Expected: all pass.
- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: accounts, sessions, rate limit, peer and break-glass reset"
```

### Task 6: Sources and platforms

**Spec:** sections 3 (Sources, Platforms), 5.8.

**Files:** Create `server/names.js`, `server/sources.js`, `server/platforms.js`, `test/sources-platforms.test.js`; modify `server/app.js`.

**Interfaces — Produces:** `cleanName(s) → string`; `sources.routes`, `platforms.routes`; constant `PERSONAL_SOURCE_ID` exported from `server/sources.js`.

**Rules:**
- `cleanName`: trim, collapse internal whitespace to one space.
- Names are unique case-insensitively among live rows **and** may not equal `Personal wardrobe` or `Not recorded` (either list) → 422 `duplicate_name`. Empty → 422 `name_required`. Longer than 70 (sources) / 40 (platforms) → 422 `name_too_long`.
- `GET /api/sources` → `{ sources: [{ id, name, fixed, itemCount }] }` (live rows, fixed first then by name; `itemCount` counts live items). `POST /api/sources { name }` → `{ source }`. `PATCH /api/sources/:id { name }` → fixed sources → 422 `fixed_source`. `DELETE /api/sources/:id` → fixed → 422 `fixed_source`; referenced by any item or purchase (including soft-deleted items) → 409 `source_in_use` with `{ itemCount, purchaseCount }`; otherwise set `deleted_at`.
- `GET /api/platforms` → `{ platforms: [{ id, name, orderCount }] }` by name. `POST`, `PATCH /:id { name }`. `DELETE /api/platforms/:id` → hard delete (orders' `platform_id` become NULL by the foreign key); response `{ ordersNowNotRecorded: n }` (count before deleting).
- All writes audited (`entity` `source` / `platform`).

- [ ] **Step 1: Write `test/sources-platforms.test.js`**

```js
import { describe, it, expect } from 'vitest'
import { makeApp } from './helpers.js'
import { cleanName } from '../server/names.js'

describe('names', () => {
  it('cleans whitespace', () => expect(cleanName('  Value   Village  ')).toBe('Value Village'))
})

describe('sources', () => {
  it('adds, renames and lists with the fixed option first', async () => {
    const { call } = await makeApp()
    const a = await call('POST', '/api/sources', { name: ' Value  Village ' })
    expect(a.body.source.name).toBe('Value Village')
    await call('PATCH', `/api/sources/${a.body.source.id}`, { name: 'Value Village – 17 Ave' })
    const list = (await call('GET', '/api/sources')).body.sources
    expect(list.map(s => s.name)).toEqual(['Personal wardrobe', 'Value Village – 17 Ave'])
  })

  it('rejects duplicates, reserved names and bad lengths', async () => {
    const { call } = await makeApp()
    await call('POST', '/api/sources', { name: 'Goodwill' })
    expect((await call('POST', '/api/sources', { name: 'goodwill ' })).body.error).toBe('duplicate_name')
    expect((await call('POST', '/api/sources', { name: 'not recorded' })).body.error).toBe('duplicate_name')
    expect((await call('POST', '/api/sources', { name: 'Personal Wardrobe' })).body.error).toBe('duplicate_name')
    expect((await call('POST', '/api/sources', { name: '   ' })).body.error).toBe('name_required')
    expect((await call('POST', '/api/sources', { name: 'x'.repeat(71) })).body.error).toBe('name_too_long')
  })

  it('protects the fixed source and sources in use', async () => {
    const { call, db } = await makeApp()
    const fixed = (await call('GET', '/api/sources')).body.sources[0]
    expect((await call('DELETE', `/api/sources/${fixed.id}`)).body.error).toBe('fixed_source')
    const s = (await call('POST', '/api/sources', { name: 'Goodwill' })).body.source
    await db.query('INSERT INTO items (source_id) VALUES ($1)', [s.id])
    const r = await call('DELETE', `/api/sources/${s.id}`)
    expect([r.status, r.body.error, r.body.itemCount]).toEqual([409, 'source_in_use', 1])
    const unused = (await call('POST', '/api/sources', { name: 'Unused' })).body.source
    expect((await call('DELETE', `/api/sources/${unused.id}`)).status).toBe(200)
    expect((await call('POST', '/api/sources', { name: 'Unused' })).status).toBe(200)
  })
})

describe('platforms', () => {
  it('starts with Instagram, Website and Poshmark', async () => {
    const { call } = await makeApp()
    expect((await call('GET', '/api/platforms')).body.platforms.map(p => p.name)).toEqual(['Instagram', 'Poshmark', 'Website'])
  })

  it('removing a platform keeps its orders as Not recorded', async () => {
    const { call, db } = await makeApp()
    const ig = (await call('GET', '/api/platforms')).body.platforms.find(p => p.name === 'Instagram')
    const c = (await db.query(`INSERT INTO customers (name) VALUES ('A') RETURNING id`)).rows[0].id
    await db.query(`INSERT INTO orders (customer_id, platform_id, payment_method, fulfilment_method, deadline) VALUES ($1, $2, 'etransfer', 'pickup', now())`, [c, ig.id])
    const r = await call('DELETE', `/api/platforms/${ig.id}`)
    expect(r.body.ordersNowNotRecorded).toBe(1)
    expect((await db.query('SELECT platform_id FROM orders')).rows[0].platform_id).toBeNull()
    expect((await call('POST', '/api/platforms', { name: 'Not Recorded' })).body.error).toBe('duplicate_name')
    expect((await call('POST', '/api/platforms', { name: 'y'.repeat(41) })).body.error).toBe('name_too_long')
  })
})
```

- [ ] **Step 2: Run to verify it fails** — `npm test -- test/sources-platforms.test.js` — Expected: FAIL.
- [ ] **Step 3: Implement** `server/names.js` (`export const cleanName = s => String(s ?? '').trim().replace(/\s+/g, ' ')`), `server/sources.js`, `server/platforms.js` per the rules; each write runs in `ctx.db.tx(async q => …)` and calls `audit(q, ctx, …)`. Register both route arrays in `server/app.js`.
- [ ] **Step 4: Run** — `npm test` — Expected: all pass.
- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat: sources and platforms"`

### Task 7: Items

**Spec:** section 5.1 (all of it), 3 (Sources), 6.10, 7.2, 7.3.

**Files:** Create `server/items.js`, `test/items.test.js`; modify `server/app.js`; append fixtures to `test/helpers.js`.

**Interfaces — Produces:**
- `items.routes`.
- `costBasis(itemRow, purchaseLineRow | null) → { cents: int|null, authority: 'purchase'|'transfer'|'own' }` (exported; Tasks 10, 13 and 14 use it).
- `meetsListing(itemRow) → string[]` (missing field names; empty when ready).
- `loadItemForCost(q, itemId) → { item, purchaseLine }` (item row plus its purchase line or null).
- `itemDto(row, purchaseLine)` → camelCase object with `costBasisCents`, `costAuthority`, `missingForListing`.
- Test fixture `readyItem(call, overrides?) → item dto` (creates and marks Ready to list) and `listedItem(call, overrides?)` (also Mark listed).

**Rules:**
- **Create** `POST /api/items` with any of: `name, askingCents, size, condition, flaws, sourceId, acquisition ('purchase'|'personal'), ownCostCents, originalRetailCents, transferValueCents, prepCents, targetMarginCents, brand, fabric, measurements, location, notes, captureId`. All `*Cents` must satisfy `isCents` or be `null` → else 422 `bad_amount` with `{ field }`. Status starts `preparing`. `acquisition: 'personal'` forces `source_id = PERSONAL_SOURCE_ID`. A `sourceId` that does not exist or is deleted → 422 `unknown_source`. If `captureId` already exists, return that existing item unchanged (idempotent capture for Plan 3). Response `{ item }`.
- **Read** `GET /api/items?status=&sourceId=&q=`: excludes soft-deleted; `sourceId=none` means NULL; `q` matches code, name or brand case-insensitively; newest first. `GET /api/items/:id` → `{ item }` where `item.saleLine` is `{ orderLineId, paidOn, effectiveCostCents }` for its active paid line, else null.
- **Cost basis** (`costBasis`): purchase line present → `{cents: line.allocated_cents, authority:'purchase'}`; else `acquisition==='personal'` → `{cents: transfer_value_confirmed_at ? transfer_value_cents : null, authority:'transfer'}`; else `{cents: own_cost_cents, authority:'own'}`.
- **Edit** `PATCH /api/items/:id { version, ...fields }` (same fields as create except `captureId`; `status` is never patchable → 422 `use_transition`):
  - Status `reserved` or `sold`: changing `askingCents`, `ownCostCents`, `prepCents`, `transferValueCents`, `acquisition` → 409 `locked_by_order`.
  - `ownCostCents` when the item is on a purchase → 409 `cost_on_purchase`.
  - `acquisition` → `personal` forces the personal source; away from `personal` clears `transfer_value_confirmed_at` and sets `source_id` NULL unless a `sourceId` is given. Any change to `transferValueCents` clears `transfer_value_confirmed_at`.
  - `sourceId` on a personal item → 422 `personal_source_fixed`.
  - Status `listed` or `reserved`: after the edit, `meetsListing` must be empty → 422 `listing_requirements` with `{ missing }`.
  - Bump `version`, set `updated_at`, audit with before/after.
- **Transitions** `POST /api/items/:id/transition { version, to, reason? }`, user-allowed only (spec 5.1 table rows marked U):
  - `preparing → ready`: requires `meetsListing` empty else 422 `listing_requirements`.
  - `ready → preparing`.
  - `ready|listed → listed` ("Mark listed"): requires listing; sets `listed_at = now`, and `first_listed_at` if null.
  - `listed → ready` (Unlist).
  - `preparing|ready|listed → archived`: `reason` required (422 `reason_required`); sets `archived_via = 'user'`, `archived_reason`.
  - `archived → preparing`: always allowed; clears `archived_via`, `archived_reason`. (This relaxes the spec table's "only if never sold" wording: user-archived items were in stock, write-offs are physical items she may repair. The spec is updated alongside this plan.)
  - Anything else → 409 `bad_transition` with `{ from, to }`.
  - Audit each with `action: 'transition'`.
- **Confirm transfer value** `POST /api/items/:id/confirm-transfer { version }`: `acquisition` must be personal and `transfer_value_cents` not null (0 allowed) → else 422 `nothing_to_confirm`; sets `transfer_value_confirmed_at = now`.
- **Delete** `DELETE /api/items/:id { version }`: only if the item has never been on any order line and is not on a purchase → else 409 `item_has_history`; sets `deleted_at`.
- Server-driven status changes (reserve, pay, return) are implemented by Tasks 9, 10 and 12 with conditional `UPDATE … WHERE status = …`, never through this route.

- [ ] **Step 1: Append fixtures to `test/helpers.js`**

```js
export async function readyItem(call, overrides = {}) {
  const r = await call('POST', '/api/items', { name: 'Burgundy cardigan', askingCents: 4800, size: 'M', condition: 'Very good', flaws: 'Light pilling at cuffs', ownCostCents: 1200, ...overrides })
  if (r.status !== 200) throw new Error(JSON.stringify(r.body))
  const t = await call('POST', `/api/items/${r.body.item.id}/transition`, { version: r.body.item.version, to: 'ready' })
  if (t.status !== 200) throw new Error(JSON.stringify(t.body))
  return t.body.item
}

export async function listedItem(call, overrides = {}) {
  const item = await readyItem(call, overrides)
  const t = await call('POST', `/api/items/${item.id}/transition`, { version: item.version, to: 'listed' })
  if (t.status !== 200) throw new Error(JSON.stringify(t.body))
  return t.body.item
}
```

- [ ] **Step 2: Write `test/items.test.js`**

```js
import { describe, it, expect } from 'vitest'
import { makeApp, readyItem, listedItem, PERSONAL_SOURCE_ID } from './helpers.js'

describe('items', () => {
  it('quick capture needs almost nothing and keeps unknown cost unknown', async () => {
    const { call } = await makeApp()
    const r = await call('POST', '/api/items', { notes: 'blue coat, 3rd rack' })
    expect(r.body.item.status).toBe('preparing')
    expect(r.body.item.code).toBe('BM-001')
    expect(r.body.item.costBasisCents).toBeNull()
    expect(r.body.item.missingForListing).toEqual(['askingCents', 'size', 'condition', 'flaws'])
  })

  it('rejects non-cent amounts', async () => {
    const { call } = await makeApp()
    const r = await call('POST', '/api/items', { askingCents: 12.5 })
    expect([r.status, r.body.error, r.body.field]).toEqual([422, 'bad_amount', 'askingCents'])
  })

  it('returns the same item for a repeated capture id', async () => {
    const { call } = await makeApp()
    const captureId = '11111111-1111-4111-8111-111111111111'
    const a = await call('POST', '/api/items', { captureId, notes: 'x' })
    const b = await call('POST', '/api/items', { captureId, notes: 'x' })
    expect(b.body.item.id).toBe(a.body.item.id)
  })

  it('enforces listing requirements on the way to Listed and while Listed', async () => {
    const { call } = await makeApp()
    const c = (await call('POST', '/api/items', { name: 'Coat' })).body.item
    const t = await call('POST', `/api/items/${c.id}/transition`, { version: c.version, to: 'ready' })
    expect([t.status, t.body.error]).toEqual([422, 'listing_requirements'])
    const listed = await listedItem(call)
    expect(listed.listedAt).toBeTruthy()
    expect(listed.firstListedAt).toBe(listed.listedAt)
    const e = await call('PATCH', `/api/items/${listed.id}`, { version: listed.version, askingCents: 0 })
    expect([e.status, e.body.error]).toEqual([422, 'listing_requirements'])
  })

  it('only allows user transitions from the table', async () => {
    const { call } = await makeApp()
    const i = await readyItem(call)
    const bad = await call('POST', `/api/items/${i.id}/transition`, { version: i.version, to: 'sold' })
    expect([bad.status, bad.body.error]).toEqual([409, 'bad_transition'])
    const noReason = await call('POST', `/api/items/${i.id}/transition`, { version: i.version, to: 'archived' })
    expect(noReason.body.error).toBe('reason_required')
    const arch = await call('POST', `/api/items/${i.id}/transition`, { version: i.version, to: 'archived', reason: 'stained beyond repair' })
    expect(arch.body.item.status).toBe('archived')
    const back = await call('POST', `/api/items/${i.id}/transition`, { version: arch.body.item.version, to: 'preparing' })
    expect(back.body.item.status).toBe('preparing')
    expect((await call('PATCH', `/api/items/${i.id}`, { version: back.body.item.version, status: 'listed' })).body.error).toBe('use_transition')
  })

  it('rejects stale edits from the other person', async () => {
    const { call } = await makeApp()
    const i = await readyItem(call)
    await call('PATCH', `/api/items/${i.id}`, { version: i.version, name: 'Jenn edit' })
    const r = await call('PATCH', `/api/items/${i.id}`, { version: i.version, notes: 'Patrick edit' }, { as: 'patrick' })
    expect([r.status, r.body.error]).toEqual([409, 'stale'])
  })

  it('personal contributions have unknown cost until the transfer value is confirmed', async () => {
    const { call } = await makeApp()
    const p = (await call('POST', '/api/items', { acquisition: 'personal', originalRetailCents: 7500, transferValueCents: 1500 })).body.item
    expect(p.sourceId).toBe(PERSONAL_SOURCE_ID)
    expect([p.costBasisCents, p.costAuthority]).toEqual([null, 'transfer'])
    const c = await call('POST', `/api/items/${p.id}/confirm-transfer`, { version: p.version })
    expect(c.body.item.costBasisCents).toBe(1500)
    const e = await call('PATCH', `/api/items/${p.id}`, { version: c.body.item.version, transferValueCents: 2000 })
    expect(e.body.item.costBasisCents).toBeNull()
    expect((await call('PATCH', `/api/items/${p.id}`, { version: e.body.item.version, sourceId: null })).body.error).toBe('personal_source_fixed')
    const zero = (await call('POST', '/api/items', { acquisition: 'personal', transferValueCents: 0 })).body.item
    expect((await call('POST', `/api/items/${zero.id}/confirm-transfer`, { version: zero.version })).body.item.costBasisCents).toBe(0)
  })

  it('soft-deletes only items with no history', async () => {
    const { call, db } = await makeApp()
    const i = await readyItem(call)
    expect((await call('DELETE', `/api/items/${i.id}`, { version: i.version })).status).toBe(200)
    expect((await call('GET', '/api/items')).body.items).toHaveLength(0)
    expect((await db.query('SELECT deleted_at FROM items WHERE id = $1', [i.id])).rows[0].deleted_at).not.toBeNull()
  })

  it('filters and searches', async () => {
    const { call } = await makeApp()
    await readyItem(call, { name: 'Denim jacket', brand: 'Levi' })
    await listedItem(call, { name: 'Wool trousers' })
    expect((await call('GET', '/api/items?q=levi')).body.items.map(i => i.name)).toEqual(['Denim jacket'])
    expect((await call('GET', '/api/items?status=listed')).body.items.map(i => i.name)).toEqual(['Wool trousers'])
    expect((await call('GET', '/api/items?sourceId=none')).body.items).toHaveLength(2)
  })

  it('writes an audit entry for each change', async () => {
    const { call, db } = await makeApp()
    await readyItem(call)
    const rows = (await db.query(`SELECT action FROM audit_log WHERE entity = 'item' ORDER BY id`)).rows.map(r => r.action)
    expect(rows).toEqual(['create', 'transition'])
  })
})
```

(Also export `PERSONAL_SOURCE_ID` from `test/helpers.js` — it already is, from Task 2.)

- [ ] **Step 3: Run to verify it fails** — `npm test -- test/items.test.js` — Expected: FAIL.
- [ ] **Step 4: Implement `server/items.js`** per the rules. Every write: `ctx.db.tx(async q => { const row = await lockVersioned(q, 'items', id, body.version); … UPDATE … SET version = version + 1, updated_at = now() … ; await audit(q, ctx, …) })`. Return `{ item: itemDto(...) }`. DTO keys are camelCase versions of the columns plus `costBasisCents`, `costAuthority`, `missingForListing`, `saleLine`. Register routes in `server/app.js`.
- [ ] **Step 5: Run** — `npm test` — Expected: all pass.
- [ ] **Step 6: Commit** — `git add -A && git commit -m "feat: items with transitions, cost authority and listing rules"`

### Task 8: Customers

**Spec:** section 5.4.

**Files:** Create `server/customers.js`, `test/customers.test.js`; modify `server/app.js`; append fixture `mkCustomer(call, overrides?)` to `test/helpers.js`.

**Interfaces — Produces:** `customers.routes`; `CAUTION_FLAGS` (exported array: `Late payment`, `Missed pickup`, `Difficult communication`, `Rude behaviour`, `Review before accepting another order`); `latestCaution(q, customerId) → { flag, notedOn, body } | null` (Task 9 uses it).

**Rules:**
- `POST /api/customers { name, handle?, email?, phone?, address? }` (name required → 422 `name_required`). `PATCH /api/customers/:id { version, ... }` (anonymised → 409 `anonymised`). `GET /api/customers?q=` (live, not deleted; matches name or handle) and `GET /api/customers/:id` → `{ customer, notes, orders: [{ id, number, status, createdAt }] }`.
- Notes: `POST /api/customers/:id/notes { notedOn, flag?, body }` (flag must be one of the six in the schema, or null); `PATCH /api/customer-notes/:id { flag?, body?, notedOn? }`; `DELETE /api/customer-notes/:id` → sets `deleted_at`. Audit entity `customer_note` (bodies redacted automatically by `diff`).
- `POST /api/customers/:id/anonymise { version, confirm: true }` (`confirm` missing → 422 `confirm_required`): `name = 'Former customer #' || number`, clear `handle, email, phone, address`, set `deleted_at` on all its notes, set `anonymised_at`. Orders untouched. Audit `action: 'anonymise'`.
- `GET /api/customers/:id/export` → `Response` with `Content-Type: application/json`, `Content-Disposition: attachment; filename="customer-<number>.json"`, body `{ customer, notes (not deleted), orders: [{ number, status, createdAt, items: [code, name] }] }`.
- `DELETE /api/customers/:id { version }` → only if the customer has no orders (409 `customer_has_orders`); sets `deleted_at`.

- [ ] **Step 1: Append fixture to `test/helpers.js`**

```js
export async function mkCustomer(call, overrides = {}) {
  const r = await call('POST', '/api/customers', { name: 'Emma R.', handle: '@emma', ...overrides })
  if (r.status !== 200) throw new Error(JSON.stringify(r.body))
  return r.body.customer
}
```

- [ ] **Step 2: Write `test/customers.test.js`**

```js
import { describe, it, expect } from 'vitest'
import { makeApp, mkCustomer } from './helpers.js'

describe('customers', () => {
  it('creates, edits and searches', async () => {
    const { call } = await makeApp()
    const c = await mkCustomer(call, { phone: '403-555-0100' })
    await call('PATCH', `/api/customers/${c.id}`, { version: c.version, address: '1 Main St' })
    expect((await call('GET', '/api/customers?q=emma')).body.customers).toHaveLength(1)
    expect((await call('POST', '/api/customers', { name: ' ' })).body.error).toBe('name_required')
  })

  it('keeps factual dated notes and never logs their text', async () => {
    const { call, db } = await makeApp()
    const c = await mkCustomer(call)
    await call('POST', `/api/customers/${c.id}/notes`, { notedOn: '2026-09-10', flag: 'Missed pickup', body: 'Did not come at 6pm' })
    expect((await call('POST', `/api/customers/${c.id}/notes`, { notedOn: '2026-09-10', flag: 'Rude', body: 'x' })).status).toBe(422)
    const detail = (await call('GET', `/api/customers/${c.id}`)).body
    expect(detail.notes[0].flag).toBe('Missed pickup')
    const log = JSON.stringify((await db.query('SELECT changes FROM audit_log')).rows)
    expect(log).not.toContain('Did not come')
    expect(log).not.toContain('403-555')
  })

  it('anonymises on request but keeps orders', async () => {
    const { call, db } = await makeApp()
    const c = await mkCustomer(call, { email: 'e@x.test' })
    await call('POST', `/api/customers/${c.id}/notes`, { notedOn: '2026-09-10', flag: 'Late payment', body: 'paid a day late' })
    await db.query(`INSERT INTO orders (customer_id, payment_method, fulfilment_method, deadline) VALUES ($1, 'etransfer', 'pickup', now())`, [c.id])
    expect((await call('POST', `/api/customers/${c.id}/anonymise`, { version: c.version })).body.error).toBe('confirm_required')
    const r = await call('POST', `/api/customers/${c.id}/anonymise`, { version: c.version, confirm: true })
    expect(r.body.customer.name).toMatch(/^Former customer #\d+$/)
    expect(r.body.customer.email).toBe('')
    const detail = (await call('GET', `/api/customers/${c.id}`)).body
    expect(detail.notes).toHaveLength(0)
    expect(detail.orders).toHaveLength(1)
    expect((await call('DELETE', `/api/customers/${c.id}`, { version: r.body.customer.version })).body.error).toBe('customer_has_orders')
  })

  it('exports one customer for an access request', async () => {
    const { call } = await makeApp()
    const c = await mkCustomer(call)
    const res = await call('GET', `/api/customers/${c.id}/export`, undefined, { raw: true })
    expect(res.headers.get('content-disposition')).toMatch(/customer-\d+\.json/)
    expect((await res.json()).customer.name).toBe('Emma R.')
  })
})
```

- [ ] **Step 3: Run to verify it fails**, **Step 4: implement** per the rules and register routes, **Step 5: run `npm test`** (all pass), **Step 6: commit** — `git add -A && git commit -m "feat: customers, notes, anonymise and export"`

### Task 9: Orders — reserve, edit, cancel/release, extend

**Spec:** section 5.5 (Lines, Order fields, Amount due, Minimum-price warning, Order states rows for reserve and cancel, Expired reservations), 7.2.

**Files:** Create `server/orders.js`, `test/orders.test.js`; modify `server/app.js`; append fixture `reserve` to `test/helpers.js`.

**Interfaces:**
- Consumes: `lockVersioned`, `audit`, `HttpError` (Task 4); `amountDue`, `orderAllocations`, `isCents` (Task 3); `meetsListing`, `costBasis`, `loadItemForCost` (Task 7); `latestCaution` (Task 8).
- Produces: `orders.routes`; `loadOrder(q, orderId) → orderDto` (Tasks 10–13 return it); `orderTotals(orderRow, lines, payments, refunds) → { amountDueCents, receivedCents, balanceCents, moneyToReturnCents, refundStatus }`.

**Order DTO** (`GET /api/orders/:id` → `{ order }`): all order columns camelCased, plus `lines` (ordered by `position`; each with `id, itemId, itemCode, itemName, position, agreedCents, active, cancelledAt, allocatedDiscountCents, netSaleCents, allocatedPlatformFeeCents, snapCostCents, snapPrepCents, snapSourceId, effectiveCostCents, effectivePrepCents, returned` — `returned` true when a refund line with decision restock/writeoff exists; effective values from the `line_effective` view), `payments` (non-voided and voided, each with `voidedAt`), `refunds` (with their lines), and the `orderTotals` fields, and `expired` (`status = 'awaiting' AND deadline < now`). Date columns (`paid_on`, `received_on`, `refunded_on`, …) are returned as `YYYY-MM-DD` strings (cast with `::text` in SQL); timestamps as ISO strings. This applies to every DTO in this plan.

**orderTotals:** `amountDueCents` = Σ agreed of lines not cancelled − discount + fee. `receivedCents` = Σ non-voided payments. `balanceCents` = max(0, due − received) while awaiting, else 0. `moneyToReturnCents` = max(0, received − (status paid|completed ? due : 0) − Σ non-voided refunds' `unallocated_cents`). `refundStatus`: `none` if no non-voided refunds; `full` if Σ (refund line amounts + fee refunds) ≥ Σ net_sale + fee; else `partial`.

**Rules:**
- **Reserve** `POST /api/orders { customerId, platformId|null, paymentMethod, fulfilmentMethod, discountCents=0, feeCents=0, deadline?, lines: [{ itemId, agreedCents? }] }`:
  - At least one line (422 `no_lines`); no duplicate itemIds (422 `duplicate_item`); customer exists, not deleted, not anonymised (422 `unknown_customer`); platform exists if given (422 `unknown_platform`); enums valid (422 `bad_value` with `{ field }`); amounts are cents (422 `bad_amount`); `discountCents` ≤ Σ agreed (422 `discount_too_large`); amount due > 0 (422 `nothing_due`).
  - `deadline` defaults to now + `settings.hold_hours`; if given must be in the future (422 `deadline_past`).
  - Each item: exists, not deleted, status `ready` or `listed`, and `meetsListing` empty (422 `not_reservable` with `{ itemId, code, missing? }`). `agreedCents` defaults to `asking_cents`.
  - In one transaction: insert order (`postage_state` = `'unknown'` for shipping, else `'na'`; `created_by`), insert lines with `position` 0…n-1, then for each item `UPDATE items SET prev_status = status, status = 'reserved', version = version + 1, updated_at = now() WHERE id = $1 AND status IN ('ready','listed') AND deleted_at IS NULL`. If any update changes 0 rows, or the line insert hits the unique index (`23505`), abort with 409 `item_unavailable` and `{ itemId, code, reservedBy, reservedAt }` (the name of the user who created the other active order and its `created_at`, when one exists).
  - Response: `{ order, customerWarning: latestCaution(...) , priceWarnings }` where `priceWarnings` lists lines whose share of the discount-adjusted price is below `cost + prep + target margin` (`{ itemId, code, minimumCents }`), or `{ itemId, code, costUnknown: true }` when the cost basis is null. Warnings never block.
  - Audit `order` `create`, and `item` `transition` for each item.
- **Edit** `PATCH /api/orders/:id { version, platformId?, paymentMethod?, fulfilmentMethod?, discountCents?, feeCents?, deadline?, lines? }`: only while `awaiting` (409 `order_locked`). `lines` is the full desired list `[{ lineId?, itemId, agreedCents }]`: existing lines missing from the list get `cancelled_at = now, active = false` and their item returns to `prev_status` (`UPDATE … WHERE status = 'reserved'`); new items are reserved as above (positions continue after the highest existing position); changed `agreedCents` update in place. Re-validate discount and amount due. `paymentMethod` cannot change once a payment row exists (409 `has_payments`). Changing `fulfilmentMethod` resets `postage_state` as on create.
- **Cancel / Release** `POST /api/orders/:id/cancel { version, reason }`: reason required; only `awaiting` (409 `cannot_cancel_paid` otherwise). All active lines → `active = false, cancelled_at = now`; items back to `prev_status` (conditional on `reserved`); order `cancelled`. The response's `moneyToReturnCents` shows any payment received.
- **Extend** `POST /api/orders/:id/extend { version, deadline }`: only `awaiting`; deadline in the future.
- **List** `GET /api/orders?status=&expired=1&customerId=` newest first, each with `number, status, customerName, lineCount, amountDueCents, receivedCents, expired, platformId`.

- [ ] **Step 1: Append fixture to `test/helpers.js`**

```js
export async function reserve(call, { items, customer, ...rest }, opts = {}) {
  const r = await call('POST', '/api/orders', {
    customerId: customer.id, platformId: null, paymentMethod: 'etransfer', fulfilmentMethod: 'pickup',
    lines: items.map(i => ({ itemId: i.id, ...(i.agreedCents !== undefined ? { agreedCents: i.agreedCents } : {}) })),
    ...rest,
  }, opts)
  if (r.status !== 200) throw new Error(JSON.stringify(r.body))
  return r.body.order
}
```

- [ ] **Step 2: Write `test/orders.test.js`**

```js
import { describe, it, expect } from 'vitest'
import { makeApp, listedItem, readyItem, mkCustomer, reserve } from './helpers.js'

describe('reserving', () => {
  it('creates lines at once with agreed prices and reserves the items', async () => {
    const { call } = await makeApp()
    const a = await listedItem(call, { askingCents: 8000 })
    const b = await listedItem(call, { askingCents: 2000 })
    const c = await mkCustomer(call)
    const o = await reserve(call, { items: [a, { ...b, agreedCents: 1500 }], customer: c, discountCents: 500, feeCents: 1000 })
    expect(o.lines.map(l => l.agreedCents)).toEqual([8000, 1500])
    expect(o.amountDueCents).toBe(10000)
    expect(o.status).toBe('awaiting')
    expect((await call('GET', `/api/items/${a.id}`)).body.item.status).toBe('reserved')
  })

  it('asking-price edits never change an existing order', async () => {
    const { call, db } = await makeApp()
    const a = await listedItem(call, { askingCents: 6000 })
    const o = await reserve(call, { items: [a], customer: await mkCustomer(call) })
    await db.query('UPDATE items SET asking_cents = 9900 WHERE id = $1', [a.id])
    expect((await call('GET', `/api/orders/${o.id}`)).body.order.amountDueCents).toBe(6000)
  })

  it('lets only one person reserve a piece', async () => {
    const { call } = await makeApp()
    const a = await listedItem(call)
    const c = await mkCustomer(call)
    await reserve(call, { items: [a], customer: c })
    const r = await call('POST', '/api/orders', { customerId: c.id, platformId: null, paymentMethod: 'etransfer', fulfilmentMethod: 'pickup', lines: [{ itemId: a.id }] }, { as: 'patrick' })
    expect([r.status, r.body.error, r.body.reservedBy]).toEqual([409, 'item_unavailable', 'Jenn'])
  })

  it('refuses items that are not ready, a discount above the total, and nothing due', async () => {
    const { call } = await makeApp()
    const c = await mkCustomer(call)
    const draft = (await call('POST', '/api/items', { name: 'Unready' })).body.item
    const base = { customerId: c.id, platformId: null, paymentMethod: 'etransfer', fulfilmentMethod: 'pickup' }
    expect((await call('POST', '/api/orders', { ...base, lines: [{ itemId: draft.id }] })).body.error).toBe('not_reservable')
    const a = await listedItem(call, { askingCents: 1000 })
    expect((await call('POST', '/api/orders', { ...base, discountCents: 1001, lines: [{ itemId: a.id }] })).body.error).toBe('discount_too_large')
    expect((await call('POST', '/api/orders', { ...base, lines: [{ itemId: a.id, agreedCents: 0 }] })).body.error).toBe('nothing_due')
  })

  it('warns about low prices, unknown costs and flagged customers without blocking', async () => {
    const { call } = await makeApp()
    const a = await listedItem(call, { askingCents: 2000, ownCostCents: 1500, targetMarginCents: 1000 })
    const b = await listedItem(call, { askingCents: 2000, ownCostCents: null })
    const c = await mkCustomer(call)
    await call('POST', `/api/customers/${c.id}/notes`, { notedOn: '2026-09-10', flag: 'Missed pickup', body: 'no show' })
    const r = await call('POST', '/api/orders', { customerId: c.id, platformId: null, paymentMethod: 'etransfer', fulfilmentMethod: 'pickup', lines: [{ itemId: a.id }, { itemId: b.id }] })
    expect(r.status).toBe(200)
    expect(r.body.priceWarnings).toEqual([{ itemId: a.id, code: a.code, minimumCents: 2500 }, { itemId: b.id, code: b.code, costUnknown: true }])
    expect(r.body.customerWarning.flag).toBe('Missed pickup')
  })

  it('reserves a ready (not yet listed) item and puts it back as ready on release', async () => {
    const { call } = await makeApp()
    const a = await readyItem(call)
    const o = await reserve(call, { items: [a], customer: await mkCustomer(call) })
    const r = await call('POST', `/api/orders/${o.id}/cancel`, { version: o.version, reason: 'Reservation released' })
    expect(r.body.order.status).toBe('cancelled')
    expect((await call('GET', `/api/items/${a.id}`)).body.item.status).toBe('ready')
    const again = await reserve(call, { items: [a], customer: await mkCustomer(call, { name: 'Jess' }) })
    expect(again.status).toBe('awaiting')
  })
})

describe('editing and expiry', () => {
  it('edits lines while awaiting payment', async () => {
    const { call } = await makeApp()
    const a = await listedItem(call)
    const b = await listedItem(call)
    const c = await listedItem(call)
    const o = await reserve(call, { items: [a, b], customer: await mkCustomer(call) })
    const keep = o.lines.find(l => l.itemId === a.id)
    const r = await call('PATCH', `/api/orders/${o.id}`, { version: o.version, lines: [{ lineId: keep.id, itemId: a.id, agreedCents: 4000 }, { itemId: c.id, agreedCents: 1000 }] })
    expect(r.body.order.lines.filter(l => l.active).map(l => [l.itemId, l.agreedCents])).toEqual([[a.id, 4000], [c.id, 1000]])
    expect((await call('GET', `/api/items/${b.id}`)).body.item.status).toBe('listed')
    expect((await call('GET', `/api/items/${c.id}`)).body.item.status).toBe('reserved')
  })

  it('shows expired reservations and extends them', async () => {
    const { call, clock } = await makeApp()
    const o = await reserve(call, { items: [await listedItem(call)], customer: await mkCustomer(call) })
    expect(new Date(o.deadline) - clock.now).toBe(24 * 3600e3)
    clock.now = new Date(clock.now.getTime() + 25 * 3600e3)
    expect((await call('GET', '/api/orders?expired=1')).body.orders).toHaveLength(1)
    const e = await call('POST', `/api/orders/${o.id}/extend`, { version: o.version, deadline: new Date(clock.now.getTime() + 3600e3).toISOString() })
    expect(e.body.order.expired).toBe(false)
    expect((await call('POST', `/api/orders/${o.id}/extend`, { version: e.body.order.version, deadline: '2020-01-01T00:00:00Z' })).body.error).toBe('deadline_past')
  })
})
```

- [ ] **Step 3: Run to verify it fails**, **Step 4: implement** `server/orders.js` per the rules and register routes, **Step 5: `npm test`** (all pass), **Step 6: commit** — `git add -A && git commit -m "feat: orders with frozen lines and one-reservation-per-item guard"`

### Task 10: Payments, platform sales and voiding

**Spec:** section 5.5 (Payments, Platform payout orders, Order states rows Paid and Void payment), 6.3, 6.4.

**Files:** Create `server/payments.js`, `test/payments.test.js`; modify `server/app.js`; append fixture `payInFull` to `test/helpers.js`.

**Interfaces:**
- Consumes: `loadOrder`, `orderTotals` (Task 9); `orderAllocations` (Task 3); `costBasis`, `loadItemForCost` (Task 7).
- Produces: `payments.routes`; `markPaid(q, ctx, orderId, paidOn)`; `unmarkPaid(q, ctx, orderId)`. (Task 11 adds a call to its `autoComplete` at the end of `markPaid`.)

**Rules:**
- `POST /api/orders/:id/payments { version, amountCents, receivedOn, bankRef?, checked }`: order `paymentMethod` must be `etransfer` (409 `wrong_method`); status `awaiting`, `paid` or `completed` (a later payment on a paid order is an overpayment and is recorded) — `cancelled` → 409 `order_cancelled`; `checked === true` else 422 `not_checked`; `amountCents` > 0 cents; `receivedOn` a date `YYYY-MM-DD` not after today (Edmonton) (422 `bad_date`). Insert payment (`kind 'etransfer'`). If the order is `awaiting` and received ≥ amount due → `markPaid(q, ctx, id, receivedOn of this payment)`. Bump order version. Return `{ order }`.
- `POST /api/orders/:id/confirm-platform { version, platformFeeCents, soldOn }`: `paymentMethod` must be `platform`; status `awaiting`; `0 ≤ platformFeeCents ≤ amount due` (422 `bad_fee`). Set `platform_fee_cents`; insert payment `kind 'platform'`, amount = amount due, `received_on = soldOn`; `markPaid(q, ctx, id, soldOn)`.
- `POST /api/orders/:id/payout { version, payoutReceivedOn }`: platform orders only; informational.
- **markPaid** (same transaction): lines = active, not cancelled, by position. `alloc = orderAllocations({ agreed, discountCents, platformFeeCents: platform_fee_cents || 0 })`. For each line: `{ item, purchaseLine } = loadItemForCost(q, itemId)`; `snap_cost_cents = costBasis(item, purchaseLine).cents`; `snap_prep_cents = item.prep_cents`; `snap_source_id = item.source_id`; write the three allocation columns. Then `UPDATE items SET status = 'sold', version = version + 1 WHERE id = $1 AND status = 'reserved'` — 0 rows → throw 409 `state_changed`. Order: `status = 'paid'`, `paid_on`. Audit `order` `paid`.
- **Void a payment** `POST /api/payments/:id/void { reason }` (reason required): payment not already voided (409 `already_voided`). Void it. If the order is `paid`/`completed` and received after voiding < amount due, the order must be `paid` (not completed), fulfilment `not_started`, have no non-voided refunds and no cost adjustments on its lines — else 409 `cannot_void` with `{ because }` (`fulfilment_started` | `has_refunds` | `has_adjustments` | `completed`). Then `unmarkPaid`: clear the allocation and snapshot columns on its lines, items `sold → reserved` (conditional), order `status = 'awaiting'`, `paid_on = NULL`, `platform_fee_cents = NULL` for platform orders. Audit.
- Test clock: `edmontonDate(ctx.now())` is today.

- [ ] **Step 1: Append fixture to `test/helpers.js`**

```js
export async function payInFull(call, order, { receivedOn = '2026-09-15', as = 'jenn' } = {}) {
  const r = await call('POST', `/api/orders/${order.id}/payments`, { version: order.version, amountCents: order.amountDueCents, receivedOn, checked: true }, { as })
  if (r.status !== 200) throw new Error(JSON.stringify(r.body))
  return r.body.order
}
```

- [ ] **Step 2: Write `test/payments.test.js`**

```js
import { describe, it, expect } from 'vitest'
import { makeApp, listedItem, mkCustomer, reserve, payInFull } from './helpers.js'

describe('e-transfer payments', () => {
  it('pays in full: allocates, snapshots cost, prep and source, marks items sold', async () => {
    const { call } = await makeApp()
    const src = (await call('POST', '/api/sources', { name: 'Goodwill' })).body.source
    const a = await listedItem(call, { askingCents: 8000, ownCostCents: 1500, prepCents: 200, sourceId: src.id })
    const b = await listedItem(call, { askingCents: 2000, ownCostCents: null })
    const o = await reserve(call, { items: [a, b], customer: await mkCustomer(call), discountCents: 1000, feeCents: 1500 })
    const paid = await payInFull(call, o)
    expect(paid.status).toBe('paid')
    expect(paid.paidOn).toBe('2026-09-15')
    const [la, lb] = paid.lines
    expect([la.allocatedDiscountCents, la.netSaleCents, lb.netSaleCents]).toEqual([800, 7200, 1800])
    expect([la.snapCostCents, la.snapPrepCents, la.snapSourceId]).toEqual([1500, 200, src.id])
    expect(lb.snapCostCents).toBeNull()
    expect((await call('GET', `/api/items/${a.id}`)).body.item.status).toBe('sold')
  })

  it('records a short payment and keeps the order waiting with a balance', async () => {
    const { call } = await makeApp()
    const o = await reserve(call, { items: [await listedItem(call, { askingCents: 6500 })], customer: await mkCustomer(call) })
    const r = await call('POST', `/api/orders/${o.id}/payments`, { version: o.version, amountCents: 4000, receivedOn: '2026-09-15', checked: true })
    expect([r.body.order.status, r.body.order.balanceCents]).toEqual(['awaiting', 2500])
    const r2 = await call('POST', `/api/orders/${o.id}/payments`, { version: r.body.order.version, amountCents: 2500, receivedOn: '2026-09-15', checked: true })
    expect(r2.body.order.status).toBe('paid')
  })

  it('records an overpayment as money to return', async () => {
    const { call } = await makeApp()
    const o = await reserve(call, { items: [await listedItem(call, { askingCents: 6500 })], customer: await mkCustomer(call) })
    const r = await call('POST', `/api/orders/${o.id}/payments`, { version: o.version, amountCents: 7000, receivedOn: '2026-09-15', checked: true })
    expect([r.body.order.status, r.body.order.moneyToReturnCents]).toEqual(['paid', 500])
  })

  it('requires the bank check and a real date', async () => {
    const { call } = await makeApp()
    const o = await reserve(call, { items: [await listedItem(call)], customer: await mkCustomer(call) })
    expect((await call('POST', `/api/orders/${o.id}/payments`, { version: o.version, amountCents: 100, receivedOn: '2026-09-15' })).body.error).toBe('not_checked')
    expect((await call('POST', `/api/orders/${o.id}/payments`, { version: o.version, amountCents: 100, receivedOn: '2026-09-16', checked: true })).body.error).toBe('bad_date')
  })

  it('records one payment when the same tap is sent twice', async () => {
    const { call, db } = await makeApp()
    const o = await reserve(call, { items: [await listedItem(call)], customer: await mkCustomer(call) })
    const body = { version: o.version, amountCents: o.amountDueCents, receivedOn: '2026-09-15', checked: true }
    await call('POST', `/api/orders/${o.id}/payments`, body, { key: 'tap' })
    await call('POST', `/api/orders/${o.id}/payments`, body, { key: 'tap' })
    expect((await db.query('SELECT count(*)::int AS n FROM payments')).rows[0].n).toBe(1)
  })

  it('money received on a cancelled reservation shows as money to return', async () => {
    const { call } = await makeApp()
    const o = await reserve(call, { items: [await listedItem(call, { askingCents: 5000 })], customer: await mkCustomer(call) })
    const p = await call('POST', `/api/orders/${o.id}/payments`, { version: o.version, amountCents: 3000, receivedOn: '2026-09-15', checked: true })
    const c = await call('POST', `/api/orders/${o.id}/cancel`, { version: p.body.order.version, reason: 'buyer backed out' })
    expect(c.body.order.moneyToReturnCents).toBe(3000)
  })
})

describe('platform sales', () => {
  it('confirms a Poshmark sale with its fee and spreads the fee by net sale', async () => {
    const { call } = await makeApp()
    const a = await listedItem(call, { askingCents: 3000 })
    const b = await listedItem(call, { askingCents: 1000 })
    const o = await reserve(call, { items: [a, b], customer: await mkCustomer(call), paymentMethod: 'platform', fulfilmentMethod: 'shipping' })
    const r = await call('POST', `/api/orders/${o.id}/confirm-platform`, { version: o.version, platformFeeCents: 800, soldOn: '2026-09-14' })
    expect(r.body.order.status).toBe('paid')
    expect(r.body.order.lines.map(l => l.allocatedPlatformFeeCents)).toEqual([600, 200])
    expect(r.body.order.receivedCents).toBe(4000)
    expect((await call('POST', `/api/orders/${o.id}/payments`, { version: r.body.order.version, amountCents: 1, receivedOn: '2026-09-15', checked: true })).body.error).toBe('wrong_method')
  })
})

describe('voiding', () => {
  it('voids a mistaken payment and puts the order back to awaiting', async () => {
    const { call } = await makeApp()
    const a = await listedItem(call)
    const o = await payInFull(call, await reserve(call, { items: [a], customer: await mkCustomer(call) }))
    const r = await call('POST', `/api/payments/${o.payments[0].id}/void`, { reason: 'ticked the wrong order' })
    expect(r.body.order.status).toBe('awaiting')
    expect(r.body.order.lines[0].snapCostCents).toBeNull()
    expect((await call('GET', `/api/items/${a.id}`)).body.item.status).toBe('reserved')
    expect((await call('POST', `/api/payments/${o.payments[0].id}/void`, { reason: 'again' })).body.error).toBe('already_voided')
  })

  it('refuses to void once the order has been handed over', async () => {
    const { call, db } = await makeApp()
    const o = await payInFull(call, await reserve(call, { items: [await listedItem(call)], customer: await mkCustomer(call) }))
    await db.query(`UPDATE orders SET fulfilment_status = 'handed_over' WHERE id = $1`, [o.id])
    const r = await call('POST', `/api/payments/${o.payments[0].id}/void`, { reason: 'x' })
    expect([r.status, r.body.error, r.body.because]).toEqual([409, 'cannot_void', 'fulfilment_started'])
  })
})
```

- [ ] **Step 3: Run to verify it fails**, **Step 4: implement** per the rules and register routes, **Step 5: `npm test`**, **Step 6: commit** — `git add -A && git commit -m "feat: payments, platform sales, snapshots and voids"`

### Task 11: Fulfilment and postage

**Spec:** section 5.5 (Fulfilment; Paid → Completed row), 5.9 (completeness).

**Files:** Create `server/fulfilment.js`, `test/fulfilment.test.js`; modify `server/payments.js` (call `autoComplete` at the end of `markPaid`), `server/app.js`.

**Interfaces — Produces:** `fulfilment.routes`; `autoComplete(q, orderId)`.

**Rules:**
- `POST /api/orders/:id/fulfilment { version, status, appointmentAt?, instructions?, tracking? }`: order not `cancelled` (409 `order_cancelled`). Allowed statuses — pickup/delivery: `not_started`, `scheduled`, `handed_over`; shipping: `not_started`, `scheduled`, `shipped` (422 `bad_status_for_method`). `scheduled` requires `appointmentAt` (422 `appointment_required`). Then `autoComplete`.
- `autoComplete(q, orderId)`: if status `paid` and fulfilment is `handed_over` or `shipped` → `completed`; if status `completed` and fulfilment is neither → back to `paid`. Audit when it changes.
- `POST /api/orders/:id/postage { version, state, cents? }`: `state` ∈ `unknown`, `entered`, `na`; `entered` needs cents (422 `bad_amount`); others clear `postage_cents`. Allowed on any non-cancelled order.

- [ ] **Step 1: Write `test/fulfilment.test.js`**

```js
import { describe, it, expect } from 'vitest'
import { makeApp, listedItem, mkCustomer, reserve, payInFull } from './helpers.js'

describe('fulfilment', () => {
  it('completes when paid and handed over, in either order', async () => {
    const { call } = await makeApp()
    const o1 = await payInFull(call, await reserve(call, { items: [await listedItem(call)], customer: await mkCustomer(call) }))
    const h = await call('POST', `/api/orders/${o1.id}/fulfilment`, { version: o1.version, status: 'handed_over' })
    expect(h.body.order.status).toBe('completed')

    const o2 = await reserve(call, { items: [await listedItem(call)], customer: await mkCustomer(call, { name: 'B' }) })
    const h2 = await call('POST', `/api/orders/${o2.id}/fulfilment`, { version: o2.version, status: 'handed_over' })
    expect(h2.body.order.status).toBe('awaiting')
    expect((await payInFull(call, h2.body.order)).status).toBe('completed')
  })

  it('checks statuses against the method and needs an appointment to schedule', async () => {
    const { call } = await makeApp()
    const o = await reserve(call, { items: [await listedItem(call)], customer: await mkCustomer(call), fulfilmentMethod: 'shipping' })
    expect(o.postageState).toBe('unknown')
    expect((await call('POST', `/api/orders/${o.id}/fulfilment`, { version: o.version, status: 'handed_over' })).body.error).toBe('bad_status_for_method')
    expect((await call('POST', `/api/orders/${o.id}/fulfilment`, { version: o.version, status: 'scheduled' })).body.error).toBe('appointment_required')
  })

  it('records postage as unknown, entered or not applicable', async () => {
    const { call } = await makeApp()
    const o = await reserve(call, { items: [await listedItem(call)], customer: await mkCustomer(call), fulfilmentMethod: 'shipping' })
    expect((await call('POST', `/api/orders/${o.id}/postage`, { version: o.version, state: 'entered' })).body.error).toBe('bad_amount')
    const r = await call('POST', `/api/orders/${o.id}/postage`, { version: o.version, state: 'entered', cents: 1840 })
    expect([r.body.order.postageState, r.body.order.postageCents]).toEqual(['entered', 1840])
    const n = await call('POST', `/api/orders/${o.id}/postage`, { version: r.body.order.version, state: 'na' })
    expect([n.body.order.postageState, n.body.order.postageCents]).toEqual(['na', null])
  })
})
```

- [ ] **Step 2: Run to verify it fails**, **Step 3: implement** and add `await autoComplete(q, orderId)` as the last step of `markPaid`, **Step 4: `npm test`**, **Step 5: commit** — `git add -A && git commit -m "feat: fulfilment, postage and auto-complete"`

### Task 12: Refunds and returns

**Spec:** section 5.6 (all), 6.7, 6.8, 6.11.

**Files:** Create `server/refunds.js`, `test/refunds.test.js`; modify `server/app.js`.

**Interfaces:** Consumes `loadOrder`, `orderTotals` (Task 9), `allocate` (Task 3). Produces `refunds.routes`.

**Rules:**
- `POST /api/orders/:id/refunds { refundedOn, reason, lines?: [{ orderLineId, amountCents, decision }], autoSplitCents?, feeRefundCents=0, unallocatedCents=0, returnPostageCents=0 }`. Lock the order row (`SELECT … FOR UPDATE`); no `version` needed (refunds are additive), but idempotency applies.
- `reason` required; `refundedOn` a date not after today (Edmonton); amounts are cents.
- `autoSplitCents` (only when `lines` is absent): split across the order's paid lines by each line's **remaining** net (`net_sale − prior non-voided refund amounts on that line`) using `allocate`; all decisions `kept`.
- Orders that are not `paid`/`completed` may only use `unallocatedCents` (422 `order_not_paid` otherwise).
- Validation (all in the transaction, counting only non-voided refunds):
  - each `orderLineId` belongs to this order and has `net_sale_cents` not null (422 `bad_line`);
  - per line: prior + this amount ≤ `net_sale_cents` → else 422 `line_refund_exceeds` `{ orderLineId, maxCents }`;
  - `decision` `restock`/`writeoff` only on a line with `active = true` → else 409 `already_returned`;
  - fees: prior + `feeRefundCents` ≤ `fee_cents` → 422 `fee_refund_exceeds`;
  - `unallocatedCents` ≤ current `moneyToReturnCents` → 422 `unallocated_exceeds`;
  - all refunds ever (line amounts + fee + unallocated, including this one) ≤ `receivedCents` → 422 `refund_exceeds_received`;
  - something must happen: total > 0 or at least one restock/writeoff (422 `empty_refund`).
- Effects:
  - insert `refunds` and `refund_lines`;
  - `restock`: `reversal_cents` = the line's effective cost from `line_effective` (may be NULL — unknown stays unknown); line `active = false`; item `UPDATE … SET status = 'ready', prep_cents = 0, version = version + 1 WHERE id = $1 AND status = 'sold'` (0 rows → 409 `state_changed`);
  - `writeoff`: `reversal_cents` NULL; line `active = false`; item `status = 'archived', archived_via = 'writeoff', archived_reason = reason` (conditional on `sold`);
  - `kept`: nothing else changes; the item stays Sold;
  - bump order version; audit `refund` `create` and each item transition. Return `{ order }`.
- `POST /api/refunds/:id/void { reason }`: refunds with any restock or writeoff line → 409 `refund_has_returns`; already voided → 409 `already_voided`; else void it.

- [ ] **Step 1: Write `test/refunds.test.js`**

```js
import { describe, it, expect } from 'vitest'
import { makeApp, listedItem, mkCustomer, reserve, payInFull } from './helpers.js'

async function paidOrder(call, items, extra = {}) {
  return payInFull(call, await reserve(call, { items, customer: await mkCustomer(call, { name: `C${Math.random()}` }), ...extra }))
}

describe('refunds', () => {
  it('restock reverses cost once; resale counts cost again; lifetime cost = one cost', async () => {
    const { call, db } = await makeApp()
    const item = await listedItem(call, { askingCents: 6000, ownCostCents: 2000 })
    const o1 = await paidOrder(call, [item])
    const r = await call('POST', `/api/orders/${o1.id}/refunds`, { refundedOn: '2026-09-15', reason: 'did not fit', lines: [{ orderLineId: o1.lines[0].id, amountCents: 6000, decision: 'restock' }] })
    expect(r.status).toBe(200)
    const back = (await call('GET', `/api/items/${item.id}`)).body.item
    expect([back.status, back.costBasisCents]).toEqual(['ready', 2000])
    const relisted = await call('POST', `/api/items/${item.id}/transition`, { version: back.version, to: 'listed' })
    await paidOrder(call, [{ ...relisted.body.item, agreedCents: 4000 }])
    const sold = (await db.query('SELECT COALESCE(sum(snap_cost_cents),0)::int AS s FROM order_lines WHERE net_sale_cents IS NOT NULL')).rows[0].s
    const reversed = (await db.query('SELECT COALESCE(sum(reversal_cents),0)::int AS s FROM refund_lines')).rows[0].s
    expect(sold - reversed).toBe(2000)
  })

  it('a concession on one piece of a bundle stays on that piece; the buyer keeps both', async () => {
    const { call } = await makeApp()
    const a = await listedItem(call, { askingCents: 5000 })
    const b = await listedItem(call, { askingCents: 2500 })
    const o = await paidOrder(call, [a, b], { discountCents: 1000, feeCents: 1500 })
    const scarf = o.lines.find(l => l.itemId === b.id)
    const r = await call('POST', `/api/orders/${o.id}/refunds`, { refundedOn: '2026-09-15', reason: 'stain on scarf', lines: [{ orderLineId: scarf.id, amountCents: 2000, decision: 'kept' }] })
    expect(r.body.order.refundStatus).toBe('partial')
    expect((await call('GET', `/api/items/${b.id}`)).body.item.status).toBe('sold')
  })

  it('enforces per-line, fee and received limits across repeated refunds', async () => {
    const { call } = await makeApp()
    const o = await paidOrder(call, [await listedItem(call, { askingCents: 3000 })], { feeCents: 500 })
    const line = o.lines[0]
    await call('POST', `/api/orders/${o.id}/refunds`, { refundedOn: '2026-09-15', reason: 'a', lines: [{ orderLineId: line.id, amountCents: 2000, decision: 'kept' }] })
    const over = await call('POST', `/api/orders/${o.id}/refunds`, { refundedOn: '2026-09-15', reason: 'b', lines: [{ orderLineId: line.id, amountCents: 1001, decision: 'kept' }] })
    expect([over.body.error, over.body.maxCents]).toEqual(['line_refund_exceeds', 1000])
    expect((await call('POST', `/api/orders/${o.id}/refunds`, { refundedOn: '2026-09-15', reason: 'c', feeRefundCents: 501 })).body.error).toBe('fee_refund_exceeds')
    const full = await call('POST', `/api/orders/${o.id}/refunds`, { refundedOn: '2026-09-15', reason: 'd', lines: [{ orderLineId: line.id, amountCents: 1000, decision: 'kept' }], feeRefundCents: 500 })
    expect(full.body.order.refundStatus).toBe('full')
  })

  it('auto-splits by remaining net sale', async () => {
    const { call } = await makeApp()
    const o = await paidOrder(call, [await listedItem(call, { askingCents: 3000 }), await listedItem(call, { askingCents: 1000 })])
    const r = await call('POST', `/api/orders/${o.id}/refunds`, { refundedOn: '2026-09-15', reason: 'late delivery', autoSplitCents: 1000 })
    expect(r.body.order.refunds[0].lines.map(l => l.amountCents)).toEqual([750, 250])
  })

  it('write-off keeps the cost recognised and archives the item', async () => {
    const { call } = await makeApp()
    const item = await listedItem(call, { ownCostCents: 900 })
    const o = await paidOrder(call, [item])
    const r = await call('POST', `/api/orders/${o.id}/refunds`, { refundedOn: '2026-09-15', reason: 'came back torn', lines: [{ orderLineId: o.lines[0].id, amountCents: o.lines[0].netSaleCents, decision: 'writeoff' }] })
    expect(r.body.order.refunds[0].lines[0].reversalCents).toBeNull()
    expect((await call('GET', `/api/items/${item.id}`)).body.item.status).toBe('archived')
    const again = await call('POST', `/api/orders/${o.id}/refunds`, { refundedOn: '2026-09-15', reason: 'x', lines: [{ orderLineId: o.lines[0].id, amountCents: 0, decision: 'restock' }] })
    expect(again.body.error).toBe('already_returned')
  })

  it('returns overpaid money as an unallocated refund', async () => {
    const { call } = await makeApp()
    const o = await reserve(call, { items: [await listedItem(call, { askingCents: 6500 })], customer: await mkCustomer(call) })
    const p = await call('POST', `/api/orders/${o.id}/payments`, { version: o.version, amountCents: 7000, receivedOn: '2026-09-15', checked: true })
    expect((await call('POST', `/api/orders/${o.id}/refunds`, { refundedOn: '2026-09-15', reason: 'overpaid', unallocatedCents: 501 })).body.error).toBe('unallocated_exceeds')
    const r = await call('POST', `/api/orders/${o.id}/refunds`, { refundedOn: '2026-09-15', reason: 'overpaid', unallocatedCents: 500 })
    expect(r.body.order.moneyToReturnCents).toBe(0)
    expect(p.body.order.status).toBe('paid')
  })

  it('voids a plain refund but not one with a return', async () => {
    const { call } = await makeApp()
    const o = await paidOrder(call, [await listedItem(call)])
    const plain = await call('POST', `/api/orders/${o.id}/refunds`, { refundedOn: '2026-09-15', reason: 'goodwill', lines: [{ orderLineId: o.lines[0].id, amountCents: 100, decision: 'kept' }] })
    expect((await call('POST', `/api/refunds/${plain.body.order.refunds[0].id}/void`, { reason: 'typo' })).status).toBe(200)
    const ret = await call('POST', `/api/orders/${o.id}/refunds`, { refundedOn: '2026-09-15', reason: 'return', lines: [{ orderLineId: o.lines[0].id, amountCents: 100, decision: 'restock' }] })
    const retId = ret.body.order.refunds.find(x => !x.voidedAt).id
    expect((await call('POST', `/api/refunds/${retId}/void`, { reason: 'x' })).body.error).toBe('refund_has_returns')
  })
})
```

- [ ] **Step 2: Run to verify it fails**, **Step 3: implement** per the rules and register routes, **Step 4: `npm test`**, **Step 5: commit** — `git add -A && git commit -m "feat: refunds, returns, restock reversal and write-off"`

### Task 13: Cost adjustments

**Spec:** section 6.6, 5.1 (Cost authority).

**Files:** Create `server/adjustments.js`, `test/adjustments.test.js`; modify `server/app.js`.

**Interfaces:** Consumes `loadItemForCost`, `costBasis` (Task 7), `loadOrder` (Task 9). Produces `adjustments.routes` and `applyCostChangeToSale(q, ctx, { orderLineId, field, newCents, reason })` (Task 14 calls it for purchase edits).

**Rules:**
- A line is **adjustable** when `net_sale_cents IS NOT NULL` and `active = true` (sold and not returned). Otherwise 409 `not_adjustable`.
- `applyCostChangeToSale`: reads the current effective value for `field` from `line_effective`; inserts `cost_adjustments (order_line_id, field, old_cents, new_cents, reason, created_by)`; audits `cost_adjustment` `create`. It does **not** change the item.
- `POST /api/order-lines/:id/adjustments { field: 'cost'|'prep', newCents, reason }` (`newCents` must be cents, not null; reason required):
  - `field = 'cost'`: by the item's cost authority — `purchase` → 409 `edit_on_purchase` (correct it on the purchase, Task 14); `transfer` → set `transfer_value_cents = newCents`, `transfer_value_confirmed_at = now`; `own` → set `own_cost_cents = newCents`.
  - `field = 'prep'`: set the item's `prep_cents = newCents`.
  - Then `applyCostChangeToSale`. Bump the item version. Return `{ order }` for the line's order.
- `GET /api/items/:id` already exposes `saleLine.effectiveCostCents` (Task 7) so the UI can ask "Apply to the sale on <date>?".

- [ ] **Step 1: Write `test/adjustments.test.js`**

```js
import { describe, it, expect } from 'vitest'
import { makeApp, listedItem, mkCustomer, reserve, payInFull } from './helpers.js'

describe('cost adjustments', () => {
  it('turns an unknown sale cost into a known one without touching the snapshot', async () => {
    const { call, db } = await makeApp()
    const item = await listedItem(call, { ownCostCents: null })
    const o = await payInFull(call, await reserve(call, { items: [item], customer: await mkCustomer(call) }))
    const line = o.lines[0]
    expect(line.effectiveCostCents).toBeNull()
    const r = await call('POST', `/api/order-lines/${line.id}/adjustments`, { field: 'cost', newCents: 400, reason: 'found the receipt' })
    const l2 = r.body.order.lines[0]
    expect([l2.snapCostCents, l2.effectiveCostCents]).toEqual([null, 400])
    expect((await call('GET', `/api/items/${item.id}`)).body.item.costBasisCents).toBe(400)
    const later = await call('POST', `/api/order-lines/${line.id}/adjustments`, { field: 'cost', newCents: 450, reason: 'receipt had tax' })
    expect(later.body.order.lines[0].effectiveCostCents).toBe(450)
    const rows = (await db.query('SELECT old_cents, new_cents FROM cost_adjustments ORDER BY created_at')).rows
    expect(rows).toEqual([{ old_cents: null, new_cents: 400 }, { old_cents: 400, new_cents: 450 }])
  })

  it('adjusts prep separately', async () => {
    const { call } = await makeApp()
    const o = await payInFull(call, await reserve(call, { items: [await listedItem(call, { prepCents: 0 })], customer: await mkCustomer(call) }))
    const r = await call('POST', `/api/order-lines/${o.lines[0].id}/adjustments`, { field: 'prep', newCents: 300, reason: 'dry cleaning' })
    expect(r.body.order.lines[0].effectivePrepCents).toBe(300)
  })

  it('refuses unpaid, returned and purchase-costed lines', async () => {
    const { call, db } = await makeApp()
    const item = await listedItem(call)
    const o = await reserve(call, { items: [item], customer: await mkCustomer(call) })
    expect((await call('POST', `/api/order-lines/${o.lines[0].id}/adjustments`, { field: 'cost', newCents: 1, reason: 'x' })).body.error).toBe('not_adjustable')
    const paid = await payInFull(call, o)
    const p = (await db.query(`INSERT INTO purchases (purchased_on, total_cents) VALUES ('2026-09-01', 1000) RETURNING id`)).rows[0].id
    await db.query('INSERT INTO purchase_lines (purchase_id, item_id, allocated_cents) VALUES ($1, $2, 1000)', [p, item.id])
    expect((await call('POST', `/api/order-lines/${paid.lines[0].id}/adjustments`, { field: 'cost', newCents: 1, reason: 'x' })).body.error).toBe('edit_on_purchase')
  })
})
```

- [ ] **Step 2: Run to verify it fails**, **Step 3: implement** and register routes, **Step 4: `npm test`**, **Step 5: commit** — `git add -A && git commit -m "feat: cost adjustments on sold lines"`

### Task 14: Purchases

**Spec:** section 5.2 (all), 5.1 (Cost authority), 6.6.

**Files:** Create `server/purchases.js`, `test/purchases.test.js`; modify `server/app.js`.

**Interfaces:** Consumes `allocate`, `isCents` (Task 3), `applyCostChangeToSale` (Task 13), `costBasis`, `loadItemForCost` (Task 7). Produces `purchases.routes`.

**Rules:**
- Body shape for create and edit: `{ purchasedOn, sourceId|null, totalCents, excludedCents=0, notes?, split: 'equal'|'amounts', lines: [{ itemId } | { newItem: { name?, notes? } }, with allocatedCents when split='amounts'], applyToSales? }` (+ `version` on edit).
- `inventory = totalCents − excludedCents` (422 `excluded_too_large` if negative). `equal` → `allocate(inventory, ones)`; `amounts` → Σ must equal inventory else 422 `allocation_mismatch` `{ expectedCents, gotCents }`. At least one line.
- Attached existing items: exist, not deleted (422 `unknown_item`), not personal (422 `personal_item`), not already on **another** purchase (409 `item_on_purchase`). New items are created in `preparing` with `acquisition 'purchase'`.
- Every attached item gets `source_id = purchase.source_id`, `acquisition = 'purchase'`.
- **Sale decisions:** for each attached item with an adjustable sold line (Task 13 definition) whose effective cost ≠ its new allocated cost: if `applyToSales` is not a boolean → 409 `needs_sale_decision` with `{ lines: [{ itemId, code, orderLineId, paidOn, currentCents, newCents }] }` and nothing is saved; `true` → `applyCostChangeToSale(... field 'cost', newCents: allocated, reason: 'Purchase <date> updated')`; `false` → no adjustment (the past sale keeps its cost).
- **Edit** `PATCH /api/purchases/:id` replaces the line set: removed items get their purchase line deleted (their cost authority reverts to own cost). Changing `sourceId` updates every attached item's source.
- **Delete** `DELETE /api/purchases/:id { version }`: 409 `purchase_has_sales` if any attached item has ever been on an order line; else delete its lines and set `deleted_at`.
- `GET /api/purchases` (newest first) and `GET /api/purchases/:id` → `{ purchase: { …, inventoryCents, lines: [{ itemId, code, name, allocatedCents }] } }`.
- A purchase is never an expense; nothing here writes to `expenses`.

- [ ] **Step 1: Write `test/purchases.test.js`**

```js
import { describe, it, expect } from 'vitest'
import { makeApp, listedItem, readyItem, mkCustomer, reserve, payInFull } from './helpers.js'

describe('purchases', () => {
  it('splits the inventory part of a receipt equally and makes item cost read-only', async () => {
    const { call } = await makeApp()
    const src = (await call('POST', '/api/sources', { name: 'Value Village' })).body.source
    const quick = (await call('POST', '/api/items', { notes: 'captured in store', ownCostCents: 999 })).body.item
    const r = await call('POST', '/api/purchases', { purchasedOn: '2026-09-14', sourceId: src.id, totalCents: 2415, excludedCents: 400, split: 'equal', lines: [{ itemId: quick.id }, { newItem: { name: 'Scarf' } }, { newItem: { name: 'Belt' } }] })
    expect(r.body.purchase.inventoryCents).toBe(2015)
    expect(r.body.purchase.lines.map(l => l.allocatedCents)).toEqual([672, 671, 672])
    const item = (await call('GET', `/api/items/${quick.id}`)).body.item
    expect([item.costBasisCents, item.costAuthority, item.sourceId]).toEqual([672, 'purchase', src.id])
    expect((await call('PATCH', `/api/items/${quick.id}`, { version: item.version, ownCostCents: 1 })).body.error).toBe('cost_on_purchase')
  })

  it('requires entered amounts to match the inventory amount', async () => {
    const { call } = await makeApp()
    const r = await call('POST', '/api/purchases', { purchasedOn: '2026-09-14', sourceId: null, totalCents: 1000, split: 'amounts', lines: [{ newItem: {}, allocatedCents: 600 }, { newItem: {}, allocatedCents: 300 }] })
    expect([r.body.error, r.body.expectedCents, r.body.gotCents]).toEqual(['allocation_mismatch', 1000, 900])
  })

  it('refuses an item already on another purchase and personal items', async () => {
    const { call } = await makeApp()
    const i = await readyItem(call)
    await call('POST', '/api/purchases', { purchasedOn: '2026-09-14', sourceId: null, totalCents: 500, split: 'equal', lines: [{ itemId: i.id }] })
    expect((await call('POST', '/api/purchases', { purchasedOn: '2026-09-14', sourceId: null, totalCents: 500, split: 'equal', lines: [{ itemId: i.id }] })).body.error).toBe('item_on_purchase')
    const p = (await call('POST', '/api/items', { acquisition: 'personal' })).body.item
    expect((await call('POST', '/api/purchases', { purchasedOn: '2026-09-14', sourceId: null, totalCents: 500, split: 'equal', lines: [{ itemId: p.id }] })).body.error).toBe('personal_item')
  })

  it('asks before changing the cost of something already sold', async () => {
    const { call } = await makeApp()
    const item = await listedItem(call, { ownCostCents: null })
    const o = await payInFull(call, await reserve(call, { items: [item], customer: await mkCustomer(call) }))
    const body = { purchasedOn: '2026-09-01', sourceId: null, totalCents: 800, split: 'equal', lines: [{ itemId: item.id }] }
    const ask = await call('POST', '/api/purchases', body)
    expect([ask.status, ask.body.error, ask.body.lines[0].newCents]).toEqual([409, 'needs_sale_decision', 800])
    expect((await call('GET', '/api/purchases')).body.purchases).toHaveLength(0)
    await call('POST', '/api/purchases', { ...body, applyToSales: true })
    expect((await call('GET', `/api/orders/${o.id}`)).body.order.lines[0].effectiveCostCents).toBe(800)
  })

  it('cannot delete a purchase whose items have sold', async () => {
    const { call } = await makeApp()
    const item = await listedItem(call)
    const p = (await call('POST', '/api/purchases', { purchasedOn: '2026-09-01', sourceId: null, totalCents: 800, split: 'equal', lines: [{ itemId: item.id }] })).body.purchase
    await reserve(call, { items: [(await call('GET', `/api/items/${item.id}`)).body.item], customer: await mkCustomer(call) })
    expect((await call('DELETE', `/api/purchases/${p.id}`, { version: p.version })).body.error).toBe('purchase_has_sales')
  })
})
```

- [ ] **Step 2: Run to verify it fails**, **Step 3: implement** and register routes, **Step 4: `npm test`**, **Step 5: commit** — `git add -A && git commit -m "feat: purchases with excluded amounts and sale decisions"`

### Task 15: Expenses and owner funding

**Spec:** section 5.7, 6.11.

**Files:** Create `server/expenses.js`, `test/expenses.test.js`; modify `server/app.js`.

**Interfaces — Produces:** `expenses.routes`; `EXPENSE_CATEGORIES` (same seven names as the schema check).

**Rules:**
- `POST /api/expenses { vendor?, receiptDate?, amountCents?, category?, notes? }` → draft. `PATCH /api/expenses/:id { version, … }` drafts only (409 `confirmed_locked`). `DELETE /api/expenses/:id { version }` drafts only → `deleted_at`.
- `POST /api/expenses/:id/confirm { version }`: vendor, receipt date (not in the future), amount > 0 and category required → else 422 `incomplete` with `{ missing }`; sets `status 'confirmed'`, `confirmed_at`.
- `POST /api/expenses/:id/void { reason }`: confirmed only; sets `voided_at`, `void_reason`.
- `GET /api/expenses?status=` newest receipt date first, excluding deleted.
- `POST /api/owner-funding { receivedOn, amountCents, note? }`; `POST /api/owner-funding/:id/void { reason }`; `GET /api/owner-funding`.
- Receipt images arrive in Plan 2 (`receipt_blob_key` stays null here).

- [ ] **Step 1: Write `test/expenses.test.js`**

```js
import { describe, it, expect } from 'vitest'
import { makeApp } from './helpers.js'

describe('expenses', () => {
  it('drafts, confirms, locks and voids', async () => {
    const { call } = await makeApp()
    const d = (await call('POST', '/api/expenses', { vendor: 'Tape Co' })).body.expense
    const bad = await call('POST', `/api/expenses/${d.id}/confirm`, { version: d.version })
    expect([bad.body.error, bad.body.missing]).toEqual(['incomplete', ['receiptDate', 'amountCents', 'category']])
    const e = await call('PATCH', `/api/expenses/${d.id}`, { version: d.version, receiptDate: '2026-09-14', amountCents: 850, category: 'Packaging' })
    const c = await call('POST', `/api/expenses/${d.id}/confirm`, { version: e.body.expense.version })
    expect(c.body.expense.status).toBe('confirmed')
    expect((await call('PATCH', `/api/expenses/${d.id}`, { version: c.body.expense.version, amountCents: 85000 })).body.error).toBe('confirmed_locked')
    expect((await call('POST', `/api/expenses/${d.id}/void`, { reason: 'duplicate' })).body.expense.voidReason).toBe('duplicate')
  })

  it('deletes drafts only', async () => {
    const { call } = await makeApp()
    const d = (await call('POST', '/api/expenses', {})).body.expense
    expect((await call('DELETE', `/api/expenses/${d.id}`, { version: d.version })).status).toBe(200)
    expect((await call('GET', '/api/expenses')).body.expenses).toHaveLength(0)
  })

  it('records owner funding separately and voids it', async () => {
    const { call } = await makeApp()
    const f = (await call('POST', '/api/owner-funding', { receivedOn: '2026-09-01', amountCents: 20000, note: 'start-up money' })).body.funding
    expect((await call('POST', `/api/owner-funding/${f.id}/void`, { reason: 'typo' })).body.funding.voidedAt).toBeTruthy()
  })
})
```

- [ ] **Step 2: Run to verify it fails**, **Step 3: implement** and register routes, **Step 4: `npm test`**, **Step 5: commit** — `git add -A && git commit -m "feat: expenses and owner funding"`

### Task 16: Reports

**Spec:** section 5.9 (all), 6.7, 6.8, 6.10.

**Files:** Create `server/reports.js`, `test/reports.test.js`; modify `server/app.js`.

**Interfaces:** Consumes the `line_effective` view (Task 2), `edmontonDate` (Task 3). Produces `reports.routes` and `moneyReport(db, { from, to }) → report object` (Task 17 uses it for the yearly summary).

**Rules** (only non-voided payments/refunds/expenses/funding count; "paid in period" = order status `paid`/`completed` with `paid_on` between `from` and `to` inclusive; refunds by `refunded_on`; expenses by `receipt_date` and `status = 'confirmed'`; funding by `received_on`):
- `GET /api/reports/money?from=YYYY-MM-DD&to=YYYY-MM-DD` (422 `bad_period` if missing, malformed or `from > to`) → `moneyReport`:
  - `merchandiseSalesCents` = Σ `net_sale_cents` of lines on orders paid in period.
  - `feesChargedCents` = Σ `fee_cents` of orders paid in period.
  - `platformFeesCents` = Σ `platform_fee_cents` of orders paid in period.
  - `merchandiseRefundsCents` = Σ refund line amounts; `feeRefundsCents` = Σ `fee_refund_cents`; `returnPostageCents` = Σ `return_postage_cents` — refunds in period. (`unallocated_cents` is money returned, not a sale refund; excluded.)
  - `cogsCents` = Σ known effective cost of lines paid in period; `restockReversalsCents` = Σ non-null `reversal_cents` of refund lines in period; `prepCents` = Σ effective prep of lines paid in period; `postageCents` = Σ `postage_cents` of orders paid in period with `postage_state = 'entered'`.
  - `expensesByCategory` (object, only categories with spending) and `expensesCents`.
  - `profitCents` = merchandise + fees charged − platform fees − merchandise refunds − fee refunds − (cogs − reversals) − prep − postage − return postage − expenses.
  - `ownerFundingCents` (cash-in line, not in profit).
  - `unpaid` = `{ count, amountDueCents }` for all orders currently `awaiting` (not period-based).
  - `incomplete` = `{ unknownCostLines, unknownPostageOrders, complete }`: lines paid in period whose effective cost is null; shipping orders paid in period with `postage_state = 'unknown'`; `complete` = both zero.
  - `sources`: per `snap_source_id` of lines paid in period (null → name `Not recorded`; deleted sources keep their name): `{ sourceId, name, lines, netSalesCents, refundsCents, cogsCents, prepCents, platformFeesCents, profitCents, incomplete }`, where refunds and reversals in the period are attributed via the refund line's order line's `snap_source_id`, `cogsCents` is net of those reversals, `profitCents = netSales − refunds − cogs − prep − platformFees` (allocated platform fee), `incomplete` = any line with unknown effective cost. Fees charged and postage are excluded. Sorted by `netSalesCents` desc, then name. Only rows with any activity.
  - `platforms`: same shape keyed by `orders.platform_id` (`orders` count instead of `lines`), null → `Not recorded`.
- `GET /api/reports/stock` → `{ knownCostCents, items, unknownCostItems }` over live items with status `preparing|ready|listed|reserved`, using `costBasis`.
- `GET /api/reports/missing` → `{ unknownCostLines: [{ orderLineId, orderId, code, paidOn }], unknownPostageOrders: [{ orderId, number, paidOn }], unconfirmedTransfer: [{ itemId, code }] (personal items not sold, not deleted, without confirmation), expiredReservations: [{ orderId, number, deadline }], listingReview: [{ itemId, code, listedAt }] (status listed, listed_at ≤ now − 30 days), backupStale: boolean }` where `backupStale` is true when no `audit_log` row with `entity = 'backup' AND action = 'success'` exists in the last 48 hours (Task 18 writes those rows).
- `GET /api/reports/gst` → the current Edmonton calendar quarter and the three before it: `{ quarters: [{ label: '2026-Q3', revenueCents }], totalCents, notice }`, revenue = merchandise + fees charged − merchandise refunds − fee refunds; `notice` = total ≥ 2,500,000.

- [ ] **Step 1: Write `test/reports.test.js`**

```js
import { describe, it, expect } from 'vitest'
import { makeApp, listedItem, mkCustomer, reserve, payInFull } from './helpers.js'

const period = '/api/reports/money?from=2026-09-01&to=2026-09-30'

describe('money report', () => {
  it('adds up a month exactly', async () => {
    const { call } = await makeApp()
    const src = (await call('POST', '/api/sources', { name: 'Goodwill' })).body.source
    const a = await listedItem(call, { askingCents: 8000, ownCostCents: 2000, prepCents: 300, sourceId: src.id })
    const b = await listedItem(call, { askingCents: 2000, ownCostCents: 500 })
    const o = await payInFull(call, await reserve(call, { items: [a, b], customer: await mkCustomer(call), discountCents: 1000, feeCents: 1500, fulfilmentMethod: 'shipping' }))
    await call('POST', `/api/orders/${o.id}/postage`, { version: o.version, state: 'entered', cents: 1200 })
    const e = (await call('POST', '/api/expenses', { vendor: 'Tape Co', receiptDate: '2026-09-10', amountCents: 850, category: 'Packaging' })).body.expense
    await call('POST', `/api/expenses/${e.id}/confirm`, { version: e.version })
    await call('POST', '/api/owner-funding', { receivedOn: '2026-09-02', amountCents: 20000 })
    const r = (await call('GET', period)).body
    expect(r.merchandiseSalesCents).toBe(9000)
    expect(r.feesChargedCents).toBe(1500)
    expect(r.cogsCents).toBe(2500)
    expect(r.prepCents).toBe(300)
    expect(r.postageCents).toBe(1200)
    expect(r.expensesCents).toBe(850)
    expect(r.profitCents).toBe(9000 + 1500 - 2500 - 300 - 1200 - 850)
    expect(r.ownerFundingCents).toBe(20000)
    expect(r.incomplete.complete).toBe(true)
    const goodwill = r.sources.find(s => s.name === 'Goodwill')
    expect([goodwill.netSalesCents, goodwill.cogsCents, goodwill.profitCents]).toEqual([7200, 2000, 7200 - 2000 - 300])
    expect(r.sources.find(s => s.name === 'Not recorded').netSalesCents).toBe(1800)
  })

  it('dates a September sale refunded in October to each month', async () => {
    const { call, clock } = await makeApp()
    const o = await payInFull(call, await reserve(call, { items: [await listedItem(call, { askingCents: 5000, ownCostCents: 1000 })], customer: await mkCustomer(call) }))
    clock.now = new Date('2026-10-03T18:00:00Z')
    await call('POST', `/api/orders/${o.id}/refunds`, { refundedOn: '2026-10-03', reason: 'return', lines: [{ orderLineId: o.lines[0].id, amountCents: 5000, decision: 'restock' }] })
    const sep = (await call('GET', period)).body
    const oct = (await call('GET', '/api/reports/money?from=2026-10-01&to=2026-10-31')).body
    expect([sep.merchandiseSalesCents, sep.cogsCents, sep.profitCents]).toEqual([5000, 1000, 4000])
    expect([oct.merchandiseRefundsCents, oct.restockReversalsCents, oct.profitCents]).toEqual([5000, 1000, -4000])
  })

  it('marks profit incomplete for unknown cost and unknown postage, and ignores unpaid reservations', async () => {
    const { call } = await makeApp()
    await payInFull(call, await reserve(call, { items: [await listedItem(call, { ownCostCents: null })], customer: await mkCustomer(call), fulfilmentMethod: 'shipping' }))
    await reserve(call, { items: [await listedItem(call, { askingCents: 9900 })], customer: await mkCustomer(call, { name: 'B' }) })
    const r = (await call('GET', period)).body
    expect(r.incomplete).toEqual({ unknownCostLines: 1, unknownPostageOrders: 1, complete: false })
    expect(r.unpaid).toEqual({ count: 1, amountDueCents: 9900 })
    expect(r.merchandiseSalesCents).toBe(4800)
  })

  it('uses the platform payout: fees reduce profit and are grouped by platform', async () => {
    const { call } = await makeApp()
    const posh = (await call('GET', '/api/platforms')).body.platforms.find(p => p.name === 'Poshmark')
    const o = await reserve(call, { items: [await listedItem(call, { askingCents: 5000, ownCostCents: 1000 })], customer: await mkCustomer(call), paymentMethod: 'platform', platformId: posh.id, fulfilmentMethod: 'shipping' })
    const c = await call('POST', `/api/orders/${o.id}/confirm-platform`, { version: o.version, platformFeeCents: 1000, soldOn: '2026-09-12' })
    await call('POST', `/api/orders/${o.id}/postage`, { version: c.body.order.version, state: 'na' })
    const r = (await call('GET', period)).body
    expect(r.profitCents).toBe(5000 - 1000 - 1000)
    expect(r.platforms[0]).toMatchObject({ name: 'Poshmark', orders: 1, netSalesCents: 5000, platformFeesCents: 1000, profitCents: 3000 })
  })

  it('rejects a bad period', async () => {
    const { call } = await makeApp()
    expect((await call('GET', '/api/reports/money?from=2026-10-01&to=2026-09-01')).body.error).toBe('bad_period')
  })
})

describe('other reports', () => {
  it('values stock at known cost and counts unknowns', async () => {
    const { call } = await makeApp()
    await listedItem(call, { ownCostCents: 1200 })
    await listedItem(call, { ownCostCents: null })
    expect((await call('GET', '/api/reports/stock')).body).toEqual({ knownCostCents: 1200, items: 2, unknownCostItems: 1 })
  })

  it('lists missing information, expired reservations and 30-day reviews', async () => {
    const { call, clock } = await makeApp()
    await listedItem(call)
    await call('POST', '/api/items', { acquisition: 'personal', transferValueCents: 500 })
    await reserve(call, { items: [await listedItem(call)], customer: await mkCustomer(call) })
    clock.now = new Date(clock.now.getTime() + 31 * 864e5)
    const m = (await call('GET', '/api/reports/missing')).body
    expect(m.listingReview).toHaveLength(1)
    expect(m.expiredReservations).toHaveLength(1)
    expect(m.unconfirmedTransfer).toHaveLength(1)
    expect(m.backupStale).toBe(true)
  })

  it('watches the GST small-supplier threshold', async () => {
    const { call } = await makeApp()
    await payInFull(call, await reserve(call, { items: [await listedItem(call, { askingCents: 2600000 })], customer: await mkCustomer(call) }))
    const g = (await call('GET', '/api/reports/gst')).body
    expect(g.quarters.map(q => q.label)).toEqual(['2025-Q4', '2026-Q1', '2026-Q2', '2026-Q3'])
    expect([g.totalCents, g.notice]).toEqual([2600000, true])
  })
})
```

- [ ] **Step 2: Run to verify it fails**, **Step 3: implement** (prefer one SQL query per figure over JavaScript loops; all date filters on `date` columns, no time-zone math needed except "today" and `listed_at`/`deadline` comparisons against `ctx.now()`), register routes, **Step 4: `npm test`**, **Step 5: commit** — `git add -A && git commit -m "feat: money, stock, missing-information and GST reports"`

### Task 17: Exports

**Spec:** section 5.9 (Exports), 5.4 (customer export already done in Task 8).

**Files:** Create `server/csv.js`, `server/exports.js`, `test/exports.test.js`; modify `server/app.js`.

**Interfaces:** Consumes `moneyReport` (Task 16). Produces `exports.routes`; `toCsv(rows, columns) → string`; `EXPORT_TABLES` (ordered table list, reused by Task 18).

**Rules:**
- `toCsv`: header row from `columns`; values: null/undefined → empty; `Date` → ISO string; objects → JSON; any value containing `"`, `,`, CR or LF is wrapped in quotes with `"` doubled; values starting with `=`, `+`, `-` or `@` get a leading `'` (spreadsheet-formula protection); lines end with `\r\n`.
- `GET /api/export/items.csv`, `/api/export/order-lines.csv` (one row per paid line: order number, paid on, item code, name, agreed, discount, net sale, platform fee, effective cost, effective prep, source name, platform name, customer name), `/api/export/expenses.csv` (confirmed, including voided with a `voided` column). `Content-Type: text/csv; charset=utf-8`, `Content-Disposition: attachment; filename="<name>-<today>.csv"`.
- `EXPORT_TABLES` = `['settings','app_users','sources','platforms','items','purchases','purchase_lines','customers','customer_notes','orders','order_lines','payments','refunds','refund_lines','cost_adjustments','expenses','owner_funding','audit_log']`. For `app_users` export only `id, email, name, created_at` (never password hashes).
- `GET /api/export/full.zip`: `fflate.zipSync` of `<table>.csv` for every `EXPORT_TABLES` entry plus `README.txt` (one paragraph: what each file is, that amounts are cents, dates are Edmonton). Photos and receipts are added in Plan 2. `Content-Type: application/zip`.
- `GET /api/export/year-summary?year=2026` → JSON `moneyReport` for Jan 1–Dec 31 of that year (422 `bad_year` outside 2020–2100).
- Every export is audited (`entity 'export'`, `action` = the file name) — exports contain personal information.

- [ ] **Step 1: Write `test/exports.test.js`**

```js
import { describe, it, expect } from 'vitest'
import { unzipSync, strFromU8 } from 'fflate'
import { makeApp, listedItem, mkCustomer, reserve, payInFull } from './helpers.js'
import { toCsv } from '../server/csv.js'

describe('csv', () => {
  it('quotes, escapes and defuses formulas', () => {
    const out = toCsv([{ a: 'x,y', b: 'say "hi"', c: '=SUM(A1)', d: null }], ['a', 'b', 'c', 'd'])
    expect(out).toBe('a,b,c,d\r\n"x,y","say ""hi""",\'=SUM(A1),\r\n')
  })
})

describe('exports', () => {
  it('exports order lines with effective cost', async () => {
    const { call } = await makeApp()
    await payInFull(call, await reserve(call, { items: [await listedItem(call, { ownCostCents: 1200 })], customer: await mkCustomer(call) }))
    const res = await call('GET', '/api/export/order-lines.csv', undefined, { raw: true })
    expect(res.headers.get('content-type')).toMatch(/text\/csv/)
    const text = await res.text()
    expect(text.split('\r\n')[1]).toContain('BM-001')
    expect(text).toContain('1200')
  })

  it('full export has every table and no password hashes', async () => {
    const { call, db } = await makeApp()
    await listedItem(call)
    const res = await call('GET', '/api/export/full.zip', undefined, { raw: true })
    const files = unzipSync(new Uint8Array(await res.arrayBuffer()))
    expect(Object.keys(files)).toContain('order_lines.csv')
    expect(Object.keys(files)).toContain('README.txt')
    expect(strFromU8(files['app_users.csv'])).not.toContain('password')
    expect((await db.query(`SELECT count(*)::int AS n FROM audit_log WHERE entity = 'export'`)).rows[0].n).toBe(1)
  })

  it('year summary uses the money report', async () => {
    const { call } = await makeApp()
    await payInFull(call, await reserve(call, { items: [await listedItem(call, { askingCents: 4000 })], customer: await mkCustomer(call) }))
    expect((await call('GET', '/api/export/year-summary?year=2026')).body.merchandiseSalesCents).toBe(4000)
    expect((await call('GET', '/api/export/year-summary?year=1999')).body.error).toBe('bad_year')
  })
})
```

- [ ] **Step 2: Run to verify it fails**, **Step 3: implement** and register routes, **Step 4: `npm test`**, **Step 5: commit** — `git add -A && git commit -m "feat: csv, full zip and yearly exports"`

### Task 18: Backup and restore

**Spec:** section 8 (Backups), 10 (Restore drill), 12.

**Files:** Create `server/backup.js`, `netlify/functions/backup-nightly.mjs`, `scripts/restore.mjs`, `test/backup.test.js`; modify `README.md` ("Restore from backup", "If data may have leaked").

**Interfaces:** Consumes `EXPORT_TABLES` (Task 17), `moneyReport` (Task 16). Produces `exportAll(db)`, `encrypt(buf, keyB64)`, `decrypt(buf, keyB64)`, `restoreAll(db, dump)`, `backupKeys(date) → string[]`.

**Rules:**
- `exportAll(db)` → `{ format: 1, createdAt, tables: { <name>: rows } }` for every `EXPORT_TABLES` entry **with all columns** (including `app_users.password_hash` — a restore must let people sign in; the file is encrypted), plus `sequences: { item_code_seq: last_value }`.
- `encrypt`: gzip (node `zlib.gzipSync`) the JSON, then AES-256-GCM with a random 12-byte IV; output bytes = `'BMV1'` (4 bytes) + IV (12) + auth tag (16) + ciphertext. `decrypt` reverses and throws on a wrong key or tampered data. Key = 32 bytes, base64 (throw `bad_backup_key` otherwise).
- `backupKeys(date)` (Edmonton date string) → `['daily/<date>.bmv']`, plus `'monthly/<YYYY-MM>.bmv'` when the day is `01`.
- `restoreAll(db, dump)`: target must have migrations applied and **no** rows in `items`, `orders`, `customers` or `app_users` (throw `target_not_empty`). In one transaction: `DELETE FROM platforms; DELETE FROM sources; DELETE FROM settings;` then insert every table in `EXPORT_TABLES` order using the row's own column names; then `setval` for `item_code_seq` (from `sequences`), `customers_number_seq`, `orders_number_seq`, `audit_log_id_seq` (to the max existing value, or 1 with `is_called = false` when empty). Insert values as JSON-safe text/numbers; timestamps as ISO strings.
- `netlify/functions/backup-nightly.mjs`: `export const config = { schedule: '0 9 * * *' }` (03:00 Mountain). Reads `BACKUP_KEY`, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`; `exportAll` → `encrypt` → `PUT https://<account>.r2.cloudflarestorage.com/<bucket>/<key>` with `aws4fetch`'s `AwsClient` (`service: 's3', region: 'auto'`) for each of `backupKeys(today)`; on success insert `audit_log (entity 'backup', entity_id <key>, action 'success')`; on any failure insert `action 'failure'` with the error message in `reason`, then rethrow so Netlify logs it. Photos and receipts are added in Plan 2.
- `scripts/restore.mjs`: usage `node scripts/restore.mjs <local-file.bmv | r2:daily/2026-09-25.bmv>` with env `BACKUP_KEY` and `TARGET_DATABASE_URL` (plus the R2 variables for `r2:` paths). Refuses if `TARGET_DATABASE_URL` equals `DATABASE_URL` when both are set. Applies migrations to the target, then `restoreAll`, then prints row counts per table and the all-time money report profit so it can be compared with production.
- README "Restore from backup": plain-English steps (create an empty Neon branch or project, copy its connection string, find the backup key in the password manager, run the script, compare the printed numbers with the live app's Money page). "If data may have leaked": sign out all devices (both people), rotate the database password in Neon and the Anthropic/R2 keys, change both passwords, decide whether there is a real risk of significant harm to customers; if yes, notify the Office of the Information and Privacy Commissioner of Alberta and the affected people.

- [ ] **Step 1: Write `test/backup.test.js`**

```js
import { describe, it, expect } from 'vitest'
import { randomBytes } from 'node:crypto'
import { makeApp, testDb, listedItem, mkCustomer, reserve, payInFull } from './helpers.js'
import { exportAll, encrypt, decrypt, restoreAll, backupKeys } from '../server/backup.js'
import { moneyReport } from '../server/reports.js'

const key = randomBytes(32).toString('base64')

describe('backup', () => {
  it('round-trips a business through encryption into an empty database', async () => {
    const { call, db } = await makeApp()
    const o = await payInFull(call, await reserve(call, { items: [await listedItem(call, { askingCents: 5000, ownCostCents: 1000 })], customer: await mkCustomer(call, { phone: '403-555-0100' }) }))
    await call('POST', `/api/orders/${o.id}/refunds`, { refundedOn: '2026-09-15', reason: 'goodwill', lines: [{ orderLineId: o.lines[0].id, amountCents: 500, decision: 'kept' }] })
    const blob = encrypt(Buffer.from(JSON.stringify(await exportAll(db))), key)
    expect(blob.subarray(0, 4).toString()).toBe('BMV1')
    expect(blob.toString('latin1')).not.toContain('403-555')

    const target = await testDb()
    await restoreAll(target, JSON.parse(decrypt(blob, key).toString()))
    const period = { from: '2026-01-01', to: '2026-12-31' }
    expect(await moneyReport(target, period)).toEqual(await moneyReport(db, period))
    for (const t of ['items', 'orders', 'order_lines', 'payments', 'refunds', 'audit_log', 'platforms', 'sources']) {
      const n = async d => (await d.query(`SELECT count(*)::int AS n FROM ${t}`)).rows[0].n
      expect(await n(target)).toBe(await n(db))
    }
    const next = await target.query('INSERT INTO items DEFAULT VALUES RETURNING code')
    expect(next.rows[0].code).toBe('BM-002')
  })

  it('rejects a wrong key and tampering', async () => {
    const blob = encrypt(Buffer.from('{"a":1}'), key)
    expect(() => decrypt(blob, randomBytes(32).toString('base64'))).toThrow()
    blob[blob.length - 1] ^= 1
    expect(() => decrypt(blob, key)).toThrow()
  })

  it('refuses to restore over live data', async () => {
    const { db } = await makeApp()
    await expect(restoreAll(db, await exportAll(db))).rejects.toThrow(/target_not_empty/)
  })

  it('writes a monthly copy on the first of the month', () => {
    expect(backupKeys('2026-10-01')).toEqual(['daily/2026-10-01.bmv', 'monthly/2026-10.bmv'])
    expect(backupKeys('2026-10-02')).toEqual(['daily/2026-10-02.bmv'])
  })
})
```

- [ ] **Step 2: Run to verify it fails**, **Step 3: implement**, **Step 4: `npm test`** — all tests in the repo pass, **Step 5: commit** — `git add -A && git commit -m "feat: encrypted nightly backup and restore"`

### Final review (Opus subagent, superpowers:requesting-code-review)

Review the whole branch against the spec sections 5.1–5.9, 6, 7 and 8 and this plan's Global Constraints. Specifically check: every write route goes through idempotency and audit; every versioned edit uses `lockVersioned`; no money row is updated outside voiding; no route returns business data without a session; the report arithmetic matches spec 6.8 dating; no secrets or connection strings are committed. Fix confirmed findings before Task 19.

### Task 19: Deploy, seed, verify and restore drill (main session, inline)

- [ ] **Step 1: Apply migrations** to the Neon `dev` branch, then production: `DATABASE_URL=<dev url> npm run migrate`, then the production URL. Verify with `mcp__neon__get_database_tables` that the 22 tables and the `line_effective` view exist on both.
- [ ] **Step 2: Create the Netlify site** `big-mood-vintage` linked to `mphampson89/big-mood-vintage`, branch `main`, in account `mphampson` (confirm with Patrick first; this creates a live site). Set environment variables in the **production** context only: `DATABASE_URL` (production), `BACKUP_KEY`, `R2_ACCOUNT_ID`, `R2_BUCKET`; Patrick pastes `R2_ACCESS_KEY_ID` and `R2_SECRET_ACCESS_KEY` himself (BLOCKED template). Deploy-preview and branch contexts get the `dev` branch `DATABASE_URL` and no R2 or backup variables. Custom domain `app.bigmoodvintage.com` is deferred to Plan 2 (no UI yet).
- [ ] **Step 3: Deploy** by pushing `main` (Patrick's explicit "go" first). Verify: `GET /api/health` → 200; `GET /api/items` without a cookie → 401; a `POST` with a foreign `Origin` → 403; response headers include the CSP and `noindex`.
- [ ] **Step 4: Seed accounts** — `DATABASE_URL=<production> node scripts/seed-users.mjs "Jenn" <her email> "Patrick" <his email>` (ask Patrick for both emails). Give Patrick the two temporary passwords privately in the terminal output only. Sign in once with each via `curl` against production and change the password (or leave `must_change_password` for Plan 2's screens — Patrick decides).
- [ ] **Step 5: Concurrency probe against real Neon** (dev branch, local `node` script, not committed): create one listed item and fire two reservation requests in parallel with different users; exactly one succeeds and the other gets `item_unavailable`. Repeat with two parallel payment confirmations using the same idempotency key → one payment row. Also confirm on Neon that `SELECT count(*) FROM items` returns a JavaScript number and `SELECT paid_on::text` a `YYYY-MM-DD` string through `neonDb()`.
- [ ] **Step 6: Run the backup once** from the Netlify UI ("Run now" on the scheduled function) and confirm the object appears in R2 and an `audit_log` `backup success` row exists.
- [ ] **Step 7: Restore drill** — create an empty Neon branch, run `scripts/restore.mjs r2:daily/<today>.bmv` against it, compare the printed counts with production, then delete the drill branch (with Patrick's OK).
- [ ] **Step 8: Set a Netlify credit alert** (account currently has none) at 80% — Patrick's call on the threshold; it is an account setting.
- [ ] **Step 9: Update docs** — spec section 16 note that Plan 1 shipped; `prototypes/big-mood/HANDOFF.md` (thrift-tracker branch) with the new repo, site, Neon project and next step (Plan 2); the new repo's README with links.

---

## Self-review (done while writing)

- **Spec coverage (Plan 1 scope):** 5.1 → T7; 5.2 → T14; 5.4 → T8; 5.5 → T9–T11; 5.6 → T12; 5.7 → T15; 5.8 → T6; 5.9 → T16–T17; 6 → T3, T10, T12, T13, T16; 7.1–7.4 → T2, T4; 8 accounts/sessions/rate limit/reset → T5, backups → T18, environments → T0/T19, privacy/breach → T8, T18; 10 unit and server tests → every task, restore drill → T19; 12 cost check → done before this plan (Netlify Pro credit plan, Neon Launch), credit alert → T19.
- **Deferred to Plan 2:** all screens (Clubhouse design), photos/thumbnails/Brighten/post export, receipt images, photo and receipt backup, `app.bigmoodvintage.com`, sign-in screen, Today's Missing-information view, customer delete-request UI. **Plan 3:** offline capture (item `capture_id` idempotency already built in T7), AI photo draft and receipt reading with the cap, public page and privacy notice, Jenn's acceptance on her iPhone, retiring the preview site.
- **Spec deltas made by this plan** (applied to the spec in the same commit): effective cost = latest adjustment (equivalent to snapshot + deltas, and works from unknown); Archived → Preparing always allowed; R2 immutability via bucket-lock rules (R2 tokens cannot be write-without-delete).
- **Names checked across tasks:** `lockVersioned`, `audit`, `costBasis`, `loadItemForCost`, `meetsListing`, `latestCaution`, `loadOrder`, `orderTotals`, `markPaid`, `unmarkPaid`, `autoComplete`, `applyCostChangeToSale`, `moneyReport`, `EXPORT_TABLES`, `exportAll`, `restoreAll`, fixtures `readyItem`, `listedItem`, `mkCustomer`, `reserve`, `payInFull`.
