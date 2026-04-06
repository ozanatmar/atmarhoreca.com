-- Explicit product-to-product relations (e.g. a device and its spare parts).
-- Stored in canonical order (product_id < related_product_id) so each pair has
-- exactly one row regardless of which side initiated the link.
CREATE TABLE product_relations (
  product_id         uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  related_product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at         timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (product_id, related_product_id),
  CHECK (product_id < related_product_id)
);

CREATE INDEX product_relations_related_product_id_idx
  ON product_relations (related_product_id);
