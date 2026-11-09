import { supabase } from '../../services/supabase.service'
import { AppError } from '../../lib/errors'
import * as usersRepo from './users.repository'
import * as notificationsService from '../notifications/notifications.service'
import * as accountsService from '../accounts/accounts.service'
import * as accountsRepo from '../accounts/accounts.repository'
import { randomBytes, randomUUID } from 'crypto'
import { purgeOrAnonymiseProfile, type PurgeMode } from '../../lib/profile-purge'
import { releaseStaleEmailHolder, blockedEmailError } from '../../lib/user-lookup'
import { deriveInvitationState, getProfileInvitationStates, type InvitationState } from '../invitations/invitations.state'
import type { InvitationStateRow } from '../invitations/invitations.repository'
import type { CreateResidentialCustomerDto, UpdateProfileDto, ListUsersQuery, UpdateUserRoleDto, ApproveUserDto } from './users.schema'

// Maps a raw profiles row to the camelCase shape the frontend expects.
// Email is not stored in profiles — callers should pass it when available,
// otherwise it is omitted (undefined).
// Customers added by an admin without an email get a system-generated address
// on a reserved, undeliverable domain (the account needs *some* email) and a
// random password nobody knows — so they can never sign in. It is hidden
// everywhere: the API reports email '' and hasLogin false.
const NO_EMAIL_DOMAIN = '@no-email.invalid'
const isPlaceholderEmail = (email?: string | null) => !!email && email.endsWith(NO_EMAIL_DOMAIN)

// Invitation status for an admin-created customer. Someone who has already
// signed in obviously has a working login, whatever the invitation rows say.
function invitationFor(rows: InvitationStateRow[] | undefined, lastSignInAt?: string | null): InvitationState {
  const derived = deriveInvitationState(rows)
  if (derived.status !== 'activated' && lastSignInAt) return { ...derived, status: 'activated' }
  return derived
}

function formatProfile(row: Record<string, unknown>, rawEmail?: string, invitation?: InvitationState) {
  const email = isPlaceholderEmail(rawEmail) ? '' : rawEmail
  return {
    invitation:  invitation ?? null,
    hasLogin:    !isPlaceholderEmail(rawEmail),
    id:          row.id as string,
    email:       email ?? (row.email as string | undefined) ?? '',
    role:        row.role as string,
    companyRole: (row.company_role as string | null) ?? null,
    fullName:    (row.full_name as string | null) ?? null,
    phone:       (row.phone as string | null) ?? null,
    avatarUrl:   (row.avatar_url as string | null) ?? null,
    accountId:   (row.account_id as string | null) ?? null,
    isApproved:  (row.is_approved as boolean) ?? false,
    dateOfBirth: (row.date_of_birth as string | null) ?? null,
    createdAt:   row.created_at as string,
  }
}

export async function getProfile(id: string) {
  const { data, error } = await usersRepo.findById(id)
  if (error || !data) throw AppError.notFound('User')

  // Fetch email from auth.users (not stored in profiles)
  const { data: authUser } = await supabase.auth.admin.getUserById(id)

  const invitation = data.role === 'residential'
    ? invitationFor((await getProfileInvitationStates([id])).get(id), authUser.user?.last_sign_in_at)
    : undefined
  return formatProfile(data as Record<string, unknown>, authUser.user?.email, invitation)
}

export async function updateProfile(id: string, dto: UpdateProfileDto) {
  if (dto.dateOfBirth !== undefined) {
    assertDateOfBirthValid(dto.dateOfBirth)
  }

  // A phone-only customer (placeholder email) can be given a real email so
  // they can sign in. Real emails are never changed through this path.
  if (dto.email) {
    const { data: current } = await supabase.auth.admin.getUserById(id)
    if (!isPlaceholderEmail(current.user?.email)) {
      throw AppError.badRequest('This customer already has an email')
    }
    const { error: emailError } = await supabase.auth.admin.updateUserById(id, {
      email: dto.email,
      email_confirm: true,
    })
    if (emailError) {
      const msg = emailError.message.toLowerCase()
      if (msg.includes('already')) throw AppError.conflict('A customer with this email already exists')
      throw AppError.badRequest(emailError.message)
    }
  }

  const { data, error } = await usersRepo.updateById(id, {
    ...(dto.fullName !== undefined && { full_name: dto.fullName }),
    ...(dto.phone    !== undefined && { phone: dto.phone }),
    ...(dto.avatarUrl !== undefined && { avatar_url: dto.avatarUrl }),
    ...(dto.dateOfBirth !== undefined && { date_of_birth: dto.dateOfBirth }),
    updated_at: new Date().toISOString(),
  })
  if (error || !data) throw AppError.notFound('User')

  const { data: authUser } = await supabase.auth.admin.getUserById(id)
  return formatProfile(data as Record<string, unknown>, authUser.user?.email)
}

// ── Delete a residential customer (soft) ──────────────────────────────────────
// Used both by an admin (customers.delete) removing a dead customer off the
// dashboard and by a residential customer closing their own account. Sets
// deleted_at + is_active=false: gone from every list, login blocked, history kept.
// Bring a removed residential customer back (login re-enabled, shows in lists again).
export async function restoreUser(id: string) {
  const { data: existing, error: findErr } = await usersRepo.findDeletedById(id)
  if (findErr || !existing) throw AppError.notFound('Removed customer')
  if (existing.role !== 'residential') throw AppError.badRequest('Only residential customers can be restored here')
  if (existing.anonymised_at) throw AppError.badRequest('This customer was permanently deleted and cannot be restored')

  const { data, error } = await usersRepo.restoreById(id)
  if (error || !data) throw AppError.internal('Failed to restore customer', error)

  void notificationsService.notifyAllAdmins(
    'account_updated',
    'Customer restored',
    `${(existing.full_name as string | null) ?? 'A residential customer'} was restored.`,
    'account',
    id,
  )
  return formatProfile(data as Record<string, unknown>)
}

// Permanently delete a removed residential customer so their email can be used
// again. The auth user is deleted outright when nothing references it; if the
// customer has history (deliveries, invoices, tickets …) the database blocks
// that, so the account is anonymised instead — personal data is wiped, the
// email address is freed and the business records stay intact.
export async function purgeUser(id: string): Promise<{ mode: PurgeMode }> {
  const { data: existing, error: findErr } = await usersRepo.findDeletedById(id)
  if (findErr || !existing) throw AppError.notFound('Removed customer')
  if (existing.role !== 'residential') throw AppError.badRequest('Only residential customers can be permanently deleted here')
  if (existing.anonymised_at) throw AppError.badRequest('This customer was already permanently deleted')

  const label = (existing.full_name as string | null) ?? 'A residential customer'
  const mode = await purgeOrAnonymiseProfile(id, 'Removed customer')

  void notificationsService.notifyAllAdmins(
    'account_updated',
    'Customer permanently deleted',
    mode === 'deleted' ? `${label} was permanently deleted.` : `${label} was permanently deleted (personal data removed).`,
    'account',
    id,
  )
  return { mode }
}

export async function deleteUser(id: string) {
  const { data: existing, error: findErr } = await usersRepo.findById(id)
  if (findErr || !existing) throw AppError.notFound('User')

  const { error } = await usersRepo.softDeleteById(id)
  if (error) throw AppError.internal('Failed to delete user', error)

  void notificationsService.notifyAllAdmins(
    'account_updated',
    'Customer removed',
    `${(existing.full_name as string | null) ?? 'A residential customer'} was removed from the dashboard.`,
    'account',
    id,
  )
}

// Deliberately NOT locked after first save — a customer who fat-fingers
// their birthday needs to be able to fix it. The Rewards birthday bonus
// this field drives is guarded on the EARN side instead (rewards-credit.
// service.ts enforces a rolling 365-day cooldown per profile, independent
// of what date_of_birth says), so freely editable here can't be used to
// farm the bonus — changing your birthday only moves *when* in the year
// you're next eligible, never *how often*.
// Still worth rejecting obviously-fake values, unrelated to that gate.
function assertDateOfBirthValid(next: string): void {
  const dob = new Date(`${next}T00:00:00.000Z`)
  const now = new Date()
  if (dob.getTime() > now.getTime()) {
    throw AppError.badRequest('Date of birth cannot be in the future')
  }
  const age = (now.getTime() - dob.getTime()) / (365.25 * 86_400_000)
  if (age > 120) {
    throw AppError.badRequest('Date of birth is not valid')
  }
}

export async function listUsers(query: ListUsersQuery) {
  const { data, count, error } = await usersRepo.findAll(query)
  if (error) throw AppError.internal('Failed to list users', error)

  const rows = (data ?? []) as Record<string, unknown>[]

  // Per-row email lookup (same pattern as company-users/admin-employees list
  // endpoints) — avoids listUsers()'s hard 1000-user cap, which silently
  // dropped emails for any tenant with more than 1000 auth users.
  const emailMap: Record<string, string> = {}
  const lastSignInMap: Record<string, string | null> = {}
  await Promise.all(
    rows.map(async (row) => {
      const { data: authUser } = await supabase.auth.admin.getUserById(row.id as string)
      if (authUser.user?.email) emailMap[row.id as string] = authUser.user.email
      lastSignInMap[row.id as string] = authUser.user?.last_sign_in_at ?? null
    }),
  )

  const invitationRows = await getProfileInvitationStates(
    rows.filter((r) => r.role === 'residential').map((r) => r.id as string),
  )

  const users = rows.map((row) =>
    formatProfile(
      row,
      emailMap[row.id as string],
      row.role === 'residential'
        ? invitationFor(invitationRows.get(row.id as string), lastSignInMap[row.id as string])
        : undefined,
    ),
  )

  return { users, total: count ?? 0 }
}

export async function updateUserRole(id: string, dto: UpdateUserRoleDto, changedBy?: string) {
  // Clear the role-specific sub-fields on every flip. Without this, an admin
  // demoted to corporate and later re-promoted to admin would silently regain
  // their old admin_role (e.g. 'ceo') and its permissions without anyone
  // explicitly re-granting them — a stale-privilege reinstatement bug.
  const updates: Record<string, unknown> = { role: dto.role }
  if (dto.role === 'corporate') {
    updates.admin_role = null
  } else if (dto.role === 'admin') {
    updates.admin_role = null
    updates.company_role = null
  }

  const { data, error } = await usersRepo.updateById(id, updates)
  if (error || !data) throw AppError.notFound('User')

  if (id !== changedBy) {
    void notificationsService
      .createNotification({
        userId:     id,
        type:       'user_role_updated',
        title:      'Your role was changed',
        body:       `Your account role was changed to "${dto.role}".`,
        entityType: 'account',
        entityId:   id,
      })
      .catch(() => undefined)
  }
  void notificationsService.notifyAllAdmins('user_role_updated', 'User role changed', `A user's role was changed to "${dto.role}".`, 'account', id, changedBy)

  const { data: authUser } = await supabase.auth.admin.getUserById(id)
  return formatProfile(data as Record<string, unknown>, authUser.user?.email)
}

// ── Avatar storage (signed-URL flow) ─────────────────────────────────────────
// The frontend uses a custom JWT (not Supabase Auth), so auth.uid() is always
// NULL when the browser client calls storage directly — causing RLS violations.
// We fix this by having the backend (service-role) generate a signed upload URL
// that the frontend can use without a Supabase Auth session.

export async function getAvatarUploadUrl(userId: string) {
  const path = `${userId}/avatar.webp`
  const { data, error } = await supabase.storage
    .from('profile-avatars')
    .createSignedUploadUrl(path)
  if (error || !data) throw AppError.internal('Failed to generate avatar upload URL', error)

  const { data: pub } = supabase.storage.from('profile-avatars').getPublicUrl(path)
  return {
    signedUrl: data.signedUrl,
    token:     data.token,
    path:      data.path,
    publicUrl: pub.publicUrl,
  }
}

export async function removeAvatar(userId: string) {
  await supabase.storage.from('profile-avatars').remove([`${userId}/avatar.webp`])
  const { error } = await usersRepo.updateById(userId, {
    avatar_url: null,
    updated_at: new Date().toISOString(),
  })
  if (error) throw AppError.internal('Failed to clear avatar', error)
}

export async function approveUser(id: string, dto: ApproveUserDto, adminId?: string) {
  const { data, error } = await usersRepo.updateById(id, { is_approved: dto.isApproved })
  if (error || !data) throw AppError.notFound('User')

  const accountId = (data as Record<string, unknown>).account_id as string | null

  // Mirror the review outcome onto the account + lifecycle feed so the
  // corporate customer profile pages can show "Reviewed / Reviewed By" and an
  // "approved" / revocation entry in the activity history.
  if (accountId) {
    void accountsRepo
      .lifecycleUpdate(accountId, {
        reviewed_at: new Date().toISOString(),
        ...(adminId ? { reviewed_by: adminId } : {}),
      })
      .catch(() => undefined)
    void accountsService.logAccountActivity({
      accountId,
      eventType:   dto.isApproved ? 'approved' : 'reviewed',
      description:  dto.isApproved ? 'Account approved' : 'Approval revoked',
      actorId:     adminId ?? null,
    })
  }

  if (dto.isApproved) {
    void notificationsService
      .createNotification({
        userId:     id,
        type:       'system',
        title:      'Account approved',
        body:       'Your corporate account has been approved. You now have full access.',
        entityType: 'account',
        entityId:   id,
      })
      .catch(() => undefined)
  }

  const { data: authUser } = await supabase.auth.admin.getUserById(id)
  return formatProfile(data as Record<string, unknown>, authUser.user?.email)
}

// ── Admin: add a residential customer (phone bookings, no email needed) ──────
export async function createResidentialCustomer(dto: CreateResidentialCustomerDto) {
  const email = dto.email?.trim() ? dto.email.trim() : `phone-${randomUUID()}${NO_EMAIL_DOMAIN}`

  // A deleted / deactivated holder of this email must not block a new customer.
  if (dto.email?.trim()) {
    const holder = await releaseStaleEmailHolder(email)
    if (holder.status === 'blocked') throw blockedEmailError(email, holder.role)
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: randomBytes(32).toString('hex'),
    email_confirm: true,
    user_metadata: { full_name: dto.fullName },
  })
  if (error || !data.user) {
    const msg = (error?.message ?? '').toLowerCase()
    if (msg.includes('already')) throw AppError.conflict('A customer with this email already exists')
    throw AppError.badRequest(error?.message ?? 'Failed to create customer')
  }

  const userId = data.user.id
  const { data: profile, error: profileError } = await usersRepo.updateById(userId, {
    role:             'residential',
    full_name:        dto.fullName,
    phone:            dto.phone,
    signup_completed: true,
    updated_at:       new Date().toISOString(),
  })
  if (profileError || !profile) {
    await supabase.auth.admin.deleteUser(userId).catch(() => undefined)
    throw AppError.internal('Failed to create customer', profileError)
  }

  return formatProfile(profile as Record<string, unknown>, email)
}
