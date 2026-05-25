-- =============================================================================
-- Migration 010: Row-Level Security Policies
--
-- Design principles:
--   • admin role sees everything (service-role key bypasses RLS in the backend,
--     but these policies protect any direct Supabase client / Studio access).
--   • shipper role sees only data belonging to their own account / user_id.
--   • Immutable audit logs (status_history, assignment_history, tracking_events)
--     are readable by the owning parties but never writable through RLS clients.
--   • Backend uses the service-role key — RLS is a defence-in-depth layer.
--
-- Helper: current user's role from profiles
-- =============================================================================

-- Reusable helper to avoid scanning profiles on every policy check
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS user_role LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$;

-- Reusable helper: current user's account_id
CREATE OR REPLACE FUNCTION current_account_id()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT account_id FROM profiles WHERE id = auth.uid()
$$;

-- ── accounts ──────────────────────────────────────────────────────────────────
-- Admins: full access to all non-deleted accounts
CREATE POLICY "admin_all_accounts" ON accounts
  FOR ALL USING (
    current_user_role() = 'admin'
    AND deleted_at IS NULL
  );

-- Shippers: read their own account only
CREATE POLICY "shipper_read_own_account" ON accounts
  FOR SELECT USING (
    current_user_role() = 'shipper'
    AND account_id = current_account_id()
    AND deleted_at IS NULL
  );

-- ── profiles ──────────────────────────────────────────────────────────────────
CREATE POLICY "admin_all_profiles" ON profiles
  FOR ALL USING (current_user_role() = 'admin');

-- Shippers can read their own profile and all profiles in their account
CREATE POLICY "shipper_read_own_profile" ON profiles
  FOR SELECT USING (
    id = auth.uid()
    OR (
      current_user_role() = 'shipper'
      AND account_id = current_account_id()
    )
  );

-- Shippers can update only their own profile
CREATE POLICY "shipper_update_own_profile" ON profiles
  FOR UPDATE USING (id = auth.uid());

-- ── shipments ─────────────────────────────────────────────────────────────────
CREATE POLICY "admin_all_shipments" ON shipments
  FOR ALL USING (current_user_role() = 'admin');

-- Shippers see only shipments belonging to their account
CREATE POLICY "shipper_own_account_shipments" ON shipments
  FOR SELECT USING (
    current_user_role() = 'shipper'
    AND account_id = current_account_id()
    AND deleted_at IS NULL
  );

CREATE POLICY "shipper_create_shipment" ON shipments
  FOR INSERT WITH CHECK (
    current_user_role() = 'shipper'
    AND created_by = auth.uid()
  );

CREATE POLICY "shipper_update_own_shipment" ON shipments
  FOR UPDATE USING (
    current_user_role() = 'shipper'
    AND account_id = current_account_id()
    -- Shippers can only edit draft/pending/quoted shipments
    AND status IN ('pending', 'quoted')
    AND deleted_at IS NULL
  );

-- ── shipment_status_history ───────────────────────────────────────────────────
CREATE POLICY "admin_all_ssh" ON shipment_status_history
  FOR ALL USING (current_user_role() = 'admin');

CREATE POLICY "shipper_read_own_ssh" ON shipment_status_history
  FOR SELECT USING (
    current_user_role() = 'shipper'
    AND shipment_id IN (
      SELECT shipment_id FROM shipments
      WHERE  account_id = current_account_id()
    )
  );

-- ── carriers ─────────────────────────────────────────────────────────────────
CREATE POLICY "admin_all_carriers" ON carriers
  FOR ALL USING (current_user_role() = 'admin');

-- Shippers can read active carriers (they need to view who is delivering their load)
CREATE POLICY "shipper_read_active_carriers" ON carriers
  FOR SELECT USING (
    current_user_role() = 'shipper'
    AND is_active = TRUE
    AND deleted_at IS NULL
  );

-- ── assignments ───────────────────────────────────────────────────────────────
CREATE POLICY "admin_all_assignments" ON assignments
  FOR ALL USING (current_user_role() = 'admin');

CREATE POLICY "shipper_read_own_assignments" ON assignments
  FOR SELECT USING (
    current_user_role() = 'shipper'
    AND shipment_id IN (
      SELECT shipment_id FROM shipments
      WHERE  account_id = current_account_id()
    )
  );

-- ── assignment_history ────────────────────────────────────────────────────────
CREATE POLICY "admin_all_ah" ON assignment_history
  FOR ALL USING (current_user_role() = 'admin');

CREATE POLICY "shipper_read_own_ah" ON assignment_history
  FOR SELECT USING (
    current_user_role() = 'shipper'
    AND shipment_id IN (
      SELECT shipment_id FROM shipments
      WHERE  account_id = current_account_id()
    )
  );

-- ── tracking_events ───────────────────────────────────────────────────────────
CREATE POLICY "admin_all_tracking" ON tracking_events
  FOR ALL USING (current_user_role() = 'admin');

CREATE POLICY "shipper_read_own_tracking" ON tracking_events
  FOR SELECT USING (
    current_user_role() = 'shipper'
    AND shipment_id IN (
      SELECT shipment_id FROM shipments
      WHERE  account_id = current_account_id()
    )
  );

-- ── notes ─────────────────────────────────────────────────────────────────────
CREATE POLICY "admin_all_notes" ON notes
  FOR ALL USING (current_user_role() = 'admin');

-- Shippers see non-internal notes on their own shipments/assignments
CREATE POLICY "shipper_read_public_notes" ON notes
  FOR SELECT USING (
    current_user_role() = 'shipper'
    AND is_internal = FALSE
    AND deleted_at IS NULL
    AND (
      (entity_type = 'shipment' AND entity_id IN (
        SELECT shipment_id FROM shipments WHERE account_id = current_account_id()
      ))
      OR
      (entity_type = 'assignment' AND entity_id IN (
        SELECT assignment_id FROM assignments
        WHERE shipment_id IN (
          SELECT shipment_id FROM shipments WHERE account_id = current_account_id()
        )
      ))
      OR
      (entity_type = 'account' AND entity_id = current_account_id())
    )
  );

-- Shippers can create notes on their own entities
CREATE POLICY "shipper_create_note" ON notes
  FOR INSERT WITH CHECK (
    current_user_role() = 'shipper'
    AND created_by = auth.uid()
    AND is_internal = FALSE
  );

-- Shippers can soft-delete their own notes
CREATE POLICY "shipper_delete_own_note" ON notes
  FOR UPDATE USING (
    current_user_role() = 'shipper'
    AND created_by = auth.uid()
  );

-- ── notifications ─────────────────────────────────────────────────────────────
CREATE POLICY "admin_all_notifications" ON notifications
  FOR ALL USING (current_user_role() = 'admin');

-- Users see only their own notifications
CREATE POLICY "user_own_notifications" ON notifications
  FOR ALL USING (user_id = auth.uid());

-- ── refresh_tokens ────────────────────────────────────────────────────────────
CREATE POLICY "admin_all_tokens" ON refresh_tokens
  FOR ALL USING (current_user_role() = 'admin');

-- Users manage only their own tokens
CREATE POLICY "user_own_tokens" ON refresh_tokens
  FOR ALL USING (user_id = auth.uid());
