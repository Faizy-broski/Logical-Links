-- =============================================================================
-- Migration 042: Missing service_role RLS policies
-- =============================================================================
-- This project has already hit this exact bug twice before (see migrations
-- 026 and 031's comments): "service_role bypasses RLS" does not reliably
-- hold in this Supabase project's configuration the way it does by default —
-- GRANT (migration 015) controls whether an operation is attempted at all,
-- but RLS policies control which rows it applies to, and a table with RLS
-- enabled and zero policies denies every row to every role, including
-- service_role, unless BYPASSRLS is actually in effect.
--
-- quotation_acceptances (migration 033) and all four support-case tables
-- (migration 034) enabled RLS and were never given the explicit service_role
-- policy that migrations 026/031 added elsewhere — so every insert from the
-- backend (accepting a quotation; creating a support case, comment,
-- attachment record, or case event) has been failing with:
--   "new row violates row-level security policy for table ..."
--
-- These tables are only ever written via the backend's service-role client
-- (never a direct client-side insert), so a single unconditional ALL policy
-- per table is correct — mirrors statuses_delete_service_role's TO
-- service_role pattern from migration 031.

CREATE POLICY "service_role_all_quotation_acceptances" ON quotation_acceptances
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_support_cases" ON support_cases
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_support_case_comments" ON support_case_comments
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_support_case_attachments" ON support_case_attachments
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_support_case_events" ON support_case_events
  FOR ALL TO service_role USING (true) WITH CHECK (true);
