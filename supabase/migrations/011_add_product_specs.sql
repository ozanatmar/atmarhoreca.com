ALTER TABLE products ADD COLUMN specs jsonb NOT NULL DEFAULT '[]'::jsonb;
