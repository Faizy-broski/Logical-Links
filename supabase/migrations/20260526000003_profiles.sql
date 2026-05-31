-- =============================================================================
-- Migration 003: Profiles
-- Extends auth.users with role, display data, and account membership.
-- The auth middleware reads: profiles.role, profiles.full_name
-- The notes repository joins: profiles ( id, full_name )
-- =============================================================================

CREATE TABLE profiles (
  -- Mirrors auth.users.id — one-to-one
  id              UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,

  role            user_role   NOT NULL DEFAULT 'shipper',

  -- Display data
  full_name       TEXT,
  phone           TEXT,
  avatar_url      TEXT,

  -- Account membership (NULL for admin users)
  account_id      UUID        REFERENCES accounts (account_id) ON DELETE SET NULL,

  -- State
  is_active       BOOLEAN     NOT NULL DEFAULT TRUE,

  -- Audit
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at      TIMESTAMPTZ
);

-- ── Auto-create profile when a new auth user signs up ─────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    role,
    full_name
  )
  VALUES (
    NEW.id,
    'shipper'::public.user_role,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.email
    )
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── updated_at ────────────────────────────────────────────────────────────────
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
