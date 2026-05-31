-- =============================================================================
-- Migration 014: Unique constraint on account_name (case-insensitive)
--
-- Prevents two registrations from creating duplicate company accounts.
-- Uses a functional unique index on lower(account_name) so that
-- "Acme Corp" and "acme corp" are treated as the same name.
-- =============================================================================

CREATE UNIQUE INDEX IF NOT EXISTS idx_accounts_name_unique
  ON accounts (lower(account_name))
  WHERE deleted_at IS NULL;
