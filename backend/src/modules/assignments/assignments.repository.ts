import { supabase } from '../../services/supabase.service'
import type { ListAssignmentsQuery } from './assignments.schema'

// ── Field projections ─────────────────────────────────────────────────────────
const ASSIGNMENT_SELECT = `
  assignment_id,
  shipment_id,
  carrier_id,
  driver_name,
  driver_phone,
  vehicle_plate,
  trailer_number,
  pickup_date,
  status,
  is_current,
  notes,
  assigned_by,
  created_at,
  updated_at,
  carriers ( carrier_id, carrier_name, phone, email ),
  shipments ( shipment_id, load_number, status, origin_city, destination_city )
`

// History table projection — includes the actor profile name
const HISTORY_SELECT = `
  history_id,
  assignment_id,
  shipment_id,
  carrier_id,
  old_status,
  new_status,
  reason,
  changed_by,
  created_at,
  carriers ( carrier_name )
`

// ── Assignments ───────────────────────────────────────────────────────────────
export async function findById(id: string) {
  return supabase
    .from('assignments')
    .select(ASSIGNMENT_SELECT)
    .eq('assignment_id', id)
    .single()
}

export async function findCurrentByShipmentId(shipmentId: string) {
  return supabase
    .from('assignments')
    .select(ASSIGNMENT_SELECT)
    .eq('shipment_id', shipmentId)
    .eq('is_current', true)
    .maybeSingle()
}

export async function findAll(query: ListAssignmentsQuery) {
  const offset = (query.page - 1) * query.limit

  let q = supabase
    .from('assignments')
    .select(ASSIGNMENT_SELECT, { count: 'exact' })
    .range(offset, offset + query.limit - 1)
    .order('created_at', { ascending: false })

  if (query.shipmentId) q = q.eq('shipment_id', query.shipmentId)
  if (query.carrierId)  q = q.eq('carrier_id', query.carrierId)
  if (query.status)     q = q.eq('status', query.status)

  if (query.isCurrent !== undefined) {
    q = q.eq('is_current', query.isCurrent === 'true')
  }

  return q
}

export async function create(data: Record<string, unknown>) {
  return supabase
    .from('assignments')
    .insert(data)
    .select(ASSIGNMENT_SELECT)
    .single()
}

export async function updateById(id: string, updates: Record<string, unknown>) {
  return supabase
    .from('assignments')
    .update(updates)
    .eq('assignment_id', id)
    .select(ASSIGNMENT_SELECT)
    .single()
}

// ── Assignment history ────────────────────────────────────────────────────────
// Returns the full audit log for one shipment — all assignments it has had.
export async function findHistoryByShipmentId(shipmentId: string) {
  return supabase
    .from('assignment_history')
    .select(HISTORY_SELECT)
    .eq('shipment_id', shipmentId)
    .order('created_at', { ascending: false })
}

// Returns the audit log for a single assignment record.
export async function findHistoryByAssignmentId(assignmentId: string) {
  return supabase
    .from('assignment_history')
    .select(HISTORY_SELECT)
    .eq('assignment_id', assignmentId)
    .order('created_at', { ascending: false })
}
