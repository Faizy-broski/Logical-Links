-- =============================================================================
-- Migration 081: Corporate customer follow-up tracking (CRM)
-- =============================================================================
-- Replaces the "Company Admin" column on the Corporate Customers list with
-- sales-ownership fields: who last spoke to the company, when to follow up
-- next, and which internal employee owns the relationship.
-- =============================================================================

ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS last_contacted_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS next_follow_up_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS assigned_employee_id UUID
    CONSTRAINT accounts_assigned_employee_id_fkey
    REFERENCES profiles(id)
    ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_accounts_assigned_employee
  ON accounts (assigned_employee_id)
  WHERE assigned_employee_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_accounts_next_follow_up
  ON accounts (next_follow_up_at)
  WHERE next_follow_up_at IS NOT NULL AND deleted_at IS NULL;
