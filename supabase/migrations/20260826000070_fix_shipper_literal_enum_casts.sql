-- =============================================================================
-- Migration 070: Fix leftover 'shipper' literal enum casts
--
-- Migration 064 (rename_shipper_to_corporate) renamed the enum LABEL via
-- ALTER TYPE ... RENAME VALUE, and assumed every reference to the old label
-- was already bound to the enum's internal OID and would therefore keep
-- working unchanged. That's true for column DEFAULTs (resolved to an OID at
-- DDL time), but NOT true for string literals cast to the enum type inside
-- function bodies and RLS policy USING/WITH CHECK expressions — those casts
-- are re-resolved by label text (via enum_in) every time the statement runs.
-- Since the label 'shipper' no longer exists, every call now fails with:
--   invalid input value for enum user_role: "shipper"
--
-- This broke sign-up (handle_new_user() trigger on auth.users) and would
-- also break the shipper_update_own_shipment RLS policy the first time a
-- corporate customer tried to update their own pending shipment.
-- =============================================================================

-- ── Sign-up trigger: new profiles must default to 'corporate', not 'shipper' ──
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
    'corporate'::public.user_role,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.email
    )
  );

  RETURN NEW;
END;
$$;

-- ── profiles.role default — keep in sync with the renamed enum label ────────
ALTER TABLE profiles ALTER COLUMN role SET DEFAULT 'corporate';

-- ── RLS policy comparing current_user_role() to the old 'shipper' literal ───
DROP POLICY IF EXISTS shipper_update_own_shipment ON shipments;

CREATE POLICY shipper_update_own_shipment
ON shipments
FOR UPDATE
USING (
  current_user_role() = 'corporate'::user_role
  AND account_id = current_account_id()
  AND status = ANY (
    ARRAY[
      'pending'::shipment_status
    ]
  )
  AND deleted_at IS NULL
);
