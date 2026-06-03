-- =============================================================================
-- Migration 026: Fix storage RLS for documents bucket
--
-- Problem: the previous admin_all_documents_storage policy uses
-- current_user_role() which resolves via auth.uid(). When the backend uploads
-- PDFs using the service-role key, auth.uid() is NULL and the policy fails in
-- some Supabase configurations even though service_role is supposed to bypass
-- RLS. Adding explicit auth.role() = 'service_role' checks ensures uploads
-- always succeed regardless of Supabase internal behaviour.
-- =============================================================================

-- Drop old policies and recreate with explicit service_role coverage
DROP POLICY IF EXISTS "admin_all_documents_storage" ON storage.objects;
DROP POLICY IF EXISTS "shipper_read_own_documents"  ON storage.objects;

-- Backend (service_role): unrestricted access to the documents bucket
CREATE POLICY "service_role_all_documents_storage" ON storage.objects
  FOR ALL
  USING    (bucket_id = 'documents' AND auth.role() = 'service_role')
  WITH CHECK (bucket_id = 'documents' AND auth.role() = 'service_role');

-- Admins: full access
CREATE POLICY "admin_all_documents_storage" ON storage.objects
  FOR ALL
  USING    (bucket_id = 'documents' AND current_user_role() = 'admin')
  WITH CHECK (bucket_id = 'documents' AND current_user_role() = 'admin');

-- Shippers: read only their own documents
CREATE POLICY "shipper_read_own_documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'documents'
    AND current_user_role() = 'shipper'
    AND (
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
