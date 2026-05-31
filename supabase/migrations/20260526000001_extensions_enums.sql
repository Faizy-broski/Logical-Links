-- =============================================================================
-- Migration 001: Extensions & Enums
-- Logical Links CMS — Logistics / Shipping Platform
-- =============================================================================

-- ── Extensions ───────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;         -- trigram fuzzy search
CREATE EXTENSION IF NOT EXISTS pgcrypto;        -- crypt() / gen_salt() for seed

-- ── Roles ─────────────────────────────────────────────────────────────────────
CREATE TYPE user_role AS ENUM (
  'admin',
  'shipper'
);

-- ── Shipment ──────────────────────────────────────────────────────────────────
CREATE TYPE shipment_type AS ENUM (
  'freight',
  'last_mile'
);

CREATE TYPE shipment_status AS ENUM (
  'pending',
  'quoted',
  'confirmed',
  'assigned',
  'in_transit',
  'delivered',
  'cancelled'
);

-- ── Assignments ───────────────────────────────────────────────────────────────
CREATE TYPE assignment_status AS ENUM (
  'pending',
  'active',
  'completed',
  'cancelled'
);

-- ── Tracking ──────────────────────────────────────────────────────────────────
CREATE TYPE tracking_event_type AS ENUM (
  'picked_up',
  'in_transit',
  'out_for_delivery',
  'delivered',
  'failed_attempt',
  'exception',
  'customs_hold',
  'returned'
);

-- ── Notes ─────────────────────────────────────────────────────────────────────
CREATE TYPE note_entity_type AS ENUM (
  'shipment',
  'carrier',
  'assignment',
  'account'
);

-- ── Notifications ─────────────────────────────────────────────────────────────
CREATE TYPE notification_type AS ENUM (
  'shipment_created',
  'shipment_assigned',
  'shipment_in_transit',
  'shipment_delivered',
  'shipment_cancelled',
  'assignment_created',
  'system'
);
