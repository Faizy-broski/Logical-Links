-- =============================================================================
-- Migration 079: 'employees.reset_password' permission
-- =============================================================================
-- The Edit Employee dialog can now set a new password on a Logical Links staff
-- account directly. That's more sensitive than editing a name/phone, so it gets
-- its own permission key rather than riding on 'employees.edit'. Seeded granted
-- for VP only; CEO resolves to the full catalog automatically
-- (auth.service.resolveAdminPermissions) and the CEO column is locked in the UI.
-- =============================================================================

INSERT INTO permissions (key, category, label, sort_order) VALUES
  ('employees.reset_password', 'Employee Management', 'Reset Passwords', 8)
ON CONFLICT (key) DO NOTHING;

-- Gap-fill the matrix for every existing role (default: not granted) so no
-- (role x permission) cell is missing — same pattern as migration 053.
INSERT INTO admin_role_permissions (admin_role, permission_key, granted)
  SELECT slug, 'employees.reset_password', FALSE FROM admin_roles
ON CONFLICT (admin_role, permission_key) DO NOTHING;

-- Grant it to CEO + VP (the roles that manage staff accounts).
UPDATE admin_role_permissions
   SET granted = TRUE, updated_at = now()
 WHERE permission_key = 'employees.reset_password'
   AND admin_role IN ('ceo', 'vp');
