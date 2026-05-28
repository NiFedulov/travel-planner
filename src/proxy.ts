import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, COOKIE_NAME } from '@/lib/auth-edge'

// Public routes — no auth required
const PUBLIC = ['/auth/signin', '/auth/signup', '/api/auth', '/api/health']

// Safe HTTP methods — skip CSRF check
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

/**
 * Edge proxy:
 *  1) CSRF defence-in-depth for all mutation requests (Origin/Sec-Fetch-Site).
 *  2) Auth gate — redirects unauthenticated users to /auth/signin.
 */
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl
  const method = req.method.toUpperCase()

  // 1) CSRF check — runs on ALL mutation requests, even on public auth endpoints.
  //    SameSite=lax cookie уже даёт базовую защиту, это дополнительный слой.
  if (!SAFE_METHODS.has(method)) {
    const csrfFail = checkOrigin(req)
    if (csrfFail) return csrfFail
  }

  const isPublic = PUBLIC.some(p => pathname.startsWith(p))
  if (isPublic) return NextResponse.next()

  // 2) Auth gate
  const token = req.cookies.get(COOKIE_NAME)?.value
  const user = token ? await verifyToken(token) : null

  if (!user) {
    // For API routes — return 401 JSON instead of redirect
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const url = req.nextUrl.clone()
    url.pathname = '/auth/signin'
    url.searchParams.set('from', pathname)
    return NextResponse.redirect(url)
  }
  return NextResponse.next()
}

function checkOrigin(req: NextRequest): NextResponse | null {
  const origin = req.headers.get('origin')
  const referer = req.headers.get('referer')
  const host = req.headers.get('host')
  const secFetchSite = req.headers.get('sec-fetch-site')

  // Modern browser signal — trust it
  if (secFetchSite === 'same-origin' || secFetchSite === 'none') return null

  // Origin header check (any non-GET request from a real browser has it)
  if (origin) {
    try {
      if (new URL(origin).host === host) return null
    } catch {
      // invalid Origin — fail
    }
  } else if (referer) {
    try {
      if (new URL(referer).host === host) return null
    } catch {
      // invalid Referer — fail
    }
  } else {
    // No origin AND no referer AND no Sec-Fetch-Site — suspicious for a browser POST.
    // Could be a server-to-server call though. We block to be safe.
  }

  return NextResponse.json({ error: 'CSRF check failed' }, { status: 403 })
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/mock).*)'],
}
