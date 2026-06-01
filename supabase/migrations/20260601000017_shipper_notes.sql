-- =============================================================================
-- Migration 017: Shipper Notes — extend note_entity_type + tighten RLS
-- =============================================================================

-- Tighten the shipper INSERT policy: shippers must never create notes whose
-- entity_type is 'shipper' (those are internal admin-only records).
DROP POLICY IF EXISTS "shipper_create_note" ON notes;
CREATE POLICY "shipper_create_note" ON notes
  FOR INSERT WITH CHECK (
    current_user_role() = 'shipper'
    AND created_by = auth.uid()
    AND is_internal = FALSE
    AND entity_type != 'shipper'
  );

-- Tighten the shipper UPDATE policy: shippers must never touch shipper-type notes.
DROP POLICY IF EXISTS "shipper_delete_own_note" ON notes;
CREATE POLICY "shipper_delete_own_note" ON notes
  FOR UPDATE USING (
    current_user_role() = 'shipper'
    AND created_by = auth.uid()
    AND entity_type != 'shipper'
  );
