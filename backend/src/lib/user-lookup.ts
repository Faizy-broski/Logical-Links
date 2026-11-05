import { supabase } from '../services/supabase.service'
import { logger } from './logger'
import { AppError } from './errors'

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
