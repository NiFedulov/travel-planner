import { SignJWT, jwtVerify } from 'jose'

export const COOKIE_NAME = 'tp_session'

function getSecret(): Uint8Array {
  const raw = process.env.JWT_SECRET
  if (!raw || raw.length < 32) {
    throw new Error(
      'JWT_SECRET is missing or too short (min 32 chars). ' +
        'Generate with: openssl rand -base64 64'
    )
  }
  return new TextEncoder().encode(raw)
}

export interface SessionUser {
  id: string
  name: string | null
  email: string
  image: string | null
}

export async function signToken(user: SessionUser): Promise<string> {
  return new SignJWT({ user })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(getSecret())
}

export async function verifyToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return (payload.user as SessionUser) ?? null
  } catch {
    return null
  }
}
