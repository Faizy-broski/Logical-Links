import { supabase } from '../../services/supabase.service'

const TABLE = 'tracking_events'

const SELECT = `
  event_id,
  shipment_id,
  assignment_id,
  event_type,
  location,
  latitude,
  longitude,
  description,
  recorded_at,
  created_by,
  created_at
`

// Returns all events ordered oldest-first — gives a chronological timeline.
export async function findByShipment(shipmentId: string) {
  return supabase
    .from(TABLE)
    .select(SELECT)
    .eq('shipment_id', shipmentId)
    .order('recorded_at', { ascending: true })
}

// Returns the single most recent event for the "current location" use-case.
export async function findLatestByShipment(shipmentId: string) {
  return supabase
    .from(TABLE)
    .select(SELECT)
    .eq('shipment_id', shipmentId)
    .order('recorded_at', { ascending: false })
    .limit(1)
    .maybeSingle()
}

export async function create(data: Record<string, unknown>) {
  return supabase.from(TABLE).insert(data).select(SELECT).single()
}
