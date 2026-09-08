-- =============================================================================
-- Migration 078: Grant VP the employee edit/delete permissions
-- =============================================================================
-- The admin UI now exposes Edit + Delete on employee and customer profiles,
-- gated by the existing RBAC keys. CEO already resolves to the full catalog
-- (auth.service.resolveAdminPermissions). VP already holds customers.edit /
-- customers.delete (Customer Management category, migration 036) but was seeded
-- WITHOUT any Employee Management keys — so a VP could not edit or remove an
-- internal employee. Grant just the two needed here; leave the more sensitive
-- employees.manage_roles / employees.manage_permissions / employees.suspend /
-- employees.create untouched.
-- =============================================================================

INSERT INTO admin_role_permissions (admin_role, permission_key, granted)
  SELECT 'vp', key, TRUE
    FROM permissions
   WHERE key IN ('employees.edit', 'employees.delete')
ON CONFLICT (admin_role, permission_key)
  DO UPDATE SET granted = TRUE, updated_at = now();
