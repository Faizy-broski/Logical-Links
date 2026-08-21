-- =============================================================================
-- Migration 056: Missing service_role RLS policy on quotations/quotation_items
--
-- Same bug class documented and fixed in migration 042 for
-- quotation_acceptances and the support-case tables: "service_role bypasses
-- RLS" does not hold in this Supabase project's configuration — a table with
-- RLS enabled and no policy matching the connecting role denies every row,
-- including to service_role, unless an explicit policy grants it.
--
-- quotations and quotation_items (migration 020/022) enabled RLS with only
-- app-role policies keyed off current_user_role() (which reads auth.uid(),
-- always NULL for the backend's service-role connection — no per-user JWT is
-- ever forwarded to Supabase) — so every quotation INSERT from the backend
-- has been failing with "new row violates row-level security policy for
-- table quotations", surfaced while testing the new residential-quote
-- self-service flow. This is not new-feature-only: the existing admin
-- quotation-creation path goes through the exact same repo.create() insert.
-- =============================================================================

CREATE POLICY "service_role_all_quotations" ON quotations
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_quotation_items" ON quotation_items
  FOR ALL TO service_role USING (true) WITH CHECK (true);
