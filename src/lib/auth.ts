// Node.js-only auth utils (API routes + Server Components)
import { cookies } from 'next/headers'
import { verifyToken, SessionUser } from './auth-edge'

export { signToken, verifyToken, COOKIE_NAME } from './auth-edge'
export type { SessionUser } from './auth-edge'

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('tp_session')?.value
  if (!token) return null
  return verifyToken(token)
}
