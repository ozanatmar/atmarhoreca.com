ALTER TABLE brands ADD COLUMN IF NOT EXISTS minimum_order_amount numeric(10,2) DEFAULT NULL;
