-- Enable RLS on inbox tables (no policies needed — service role bypasses RLS)
ALTER TABLE inbox_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE inbox_emails ENABLE ROW LEVEL SECURITY;

-- Enable RLS on product_relations + policies
ALTER TABLE product_relations ENABLE ROW LEVEL SECURITY;

-- Public product pages read this with the anon key
CREATE POLICY "Anyone can read product relations"
  ON product_relations FOR SELECT
  USING (true);

-- Only admins can write
CREATE POLICY "Admin can insert product relations"
  ON product_relations FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin can delete product relations"
  ON product_relations FOR DELETE
  USING (public.is_admin());

-- Fix mutable search_path on SECURITY DEFINER function (higher risk)
CREATE OR REPLACE FUNCTION public.is_admin()
  RETURNS boolean
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = ''
AS $$
BEGIN
  RETURN (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin'
  );
END;
$$;

-- Fix mutable search_path on trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
