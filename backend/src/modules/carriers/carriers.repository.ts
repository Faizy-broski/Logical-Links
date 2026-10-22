import { supabase } from '../../services/supabase.service'
import type { ListCarriersQuery } from './carriers.schema'

const ROUTE_SELECT = 'id, province, origin_city, destination_city, cross_border, sort_order'
const DOCUMENT_SELECT = `
  id, document_type, file_path, file_name, file_size, mime_type, issue_date,
  expiry_date, verification_status, notes, uploaded_by, created_at, updated_at
`

// Routes and documents are embedded so the list page can search lanes and flag
// expiring documents without extra requests.
const SELECT = `
  id, carrier_name, status, contact_name, contact_email, contact_phone,
  contact_phone_type, website, address_line1, address_city, address_province,
  address_postcode, equipment_types, equipment_other, services_offered,
  last_contacted_at, next_follow_up_at, notes, created_by, created_at, updated_at,
  routes:carrier_routes(${ROUTE_SELECT}),
  documents:carrier_documents(${DOCUMENT_SELECT})
`

export async function findById(id: string) {
  return supabase
    .from('carriers')
    .select(SELECT)
    .eq('id', id)
    .is('deleted_at', null)
    .single()
}

export async function findAll(query: ListCarriersQuery) {
  const offset = (query.page - 1) * query.limit

  let q = supabase
    .from('carriers')
    .select(SELECT, { count: 'exact' })
    .is('deleted_at', null)
    .order('carrier_name', { ascending: true })
    .range(offset, offset + query.limit - 1)

  if (query.status) q = q.eq('status', query.status)

  if (query.search) {
    const s = query.search.replace(/[(),]/g, '').slice(0, 100)
    q = q.or(
      `carrier_name.ilike.%${s}%,contact_name.ilike.%${s}%,contact_email.ilike.%${s}%,address_city.ilike.%${s}%`,
    )
  }

  return q
}

export async function findByName(name: string, excludeId?: string) {
  let q = supabase
    .from('carriers')
    .select('id')
    .ilike('carrier_name', name)
    .is('deleted_at', null)
  if (excludeId) q = q.neq('id', excludeId)
  return q.maybeSingle()
}

export async function create(row: Record<string, unknown>) {
  return supabase.from('carriers').insert(row).select('id').single()
}

export async function updateById(id: string, updates: Record<string, unknown>) {
  return supabase
    .from('carriers')
    .update(updates)
    .eq('id', id)
    .is('deleted_at', null)
    .select('id')
    .single()
}

export async function softDeleteById(id: string) {
  return supabase
    .from('carriers')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
}

// ── Routes ────────────────────────────────────────────────────────────────────

export async function deleteRoutes(carrierId: string) {
  return supabase.from('carrier_routes').delete().eq('carrier_id', carrierId)
}

export async function insertRoutes(rows: Record<string, unknown>[]) {
  return supabase.from('carrier_routes').insert(rows)
}

// ── Documents ─────────────────────────────────────────────────────────────────

export async function findDocument(carrierId: string, documentId: string) {
  return supabase
    .from('carrier_documents')
    .select(DOCUMENT_SELECT)
    .eq('id', documentId)
    .eq('carrier_id', carrierId)
    .single()
}

export async function createDocument(row: Record<string, unknown>) {
  return supabase.from('carrier_documents').insert(row).select(DOCUMENT_SELECT).single()
}

export async function updateDocument(documentId: string, updates: Record<string, unknown>) {
  return supabase
    .from('carrier_documents')
    .update(updates)
    .eq('id', documentId)
    .select(DOCUMENT_SELECT)
    .single()
}

export async function deleteDocument(documentId: string) {
  return supabase.from('carrier_documents').delete().eq('id', documentId)
}
