-- =============================================================================
-- Migration 043: Residential customers
--
-- Adds a second customer-facing role, 'residential', alongside 'shipper'.
-- Residential customers are individuals a delivery is made directly to —
-- they have no `accounts` row (account_id stays NULL, same as admins) and
-- never author shipments (only admins create shipments — see shipments
-- .routes.ts). Instead, admins can link a shipment straight to a residential
-- customer via the new shipments.customer_id column, parallel to the
-- existing account_id (shipping company) link.
-- =============================================================================

ALTER TYPE user_role ADD VALUE 'residential';
