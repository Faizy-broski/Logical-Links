-- ─── Multi-Tenant Refactor: Shipping Company → Employees ─────────────────────
-- Introduces company_role on profiles and assigned_employee_id on shipments.
-- All existing shipper accounts become company_admin automatically.

-- ── 1. company_role enum ──────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE company_role AS ENUM ('company_admin', 'employee');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── 2. Add company_role to profiles ──────────────────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS company_role company_role;

-- ── 3. Migrate all existing shippers → company_admin ─────────────────────────
UPDATE profiles
  SET company_role = 'company_admin'
  WHERE role = 'shipper';

-- ── 4. Add assigned_employee_id to shipments ─────────────────────────────────
ALTER TABLE shipments
  ADD COLUMN IF NOT EXISTS assigned_employee_id UUID
    REFERENCES profiles(id)
    ON DELETE SET NULL;

-- ── 5. Index for efficient employee lookups ───────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_shipments_assigned_employee
  ON shipments(assigned_employee_id)
  WHERE assigned_employee_id IS NOT NULL;

-- ── 6. RLS: employees can see their assigned shipments ────────────────────────
-- The backend enforces access at the service layer (service-role bypasses RLS).
-- These policies add defence-in-depth for any direct Supabase client access.

-- Drop stale shipper policies so we can replace them
DROP POLICY IF EXISTS "Shippers can view their own shipments"   ON shipments;
DROP POLICY IF EXISTS "Shippers can create shipments"           ON shipments;
DROP POLICY IF EXISTS "Shippers can update their own shipments" ON shipments;

-- Company admins: all shipments belonging to their account
CREATE POLICY "Company admins view company shipments" ON shipments
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM profiles
      WHERE role = 'shipper'
        AND company_role = 'company_admin'
        AND account_id = shipments.account_id
    )
  );

-- Employees: only shipments assigned to them
CREATE POLICY "Employees view assigned shipments" ON shipments
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM profiles
      WHERE role = 'shipper'
        AND company_role = 'employee'
    )
    AND assigned_employee_id = auth.uid()
  );

-- Company admins can insert (create) shipments for their company
CREATE POLICY "Company admins create shipments" ON shipments
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM profiles
      WHERE role = 'shipper'
        AND company_role = 'company_admin'
        AND account_id IS NOT NULL
    )
  );

-- Company members can update shipments they can see
CREATE POLICY "Company members update their shipments" ON shipments
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT id FROM profiles
      WHERE role = 'shipper'
        AND company_role = 'company_admin'
        AND account_id = shipments.account_id
    )
    OR assigned_employee_id = auth.uid()
  );
