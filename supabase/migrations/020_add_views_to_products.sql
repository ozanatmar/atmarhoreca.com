-- Add views column to products table
-- Populated by Make.com scenario that aggregates product_views and updates this column
ALTER TABLE products ADD COLUMN IF NOT EXISTS views integer NOT NULL DEFAULT 0;
