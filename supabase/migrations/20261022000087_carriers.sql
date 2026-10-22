-- =============================================================================
-- Migration 087: Carriers
-- =============================================================================
-- Trucking companies Logical Links works with (or may work with). These are
-- independent companies, not LLC staff, so they get their own table and their
-- own "Carrier Management" permission category instead of living under
-- Employees. Managed from Admin → Carriers.
-- =============================================================================

CREATE TABLE IF NOT EXISTS carriers (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  carrier_name        TEXT        NOT NULL,
  -- prospect: may work with · active: approved and in use ·
  -- inactive: not currently used · do_not_use: blocked
  status              TEXT        NOT NULL DEFAULT 'prospect'
                      CHECK (status IN ('prospect', 'active', 'inactive', 'do_not_use')),
  contact_name        TEXT,
  contact_email       TEXT,
  contact_phone       TEXT,
  contact_phone_type  TEXT,
  website             TEXT,
  address_line1       TEXT,
  address_city        TEXT,
  address_province    TEXT,
  address_postcode    TEXT,
  -- Canadian carrier credentials: National Safety Code + Ontario CVOR
  nsc_number          TEXT,
  cvor_number         TEXT,
  insurance_expiry    DATE,
  equipment_types     TEXT[]      NOT NULL DEFAULT '{}',
  service_area        TEXT,
  notes               TEXT,
  created_by          UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at          TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_carriers_status ON carriers (status) WHERE deleted_at IS NULL;

CREATE TRIGGER trg_carriers_updated_at
  BEFORE UPDATE ON carriers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Backend-only access via the service role, same as every other table.
ALTER TABLE carriers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all_carriers" ON carriers FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ── Permissions ───────────────────────────────────────────────────────────────
INSERT INTO permissions (key, category, label, sort_order) VALUES
  ('carriers.view',   'Carrier Management', 'View Carriers',   1),
  ('carriers.create', 'Carrier Management', 'Add Carriers',    2),
  ('carriers.edit',   'Carrier Management', 'Edit Carriers',   3),
  ('carriers.delete', 'Carrier Management', 'Delete Carriers', 4)
ON CONFLICT (key) DO NOTHING;

-- Gap-fill the matrix for every existing role (default: not granted) so no
-- (role x permission) cell is missing — same pattern as migrations 053 / 079.
INSERT INTO admin_role_permissions (admin_role, permission_key, granted)
  SELECT r.slug, p.key, FALSE
    FROM admin_roles r
   CROSS JOIN (VALUES ('carriers.view'), ('carriers.create'), ('carriers.edit'), ('carriers.delete')) AS p(key)
ON CONFLICT (admin_role, permission_key) DO NOTHING;

-- VP and Manager get full carrier management; CEO resolves to the full catalog
-- automatically (auth.service.resolveAdminPermissions). Other roles can be
-- granted access from Roles & Permissions.
UPDATE admin_role_permissions
   SET granted = TRUE, updated_at = now()
 WHERE permission_key IN ('carriers.view', 'carriers.create', 'carriers.edit', 'carriers.delete')
   AND admin_role IN ('ceo', 'vp', 'manager');
