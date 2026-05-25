-- =============================================================================
-- Migration 007: Tracking Events
--
-- Table name: tracking_events  (matches backend repository exactly)
-- Backend inserts: shipment_id, event_type, location, latitude, longitude,
--                  description, recorded_at, created_by
-- Backend selects: * (all columns)
-- This table is append-only. No updates, no soft-deletes.
-- =============================================================================

CREATE TABLE tracking_events (
  event_id        UUID               PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  shipment_id     UUID               NOT NULL REFERENCES shipments   (shipment_id) ON DELETE CASCADE,
  assignment_id   UUID               REFERENCES assignments (assignment_id) ON DELETE SET NULL,

  -- Event data — names match backend exactly
  event_type      tracking_event_type NOT NULL,
  location        TEXT,
  latitude        NUMERIC(10, 7)      CHECK (latitude  BETWEEN -90  AND 90),
  longitude       NUMERIC(10, 7)      CHECK (longitude BETWEEN -180 AND 180),
  description     TEXT,

  -- When the physical event happened (may differ from DB insert time)
  recorded_at     TIMESTAMPTZ        NOT NULL DEFAULT now(),

  -- Audit — names match backend
  created_by      UUID               NOT NULL REFERENCES auth.users (id) ON DELETE RESTRICT,
  created_at      TIMESTAMPTZ        NOT NULL DEFAULT now()

  -- Intentionally no updated_at or deleted_at: tracking events are immutable.
);

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE tracking_events ENABLE ROW LEVEL SECURITY;
