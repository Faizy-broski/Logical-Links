-- =============================================================================
-- Migration 060: Missing service_role RLS policy — remaining tables
--
-- Same bug class as migrations 042, 056, 058, 059, fixed reactively one
-- table at a time as each was exercised and broke in production. Auditing
-- every RLS-enabled table in this project (grep for "ENABLE ROW LEVEL
-- SECURITY" vs. tables with a "TO service_role" policy) shows this was
-- never a per-table bug — it's every table whose only policies are keyed
-- off current_user_role() / auth.uid() (both NULL for the backend's
-- service-role connection, which forwards no per-user JWT). "service_role
-- bypasses RLS" does not hold in this Supabase project's configuration —
-- closing the gap for every remaining table here instead of waiting for the
-- next one to surface as a production incident.
--
-- statuses already has a service_role policy but DELETE-only
-- (statuses_delete_service_role, migration 031) — service_role couldn't
-- previously SELECT/INSERT/UPDATE it either; FOR ALL below supersedes that
-- gap (multiple permissive policies on the same table are simply OR'd).
--
-- carriers, assignments, assignment_history, and tracking_events were
-- created in migrations 004/010 but dropped again in migration 012
-- (remove_carriers_drop_quoted_add_approval) — they don't exist in the
-- live schema, so no policy is needed (or possible) for them.
-- =============================================================================

CREATE POLICY "service_role_all_accounts"             ON accounts             FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_invoice_items"         ON invoice_items        FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_invoices"              ON invoices             FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_load_tracking_events"  ON load_tracking_events FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_locations"             ON locations            FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_notes"                 ON notes                FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_notifications"         ON notifications        FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_profiles"              ON profiles             FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_refresh_tokens"        ON refresh_tokens       FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_statuses"              ON statuses             FOR ALL TO service_role USING (true) WITH CHECK (true);
