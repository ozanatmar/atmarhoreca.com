ALTER TABLE orders ADD COLUMN IF NOT EXISTS estimated_ship_date date DEFAULT NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS estimated_delivery_date date DEFAULT NULL;
