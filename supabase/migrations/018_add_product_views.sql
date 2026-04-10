-- Product views tracking for best-sellers feature

CREATE TABLE product_views (
  id         uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id uuid        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  session_id text        NOT NULL,
  visited_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX product_views_product_id_idx ON product_views(product_id);
CREATE INDEX product_views_visited_at_idx  ON product_views(visited_at);
CREATE INDEX product_views_session_product_idx ON product_views(session_id, product_id, visited_at);

ALTER TABLE product_views ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to record views
CREATE POLICY "anon_insert_product_views" ON product_views
  FOR INSERT TO anon WITH CHECK (true);

-- RPC: return top N product IDs by view count over the last N days
CREATE OR REPLACE FUNCTION get_best_seller_ids(
  limit_n  int DEFAULT 8,
  days_back int DEFAULT 30
)
RETURNS TABLE(product_id uuid, view_count bigint)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT pv.product_id, COUNT(*) AS view_count
  FROM product_views pv
  WHERE pv.visited_at > now() - (days_back || ' days')::interval
  GROUP BY pv.product_id
  ORDER BY view_count DESC
  LIMIT limit_n;
$$;
