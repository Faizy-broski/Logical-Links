-- =============================================================================
-- Migration 016: Shipper Notes — extend note_entity_type + tighten RLS
-- =============================================================================

-- Add 'shipper' to the entity type enum so internal admin notes can be attached
-- to a shipper profile. entity_id will hold the shipper's profiles.id (UUID).
ALTER TYPE note_entity_type ADD VALUE IF NOT EXISTS 'shipper';
