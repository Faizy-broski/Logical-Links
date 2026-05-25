import { supabase } from '../../services/supabase.service'
import type { ListCarriersQuery } from './carriers.schema'

const TABLE = 'carriers'

// Full projection — used for both list and detail.
// Omitting internal-only fields is a future concern; expose everything for now.
const SELECT = `
  carrier_id,
  carrier_name,
  carrier_code,
  abn,
  contact_name,
  email,
  phone,
  address,
  city,
  state,
  postcode,
  country,
  mc_number,
  dot_number,
  insurance_expiry,
  service_types,
  coverage_states,
  rating,
  notes,
  is_active,
  created_by,
  created_at,
  updated_at
`

export async function findById(id: string) {
  return supabase
    .from(TABLE)
    .select(SELECT)
    .eq('carrier_id', id)
    .is('deleted_at', null)
    .single()
}

export async function findAll(query: ListCarriersQuery) {
  const offset = (query.page - 1) * query.limit

  let q = supabase
    .from(TABLE)
    .select(SELECT, { count: 'exact' })
    .is('deleted_at', null)
    .range(offset, offset + query.limit - 1)
    .order('carrier_name', { ascending: true })

  // isActive comes in as string from query params after Zod coercion
  if (query.isActive !== undefined) {
    q = q.eq('is_active', query.isActive === 'true')
  }

  // Full-text search across name, code, email — backed by trigram index on carrier_name.
  // Strip PostgREST OR-clause meta-characters before interpolation.
  if (query.search) {
    const s = query.search.replace(/[(),]/g, '').slice(0, 100)
    q = q.or(
      `carrier_name.ilike.%${s}%,` +
      `carrier_code.ilike.%${s}%,` +
      `email.ilike.%${s}%`,
    )
  }

  // Postgres array operators: @> means "contains element"
  // PostgREST exposes this as the `cs` (contains) filter.
  if (query.serviceType) {
    q = q.contains('service_types', [query.serviceType])
  }

  if (query.state) {
    q = q.contains('coverage_states', [query.state])
  }

  return q
}

export async function create(data: Record<string, unknown>) {
  return supabase.from(TABLE).insert(data).select(SELECT).single()
}

export async function updateById(id: string, updates: Record<string, unknown>) {
  return supabase
    .from(TABLE)
    .update(updates)
    .eq('carrier_id', id)
    .is('deleted_at', null)
    .select(SELECT)
    .single()
}

// Soft delete: preserve the record for historical FK references in assignments.
// Setting is_active=false removes it from operational queries.
export async function softDeleteById(id: string) {
  return supabase
    .from(TABLE)
    .update({ deleted_at: new Date().toISOString(), is_active: false })
    .eq('carrier_id', id)
    .is('deleted_at', null)
}
