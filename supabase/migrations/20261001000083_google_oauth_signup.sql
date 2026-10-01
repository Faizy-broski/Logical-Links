-- =============================================================================
-- Migration 083: Google OAuth sign-up
--
-- Google sign-in creates the auth.users row (and, via handle_new_user, the
-- profiles row) BEFORE the user has filled in the sign-up form. Those profiles
-- are stubs: no account type, phone or company details yet. signup_completed
-- marks them so the backend refuses to issue a session until the user submits
-- the full sign-up form (POST /auth/register/google).
--
-- Existing rows and every email/password user (backend register, admin-created
-- employees/customers, invites) are complete from the moment they're created.
-- =============================================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS signup_completed BOOLEAN NOT NULL DEFAULT TRUE;

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
    full_name,
    signup_completed
  )
  VALUES (
    NEW.id,
    'corporate'::public.user_role,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      NEW.email
    ),
    -- OAuth sign-ups (provider = 'google', …) still owe us the sign-up form.
    COALESCE(NEW.raw_app_meta_data->>'provider', 'email') = 'email'
  );

  RETURN NEW;
END;
$$;
