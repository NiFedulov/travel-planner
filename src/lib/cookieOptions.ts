import type { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies'

const SECURE = process.env.NODE_ENV === 'production'

/**
 * Cookie config for tp_session.
 * - httpOnly: блокирует JS-доступ (XSS защита)
 * - secure: only HTTPS in prod
 * - sameSite: 'lax' — баланс между CSRF защитой и OAuth callback совместимостью.
 *   Для чисто-internal API можно strict, но Google OAuth redirect требует lax.
 * - path: '/' — доступен на всех роутах
 */
export const SESSION_COOKIE_OPTIONS: Partial<ResponseCookie> = {
  httpOnly: true,
  secure: SECURE,
  path: '/',
  sameSite: 'lax',
  maxAge: 60 * 60 * 24 * 30, // 30d
}

export const SESSION_COOKIE_CLEAR_OPTIONS: Partial<ResponseCookie> = {
  httpOnly: true,
  secure: SECURE,
  path: '/',
  sameSite: 'lax',
  maxAge: 0,
}

export const OAUTH_STATE_COOKIE_OPTIONS: Partial<ResponseCookie> = {
  httpOnly: true,
  secure: SECURE,
  path: '/',
  sameSite: 'lax',
  maxAge: 600, // 10 min — достаточно для OAuth handshake
}
