-- =============================================================================
-- Migration 033: Quotation Acceptance
-- Adds the accept/decline workflow: denormalized timestamps on quotations for
-- fast reads, plus a dedicated audit table recording who accepted, from where,
-- and which Terms & Conditions version they agreed to.
-- =============================================================================

ALTER TABLE quotations ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS declined_at TIMESTAMPTZ;

-- ── Quotation Acceptances (audit log) ─────────────────────────────────────────
-- One row per acceptance event. Never updated or deleted — this is a
-- compliance record, not application state (quotations.status is the
-- source of truth for "is this quotation accepted").

CREATE TABLE quotation_acceptances (
  acceptance_id  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id   UUID        NOT NULL REFERENCES quotations (id) ON DELETE CASCADE,

  -- Who accepted
  user_id        UUID        NOT NULL REFERENCES auth.users (id) ON DELETE RESTRICT,
  full_name      TEXT,
  company_name   TEXT,

  -- Where from
  ip_address     INET,
  user_agent     TEXT,

  -- What they agreed to
  terms_version  TEXT        NOT NULL,

  accepted_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE quotation_acceptances ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_quotation_acceptances_quotation_id ON quotation_acceptances (quotation_id);
