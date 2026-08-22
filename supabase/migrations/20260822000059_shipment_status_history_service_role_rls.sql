-- =============================================================================
-- Migration 059: Missing service_role RLS policy on shipment_status_history
--
-- Same bug class as migrations 042, 056, 058: "service_role bypasses RLS"
-- does not hold in this Supabase project's configuration.
--
-- shipment_status_history (migration 004) enabled RLS with only app-role
-- policies (admin_all_ssh, shipper_read_own_ssh, residential_read_own_ssh),
-- none matching service_role. The AFTER INSERT trigger on shipments
-- (trg_shipment_status_history) writes into this table as part of the same
-- INSERT transaction — so even after migration 058 fixed shipments itself,
-- every shipment INSERT still rolled back with "new row violates row-level
-- security policy for table shipment_status_history", surfacing as
-- "Failed to create shipment" on quotation acceptance.
-- =============================================================================

CREATE POLICY "service_role_all_shipment_status_history" ON shipment_status_history
  FOR ALL TO service_role USING (true) WITH CHECK (true);
