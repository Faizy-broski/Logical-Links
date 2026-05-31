-- =============================================================================
-- Migration 015: Grant table/sequence permissions to Supabase roles
--
-- Problem: every previous migration runs CREATE TABLE + ALTER TABLE ENABLE RLS
-- but never GRANTs DML privileges to the Supabase Postgres roles.
-- In Supabase, service_role bypasses RLS *policies* but still needs explicit
-- table-level GRANT to execute INSERT/UPDATE/DELETE through PostgREST.
-- Without these grants the backend gets: ERROR 42501 insufficient_privilege.
-- =============================================================================

-- ── Existing tables ───────────────────────────────────────────────────────────
-- service_role  → full access (backend uses this key for all operations)
-- authenticated → full access (RLS policies are the access-control layer)
-- anon          → SELECT only (public read where RLS allows it)

GRANT ALL ON ALL TABLES    IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL ROUTINES  IN SCHEMA public TO service_role;

GRANT ALL ON ALL TABLES    IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL ROUTINES  IN SCHEMA public TO authenticated;

GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- ── Future tables (any migration run after this one) ──────────────────────────
-- Without ALTER DEFAULT PRIVILEGES, tables created in later migrations would
-- again be missing grants and reproduce this exact bug.

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON TABLES TO service_role, authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON SEQUENCES TO service_role, authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT EXECUTE ON FUNCTIONS TO service_role, authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT ON TABLES TO anon;
