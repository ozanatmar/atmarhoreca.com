CREATE TABLE IF NOT EXISTS settings (
  key text PRIMARY KEY,
  value text NOT NULL
);

INSERT INTO settings (key, value) VALUES ('scrape_frequency', 'weekly')
ON CONFLICT (key) DO NOTHING;
