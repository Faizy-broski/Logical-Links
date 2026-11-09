import { supabase } from '../services/supabase.service'
import { logger } from './logger'
import { AppError } from './errors'
import { purgeOrAnonymiseProfile } from './profile-purge'

/** Message shown whenever a deactivated / removed account tries to sign in or sign up. */
export const DEACTIVATED_MESSAGE =
  'Your account has been deactivated. Please contact support to reactivate it.'

export const ACCOUNT_DEACTIVATED_CODE = 'ACCOUNT_DEACTIVATED'

export function deactivatedError(): AppError {
  return new AppError(403, DEACTIVATED_MESSAGE, ACCOUNT_DEACTIVATED_CODE)
}

export type UserLookup = {
  userId:    string
  role:      string | null
  isActive:  boolean
  deletedAt: string | null
  accountId: string | null
}

/**
 * Looks an auth user up by email together with the state of their profile.
 * Returns null when there is no such user, or when the lookup is unavailable
 * (e.g. migration 090 not applied yet) — callers must treat null as "unknown"
 * and fall back to their generic behaviour.
 */
export async function findUserByEmail(email: string): Promise<UserLookup | null> {
  const { data, error } = await supabase.rpc('find_user_by_email', { p_email: email })
  if (error) {
    logger.warn('find_user_by_email lookup failed', { error: error.message })
    return null
  }
  const row = Array.isArray(data) ? data[0] : data
  if (!row) return null
  return {
    userId:    row.user_id as string,
    role:      (row.role as string | null) ?? null,
    isActive:  row.is_active !== false,
    deletedAt: (row.deleted_at as string | null) ?? null,
    accountId: (row.account_id as string | null) ?? null,
  }
}

/** True when the email belongs to an account that was deactivated or removed. */
export async function isDeactivatedEmail(email: string): Promise<boolean> {
  const found = await findUserByEmail(email)
  return !!found && (!found.isActive || !!found.deletedAt)
}

export type EmailHolderResult =
  | { status: 'free' }
  | { status: 'released' }                       // a deleted / deactivated holder was cleared
  | { status: 'same-account'; userId: string }   // the login already belongs to the target account
  | { status: 'blocked'; role: string | null }   // an active login owns the email

/**
 * Decides whether an email can be used for a new login created by an admin.
 * A deleted / deactivated holder never blocks an email for good: its login is
 * deleted (or anonymised when it has history, keeping the business records) so
 * the address is free again. An ACTIVE holder always blocks, except when it is
 * already the login of `accountId` (a reactivated account).
 */
export async function releaseStaleEmailHolder(
  email: string,
  opts: { accountId?: string } = {},
): Promise<EmailHolderResult> {
  const holder = await findUserByEmail(email)
  if (!holder) return { status: 'free' }

  if (opts.accountId && holder.accountId === opts.accountId) {
    return { status: 'same-account', userId: holder.userId }
  }

  const stale = !holder.isActive || !!holder.deletedAt
  if (!stale) return { status: 'blocked', role: holder.role }

  const label = holder.role === 'admin' ? 'Removed employee' : 'Removed customer'
  await purgeOrAnonymiseProfile(holder.userId, label)
  return { status: 'released' }
}

export function blockedEmailError(email: string, role: string | null): AppError {
  const who =
    role === 'residential' ? 'an active residential customer'
    : role === 'admin' ? 'a Logical Links employee'
    : 'an active corporate login'
  return AppError.conflict(
    `${email} already belongs to ${who}. Use a different email, or delete/deactivate that account first.`,
  )
}
