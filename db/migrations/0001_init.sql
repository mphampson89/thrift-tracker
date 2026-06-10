-- Thrift Tracker — Neon schema (migrated from Supabase 2026-06-10)
-- Single-user app: no auth, no RLS. The DATABASE_URL secret in the
-- Netlify Functions layer is the access boundary.

CREATE TABLE items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  name text NOT NULL,
  cost numeric,
  listing_price numeric,
  sold_price numeric,
  ai_suggested_price numeric,
  status text NOT NULL DEFAULT 'unsold',
  listed_on text,
  notes text,
  photo_url text,
  search_query text
);
