import { NextResponse } from 'next/server'
import { rateLimit, authLimiter, getIdentifier } from '@/lib/rateLimit'
import { NextRequest } from 'next/server'
import { OAUTH_STATE_COOKIE_OPTIONS } from '@/lib/cookieOptions'

export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID
  if (!clientId) return NextResponse.json({ error: 'Google OAuth not configured' }, { status: 503 })

  const limited = await rateLimit(authLimiter, getIdentifier(req))
  if (limited) return limited

  const state = crypto.randomUUID()
  const redirectUri = `${process.env.NEXT_PUBLIC_URL ?? 'http://localhost:3000'}/api/auth/google/callback`
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'select_account',
    state,
  })
  const res = NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`)
  res.cookies.set('oauth_state', state, OAUTH_STATE_COOKIE_OPTIONS)
  return res
}
