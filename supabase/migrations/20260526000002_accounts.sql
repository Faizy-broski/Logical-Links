-- =============================================================================
-- Migration 002: Accounts
-- Accounts = shipper companies / customers of the logistics platform.
-- Each shipper user belongs to one account.
-- Admins are not tied to any account (account_id IS NULL on their profile).
-- =============================================================================

CREATE TABLE accounts (
  account_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identity
  account_name    TEXT        NOT NULL,
  account_code    TEXT        UNIQUE, -- auto-generated: ACC-YYYY-NNN
  abn             TEXT,               -- Australian Business Number

  -- Primary contact
  contact_name    TEXT,
  contact_email   TEXT,
  contact_phone   TEXT,

  -- Billing address
  billing_address TEXT,
  billing_city    TEXT,
  billing_state   TEXT,
  billing_postcode TEXT,
  billing_country TEXT        NOT NULL DEFAULT 'Australia',

  -- Commercial terms
  credit_limit    NUMERIC(12, 2) DEFAULT 0,
  payment_terms   INTEGER        DEFAULT 30, -- days net

  -- State
  is_active       BOOLEAN     NOT NULL DEFAULT TRUE,

  -- Audit
  created_by      UUID        REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at      TIMESTAMPTZ           -- soft delete
);

-- ── Auto-generate account_code: ACC-YYYY-NNN ─────────────────────────────────
CREATE SEQUENCE IF NOT EXISTS accounts_code_seq START 1;

CREATE OR REPLACE FUNCTION generate_account_code()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.account_code IS NULL THEN
    NEW.account_code :=
      'ACC-' || TO_CHAR(now(), 'YYYY') || '-' ||
      LPAD(nextval('accounts_code_seq')::TEXT, 3, '0');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_account_code
  BEFORE INSERT ON accounts
  FOR EACH ROW EXECUTE FUNCTION generate_account_code();

-- ── updated_at auto-maintain ─────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_accounts_updated_at
  BEFORE UPDATE ON accounts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
