-- =============================================================================
-- Migration 032: Company Profile & Security
-- Adds fields for the redesigned Company Profile page (Company Info, Primary
-- Contact, Billing Contact) and TOTP-based MFA on profiles.
-- =============================================================================

-- ── Accounts: company info + billing contact ─────────────────────────────────
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS website TEXT;

ALTER TABLE accounts ADD COLUMN IF NOT EXISTS address_line1  TEXT;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS address_city     TEXT;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS address_state    TEXT;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS address_postcode TEXT;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS address_country  TEXT;

ALTER TABLE accounts ADD COLUMN IF NOT EXISTS billing_email          TEXT;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS accounts_payable_email TEXT;

-- ── Profiles: TOTP MFA ────────────────────────────────────────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS mfa_secret      TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS mfa_enabled     BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS mfa_enrolled_at TIMESTAMPTZ;
