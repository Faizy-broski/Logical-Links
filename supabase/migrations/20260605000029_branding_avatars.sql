-- ─────────────────────────────────────────────────────────────────────────────
-- Company branding & user avatar support
-- • Adds logo_url column to accounts (one logo per shipping company)
-- • Creates profile-avatars and company-logos storage buckets
-- • RLS policies: owners can upload/update their own images; everyone can read
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Add logo_url to accounts ─────────────────────────────────────────────────
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- 2. Storage buckets ──────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'profile-avatars',
    'profile-avatars',
    true,
    5242880,  -- 5 MB
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  ),
  (
    'company-logos',
    'company-logos',
    true,
    5242880,  -- 5 MB
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  )
ON CONFLICT (id) DO UPDATE SET
  file_size_limit    = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types,
  public             = EXCLUDED.public;

-- 3. RLS policies: profile-avatars ────────────────────────────────────────────
-- Anyone can read (bucket is public)
CREATE POLICY "profile_avatars_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'profile-avatars');

-- Authenticated user can upload into their own folder (profile-avatars/{user_id}/*)
CREATE POLICY "profile_avatars_owner_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'profile-avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Authenticated user can update/replace their own avatar
CREATE POLICY "profile_avatars_owner_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'profile-avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Authenticated user can delete their own avatar
CREATE POLICY "profile_avatars_owner_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'profile-avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 4. RLS policies: company-logos ──────────────────────────────────────────────
-- Anyone can read (bucket is public)
CREATE POLICY "company_logos_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'company-logos');

-- Company admin can upload logo for their company (company-logos/{account_id}/*)
CREATE POLICY "company_logos_admin_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'company-logos'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id           = auth.uid()
        AND profiles.company_role = 'company_admin'
        AND profiles.account_id   = ((storage.foldername(name))[1])::uuid
    )
  );

CREATE POLICY "company_logos_admin_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'company-logos'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id           = auth.uid()
        AND profiles.company_role = 'company_admin'
        AND profiles.account_id   = ((storage.foldername(name))[1])::uuid
    )
  );

CREATE POLICY "company_logos_admin_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'company-logos'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id           = auth.uid()
        AND profiles.company_role = 'company_admin'
        AND profiles.account_id   = ((storage.foldername(name))[1])::uuid
    )
  );

-- System admin can manage all company logos
CREATE POLICY "company_logos_sysadmin_all"
  ON storage.objects FOR ALL
  TO authenticated
  USING (
    bucket_id = 'company-logos'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id   = auth.uid()
        AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    bucket_id = 'company-logos'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id   = auth.uid()
        AND profiles.role = 'admin'
    )
  );
