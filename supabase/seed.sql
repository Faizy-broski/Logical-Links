-- =============================================================================
-- Seed: Development Data — Logical Links CMS
-- Run AFTER all migrations.
-- Creates: 1 admin user, 2 shipper accounts, 3 shipper users,
--          3 carriers, 4 shipments, assignments, and tracking events.
--
-- NOTE: Supabase auth users must be created first via the Supabase Dashboard
--       or via `supabase auth admin create-user`. The UUIDs below are fixed
--       so you can reference them in subsequent inserts.
--
-- Admin UUID  : 00000000-0000-0000-0000-000000000001
-- Shipper 1   : 00000000-0000-0000-0000-000000000002
-- Shipper 2   : 00000000-0000-0000-0000-000000000003
-- Shipper 3   : 00000000-0000-0000-0000-000000000004
-- =============================================================================

-- ── Helper: insert auth users (local dev only — Supabase local emulator) ──────
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at,
  raw_user_meta_data, aud, role)
VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    'admin@logicallinks.com.au',
    crypt('Admin@123456', gen_salt('bf')),
    now(), now(), now(),
    '{"full_name": "System Admin"}'::jsonb,
    'authenticated', 'authenticated'
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    'alice@fastfreight.com.au',
    crypt('Shipper@1234', gen_salt('bf')),
    now(), now(), now(),
    '{"full_name": "Alice Nguyen"}'::jsonb,
    'authenticated', 'authenticated'
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    'bob@aussielogistics.com.au',
    crypt('Shipper@1234', gen_salt('bf')),
    now(), now(), now(),
    '{"full_name": "Bob Chen"}'::jsonb,
    'authenticated', 'authenticated'
  ),
  (
    '00000000-0000-0000-0000-000000000004',
    'carol@sydneyexpress.com.au',
    crypt('Shipper@1234', gen_salt('bf')),
    now(), now(), now(),
    '{"full_name": "Carol Smith"}'::jsonb,
    'authenticated', 'authenticated'
  )
ON CONFLICT (id) DO NOTHING;

-- ── Profiles ─────────────────────────────────────────────────────────────────
-- Admin profile (no account_id — admins are platform-level)
INSERT INTO profiles (id, role, full_name, is_active)
VALUES ('00000000-0000-0000-0000-000000000001', 'admin', 'System Admin', TRUE)
ON CONFLICT (id) DO UPDATE
  SET role = 'admin', full_name = 'System Admin';

-- Shipper profiles are auto-created by the trigger, but we update roles here
UPDATE profiles SET full_name = 'Alice Nguyen'  WHERE id = '00000000-0000-0000-0000-000000000002';
UPDATE profiles SET full_name = 'Bob Chen'       WHERE id = '00000000-0000-0000-0000-000000000003';
UPDATE profiles SET full_name = 'Carol Smith'    WHERE id = '00000000-0000-0000-0000-000000000004';

-- ── Accounts ─────────────────────────────────────────────────────────────────
INSERT INTO accounts (
  account_id, account_name, contact_name, contact_email, contact_phone,
  billing_address, billing_city, billing_state, billing_postcode,
  is_active, created_by
) VALUES
  (
    'aaaaaaaa-0000-0000-0000-000000000001',
    'Fast Freight Pty Ltd',
    'Alice Nguyen', 'alice@fastfreight.com.au', '0412 000 001',
    '100 Freight Road', 'Sydney', 'NSW', '2000',
    TRUE, '00000000-0000-0000-0000-000000000001'
  ),
  (
    'aaaaaaaa-0000-0000-0000-000000000002',
    'Sydney Express Logistics',
    'Carol Smith', 'carol@sydneyexpress.com.au', '0412 000 003',
    '50 Express Way', 'Melbourne', 'VIC', '3000',
    TRUE, '00000000-0000-0000-0000-000000000001'
  )
ON CONFLICT (account_id) DO NOTHING;

-- Link shipper profiles to accounts
UPDATE profiles SET account_id = 'aaaaaaaa-0000-0000-0000-000000000001'
  WHERE id IN ('00000000-0000-0000-0000-000000000002');

UPDATE profiles SET account_id = 'aaaaaaaa-0000-0000-0000-000000000002'
  WHERE id IN ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000004');

-- ── Carriers ─────────────────────────────────────────────────────────────────
INSERT INTO carriers (
  carrier_id, carrier_name, carrier_code,
  contact_name, email, phone,
  city, state, country,
  service_types, is_active, created_by
) VALUES
  (
    'cccccccc-0000-0000-0000-000000000001',
    'Precision Road Transport', 'PRT',
    'James Wilson', 'dispatch@prt.com.au', '02 9000 0001',
    'Sydney', 'NSW', 'Australia',
    ARRAY['freight','last_mile'], TRUE, '00000000-0000-0000-0000-000000000001'
  ),
  (
    'cccccccc-0000-0000-0000-000000000002',
    'EastCoast Freight Services', 'ECF',
    'Sarah Kim', 'ops@eastcoastfreight.com.au', '03 9000 0002',
    'Melbourne', 'VIC', 'Australia',
    ARRAY['freight'], TRUE, '00000000-0000-0000-0000-000000000001'
  ),
  (
    'cccccccc-0000-0000-0000-000000000003',
    'Metro Last Mile Pty Ltd', 'MLM',
    'Tom Nguyen', 'tom@metrolastmile.com.au', '07 9000 0003',
    'Brisbane', 'QLD', 'Australia',
    ARRAY['last_mile'], TRUE, '00000000-0000-0000-0000-000000000001'
  )
ON CONFLICT (carrier_id) DO NOTHING;

-- ── Shipments ────────────────────────────────────────────────────────────────
INSERT INTO shipments (
  shipment_id, account_id, created_by,
  shipment_type, status,
  origin_address, origin_city, origin_state, origin_postcode,
  destination_address, destination_city, destination_state, destination_postcode,
  cargo_description, weight_kg, volume_m3, pieces,
  estimated_pickup_date, estimated_delivery_date,
  reference_number
) VALUES
  (
    'ssssssss-0000-0000-0000-000000000001',
    'aaaaaaaa-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002',
    'freight', 'in_transit',
    '100 Freight Road', 'Sydney', 'NSW', '2000',
    '88 Industrial Ave', 'Melbourne', 'VIC', '3000',
    'Industrial machinery — 3 pallets', 1200.00, 6.5, 3,
    now() - INTERVAL '2 days', now() + INTERVAL '1 day',
    'FFP-2024-001'
  ),
  (
    'ssssssss-0000-0000-0000-000000000002',
    'aaaaaaaa-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002',
    'last_mile', 'pending',
    '22 Warehouse Drive', 'Parramatta', 'NSW', '2150',
    '5 Residential Street', 'Penrith', 'NSW', '2750',
    'Consumer electronics — 12 boxes', 85.00, 0.8, 12,
    now() + INTERVAL '1 day', now() + INTERVAL '2 days',
    'FFP-2024-002'
  ),
  (
    'ssssssss-0000-0000-0000-000000000003',
    'aaaaaaaa-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000004',
    'freight', 'assigned',
    '10 Port Road', 'Brisbane', 'QLD', '4000',
    '99 Factory Lane', 'Gold Coast', 'QLD', '4217',
    'Food-grade packaging materials', 450.00, 3.2, 5,
    now() + INTERVAL '3 days', now() + INTERVAL '5 days',
    'SEL-2024-011'
  ),
  (
    'ssssssss-0000-0000-0000-000000000004',
    'aaaaaaaa-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000003',
    'freight', 'delivered',
    '45 Harbour Blvd', 'Sydney', 'NSW', '2000',
    '7 Commerce Park', 'Canberra', 'ACT', '2601',
    'Office furniture — disassembled', 280.00, 4.1, 8,
    now() - INTERVAL '5 days', now() - INTERVAL '2 days',
    'SEL-2024-007'
  )
ON CONFLICT (shipment_id) DO NOTHING;

-- ── Assignments ───────────────────────────────────────────────────────────────
INSERT INTO assignments (
  assignment_id, shipment_id, carrier_id,
  driver_name, driver_phone, vehicle_plate,
  status, is_current, assigned_by
) VALUES
  (
    'aaaassss-0000-0000-0000-000000000001',
    'ssssssss-0000-0000-0000-000000000001',
    'cccccccc-0000-0000-0000-000000000001',
    'Mark Thompson', '0411 222 333', 'ABC 123',
    'active', TRUE, '00000000-0000-0000-0000-000000000001'
  ),
  (
    'aaaassss-0000-0000-0000-000000000002',
    'ssssssss-0000-0000-0000-000000000003',
    'cccccccc-0000-0000-0000-000000000002',
    'Lisa Park', '0411 444 555', 'XYZ 789',
    'pending', TRUE, '00000000-0000-0000-0000-000000000001'
  ),
  (
    'aaaassss-0000-0000-0000-000000000003',
    'ssssssss-0000-0000-0000-000000000004',
    'cccccccc-0000-0000-0000-000000000002',
    'David Brown', '0411 666 777', 'DEF 456',
    'completed', TRUE, '00000000-0000-0000-0000-000000000001'
  )
ON CONFLICT (assignment_id) DO NOTHING;

-- ── Tracking Events ───────────────────────────────────────────────────────────
INSERT INTO tracking_events (
  event_id, shipment_id, assignment_id,
  event_type, location, latitude, longitude,
  description, recorded_at, created_by
) VALUES
  (
    gen_random_uuid(),
    'ssssssss-0000-0000-0000-000000000001',
    'aaaassss-0000-0000-0000-000000000001',
    'picked_up', 'Sydney, NSW', -33.8688, 151.2093,
    'Shipment picked up from origin warehouse',
    now() - INTERVAL '2 days',
    '00000000-0000-0000-0000-000000000001'
  ),
  (
    gen_random_uuid(),
    'ssssssss-0000-0000-0000-000000000001',
    'aaaassss-0000-0000-0000-000000000001',
    'in_transit', 'Goulburn, NSW', -34.7535, 149.7178,
    'In transit — on schedule',
    now() - INTERVAL '1 day',
    '00000000-0000-0000-0000-000000000001'
  ),
  (
    gen_random_uuid(),
    'ssssssss-0000-0000-0000-000000000004',
    'aaaassss-0000-0000-0000-000000000003',
    'delivered', 'Canberra, ACT', -35.2809, 149.1300,
    'Delivered and signed by J. Miller',
    now() - INTERVAL '2 days',
    '00000000-0000-0000-0000-000000000001'
  )
ON CONFLICT DO NOTHING;

-- ── Notes ────────────────────────────────────────────────────────────────────
INSERT INTO notes (note_id, entity_type, entity_id, content, is_internal, created_by) VALUES
  (
    gen_random_uuid(),
    'shipment', 'ssssssss-0000-0000-0000-000000000001',
    'Customer requested delivery before 10am. Driver has been briefed.',
    FALSE,
    '00000000-0000-0000-0000-000000000001'
  ),
  (
    gen_random_uuid(),
    'shipment', 'ssssssss-0000-0000-0000-000000000001',
    'INTERNAL: Spot check pallet weights before load confirmation.',
    TRUE,
    '00000000-0000-0000-0000-000000000001'
  ),
  (
    gen_random_uuid(),
    'carrier', 'cccccccc-0000-0000-0000-000000000001',
    'Reliable carrier, always on time. Preferred for NSW-VIC lane.',
    TRUE,
    '00000000-0000-0000-0000-000000000001'
  )
ON CONFLICT DO NOTHING;

-- ── Notifications ─────────────────────────────────────────────────────────────
INSERT INTO notifications (user_id, type, title, body, entity_type, entity_id) VALUES
  (
    '00000000-0000-0000-0000-000000000002',
    'shipment_in_transit',
    'Your shipment is on the move',
    'Load LL-2024-00001 has been picked up and is in transit to Melbourne.',
    'shipment', 'ssssssss-0000-0000-0000-000000000001'
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    'shipment_delivered',
    'Shipment delivered',
    'Your shipment to Canberra has been successfully delivered.',
    'shipment', 'ssssssss-0000-0000-0000-000000000004'
  )
ON CONFLICT DO NOTHING;
