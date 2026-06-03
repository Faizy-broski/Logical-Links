-- Add created_by_role to shipments to track whether the load was created by a
-- shipper or an admin. Shipper-created loads are auto-assigned to the creator
-- and their assignment is permanently locked — no one (including admins) may
-- change the assigned shipper after creation.
--
-- NULL for rows created before this migration (treated as admin-created for
-- backward compatibility, since only admins used the create endpoint before
-- shippers were given access).

ALTER TABLE shipments
  ADD COLUMN IF NOT EXISTS created_by_role text
    CHECK (created_by_role IN ('admin', 'shipper'));
