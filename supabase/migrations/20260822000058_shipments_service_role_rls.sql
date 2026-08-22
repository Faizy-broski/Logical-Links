-- =============================================================================
-- Migration 058: Missing service_role RLS policy on shipments
--
-- Same bug class as migrations 042 and 056: "service_role bypasses RLS" does
-- not hold in this Supabase project's configuration — a table with RLS
-- enabled and no policy matching the connecting role denies every row,
-- including to service_role, unless an explicit policy grants it.
--
-- shipments (migration 004) enabled RLS with only app-role policies keyed
-- off current_user_role() (which reads auth.uid(), always NULL for the
-- backend's service-role connection) — so every shipment INSERT from the
-- backend has been failing with "new row violates row-level security policy
-- for table shipments". This surfaced as residential customers accepting a
-- quotation successfully (quotations already had its own service_role
-- policy since migration 056) but the matching shipment/delivery failing to
-- create — leaving the quotation stuck "accepted" with no delivery.
-- =============================================================================

CREATE POLICY "service_role_all_shipments" ON shipments
  FOR ALL TO service_role USING (true) WITH CHECK (true);
