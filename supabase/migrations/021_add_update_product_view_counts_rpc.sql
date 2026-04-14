-- RPC called by Make.com to aggregate product_views and update products.views
-- Make.com scenario: "Daily update view counts of products in atmarhoreca.com"
CREATE OR REPLACE FUNCTION update_product_view_counts()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE products p
  SET views = v.view_count
  FROM (
    SELECT product_id, COUNT(*)::integer AS view_count
    FROM product_views
    GROUP BY product_id
  ) v
  WHERE p.id = v.product_id;
$$;

GRANT EXECUTE ON FUNCTION update_product_view_counts() TO anon;
