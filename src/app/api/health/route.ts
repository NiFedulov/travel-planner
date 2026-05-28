import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const startedAt = Date.now()

/**
 * Health check для ELB/ALB.
 * - GET /api/health — liveness (быстрый, без БД)
 * - GET /api/health?deep=1 — readiness (с БД ping)
 *
 * ELB target group рекомендую направлять на /api/health (liveness),
 * а на /api/health?deep=1 — отдельный CloudWatch alarm.
 */
export async function GET(req: Request) {
  const url = new URL(req.url)
  const deep = url.searchParams.get('deep') === '1'

  const base = {
    status: 'ok' as const,
    uptime: Math.floor((Date.now() - startedAt) / 1000),
    timestamp: new Date().toISOString(),
    version: process.env.APP_VERSION ?? 'dev',
  }

  if (!deep) return NextResponse.json(base)

  try {
    await prisma.$queryRaw`SELECT 1`
    return NextResponse.json({ ...base, db: 'ok' })
  } catch {
    return NextResponse.json({ ...base, status: 'degraded', db: 'fail' }, { status: 503 })
  }
}
