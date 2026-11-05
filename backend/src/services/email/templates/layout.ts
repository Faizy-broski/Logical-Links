// Shared shell for every transactional email body. Plain, table-free, inline
// styles only — safe for the widest set of mail clients and trivial for a real
// provider to send as-is once the transport is wired.

const BRAND = 'Logical Links'
const SIGN_OFF_LINES = ['Kind regards,', 'Customer Support Team', BRAND]

export type RenderedEmail = {
  subject: string
  html:    string
  text:    string
}

/**
 * Build a full email from a heading + ordered paragraphs. The standard
 * "Kind regards / Customer Support Team / Logical Links" sign-off is appended
 * automatically — do not include it in `paragraphs`. Pass `signOff` to use a
 * different closing (e.g. the account emails close with "Regards, / Logical Links").
 */
export function renderEmail(opts: {
  subject:    string
  heading:    string
  paragraphs: string[]
  signOff?:   string[]
  /** Label/value rows shown as a compact table after the paragraphs. Empty values are skipped. */
  details?:   [label: string, value: string][]
  /** A call-to-action button. The URL is also printed in the plain-text body. */
  cta?:       { label: string; url: string }
  /** Extra paragraphs shown after the details / button (e.g. fallback instructions). */
  footnotes?: string[]
}): RenderedEmail {
  const { subject, heading, paragraphs } = opts
  const signOffLines = opts.signOff ?? SIGN_OFF_LINES
  const details   = (opts.details ?? []).filter(([, v]) => v !== undefined && v !== null && String(v).trim() !== '')
  const footnotes = opts.footnotes ?? []

  const text = [
    heading,
    '',
    ...paragraphs,
    ...(details.length ? ['', ...details.map(([k, v]) => `${k}: ${v}`)] : []),
    ...(opts.cta ? ['', `${opts.cta.label}: ${opts.cta.url}`] : []),
    ...(footnotes.length ? ['', ...footnotes] : []),
    '',
    ...signOffLines,
  ].join('\n')

  const paragraphStyle = 'margin:0 0 16px;font-size:15px;line-height:1.6;color:#1f2937;'
  const paragraphHtml = paragraphs
    .map((p) => `<p style="${paragraphStyle}">${escapeHtml(p)}</p>`)
    .join('\n')

  const detailsHtml = details.length
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:0 0 20px;border-collapse:collapse;">
${details
  .map(
    ([k, v]) =>
      `<tr><td style="padding:6px 12px 6px 0;font-size:13px;color:#6b7280;vertical-align:top;white-space:nowrap;">${escapeHtml(k)}</td><td style="padding:6px 0;font-size:14px;color:#111827;vertical-align:top;">${escapeHtml(String(v))}</td></tr>`,
  )
  .join('\n')}
</table>`
    : ''

  const ctaHtml = opts.cta
    ? `<p style="margin:8px 0 20px;"><a href="${escapeHtml(opts.cta.url)}" style="display:inline-block;background:#b8923a;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 24px;border-radius:8px;">${escapeHtml(opts.cta.label)}</a></p>
<p style="margin:0 0 16px;font-size:12px;line-height:1.5;color:#6b7280;word-break:break-all;">If the button doesn't work, copy and paste this link into your browser:<br>${escapeHtml(opts.cta.url)}</p>`
    : ''

  const footnotesHtml = footnotes
    .map((p) => `<p style="${paragraphStyle}">${escapeHtml(p)}</p>`)
    .join('\n')

  const signOffHtml = signOffLines
    .map((line) => `<div style="font-size:15px;line-height:1.6;color:#1f2937;">${escapeHtml(line)}</div>`)
    .join('\n')

  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:#f5f5f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;padding:32px;">
      <h1 style="margin:0 0 20px;font-size:18px;font-weight:700;color:#111827;">${escapeHtml(heading)}</h1>
      ${paragraphHtml}
      ${detailsHtml}
      ${ctaHtml}
      ${footnotesHtml}
      <div style="margin-top:24px;">${signOffHtml}</div>
    </div>
  </body>
</html>`

  return { subject, html, text }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
