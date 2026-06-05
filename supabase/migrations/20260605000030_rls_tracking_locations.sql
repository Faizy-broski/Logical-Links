-- =============================================================================
-- Migration 030: RLS for load_tracking_events and locations
--
-- Migration 028 created these tables without enabling RLS.
-- Backend uses service-role (bypasses RLS) so no backend operations are
-- affected. These policies are defence-in-depth for direct Supabase client
-- access (Supabase Studio, SDK usage, future mobile clients, etc.).
--
-- Role hierarchy:
--   admin (role = 'admin')            → full access
--   company_admin (company_role)      → company-scoped access
--   employee (company_role)           → assigned-load access
-- =============================================================================

-- ── 1. Enable RLS ─────────────────────────────────────────────────────────────

ALTER TABLE locations          ENABLE ROW LEVEL SECURITY;
ALTER TABLE load_tracking_events ENABLE ROW LEVEL SECURITY;

-- ── 2. locations ──────────────────────────────────────────────────────────────
-- Locations are reference data (cities/provinces) — all authenticated users can
-- read them. Only admins can create or modify locations.

CREATE POLICY "locations_public_read" ON locations
  FOR SELECT
  USING (true);

CREATE POLICY "locations_admin_all" ON locations
  FOR ALL
  USING (current_user_role() = 'admin');

-- ── 3. load_tracking_events ───────────────────────────────────────────────────

-- Admins: full access
CREATE POLICY "tracking_admin_all" ON load_tracking_events
  FOR ALL
  USING (current_user_role() = 'admin');

-- Company admins: see and create events for any load belonging to their company
CREATE POLICY "tracking_company_admin_select" ON load_tracking_events
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM profiles
      WHERE role         = 'shipper'
        AND company_role = 'company_admin'
    )
    AND load_id IN (
      SELECT shipment_id FROM shipments
      WHERE account_id = current_account_id()
    )
  );

CREATE POLICY "tracking_company_admin_insert" ON load_tracking_events
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM profiles
      WHERE role         = 'shipper'
        AND company_role = 'company_admin'
    )
    AND load_id IN (
      SELECT shipment_id FROM shipments
      WHERE account_id = current_account_id()
    )
    AND created_by = auth.uid()
  );

CREATE POLICY "tracking_company_admin_update" ON load_tracking_events
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT id FROM profiles
      WHERE role         = 'shipper'
        AND company_role = 'company_admin'
    )
    AND load_id IN (
      SELECT shipment_id FROM shipments
      WHERE account_id = current_account_id()
    )
  );

-- Employees: see and create events only for their assigned load
CREATE POLICY "tracking_employee_select" ON load_tracking_events
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM profiles
      WHERE role         = 'shipper'
        AND company_role = 'employee'
    )
    AND load_id IN (
      SELECT shipment_id FROM shipments
      WHERE assigned_employee_id = auth.uid()
    )
  );

CREATE POLICY "tracking_employee_insert" ON load_tracking_events
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM profiles
      WHERE role         = 'shipper'
        AND company_role = 'employee'
    )
    AND load_id IN (
      SELECT shipment_id FROM shipments
      WHERE assigned_employee_id = auth.uid()
    )
    AND created_by = auth.uid()
  );

-- Employees can only update events they personally created
CREATE POLICY "tracking_employee_update_own" ON load_tracking_events
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT id FROM profiles
      WHERE role         = 'shipper'
        AND company_role = 'employee'
    )
    AND created_by = auth.uid()
  );
