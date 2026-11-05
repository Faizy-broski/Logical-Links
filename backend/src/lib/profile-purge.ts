import { randomBytes } from 'crypto'
import { supabase } from '../services/supabase.service'
import { AppError } from './errors'
import { logger } from './logger'

export type PurgeMode = 'deleted' | 'anonymised'

/**
 * Permanently removes a login so its email address can be registered again.
 *
 *  - If nothing references the user, the auth user is deleted outright
 *    (the profile and per-user rows cascade).
 *  - If the person has history (deliveries, invoices, tickets, notes …) the
 *    database refuses the delete, so the account is ANONYMISED instead:
 *    the email is replaced, the password scrambled, sessions revoked and
 *    personal fields wiped, while the business records stay intact.
 *
 * Callers must have verified the profile is soft-deleted and may be purged.
 * Requires migration 090 (profiles.anonymised_at).
 */
export async function purgeOrAnonymiseProfile(id: string, anonymisedName: string): Promise<PurgeMode> {
  const { error: deleteError } = await supabase.auth.admin.deleteUser(id)
  if (!deleteError) return 'deleted'

  logger.info('Profile has history — anonymising instead of deleting', { id })

  const { error: authError } = await supabase.auth.admin.updateUserById(id, {
    email:         `removed-${id}@removed.invalid`,
    password:      randomBytes(32).toString('hex'),
    email_confirm: true,
  })
  if (authError) throw AppError.internal('Failed to permanently delete the account', authError)

  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      full_name:     anonymisedName,
      phone:         null,
      avatar_url:    null,
      date_of_birth: null,
      is_active:     false,
      anonymised_at: new Date().toISOString(),
    })
    .eq('id', id)
  if (profileError) throw AppError.internal('Failed to permanently delete the account', profileError)

  await supabase.from('refresh_tokens').delete().eq('user_id', id)
  return 'anonymised'
}
