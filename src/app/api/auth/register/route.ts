import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { signToken, COOKIE_NAME } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json()
    if (!email || !password) return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    if (password.length < 6) return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) return NextResponse.json({ error: 'Email already in use' }, { status: 409 })

    const hashed = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({ data: { name: name?.trim() || null, email, password: hashed } })

    const token = await signToken({ id: user.id, name: user.name, email: user.email, image: user.image })
    const res = NextResponse.json({ ok: true, user: { id: user.id, name: user.name, email: user.email } })
    res.cookies.set(COOKIE_NAME, token, { httpOnly: true, path: '/', maxAge: 60 * 60 * 24 * 30, sameSite: 'lax' })
    return res
  } catch (err) {
    console.error('register error:', err)
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 })
  }
}
