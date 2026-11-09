import { createHash, randomBytes } from 'crypto'
import { supabase } from '../../services/supabase.service'
import { AppError } from '../../lib/errors'
import { logger } from '../../lib/logger'
import { env } from '../../lib/env'
import { releaseStaleEmailHolder, blockedEmailError } from '../../lib/user-lookup'
import { sendEmail, isEmailConfigured } from '../../services/email/email.service'
import { customerInvitationEmail } from '../../services/email/templates/account.templates'
import * as notificationsService from '../notifications/notifications.service'
import * as accountsService from '../accounts/accounts.service'
import type { CorporatePipelineStatus } from '../accounts/accounts.schema'
import * as invitationsRepo from './invitations.repository'
import { deriveInvitationState, getProfileInvitationStates, type InvitationState } from './invitations.state'

// How long an activation link stays valid.
export const INVITATION_TTL_DAYS = 7

const NO_EMAIL_DOMAIN = '@no-email.invalid'
const BLOCKED_PIPELINE_STATUSES = ['inactive', 'lost']

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex')

function activationUrl(token: string): string {
  return `${env.FRONTEND_URL.replace(/\/+$/, '')}/activate?token=${encodeURIComponent(token)}`
}

function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!local || !domain) return email
  const visible = local.length <= 2 ? local[0] ?? '' : local.slice(0, 2)
  return `${visible}${'*'.repeat(Math.max(2, local.length - visible.length))}@${domain}`
}

const invitationError = (status: number, code: string, message: string) => new AppError(status, message, code)

// Creates the invitation row, then emails it. If the email cannot be sent the
// row is revoked again, so the status honestly stays "Invitation Not Sent".
async function issueAndSend(opts: {
  target:       { accountId: string } | { profileId: string }
  customerType: 'corporate' | 'residential'
  email:        string
  name:         string
  sentBy:       string
}): Promise<{ state: InvitationState; resent: boolean }> {
  if (!isEmailConfigured() && env.NODE_ENV === 'production') {
    throw AppError.internal('Email delivery is not configured on the server, so the invitation cannot be sent')
  }

  const existing = 'accountId' in opts.target
    ? await invitationsRepo.findForAccounts([opts.target.accountId])
    : await invitationsRepo.findForProfiles([opts.target.profileId])
  const resent = existing.length > 0

  const token     = randomBytes(32).toString('base64url')
  const expiresAt = new Date(Date.now() + INVITATION_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString()

  // Only one live link per customer: revoke whatever is outstanding first.
  const { error: revokeError } = await invitationsRepo.revokeLive(opts.target)
  if (revokeError) throw AppError.internal('Failed to prepare the invitation', revokeError)

  const { data: inserted, error: insertError } = await invitationsRepo.insert({
    ...('accountId' in opts.target ? { account_id: opts.target.accountId } : { profile_id: opts.target.profileId }),
    customer_type: opts.customerType,
    email:         opts.email,
    token_hash:    hashToken(token),
    expires_at:    expiresAt,
    sent_by:       opts.sentBy,
  })
  if (insertError || !inserted) throw AppError.internal('Failed to create the invitation', insertError)

  const msg = customerInvitationEmail({
    name:          opts.name,
    activationUrl: activationUrl(token),
    expiresInDays: INVITATION_TTL_DAYS,
    customerType:  opts.customerType,
  })

  try {
    await sendEmail({ to: opts.email, subject: msg.subject, html: msg.html, text: msg.text })
  } catch (err) {
    await invitationsRepo.revokeById(inserted.id as string)
    logger.error('Failed to send customer invitation email', { error: err instanceof Error ? err.message : String(err) })
    throw invitationError(502, 'EMAIL_SEND_FAILED', 'The invitation email could not be sent. Please check the email address and try again.')
  }

  return {
    resent,
    state: {
      status:      'sent',
      sent_at:     inserted.sent_at as string,
      expires_at:  inserted.expires_at as string,
      accepted_at: null,
    },
  }
}

// ── Admin: send / resend ──────────────────────────────────────────────────────
export async function sendAccountInvitation(accountId: string, adminId: string) {
  const account = await accountsService.getAccount(accountId)
  if (account.rejected_at || account.deleted_at) {
    throw AppError.badRequest('Restore this account before sending credentials')
  }
  if (BLOCKED_PIPELINE_STATUSES.includes(account.pipeline_status as string)) {
    throw AppError.badRequest('Move this account out of Inactive / Lost before sending credentials')
  }

  const email = ((account.contact_email as string | null) ?? '').trim().toLowerCase()
  if (!email) throw AppError.badRequest('Add a contact email address to this account before sending credentials')

  // A login that already belongs to this account (e.g. a reactivated account) can
  // be re-invited as long as its owner has never signed in; otherwise they
  // should simply use "Forgot password".
  const { data: existingLogin } = await supabase
    .from('profiles')
    .select('id, is_active')
    .eq('account_id', accountId)
    .eq('company_role', 'company_admin')
    .limit(1)
    .maybeSingle()
  if (existingLogin?.is_active) {
    const { data: au } = await supabase.auth.admin.getUserById(existingLogin.id as string)
    if (au.user?.last_sign_in_at) {
      throw AppError.badRequest('This customer already has a working login. If they cannot sign in, ask them to use "Forgot password".')
    }
  }

  // A deleted / deactivated login on this email never blocks it; an active one does.
  const holder = await releaseStaleEmailHolder(email, { accountId })
  if (holder.status === 'blocked') throw blockedEmailError(email, holder.role)

  const { state, resent } = await issueAndSend({
    target:       { accountId },
    customerType: 'corporate',
    email,
    name:         ((account.contact_name as string | null) ?? '').trim(),
    sentBy:       adminId,
  })

  await accountsService.logAccountActivity({
    accountId,
    eventType:   'invitation_sent',
    description: `${resent ? 'Invitation resent' : 'Invitation sent'} to ${email}`,
    actorId:     adminId,
    actorLabel:  await accountsService.actorLabel(adminId),
  })

  return state
}

export async function sendUserInvitation(profileId: string, adminId: string) {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, role, full_name, is_active, deleted_at')
    .eq('id', profileId)
    .maybeSingle()
  if (error || !profile) throw AppError.notFound('Customer')
  if (profile.role !== 'residential') throw AppError.badRequest('Only residential customers can be invited here')
  if (profile.deleted_at || !profile.is_active) throw AppError.badRequest('Restore this customer before sending credentials')

  const { data: authUser } = await supabase.auth.admin.getUserById(profileId)
  const email = authUser.user?.email ?? ''
  if (!email || email.endsWith(NO_EMAIL_DOMAIN)) {
    throw AppError.badRequest('Add an email address for this customer before sending credentials')
  }
  if (authUser.user?.last_sign_in_at) {
    throw AppError.badRequest('This customer has already signed in — there is nothing to activate')
  }

  const { state } = await issueAndSend({
    target:       { profileId },
    customerType: 'residential',
    email,
    name:         ((profile.full_name as string | null) ?? '').trim(),
    sentBy:       adminId,
  })
  return state
}

// ── Public: validate / accept ─────────────────────────────────────────────────
type Problem = { code: string; status: number; message: string }

function problemFor(row: invitationsRepo.InvitationRow | null): Problem | null {
  if (!row) return { code: 'INVITATION_INVALID', status: 404, message: 'This activation link is not valid. Please ask Logical Links to send a new invitation.' }
  if (row.accepted_at) return { code: 'INVITATION_USED', status: 409, message: 'This account has already been activated. You can sign in now.' }
  if (row.revoked_at) return { code: 'INVITATION_REPLACED', status: 410, message: 'A newer invitation was sent to you. Please use the link in the most recent email.' }
  if (new Date(row.expires_at).getTime() <= Date.now()) {
    return { code: 'INVITATION_EXPIRED', status: 410, message: 'This activation link has expired. Please ask Logical Links to send a new invitation.' }
  }
  return null
}

async function loadInvitation(token: string) {
  const { data } = await invitationsRepo.findByTokenHash(hashToken(token))
  return (data as invitationsRepo.InvitationRow | null) ?? null
}

export async function validateInvitation(token: string) {
  const row = await loadInvitation(token)
  const problem = problemFor(row)
  if (problem || !row) {
    return { valid: false as const, code: problem?.code ?? 'INVITATION_INVALID', message: problem?.message ?? '' }
  }

  let name = ''
  if (row.account_id) {
    const account = await accountsService.getAccount(row.account_id).catch(() => null)
    name = (account?.contact_name as string | null) ?? (account?.account_name as string | null) ?? ''
  } else if (row.profile_id) {
    const { data } = await supabase.from('profiles').select('full_name').eq('id', row.profile_id).maybeSingle()
    name = (data?.full_name as string | null) ?? ''
  }
  return {
    valid:        true as const,
    customerType: row.customer_type,
    name,
    email:        maskEmail(row.email),
    expiresAt:    row.expires_at,
  }
}

export async function acceptInvitation(token: string, password: string) {
  const existing = await loadInvitation(token)
  const problem = problemFor(existing)
  if (problem || !existing) {
    const p = problem ?? { status: 404, code: 'INVITATION_INVALID', message: 'This activation link is not valid.' }
    throw invitationError(p.status, p.code, p.message)
  }

  // Single use: only one concurrent request can win this claim.
  const { data: claimed } = await invitationsRepo.claim(existing.id)
  if (!claimed) {
    throw invitationError(409, 'INVITATION_USED', 'This activation link has already been used.')
  }
  const inv = claimed as invitationsRepo.InvitationRow

  try {
    if (inv.customer_type === 'corporate' && inv.account_id) {
      await activateCorporate(inv, password)
    } else if (inv.customer_type === 'residential' && inv.profile_id) {
      await activateResidential(inv, password)
    } else {
      throw AppError.internal('Invitation has no target')
    }
  } catch (err) {
    // Let the customer retry with the same link.
    await invitationsRepo.release(inv.id)
    throw err
  }

  return { email: inv.email, customerType: inv.customer_type }
}

async function activateCorporate(inv: invitationsRepo.InvitationRow, password: string) {
  const accountId = inv.account_id as string
  const account = await accountsService.getAccount(accountId)
  if (account.rejected_at || account.deleted_at) {
    throw AppError.badRequest('This account is no longer available. Please contact Logical Links.')
  }
  const status = account.pipeline_status as CorporatePipelineStatus
  if (BLOCKED_PIPELINE_STATUSES.includes(status)) {
    throw AppError.badRequest('This account is not currently active. Please contact Logical Links.')
  }
  const fullName = ((account.contact_name as string | null) ?? '').trim() || (account.account_name as string)

  const holder = await releaseStaleEmailHolder(inv.email, { accountId })
  if (holder.status === 'blocked') {
    throw AppError.conflict('A login with this email already exists. Please sign in instead.')
  }

  // Reactivated account: its own login already exists — just set the new password.
  if (holder.status === 'same-account') {
    const { error: pwError } = await supabase.auth.admin.updateUserById(holder.userId, { password, email_confirm: true })
    if (pwError) throw AppError.internal('Failed to activate your account — please try again', pwError)
    await supabase
      .from('profiles')
      .update({ is_active: true, deleted_at: null, is_approved: true, signup_completed: true })
      .eq('id', holder.userId)
    if (!accountsService.portalAccessFor(status)) {
      await accountsService.updateAccount(accountId, { pipelineStatus: 'onboarding' }, undefined).catch(() => undefined)
    }
    await accountsService.logAccountActivity({
      accountId, eventType: 'invitation_accepted',
      description: `${fullName} activated their account`, actorLabel: fullName,
    })
    return
  }
  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email:         inv.email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  })
  if (createError || !created.user) {
    const msg = createError?.message.toLowerCase() ?? ''
    if (msg.includes('already')) throw AppError.conflict('A login with this email already exists. Please sign in instead.')
    throw AppError.badRequest(createError?.message ?? 'Could not create your login')
  }
  const userId = created.user.id

  // Link the new login to the account as its primary contact.
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      role:             'corporate',
      account_id:       accountId,
      company_role:     'company_admin',
      full_name:        fullName,
      phone:            (account.contact_phone as string | null) ?? null,
      signup_completed: true,
      is_active:        true,
      is_approved:      accountsService.portalAccessFor(status),
    })
    .eq('id', userId)
  if (profileError) {
    await supabase.auth.admin.deleteUser(userId).catch(() => undefined)
    throw AppError.internal('Failed to activate your account — please try again', profileError)
  }

  // Early-stage accounts move to Onboarding so the customer gets portal access.
  // updateAccount grants access and sends the onboarding email + notification.
  if (!accountsService.portalAccessFor(status)) {
    try {
      await accountsService.updateAccount(accountId, { pipelineStatus: 'onboarding' }, undefined)
    } catch (err) {
      // The login already exists, so never fail (and strand) the activation here —
      // grant access directly and let an admin fix the stage if needed.
      logger.error('Invitation accepted but moving the account to Onboarding failed', {
        accountId,
        error: err instanceof Error ? err.message : String(err),
      })
      await supabase.from('profiles').update({ is_approved: true }).eq('id', userId)
    }
  }

  await accountsService.logAccountActivity({
    accountId,
    eventType:   'invitation_accepted',
    description: `${fullName} activated their account`,
    actorLabel:  fullName,
  })
  void notificationsService.notifyAllAdmins(
    'account_updated',
    'Customer activated their account',
    `${account.account_name as string} accepted the invitation and can now sign in.`,
    'account',
    accountId,
  )
}

async function activateResidential(inv: invitationsRepo.InvitationRow, password: string) {
  const profileId = inv.profile_id as string
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, full_name, is_active, deleted_at')
    .eq('id', profileId)
    .maybeSingle()
  if (!profile || profile.role !== 'residential' || profile.deleted_at || !profile.is_active) {
    throw AppError.badRequest('This account is no longer available. Please contact Logical Links.')
  }

  const { error } = await supabase.auth.admin.updateUserById(profileId, { password, email_confirm: true })
  if (error) throw AppError.internal('Failed to activate your account — please try again', error)

  void notificationsService.notifyAllAdmins(
    'account_updated',
    'Customer activated their account',
    `${(profile.full_name as string | null) ?? 'A residential customer'} accepted the invitation and can now sign in.`,
    'account',
    profileId,
  )
}

// Used by the customer lists / detail pages to show the status.
export { deriveInvitationState, getProfileInvitationStates }
