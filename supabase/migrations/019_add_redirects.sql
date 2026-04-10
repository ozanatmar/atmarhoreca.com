CREATE TABLE redirects (
  id         uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_path  text        NOT NULL UNIQUE,
  to_path    text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE redirects ENABLE ROW LEVEL SECURITY;

-- Middleware reads with anon key
CREATE POLICY "anon_select_redirects" ON redirects
  FOR SELECT TO anon USING (true);

-- Admin full access
CREATE POLICY "authenticated_all_redirects" ON redirects
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
