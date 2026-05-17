import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { signToken, COOKIE_NAME } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_URL ?? 'http://localhost:3000'
  const code = req.nextUrl.searchParams.get('code')
  if (!code) return NextResponse.redirect(`${baseUrl}/auth/signin?error=google_cancelled`)

  const clientId = process.env.GOOGLE_CLIENT_ID!
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET!
  const redirectUri = `${baseUrl}/api/auth/google/callback`

  try {
    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, grant_type: 'authorization_code' }),
    })
    const tokens = await tokenRes.json()
    if (!tokens.access_token) return NextResponse.redirect(`${baseUrl}/auth/signin?error=google_failed`)

    // Get user info from Google
    const infoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })
    const info = await infoRes.json()
    if (!info.email) return NextResponse.redirect(`${baseUrl}/auth/signin?error=google_no_email`)

    // Find or create user
    let user = await prisma.user.findFirst({ where: { OR: [{ googleId: info.id }, { email: info.email }] } })
    if (!user) {
      user = await prisma.user.create({ data: { email: info.email, name: info.name ?? null, image: info.picture ?? null, googleId: info.id } })
    } else if (!user.googleId) {
      user = await prisma.user.update({ where: { id: user.id }, data: { googleId: info.id, image: info.picture ?? user.image } })
    }

    const token = await signToken({ id: user.id, name: user.name, email: user.email, image: user.image })
    const res = NextResponse.redirect(`${baseUrl}/`)
    res.cookies.set(COOKIE_NAME, token, { httpOnly: true, path: '/', maxAge: 60 * 60 * 24 * 30, sameSite: 'lax' })
    return res
  } catch (e) {
    console.error('Google callback error:', e)
    return NextResponse.redirect(`${baseUrl}/auth/signin?error=google_failed`)
  }
}
