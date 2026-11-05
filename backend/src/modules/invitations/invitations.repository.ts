import { supabase } from '../../services/supabase.service'

export type InvitationRow = {
  id:          string
  account_id:  string | null
  profile_id:  string | null
  customer_type: 'corporate' | 'residential'
  email:       string
  token_hash:  string
  expires_at:  string
  sent_at:     string
  accepted_at: string | null
  revoked_at:  string | null
  sent_by:     string | null
  created_at:  string
}

// Columns safe to return in lists (never the token hash).
const STATE_COLUMNS = 'id, account_id, profile_id, sent_at, expires_at, accepted_at, revoked_at, created_at'

export type InvitationStateRow = Pick<
  InvitationRow,
  'id' | 'account_id' | 'profile_id' | 'sent_at' | 'expires_at' | 'accepted_at' | 'revoked_at' | 'created_at'
>

export async function findForAccounts(accountIds: string[]): Promise<InvitationStateRow[]> {
  if (accountIds.length === 0) return []
  const { data, error } = await supabase
    .from('customer_invitations')
    .select(STATE_COLUMNS)
    .in('account_id', accountIds)
    .order('created_at', { ascending: false })
  // Table missing (migration not applied yet) must never break the customer lists.
  if (error) return []
  return (data ?? []) as InvitationStateRow[]
}

export async function findForProfiles(profileIds: string[]): Promise<InvitationStateRow[]> {
  if (profileIds.length === 0) return []
  const { data, error } = await supabase
    .from('customer_invitations')
    .select(STATE_COLUMNS)
    .in('profile_id', profileIds)
    .order('created_at', { ascending: false })
  if (error) return []
  return (data ?? []) as InvitationStateRow[]
}

type Target = { accountId: string } | { profileId: string }

export async function revokeLive(target: Target) {
  const q = supabase
    .from('customer_invitations')
    .update({ revoked_at: new Date().toISOString() })
    .is('accepted_at', null)
    .is('revoked_at', null)
  return 'accountId' in target ? q.eq('account_id', target.accountId) : q.eq('profile_id', target.profileId)
}

export async function insert(row: {
  account_id?:   string
  profile_id?:   string
  customer_type: 'corporate' | 'residential'
  email:         string
  token_hash:    string
  expires_at:    string
  sent_by:       string
}) {
  return supabase.from('customer_invitations').insert(row).select('id, sent_at, expires_at').single()
}

export async function revokeById(id: string) {
  return supabase
    .from('customer_invitations')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', id)
}

export async function findByTokenHash(tokenHash: string) {
  return supabase
    .from('customer_invitations')
    .select('*')
    .eq('token_hash', tokenHash)
    .maybeSingle()
}

// Atomically marks the invitation as used. Only one concurrent caller can win,
// which makes the link strictly single-use even on a double submit.
export async function claim(id: string) {
  return supabase
    .from('customer_invitations')
    .update({ accepted_at: new Date().toISOString() })
    .eq('id', id)
    .is('accepted_at', null)
    .is('revoked_at', null)
    .gt('expires_at', new Date().toISOString())
    .select('*')
    .maybeSingle()
}

// Undo a claim when activation failed part-way so the customer can try again.
export async function release(id: string) {
  return supabase.from('customer_invitations').update({ accepted_at: null }).eq('id', id)
}
