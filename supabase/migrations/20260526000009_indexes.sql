-- =============================================================================
-- Migration 009: Indexes
--
-- Strategy:
--   1. Every FK column gets a plain B-tree index (Postgres does NOT auto-index FKs).
--   2. Admin filter/sort columns get partial or composite indexes.
--   3. GiST trigram indexes for fuzzy-search on names & load numbers.
--   4. Partial indexes on is_active / soft-delete to keep hot-path queries cheap.
-- =============================================================================

-- ── accounts ──────────────────────────────────────────────────────────────────
CREATE INDEX idx_accounts_code         ON accounts (account_code);
CREATE INDEX idx_accounts_active       ON accounts (is_active) WHERE deleted_at IS NULL;
-- Fuzzy search on account_name in admin list
CREATE INDEX idx_accounts_name_trgm    ON accounts USING GIST (account_name gist_trgm_ops);

-- ── profiles ─────────────────────────────────────────────────────────────────
CREATE INDEX idx_profiles_account      ON profiles (account_id);
CREATE INDEX idx_profiles_role         ON profiles (role);
CREATE INDEX idx_profiles_active       ON profiles (is_active) WHERE deleted_at IS NULL;
-- Auth middleware: SELECT role FROM profiles WHERE id = $1 (PK — already optimal)

-- ── shipments ────────────────────────────────────────────────────────────────
-- Most common admin query: all shipments ordered by created_at DESC
CREATE INDEX idx_shipments_created_at       ON shipments (created_at DESC)  WHERE deleted_at IS NULL;
CREATE INDEX idx_shipments_status           ON shipments (status)            WHERE deleted_at IS NULL;
-- Composite: filter by status + sort — covers the most common admin list query
CREATE INDEX idx_shipments_status_created   ON shipments (status, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_shipments_account          ON shipments (account_id)        WHERE deleted_at IS NULL;
CREATE INDEX idx_shipments_created_by       ON shipments (created_by)        WHERE deleted_at IS NULL;
CREATE INDEX idx_shipments_type             ON shipments (shipment_type)     WHERE deleted_at IS NULL;
-- Fuzzy search on load_number (ilike pattern from backend)
CREATE INDEX idx_shipments_load_trgm        ON shipments USING GIST (load_number gist_trgm_ops);
-- Date range filter for admin reporting
CREATE INDEX idx_shipments_pickup_date      ON shipments (estimated_pickup_date)   WHERE deleted_at IS NULL;
CREATE INDEX idx_shipments_delivery_date    ON shipments (estimated_delivery_date) WHERE deleted_at IS NULL;

-- ── shipment_status_history ───────────────────────────────────────────────────
CREATE INDEX idx_ssh_shipment         ON shipment_status_history (shipment_id, created_at DESC);
CREATE INDEX idx_ssh_changed_by       ON shipment_status_history (changed_by);

-- ── carriers ─────────────────────────────────────────────────────────────────
CREATE INDEX idx_carriers_active      ON carriers (is_active) WHERE deleted_at IS NULL;
-- Fuzzy search on carrier_name (ilike from backend list query)
CREATE INDEX idx_carriers_name_trgm   ON carriers USING GIST (carrier_name gist_trgm_ops);
CREATE INDEX idx_carriers_code        ON carriers (carrier_code);

-- ── assignments ───────────────────────────────────────────────────────────────
-- Backend: filter by shipment_id, carrier_id, status
CREATE INDEX idx_assignments_shipment ON assignments (shipment_id);
CREATE INDEX idx_assignments_carrier  ON assignments (carrier_id);
CREATE INDEX idx_assignments_status   ON assignments (status);
-- Fast lookup for the current live assignment per shipment
CREATE INDEX idx_assignments_current  ON assignments (shipment_id) WHERE is_current = TRUE;
CREATE INDEX idx_assignments_created  ON assignments (created_at DESC);
CREATE INDEX idx_assignments_assignee ON assignments (assigned_by);

-- ── assignment_history ────────────────────────────────────────────────────────
CREATE INDEX idx_ah_assignment        ON assignment_history (assignment_id, created_at DESC);
CREATE INDEX idx_ah_shipment          ON assignment_history (shipment_id);

-- ── tracking_events ───────────────────────────────────────────────────────────
-- Backend: .eq('shipment_id', id).order('recorded_at', DESC)
CREATE INDEX idx_te_shipment_time     ON tracking_events (shipment_id, recorded_at DESC);
CREATE INDEX idx_te_assignment        ON tracking_events (assignment_id);
CREATE INDEX idx_te_event_type        ON tracking_events (event_type);
-- Geospatial queries (lat/lng filtering) — B-tree composite is adequate at startup scale
CREATE INDEX idx_te_geo               ON tracking_events (latitude, longitude)
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- ── notes ─────────────────────────────────────────────────────────────────────
-- Backend: .eq('entity_type').eq('entity_id').order('created_at', DESC)
CREATE INDEX idx_notes_entity         ON notes (entity_type, entity_id, created_at DESC)
  WHERE deleted_at IS NULL;
CREATE INDEX idx_notes_created_by     ON notes (created_by) WHERE deleted_at IS NULL;

-- ── notifications ─────────────────────────────────────────────────────────────
-- Backend: .eq('user_id').eq('is_read', false).order('created_at', DESC)
CREATE INDEX idx_notif_user_unread    ON notifications (user_id, created_at DESC) WHERE is_read = FALSE;
CREATE INDEX idx_notif_user_all       ON notifications (user_id, created_at DESC);
CREATE INDEX idx_notif_entity         ON notifications (entity_id) WHERE entity_id IS NOT NULL;
CREATE INDEX idx_notif_expires        ON notifications (expires_at) WHERE expires_at IS NOT NULL;

-- ── refresh_tokens ────────────────────────────────────────────────────────────
-- Backend token-verification: .eq('token_hash', hash).eq('is_revoked', false)
CREATE INDEX idx_rt_user_active       ON refresh_tokens (user_id) WHERE is_revoked = FALSE;
CREATE INDEX idx_rt_expires           ON refresh_tokens (expires_at) WHERE is_revoked = FALSE;
