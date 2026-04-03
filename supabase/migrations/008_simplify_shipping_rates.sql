-- Simplify shipping_rates: remove weight/cost columns, one row per route.
-- Shipping is now free for all EU destinations; transit_days is the only
-- per-route value we need.

-- Step 1: deduplicate — keep one row per origin+destination (lowest weight tier)
DELETE FROM shipping_rates
WHERE id NOT IN (
  SELECT DISTINCT ON (origin_country_code, destination_country_code) id
  FROM shipping_rates
  ORDER BY origin_country_code, destination_country_code, weight_kg ASC
);

-- Step 2: drop weight_kg and rate_eur columns
ALTER TABLE shipping_rates DROP COLUMN IF EXISTS weight_kg;
ALTER TABLE shipping_rates DROP COLUMN IF EXISTS rate_eur;

-- Step 3: drop the old 3-column unique constraint (auto-named by Postgres)
DO $$
DECLARE
  cname text;
BEGIN
  SELECT conname INTO cname
  FROM pg_constraint
  WHERE conrelid = 'shipping_rates'::regclass
    AND contype = 'u';
  IF cname IS NOT NULL THEN
    EXECUTE 'ALTER TABLE shipping_rates DROP CONSTRAINT ' || quote_ident(cname);
  END IF;
END $$;

-- Step 4: drop old index
DROP INDEX IF EXISTS shipping_rates_route_idx;

-- Step 5: new unique constraint and index
ALTER TABLE shipping_rates
  ADD CONSTRAINT shipping_rates_route_unique
  UNIQUE (origin_country_code, destination_country_code);

CREATE INDEX shipping_rates_route_idx
  ON shipping_rates(origin_country_code, destination_country_code);
