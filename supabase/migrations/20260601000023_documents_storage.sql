-- =============================================================================
-- Migration 023: Supabase Storage — Documents Bucket
--
-- Bucket: documents
-- Folder structure:
--   documents/quotations/{quotation-id}.pdf
--   documents/invoices/{invoice-id}.pdf
-- =============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false,                          -- private: URLs require signed access
  10485760,                       -- 10 MB limit per file
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Admins: full access to all documents
CREATE POLICY "admin_all_documents_storage" ON storage.objects
  FOR ALL USING (
    bucket_id = 'documents'
    AND current_user_role() = 'admin'
  );

-- Shippers: read only their own documents
-- Path format: quotations/{quotation-id}.pdf or invoices/{invoice-id}.pdf
CREATE POLICY "shipper_read_own_documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'documents'
    AND current_user_role() = 'shipper'
    AND (
      -- quotations: check ownership via DB
      (
        (storage.foldername(name))[1] = 'quotations'
        AND (storage.filename(name) LIKE '%.pdf')
        AND REPLACE(storage.filename(name), '.pdf', '')::UUID IN (
          SELECT id FROM quotations
          WHERE profile_id IN (
            SELECT id FROM profiles WHERE account_id = current_account_id()
          )
          AND deleted_at IS NULL
        )
      )
      OR
      -- invoices: check ownership via DB
      (
        (storage.foldername(name))[1] = 'invoices'
        AND (storage.filename(name) LIKE '%.pdf')
        AND REPLACE(storage.filename(name), '.pdf', '')::UUID IN (
          SELECT id FROM invoices
          WHERE profile_id IN (
            SELECT id FROM profiles WHERE account_id = current_account_id()
          )
          AND deleted_at IS NULL
        )
      )
    )
  );

-- Backend service role uploads PDFs (bypasses RLS — no additional policy needed)
