import * as invitationsRepo from './invitations.repository'
import type { InvitationStateRow } from './invitations.repository'

// Status shown next to an admin-created customer.
//   not_sent  — account created, no invitation has been sent yet
//   sent      — invitation sent and still valid
//   expired   — invitation sent but the link has expired
//   activated — the customer has set a password and can sign in
export type InvitationStatus = 'not_sent' | 'sent' | 'expired' | 'activated'

export type InvitationState = {
  status:      InvitationStatus
  sent_at:     string | null
  expires_at:  string | null
  accepted_at: string | null
}

const NOT_SENT: InvitationState = { status: 'not_sent', sent_at: null, expires_at: null, accepted_at: null }

/** Derives the status from a target's invitation rows (newest first). Pure. */
export function deriveInvitationState(rows: InvitationStateRow[] | undefined, now = Date.now()): InvitationState {
  const accepted = rows?.find((r) => r.accepted_at)
  if (accepted) {
    return { status: 'activated', sent_at: accepted.sent_at, expires_at: accepted.expires_at, accepted_at: accepted.accepted_at }
  }
  // A revoked row was replaced by a newer one (or the send failed) — ignore it.
  const latest = rows?.find((r) => !r.revoked_at)
  if (!latest) return NOT_SENT
  const expired = new Date(latest.expires_at).getTime() <= now
  return {
    status:      expired ? 'expired' : 'sent',
    sent_at:     latest.sent_at,
    expires_at:  latest.expires_at,
    accepted_at: null,
  }
}

function groupBy(rows: InvitationStateRow[], key: 'account_id' | 'profile_id'): Map<string, InvitationStateRow[]> {
  const map = new Map<string, InvitationStateRow[]>()
  for (const r of rows) {
    const k = r[key]
    if (!k) continue
    const list = map.get(k)
    if (list) list.push(r)
    else map.set(k, [r])
  }
  return map
}

/** Adds `invitation` to each corporate account row (one query for the whole list). */
export async function attachAccountInvitations<T extends { account_id: string }>(
  rows: T[],
): Promise<Array<T & { invitation: InvitationState }>> {
  const grouped = groupBy(await invitationsRepo.findForAccounts(rows.map((r) => r.account_id)), 'account_id')
  return rows.map((r) => ({ ...r, invitation: deriveInvitationState(grouped.get(r.account_id)) }))
}

/** Invitation state for residential profiles, keyed by profile id. */
export async function getProfileInvitationStates(profileIds: string[]): Promise<Map<string, InvitationStateRow[]>> {
  return groupBy(await invitationsRepo.findForProfiles(profileIds), 'profile_id')
}
