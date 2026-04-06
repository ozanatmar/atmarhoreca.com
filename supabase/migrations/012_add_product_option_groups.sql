ALTER TABLE products ADD COLUMN option_groups jsonb NOT NULL DEFAULT '[]'::jsonb;
