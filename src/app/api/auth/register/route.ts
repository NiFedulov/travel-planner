import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { signToken, COOKIE_NAME } from '@/lib/auth'
import { rateLimit, authLimiter, getIdentifier } from '@/lib/rateLimit'
import { track } from '@/lib/analytics'
import { SESSION_COOKIE_OPTIONS } from '@/lib/cookieOptions'
import { registerSchema } from '@/lib/schemas/auth'
import { logger } from '@/lib/logger'
import { auditLog } from '@/lib/auditLog'

export async function POST(req: NextRequest) {
  const limited = await rateLimit(authLimiter, getIdentifier(req))
  if (limited) return limited

  try {
    const parsed = registerSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
        { status: 400 }
      )
    }
    const { name, email, password } = parsed.data

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) return NextResponse.json({ error: 'Email already in use' }, { status: 409 })

    const hashed = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({ data: { name: name?.trim() || null, email, password: hashed } })

    await track('user_registered', user.id, { method: 'email' })

    const token = await signToken({ id: user.id, name: user.name, email: user.email, image: user.image })
    const res = NextResponse.json({ ok: true, user: { id: user.id, name: user.name, email: user.email } })
    res.cookies.set(COOKIE_NAME, token, SESSION_COOKIE_OPTIONS)
    await auditLog('user_registered', { userId: user.id, req, metadata: { method: 'email' } })
    return res
  } catch (err) {
    logger.error('register error', err)
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 })
  }
}
