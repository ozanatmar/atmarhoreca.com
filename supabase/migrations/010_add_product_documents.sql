-- Product documents (PDFs, spec sheets, etc.)
CREATE TABLE product_documents (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name        text NOT NULL,
  file_path   text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX product_documents_product_id_idx ON product_documents(product_id);

ALTER TABLE product_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "product_documents_public_read" ON product_documents
  FOR SELECT USING (true);

CREATE POLICY "product_documents_admin_all" ON product_documents
  FOR ALL USING (is_admin());

-- Storage policies for product-documents bucket
CREATE POLICY "product_documents_storage_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-documents');

CREATE POLICY "product_documents_storage_admin_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'product-documents' AND is_admin());

CREATE POLICY "product_documents_storage_admin_delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'product-documents' AND is_admin());
