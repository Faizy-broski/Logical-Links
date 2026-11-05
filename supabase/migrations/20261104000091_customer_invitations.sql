-- =============================================================================
-- Migration 091: customer_invitations
--
-- When an admin / CSR creates a customer on their behalf (corporate account or
-- residential customer) nothing tells the customer. This table backs the
-- "Send credentials" flow: the admin sends a secure, single-use activation link
-- by email; the customer opens it, verifies their address and chooses their own
-- password. Only a SHA-256 hash of the token is stored — the raw token exists
-- only in the email.
--
-- Invitation status shown in the admin UI is DERIVED from these rows
-- (not sent / sent / expired / activated); it is never stored, so it cannot
-- drift out of sync and it stays independent of the corporate pipeline stage.
--
-- Service-role only: RLS is enabled with no policies, so anon/authenticated
-- clients cannot read or write it.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.customer_invitations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id    UUID,           -- corporate: the account being activated
  profile_id    UUID,           -- residential: the existing customer profile
  customer_type TEXT NOT NULL CHECK (customer_type IN ('corporate', 'residential')),
  email         TEXT NOT NULL,
  token_hash    TEXT NOT NULL,
  expires_at    TIMESTAMPTZ NOT NULL,
  sent_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at   TIMESTAMPTZ,
  revoked_at    TIMESTAMPTZ,
  sent_by       UUID,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT customer_invitations_account_id_fkey
    FOREIGN KEY (account_id) REFERENCES public.accounts (account_id) ON DELETE CASCADE,
  CONSTRAINT customer_invitations_profile_id_fkey
    FOREIGN KEY (profile_id) REFERENCES public.profiles (id) ON DELETE CASCADE,
  CONSTRAINT customer_invitations_sent_by_fkey
    FOREIGN KEY (sent_by) REFERENCES public.profiles (id) ON DELETE SET NULL,
  CONSTRAINT customer_invitations_token_hash_key UNIQUE (token_hash),
  -- Exactly one target: a corporate account OR a residential profile.
  CONSTRAINT customer_invitations_one_target
    CHECK ((account_id IS NOT NULL) <> (profile_id IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS idx_customer_invitations_account
  ON public.customer_invitations (account_id, created_at DESC) WHERE account_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_customer_invitations_profile
  ON public.customer_invitations (profile_id, created_at DESC) WHERE profile_id IS NOT NULL;

-- At most one live (unused, un-revoked) invitation per target. Resending revokes
-- the previous one first, so an old link can never be used after a newer email.
CREATE UNIQUE INDEX IF NOT EXISTS uq_customer_invitations_live_account
  ON public.customer_invitations (account_id)
  WHERE account_id IS NOT NULL AND accepted_at IS NULL AND revoked_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_customer_invitations_live_profile
  ON public.customer_invitations (profile_id)
  WHERE profile_id IS NOT NULL AND accepted_at IS NULL AND revoked_at IS NULL;

ALTER TABLE public.customer_invitations ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.customer_invitations IS
  'Single-use activation links for customers created by an admin. Token stored as SHA-256 hash only. Status is derived, never stored.';
