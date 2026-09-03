-- =============================================================================
-- Migration 072: purge_account_fully(uuid)
--
-- Hard-deletes a corporate account and EVERYTHING linked to it — used by:
--   * the daily pg_cron sweep (migration 073) once a rejected account is past
--     its 90-day `purge_after` deadline, and
--   * the admin "Purge now" action (POST /accounts/:id/purge).
--
-- Irreversible. Callers are expected to have already soft-rejected the account.
--
-- Deletion order is dictated by the ON DELETE RESTRICT foreign keys in the
-- schema (shipments.account_id, shipments.created_by, quotations.profile_id,
-- invoices.profile_id, assignments.shipment_id): children first, then the
-- accounts row, then the auth.users rows (which cascade the profiles and
-- anything keyed on the user such as notifications / refresh_tokens).
-- =============================================================================

CREATE OR REPLACE FUNCTION purge_account_fully(p_account_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_profile_ids  UUID[];
  v_shipment_ids UUID[];
BEGIN
  SELECT array_agg(id)          INTO v_profile_ids  FROM profiles  WHERE account_id = p_account_id;
  SELECT array_agg(shipment_id) INTO v_shipment_ids FROM shipments WHERE account_id = p_account_id;

  v_profile_ids  := COALESCE(v_profile_ids,  '{}');
  v_shipment_ids := COALESCE(v_shipment_ids, '{}');

  -- ── Invoices (profile_id RESTRICT) ────────────────────────────────────────
  DELETE FROM invoice_items
   WHERE invoice_id IN (SELECT id FROM invoices WHERE profile_id = ANY (v_profile_ids));
  DELETE FROM invoices WHERE profile_id = ANY (v_profile_ids);

  -- ── Quotations (profile_id RESTRICT; items / acceptances CASCADE) ──────────
  DELETE FROM quotations WHERE profile_id = ANY (v_profile_ids);

  -- ── Shipment tree (account_id RESTRICT; children CASCADE) ────────────────
  -- (The carrier `assignments` / `assignment_history` / `tracking_events`
  --  tables were dropped in migration 012 — nothing to clean up there.)
  IF array_length(v_shipment_ids, 1) IS NOT NULL THEN
    -- delivery_assignments / load_tracking_events / shipment_status_history all
    -- CASCADE from shipments, but delete explicitly so a future FK change
    -- can't silently block the purge.
    DELETE FROM delivery_assignments     WHERE delivery_id = ANY (v_shipment_ids);
    DELETE FROM load_tracking_events     WHERE load_id     = ANY (v_shipment_ids);
    DELETE FROM shipment_status_history  WHERE shipment_id = ANY (v_shipment_ids);
    DELETE FROM notes
      WHERE entity_type = 'shipment'
        AND entity_id = ANY (v_shipment_ids);
    DELETE FROM shipments WHERE shipment_id = ANY (v_shipment_ids);
  END IF;

  -- ── Support cases (account_id SET NULL; children CASCADE) ─────────────────
  DELETE FROM support_cases
   WHERE account_id = p_account_id
      OR created_by = ANY (v_profile_ids);

  -- ── Notes: on the account, plus anything these users authored ────────────
  -- notes.created_by is ON DELETE RESTRICT, so every note by a purged user
  -- must go before their auth.users row is removed.
  DELETE FROM notes WHERE entity_type = 'account' AND entity_id = p_account_id;
  DELETE FROM notes WHERE created_by = ANY (v_profile_ids);

  -- ── Lifecycle feed (also CASCADEs on accounts delete) ────────────────────
  DELETE FROM account_activity WHERE account_id = p_account_id;

  -- customer_credit_balances / customer_credit_ledger CASCADE from profiles.

  -- ── The account row (profiles.account_id SET NULL) ───────────────────────
  DELETE FROM accounts WHERE account_id = p_account_id;

  -- ── The users — cascades profiles, notifications, refresh_tokens, … ──────
  IF array_length(v_profile_ids, 1) IS NOT NULL THEN
    DELETE FROM auth.users WHERE id = ANY (v_profile_ids);
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION purge_account_fully(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION purge_account_fully(UUID) TO service_role;

COMMENT ON FUNCTION purge_account_fully(UUID) IS
  'Irreversibly deletes a corporate account and all linked data (shipments, '
  'quotations, invoices, support cases, notes, activity) plus its auth users. '
  'Called by the rejected-account retention sweep and the admin Purge action.';
