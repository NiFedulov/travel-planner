import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { signToken, COOKIE_NAME } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()
    if (!email || !password) return NextResponse.json({ error: 'Email and password required' }, { status: 400 })

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || !user.password) return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })

    const token = await signToken({ id: user.id, name: user.name, email: user.email, image: user.image })
    const res = NextResponse.json({ ok: true, user: { id: user.id, name: user.name, email: user.email } })
    res.cookies.set(COOKIE_NAME, token, { httpOnly: true, path: '/', maxAge: 60 * 60 * 24 * 30, sameSite: 'lax' })
    return res
  } catch {
    return NextResponse.json({ error: 'Login failed' }, { status: 500 })
  }
}
