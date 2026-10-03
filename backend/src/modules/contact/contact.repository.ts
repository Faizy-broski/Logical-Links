import { supabase } from '../../services/supabase.service'
import type { ListContactMessagesQuery } from './contact.schema'

const MESSAGES = 'contact_messages'

const MESSAGE_SELECT = `
  id,
  name,
  email,
  phone,
  subject,
  message,
  status,
  archived_at,
  created_at,
  updated_at
`

export async function insertMessage(data: {
  name:    string
  email:   string
  phone?:  string
  subject: string
  message: string
}) {
  return supabase.from(MESSAGES).insert(data).select(MESSAGE_SELECT).single()
}

export async function findAll(query: ListContactMessagesQuery) {
  let q = supabase
    .from(MESSAGES)
    .select(MESSAGE_SELECT, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((query.page - 1) * query.limit, query.page * query.limit - 1)

  q = query.archived ? q.not('archived_at', 'is', null) : q.is('archived_at', null)
  if (query.status) q = q.eq('status', query.status)
  if (query.search) {
    const s = query.search.replace(/[(),]/g, '').slice(0, 200)
    q = q.or(`name.ilike.%${s}%,email.ilike.%${s}%,subject.ilike.%${s}%`)
  }

  return q
}

export async function findById(id: string) {
  return supabase.from(MESSAGES).select(MESSAGE_SELECT).eq('id', id).single()
}

export async function updateStatus(id: string, status: string) {
  return supabase
    .from(MESSAGES)
    .update({ status })
    .eq('id', id)
    .select(MESSAGE_SELECT)
    .single()
}

export async function setArchived(id: string, archived: boolean) {
  return supabase
    .from(MESSAGES)
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq('id', id)
    .select(MESSAGE_SELECT)
    .single()
}

const REPLIES = 'contact_message_replies'
const REPLY_SELECT = 'id, message_id, admin_id, body, email_status, email_error, created_at'

export async function findReplies(messageId: string) {
  return supabase
    .from(REPLIES)
    .select(REPLY_SELECT)
    .eq('message_id', messageId)
    .order('created_at', { ascending: true })
}

export async function insertReply(data: {
  message_id:   string
  admin_id:     string
  body:         string
  email_status: 'sent' | 'failed'
  email_error?: string
}) {
  return supabase.from(REPLIES).insert(data).select(REPLY_SELECT).single()
}
