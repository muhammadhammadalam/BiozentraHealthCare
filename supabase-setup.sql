-- ============================================================
-- Biozentra Healthcare Dashboard — Supabase Setup Script
-- Run this once in the Supabase SQL Editor after creating
-- your project. It creates all tables, enables RLS, and
-- grants public read/write access (anon key).
-- ============================================================

-- ── 1. Products ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.products (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  category    TEXT NOT NULL DEFAULT '',
  price       NUMERIC(12, 2) NOT NULL DEFAULT 0,
  stock       INTEGER NOT NULL DEFAULT 0,
  supplier    TEXT NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for anon" ON public.products
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ── 2. Customers ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.customers (
  id           TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  email        TEXT NOT NULL DEFAULT '',
  phone        TEXT NOT NULL DEFAULT '',
  city         TEXT NOT NULL DEFAULT '',
  total_spent  NUMERIC(14, 2) NOT NULL DEFAULT 0,
  orders       INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for anon" ON public.customers
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ── 3. Orders ────────────────────────────────────────────────
-- line_items is a JSONB array of: [{id, product, qty, unitPrice}]
CREATE TABLE IF NOT EXISTS public.orders (
  id          TEXT PRIMARY KEY,
  customer    TEXT NOT NULL,
  date        TEXT NOT NULL,
  total       NUMERIC(14, 2) NOT NULL DEFAULT 0,
  status      TEXT NOT NULL DEFAULT 'Pending',
  line_items  JSONB NOT NULL DEFAULT '[]'::JSONB,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for anon" ON public.orders
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ── 4. Invoices ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.invoices (
  id         TEXT PRIMARY KEY,
  customer   TEXT NOT NULL,
  date       TEXT NOT NULL,
  due_date   TEXT NOT NULL DEFAULT '',
  amount     NUMERIC(14, 2) NOT NULL DEFAULT 0,
  status     TEXT NOT NULL DEFAULT 'Pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for anon" ON public.invoices
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ── 5. Enable Realtime on all tables ────────────────────────
-- (If you get "already a member" errors, that's fine — just ignore them)
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
ALTER PUBLICATION supabase_realtime ADD TABLE public.customers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.invoices;

-- ── Done! ────────────────────────────────────────────────────
-- After running this script, go to your Supabase project:
-- Settings → API → copy "Project URL" and "anon public" key
-- Add them to Vercel as:
--   VITE_SUPABASE_URL  = https://xxxxxxxxxxxx.supabase.co
--   VITE_SUPABASE_ANON_KEY = eyJ...
