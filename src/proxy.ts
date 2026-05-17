import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, COOKIE_NAME } from '@/lib/auth-edge'

const PUBLIC = ['/auth/signin', '/auth/signup', '/api/auth']

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl
  const isPublic = PUBLIC.some(p => pathname.startsWith(p))
  if (isPublic) return NextResponse.next()

  const token = req.cookies.get(COOKIE_NAME)?.value
  const user = token ? await verifyToken(token) : null

  if (!user) {
    const url = req.nextUrl.clone()
    url.pathname = '/auth/signin'
    url.searchParams.set('from', pathname)
    return NextResponse.redirect(url)
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/mock).*)'],
}
