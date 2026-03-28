-- ============================================================
-- atmarhoreca.com — Initial Database Schema
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE stock_status_enum AS ENUM ('in_stock', 'out_of_stock', 'unknown');
CREATE TYPE order_type_enum AS ENUM ('A', 'B');
CREATE TYPE order_status_enum AS ENUM ('pending_approval', 'awaiting_payment', 'paid', 'fulfilled', 'cancelled');
CREATE TYPE scrape_status_enum AS ENUM ('success', 'failed');

-- ============================================================
-- TABLE: suppliers
-- ============================================================

CREATE TABLE suppliers (
  id                          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                        text NOT NULL,
  country_code                char(2) NOT NULL,
  lead_time_note              text,
  handling_days               int NOT NULL DEFAULT 3,
  default_requires_confirmation boolean NOT NULL DEFAULT false,
  contact_email               text,
  active                      boolean NOT NULL DEFAULT true,
  created_at                  timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLE: products
-- ============================================================

CREATE TABLE products (
  id                    uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier_id           uuid NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
  name                  text NOT NULL,
  slug                  text NOT NULL UNIQUE,
  description           text,
  price                 numeric(10,2) NOT NULL,
  weight_kg             numeric(8,3) NOT NULL DEFAULT 1,
  requires_confirmation boolean NOT NULL DEFAULT false,
  stock_status          stock_status_enum NOT NULL DEFAULT 'unknown',
  last_scraped_at       timestamptz,
  martellato_url        text,
  images                text[] NOT NULL DEFAULT '{}',
  meta_title            text,
  meta_description      text,
  shipping_inefficient  boolean NOT NULL DEFAULT false,
  active                boolean NOT NULL DEFAULT true,
  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX products_slug_idx ON products(slug);
CREATE INDEX products_supplier_id_idx ON products(supplier_id);
CREATE INDEX products_active_idx ON products(active);

-- ============================================================
-- TABLE: customers
-- Mirrors Supabase Auth users — id matches auth.users.id
-- ============================================================

CREATE TABLE customers (
  id               uuid PRIMARY KEY,
  email            text NOT NULL UNIQUE,
  full_name        text NOT NULL,
  company_name     text,
  vat_number       text,
  vat_validated    boolean NOT NULL DEFAULT false,
  country_code     char(2),
  billing_address  jsonb,
  shipping_address jsonb,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLE: orders
-- ============================================================

CREATE TABLE orders (
  id                       uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id              uuid NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  type                     order_type_enum NOT NULL,
  status                   order_status_enum NOT NULL DEFAULT 'pending_approval',
  items                    jsonb NOT NULL DEFAULT '[]',
  subtotal                 numeric(10,2) NOT NULL,
  shipping_cost            numeric(10,2) NOT NULL DEFAULT 0,
  vat_rate                 numeric(5,4) NOT NULL DEFAULT 0,
  vat_amount               numeric(10,2) NOT NULL DEFAULT 0,
  total                    numeric(10,2) NOT NULL,
  currency                 char(3) NOT NULL DEFAULT 'EUR',
  stripe_payment_link_url  text,
  stripe_payment_intent_id text,
  proforma_pdf_url         text,
  tracking_number          text,
  tracking_url             text,
  admin_notes              text,
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX orders_customer_id_idx ON orders(customer_id);
CREATE INDEX orders_status_idx ON orders(status);
CREATE INDEX orders_created_at_idx ON orders(created_at DESC);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- TABLE: shipping_rates
-- One row per: origin_country + destination_country + weight_kg (1–30)
-- ============================================================

CREATE TABLE shipping_rates (
  id                        uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  origin_country_code       char(2) NOT NULL,
  destination_country_code  char(2) NOT NULL,
  weight_kg                 int NOT NULL CHECK (weight_kg >= 1 AND weight_kg <= 30),
  rate_eur                  numeric(8,2) NOT NULL,
  transit_days              int NOT NULL,
  UNIQUE (origin_country_code, destination_country_code, weight_kg)
);

CREATE INDEX shipping_rates_route_idx ON shipping_rates(origin_country_code, destination_country_code);

-- ============================================================
-- TABLE: blog_posts
-- ============================================================

CREATE TABLE blog_posts (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title             text NOT NULL,
  slug              text NOT NULL UNIQUE,
  content           text NOT NULL,
  linked_product_ids uuid[] NOT NULL DEFAULT '{}',
  meta_title        text,
  meta_description  text,
  published_at      timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX blog_posts_slug_idx ON blog_posts(slug);
CREATE INDEX blog_posts_published_at_idx ON blog_posts(published_at DESC);

-- ============================================================
-- TABLE: scrape_logs
-- ============================================================

CREATE TABLE scrape_logs (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier_id      uuid NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  status           scrape_status_enum NOT NULL,
  products_updated int NOT NULL DEFAULT 0,
  error_log        text,
  ran_at           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX scrape_logs_supplier_id_idx ON scrape_logs(supplier_id);
CREATE INDEX scrape_logs_ran_at_idx ON scrape_logs(ran_at DESC);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE scrape_logs ENABLE ROW LEVEL SECURITY;

-- Helper: is caller an admin?
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- suppliers: public read for active, admin full access
CREATE POLICY "suppliers_public_read" ON suppliers
  FOR SELECT USING (active = true);

CREATE POLICY "suppliers_admin_all" ON suppliers
  FOR ALL USING (is_admin());

-- products: public read for active, admin full access
CREATE POLICY "products_public_read" ON products
  FOR SELECT USING (active = true AND EXISTS (
    SELECT 1 FROM suppliers WHERE suppliers.id = products.supplier_id AND suppliers.active = true
  ));

CREATE POLICY "products_admin_all" ON products
  FOR ALL USING (is_admin());

-- customers: each user reads/updates their own row; admin full access
CREATE POLICY "customers_own_row" ON customers
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "customers_admin_all" ON customers
  FOR ALL USING (is_admin());

-- orders: customer sees own orders; admin full access
CREATE POLICY "orders_own" ON orders
  FOR SELECT USING (customer_id = auth.uid());

CREATE POLICY "orders_insert_own" ON orders
  FOR INSERT WITH CHECK (customer_id = auth.uid());

CREATE POLICY "orders_admin_all" ON orders
  FOR ALL USING (is_admin());

-- shipping_rates: public read; admin full access
CREATE POLICY "shipping_rates_public_read" ON shipping_rates
  FOR SELECT USING (true);

CREATE POLICY "shipping_rates_admin_all" ON shipping_rates
  FOR ALL USING (is_admin());

-- blog_posts: public reads published posts; admin full access
CREATE POLICY "blog_posts_public_read" ON blog_posts
  FOR SELECT USING (published_at IS NOT NULL AND published_at <= now());

CREATE POLICY "blog_posts_admin_all" ON blog_posts
  FOR ALL USING (is_admin());

-- scrape_logs: admin only
CREATE POLICY "scrape_logs_admin_all" ON scrape_logs
  FOR ALL USING (is_admin());

-- ============================================================
-- SEED: Martellato supplier
-- ============================================================

INSERT INTO suppliers (name, country_code, lead_time_note, handling_days, default_requires_confirmation, contact_email, active)
VALUES (
  'Martellato',
  'IT',
  'Usually ships in 5–7 business days',
  5,
  false,
  '',
  true
);
