import { AppError } from '../../lib/errors'
import * as repo from './contact.repository'
import { sendEmail } from '../../services/email/email.service'
import { contactReplyEmail } from '../../services/email/templates/contact.templates'
import * as notificationsService from '../notifications/notifications.service'
import type {
  SubmitContactMessageDto,
  UpdateContactMessageStatusDto,
  ReplyContactMessageDto,
  ListContactMessagesQuery,
} from './contact.schema'

export async function submitContactMessage(dto: SubmitContactMessageDto) {
  const { data: row, error } = await repo.insertMessage({
    name:    dto.name,
    email:   dto.email,
    ...(dto.phone && { phone: dto.phone }),
    subject: dto.subject,
    message: dto.message,
  })
  if (error || !row) throw AppError.internal('Failed to submit contact message', error)

  // Fire-and-forget — notifications must never block the caller's submission.
  void notificationsService
    .notifyAllAdmins(
      'system',
      'New contact message',
      `${dto.name} sent a message: "${dto.subject}".`,
      'contact_message',
      row.id as string,
    )
    .catch(() => undefined)

  return row
}

export async function listContactMessages(query: ListContactMessagesQuery) {
  const { data, count, error } = await repo.findAll(query)
  if (error) throw AppError.internal('Failed to fetch contact messages', error)
  return { messages: data ?? [], total: count ?? 0 }
}

export async function updateContactMessageStatus(id: string, dto: UpdateContactMessageStatusDto) {
  const { data: existing, error: findErr } = await repo.findById(id)
  if (findErr || !existing) throw AppError.notFound('Contact message')

  const { data: updated, error } = await repo.updateStatus(id, dto.status)
  if (error || !updated) throw AppError.internal('Failed to update contact message status', error)

  return updated
}

export async function getContactMessage(id: string) {
  const { data: message, error } = await repo.findById(id)
  if (error || !message) throw AppError.notFound('Contact message')

  const { data: replies, error: repliesErr } = await repo.findReplies(id)
  if (repliesErr) throw AppError.internal('Failed to fetch replies', repliesErr)

  return { ...message, replies: replies ?? [] }
}

export async function replyToContactMessage(id: string, dto: ReplyContactMessageDto, adminId: string) {
  const { data: message, error: findErr } = await repo.findById(id)
  if (findErr || !message) throw AppError.notFound('Contact message')

  // Awaited (unlike other emails) - the admin needs to know if delivery failed.
  let emailStatus: 'sent' | 'failed' = 'sent'
  let emailError: string | undefined
  try {
    const email = contactReplyEmail({
      name:            message.name as string,
      originalSubject: message.subject as string,
      originalMessage: message.message as string,
      reply:           dto.body,
    })
    await sendEmail({ to: message.email as string, ...email })
  } catch (err) {
    emailStatus = 'failed'
    emailError = err instanceof Error ? err.message : 'Unknown email error'
  }

  const { data: reply, error } = await repo.insertReply({
    message_id:   id,
    admin_id:     adminId,
    body:         dto.body,
    email_status: emailStatus,
    ...(emailError && { email_error: emailError }),
  })
  if (error || !reply) throw AppError.internal('Failed to record reply', error)

  // First response moves a brand-new message into progress.
  if (emailStatus === 'sent' && message.status === 'new') {
    await repo.updateStatus(id, 'in_progress')
  }

  if (emailStatus === 'failed') {
    throw AppError.internal('Reply was saved but the email could not be delivered', emailError)
  }
  return reply
}

export async function archiveContactMessage(id: string, archived: boolean) {
  const { data: existing, error: findErr } = await repo.findById(id)
  if (findErr || !existing) throw AppError.notFound('Contact message')
  if (archived && existing.status !== 'resolved') {
    throw AppError.badRequest('Only resolved messages can be archived')
  }

  const { data, error } = await repo.setArchived(id, archived)
  if (error || !data) throw AppError.internal('Failed to update archive state', error)
  return data
}
