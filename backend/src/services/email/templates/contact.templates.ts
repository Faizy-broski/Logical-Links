import { renderEmail, type RenderedEmail } from './layout'

// Admin reply to a General Inquiry from the public contact form.
export function contactReplyEmail(opts: {
  name:            string
  originalSubject: string
  originalMessage: string
  reply:           string
}): RenderedEmail {
  const subject = `Re: ${opts.originalSubject}`
  const replyParagraphs = opts.reply.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean)

  return renderEmail({
    subject,
    heading: subject,
    paragraphs: [
      opts.name.trim() ? `Hello ${opts.name.trim()},` : 'Hello,',
      ...replyParagraphs,
      `Your original message: "${opts.originalMessage}"`,
    ],
  })
}
