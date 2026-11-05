import { supabase } from '../../services/supabase.service'
import type { ListUsersQuery } from './users.schema'

export async function findById(id: string) {
  return supabase.from('profiles').select('*').eq('id', id).is('deleted_at', null).single()
}

export async function findAll(query: ListUsersQuery) {
  let q = supabase
    .from('profiles')
    .select('*', { count: 'exact' })
    .range((query.page - 1) * query.limit, query.page * query.limit - 1)
    .order('created_at', { ascending: false })

  // Removed customers only show in the "Deleted" view; permanently deleted
  // (anonymised) ones never come back.
  q = query.deleted === 'true'
    ? q.not('deleted_at', 'is', null).is('anonymised_at', null)
    : q.is('deleted_at', null)

  if (query.role)   q = q.eq('role', query.role)

  if (query.search) {
    const s = query.search.replace(/[(),]/g, '').slice(0, 100)
    q = q.or(`full_name.ilike.%${s}%`)
  }

  return q
}

export async function updateById(id: string, updates: Record<string, unknown>) {
  return supabase.from('profiles').update(updates).eq('id', id).select().single()
}

export async function findDeletedById(id: string) {
  return supabase.from('profiles').select('*').eq('id', id).not('deleted_at', 'is', null).maybeSingle()
}

export async function restoreById(id: string) {
  return supabase
    .from('profiles')
    .update({ deleted_at: null, is_active: true })
    .eq('id', id)
    .select()
    .single()
}

// Soft delete — drops the profile out of every list (findById/findAll filter
// deleted_at IS NULL) and `is_active: false` blocks login/refresh (auth.service).
export async function softDeleteById(id: string) {
  return supabase
    .from('profiles')
    .update({ deleted_at: new Date().toISOString(), is_active: false })
    .eq('id', id)
}
