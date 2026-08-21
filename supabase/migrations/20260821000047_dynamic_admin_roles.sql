-- =============================================================================
-- Migration 047: Dynamic Admin Roles
--
-- Replaces the fixed admin_role Postgres ENUM ('ceo','vp','manager','assistant')
-- with a proper admin_roles table so the CEO can create/rename/delete custom
-- roles (Accountant, Dispatcher, etc.) from the Roles & Permissions page without
-- a code deploy. Also seeds "Driver" as a new system role.
--
-- Both profiles.admin_role and admin_role_permissions.admin_role are widened
-- from the enum to TEXT (FK'd to admin_roles.slug). This keeps the column
-- NAME unchanged, so resolveAdminPermissions() in auth.service.ts and every
-- existing repository query (which compare admin_role as a plain string)
-- keep working unmodified — only the column's underlying type changes.
-- =============================================================================

-- ── 1. admin_roles table ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_roles (
  slug        TEXT PRIMARY KEY,             -- e.g. 'ceo', 'driver', 'dispatcher'
  label       TEXT NOT NULL,                -- display label, e.g. "CEO"
  is_system   BOOLEAN NOT NULL DEFAULT FALSE, -- seeded roles — cannot be deleted
  sort_order  INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_admin_roles_updated_at
  BEFORE UPDATE ON admin_roles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

INSERT INTO admin_roles (slug, label, is_system, sort_order) VALUES
  ('ceo',       'CEO',       TRUE, 1),
  ('vp',        'VP',        TRUE, 2),
  ('manager',   'Manager',   TRUE, 3),
  ('assistant', 'Assistant', TRUE, 4),
  ('driver',    'Driver',    TRUE, 5)
ON CONFLICT (slug) DO NOTHING;

-- ── 2. Widen profiles.admin_role from enum to TEXT (FK to admin_roles) ────────
ALTER TABLE profiles
  ALTER COLUMN admin_role TYPE TEXT USING admin_role::TEXT;

ALTER TABLE profiles
  ADD CONSTRAINT profiles_admin_role_fkey
  FOREIGN KEY (admin_role) REFERENCES admin_roles (slug) ON DELETE RESTRICT;

-- ── 3. Widen admin_role_permissions.admin_role from enum to TEXT ──────────────
ALTER TABLE admin_role_permissions
  ALTER COLUMN admin_role TYPE TEXT USING admin_role::TEXT;

ALTER TABLE admin_role_permissions
  ADD CONSTRAINT admin_role_permissions_admin_role_fkey
  FOREIGN KEY (admin_role) REFERENCES admin_roles (slug) ON DELETE CASCADE;

-- ── 4. Drop the now-unused enum type ───────────────────────────────────────────
DROP TYPE IF EXISTS admin_role;

-- ── 5. Seed default grant matrix for the new "driver" role ────────────────────
-- Drivers are a dropdown-source role for delivery assignment, not an
-- admin-panel login persona — start with zero permissions granted; CEO can
-- grant specific access later from the Roles & Permissions page if needed.
INSERT INTO admin_role_permissions (admin_role, permission_key, granted)
  SELECT 'driver', key, FALSE FROM permissions
ON CONFLICT (admin_role, permission_key) DO NOTHING;

-- No RLS on admin_roles — matches permissions/admin_role_permissions (migration
-- 036), which are accessed exclusively via the backend's service-role client.
