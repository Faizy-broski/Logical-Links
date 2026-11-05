-- =============================================================================
-- Migration 090: find_user_by_email(text)
--
-- Lets the backend tell WHY an email cannot be registered. Supabase Auth only
-- says "already registered"; when the old account was deactivated / removed
-- (profiles.is_active = false or deleted_at set) the customer deserves a
-- different message than "an account already exists", and an admin needs the
-- same lookup to restore or permanently delete that account.
--
-- Service-role only — never exposed to anon/authenticated clients.
-- =============================================================================

-- Set when a removed residential customer is permanently deleted but their
-- records must be kept: personal data is wiped and the email address freed.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS anonymised_at TIMESTAMPTZ;

CREATE OR REPLACE FUNCTION public.find_user_by_email(p_email TEXT)
RETURNS TABLE (
  user_id    UUID,
  role       TEXT,
  is_active  BOOLEAN,
  deleted_at TIMESTAMPTZ,
  account_id UUID
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT u.id,
         p.role::text,
         COALESCE(p.is_active, TRUE),
         p.deleted_at,
         p.account_id
    FROM auth.users u
    LEFT JOIN public.profiles p ON p.id = u.id
   WHERE lower(u.email) = lower(btrim(p_email))
   LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.find_user_by_email(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.find_user_by_email(TEXT) TO service_role;

COMMENT ON FUNCTION public.find_user_by_email(TEXT) IS
  'Returns the auth user id plus profile state (role, is_active, deleted_at, '
  'account_id) for an email, or no row. Service-role only.';
