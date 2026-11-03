import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Same-origin relative paths only — never an open redirect.
function safeNext(next: string | null, fallback = '/'): string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.includes('\\')) return fallback
  return next
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code       = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type       = searchParams.get('type')
  const next       = safeNext(searchParams.get('next'))
  const isRecovery = type === 'recovery' || next.startsWith('/update-password')

  // Where a failed link sends the user: password-reset links back to the reset
  // form (with a clear reason), everything else to the login page.
  const fail = (reason: 'link_expired' | 'link_invalid') =>
    NextResponse.redirect(
      isRecovery
        ? `${origin}/forgot-password?error=${reason}`
        : `${origin}/login?error=auth_callback_failed`,
    )

  // Supabase reports an expired / already-used link as ?error_code=otp_expired
  const providerError = searchParams.get('error_code') ?? searchParams.get('error')
  if (providerError) return fail(providerError === 'otp_expired' ? 'link_expired' : 'link_invalid')

  const supabase = await createClient()

  // PKCE flow — code from OAuth or magic link. Only works in the browser that
  // requested it (the code verifier cookie lives there).
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) return fail('link_invalid')
    return NextResponse.redirect(`${origin}${next}`)
  }

  // Email OTP flow — token_hash from invite / recovery emails. Works on any
  // device or browser, so the reset email template uses this form.
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash, type: type as 'recovery' | 'invite' | 'email' })
    if (error) return fail(/expired/i.test(error.message) ? 'link_expired' : 'link_invalid')

    // Recovery emails → password update page
    if (type === 'recovery') return NextResponse.redirect(`${origin}/update-password`)

    // Invite emails → role-based redirect (server-side)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from('profiles').select('role').eq('id', user.id).single()
      const role = (profile as { role?: string } | null)?.role
      if (role === 'admin') return NextResponse.redirect(`${origin}/admin/dashboard`)
      if (role === 'corporate')      return NextResponse.redirect(`${origin}/corporate/dashboard`)
    }
    return NextResponse.redirect(`${origin}${next}`)
  }

  return fail('link_invalid')
}
