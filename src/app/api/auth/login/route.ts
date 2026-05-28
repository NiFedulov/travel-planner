import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { signToken, COOKIE_NAME } from '@/lib/auth'
import { rateLimit, authLimiter, getIdentifier } from '@/lib/rateLimit'
import { SESSION_COOKIE_OPTIONS } from '@/lib/cookieOptions'
import { loginSchema } from '@/lib/schemas/auth'
import { logger } from '@/lib/logger'
import { auditLog } from '@/lib/auditLog'

export async function POST(req: NextRequest) {
  const limited = await rateLimit(authLimiter, getIdentifier(req))
  if (limited) return limited

  try {
    const parsed = loginSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 400 })
    }
    const { email, password } = parsed.data

    const user = await prisma.user.findUnique({ where: { email } })
    // Constant-time-ish: always run bcrypt to avoid user enumeration timing attacks
    const dummyHash = '$2a$12$abcdefghijklmnopqrstuvwxyz0123456789012345678901234567'
    const hash = user?.password ?? dummyHash
    const valid = await bcrypt.compare(password, hash)
    if (!user || !user.password || !valid) {
      await auditLog('login_failed', { req, metadata: { email } })
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    const token = await signToken({ id: user.id, name: user.name, email: user.email, image: user.image })
    const res = NextResponse.json({ ok: true, user: { id: user.id, name: user.name, email: user.email } })
    res.cookies.set(COOKIE_NAME, token, SESSION_COOKIE_OPTIONS)
    await auditLog('login_success', { userId: user.id, req })
    return res
  } catch (err) {
    logger.error('login error', err)
    return NextResponse.json({ error: 'Login failed' }, { status: 500 })
  }
}
