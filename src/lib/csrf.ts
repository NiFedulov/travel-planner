import { NextRequest, NextResponse } from 'next/server'

/**
 * CSRF protection через Origin/Referer проверку.
 * Современный браузер ВСЕГДА шлёт Origin для cross-origin POST/PUT/DELETE.
 * Sec-Fetch-Site: same-origin — дополнительный сигнал (поддержка ~96% браузеров).
 *
 * SameSite=lax уже даёт базовую защиту, но не покрывает edge cases (top-level GET с
 * побочными эффектами, cross-subdomain). Эта проверка — defence-in-depth.
 */
export function checkCSRF(req: NextRequest): NextResponse | null {
  const method = req.method.toUpperCase()
  // GET/HEAD/OPTIONS — safe, не проверяем
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return null

  const origin = req.headers.get('origin')
  const referer = req.headers.get('referer')
  const host = req.headers.get('host')
  const secFetchSite = req.headers.get('sec-fetch-site')

  // Sec-Fetch-Site: same-origin — принимаем
  if (secFetchSite === 'same-origin' || secFetchSite === 'none') return null

  // Проверяем Origin
  if (origin) {
    try {
      const originHost = new URL(origin).host
      if (originHost === host) return null
    } catch {
      // невалидный Origin URL — отклоняем
    }
  }

  // Fallback на Referer (для legacy клиентов)
  if (!origin && referer) {
    try {
      const refHost = new URL(referer).host
      if (refHost === host) return null
    } catch {
      // пропускаем
    }
  }

  return NextResponse.json({ error: 'CSRF check failed' }, { status: 403 })
}
