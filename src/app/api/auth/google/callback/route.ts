import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { signToken, COOKIE_NAME } from '@/lib/auth'
import { track } from '@/lib/analytics'
import { logger } from '@/lib/logger'
import { SESSION_COOKIE_OPTIONS } from '@/lib/cookieOptions'
import { auditLog } from '@/lib/auditLog'

// Timing-safe string compare to avoid leaking info via response time
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let mismatch = 0
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return mismatch === 0
}

export async function GET(req: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_URL ?? 'http://localhost:3000'
  const code = req.nextUrl.searchParams.get('code')
  const state = req.nextUrl.searchParams.get('state')
  const savedState = req.cookies.get('oauth_state')?.value

  if (!code) return NextResponse.redirect(`${baseUrl}/auth/signin?error=google_cancelled`)
  if (!state || !savedState || !timingSafeEqual(state, savedState)) {
    return NextResponse.redirect(`${baseUrl}/auth/signin?error=invalid_state`)
  }

  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${baseUrl}/auth/signin?error=google_not_configured`)
  }
  const redirectUri = `${baseUrl}/api/auth/google/callback`

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, grant_type: 'authorization_code' }),
    })
    const tokens = await tokenRes.json()
    if (!tokens.access_token) return NextResponse.redirect(`${baseUrl}/auth/signin?error=google_failed`)

    const infoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })
    const info = await infoRes.json()
    if (!info.email || !info.verified_email) {
      return NextResponse.redirect(`${baseUrl}/auth/signin?error=google_no_email`)
    }

    const email = String(info.email).toLowerCase().trim()
    let user = await prisma.user.findFirst({ where: { OR: [{ googleId: info.id }, { email }] } })
    const isNew = !user
    if (!user) {
      user = await prisma.user.create({ data: { email, name: info.name ?? null, image: info.picture ?? null, googleId: info.id } })
    } else if (!user.googleId) {
      user = await prisma.user.update({ where: { id: user.id }, data: { googleId: info.id, image: info.picture ?? user.image } })
    }

    if (isNew) {
      await track('user_registered', user.id, { method: 'google' })
      await auditLog('user_registered', { userId: user.id, req, metadata: { method: 'google' } })
    }

    const token = await signToken({ id: user.id, name: user.name, email: user.email, image: user.image })
    const res = NextResponse.redirect(`${baseUrl}/`)
    res.cookies.set(COOKIE_NAME, token, SESSION_COOKIE_OPTIONS)
    res.cookies.delete('oauth_state')
    await auditLog('oauth_success', { userId: user.id, req, metadata: { provider: 'google' } })
    return res
  } catch (e) {
    logger.error('Google callback error', e)
    await auditLog('oauth_failed', { req, metadata: { provider: 'google' } })
    return NextResponse.redirect(`${baseUrl}/auth/signin?error=google_failed`)
  }
}
