import { SignJWT, jwtVerify } from 'jose'

export const COOKIE_NAME = 'tp_session'

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'dev-secret-change-in-production-32chars'
)

export interface SessionUser {
  id: string
  name: string | null
  email: string
  image: string | null
}

export async function signToken(user: SessionUser): Promise<string> {
  return new SignJWT({ user })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('30d')
    .sign(SECRET)
}

export async function verifyToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET)
    return (payload.user as SessionUser) ?? null
  } catch {
    return null
  }
}
