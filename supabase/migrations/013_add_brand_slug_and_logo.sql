ALTER TABLE brands ADD COLUMN slug text UNIQUE;
ALTER TABLE brands ADD COLUMN logo_url text;
ALTER TABLE brands ADD COLUMN description text;

-- Populate slugs for existing brands
UPDATE brands SET slug = lower(regexp_replace(trim(both '-' from regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g')), '-+', '-', 'g'));
