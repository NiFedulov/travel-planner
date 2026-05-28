import { NextRequest, NextResponse } from 'next/server'
import { COOKIE_NAME, getSession } from '@/lib/auth'
import { SESSION_COOKIE_CLEAR_OPTIONS } from '@/lib/cookieOptions'
import { auditLog } from '@/lib/auditLog'

export async function POST(req: NextRequest) {
  const user = await getSession()
  const res = NextResponse.json({ ok: true })
  res.cookies.set(COOKIE_NAME, '', SESSION_COOKIE_CLEAR_OPTIONS)
  if (user) await auditLog('logout', { userId: user.id, req })
  return res
}
