-- Rename suppliers table to brands
ALTER TABLE suppliers RENAME TO brands;

-- Rename supplier_id columns
ALTER TABLE products RENAME COLUMN supplier_id TO brand_id;
ALTER TABLE scrape_logs RENAME COLUMN supplier_id TO brand_id;

-- Rename indexes
ALTER INDEX products_supplier_id_idx RENAME TO products_brand_id_idx;
ALTER INDEX scrape_logs_supplier_id_idx RENAME TO scrape_logs_brand_id_idx;

-- Rename RLS policies on brands table
ALTER POLICY suppliers_public_read ON brands RENAME TO brands_public_read;
ALTER POLICY suppliers_admin_all ON brands RENAME TO brands_admin_all;
