import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { NextResponse } from 'next/server'
import { logger } from './logger'

/**
 * Vercel-friendly rate limiter.
 *
 * Использует Upstash Redis с HTTP API — работает в serverless functions без
 * persistent TCP connections (ioredis в serverless течёт пулом).
 *
 * Env vars (Vercel Integrations → Upstash → автоматически проставляются):
 *  - UPSTASH_REDIS_REST_URL
 *  - UPSTASH_REDIS_REST_TOKEN
 *
 * Если они не выставлены — падаем на in-memory (только для локального dev на
 * одном процессе). В serverless prod это сломается между cold starts — лог warn.
 */

const hasUpstash = !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN

const redis = hasUpstash
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null

if (!hasUpstash && process.env.NODE_ENV === 'production') {
  logger.warn('Upstash Redis not configured — rate limits use in-memory (NOT shared across invocations)')
}

function makeLimiter(key: string, points: number, window: `${number} s` | `${number} m`): Ratelimit | InMemoryLimiter {
  if (redis) {
    return new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(points, window),
      analytics: false,
      prefix: `rl:${key}`,
    })
  }
  return new InMemoryLimiter(points, parseWindowSec(window))
}

function parseWindowSec(window: string): number {
  const m = window.match(/^(\d+)\s*([sm])$/)
  if (!m) return 60
  const n = Number(m[1])
  return m[2] === 'm' ? n * 60 : n
}

// In-memory fallback — единственный процесс, dev only
class InMemoryLimiter {
  private hits = new Map<string, { count: number; resetAt: number }>()
  constructor(private points: number, private windowSec: number) {}
  async limit(identifier: string): Promise<{ success: boolean; remaining: number; reset: number }> {
    const now = Date.now()
    const entry = this.hits.get(identifier)
    if (!entry || entry.resetAt < now) {
      const resetAt = now + this.windowSec * 1000
      this.hits.set(identifier, { count: 1, resetAt })
      return { success: true, remaining: this.points - 1, reset: resetAt }
    }
    entry.count++
    if (entry.count > this.points) {
      return { success: false, remaining: 0, reset: entry.resetAt }
    }
    return { success: true, remaining: this.points - entry.count, reset: entry.resetAt }
  }
}

export const aiLimiter = makeLimiter('ai', 15, '60 s')        // 15 req/min на AI
export const authLimiter = makeLimiter('auth', 10, '900 s')   // 10 req/15min на auth
export const apiLimiter = makeLimiter('api', 120, '60 s')     // 120 req/min на API

type AnyLimiter = Ratelimit | InMemoryLimiter

export async function rateLimit(
  limiter: AnyLimiter,
  identifier: string
): Promise<NextResponse | null> {
  const result = await limiter.limit(identifier)
  if (result.success) return null
  const retryAfter = Math.max(1, Math.ceil((result.reset - Date.now()) / 1000))
  return NextResponse.json(
    { error: 'Too many requests', retryAfter },
    { status: 429, headers: { 'Retry-After': String(retryAfter) } }
  )
}

export function getIdentifier(req: Request, userId?: string): string {
  if (userId) return `user:${userId}`
  // На Vercel x-forwarded-for всегда корректный (Vercel Edge перезаписывает)
  const forwarded = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip')
  return `ip:${forwarded?.split(',')[0]?.trim() ?? 'unknown'}`
}
