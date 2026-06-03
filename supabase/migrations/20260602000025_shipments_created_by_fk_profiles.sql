-- Change shipments.created_by FK from auth.users → profiles so that
-- Supabase PostgREST can auto-join the creator's profile row in API selects.
--
-- profiles.id mirrors auth.users.id (1:1, ON DELETE CASCADE), so existing data
-- is always consistent with this FK change. No back-fill required.

ALTER TABLE shipments
  DROP CONSTRAINT IF EXISTS shipments_created_by_fkey,
  ADD CONSTRAINT fk_shipments_created_by
    FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE RESTRICT;
