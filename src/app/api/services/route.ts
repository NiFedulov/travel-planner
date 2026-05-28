import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { rateLimit, apiLimiter, getIdentifier } from '@/lib/rateLimit'
import { getService } from '@/lib/services/config'

export async function GET(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const limited = await rateLimit(apiLimiter, getIdentifier(req, user.id))
  if (limited) return limited

  const services = await prisma.connectedService.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: 'desc' },
  })
  return NextResponse.json(services.map(parse))
}

export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const limited = await rateLimit(apiLimiter, getIdentifier(req, user.id))
  if (limited) return limited

  const { provider, username, membershipId, membershipLevel, historyPasted } = await req.json()
  if (!provider) return NextResponse.json({ error: 'provider required' }, { status: 400 })
  if (!getService(provider)) return NextResponse.json({ error: 'unknown provider' }, { status: 400 })

  const config = getService(provider)!
  const service = await prisma.connectedService.upsert({
    where: { userId_provider: { userId: user.id, provider } },
    create: {
      userId: user.id,
      category: config.category,
      provider,
      username: username ?? null,
      membershipId: membershipId ?? null,
      membershipLevel: membershipLevel ?? null,
      historyPasted: historyPasted ?? null,
      analysisStatus: historyPasted ? 'pending' : 'none',
    },
    update: {
      username: username ?? null,
      membershipId: membershipId ?? null,
      membershipLevel: membershipLevel ?? null,
      historyPasted: historyPasted ?? null,
      analysisStatus: historyPasted ? 'pending' : 'none',
      aiInsights: historyPasted ? null : undefined,
    },
  })
  return NextResponse.json(parse(service))
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parse(s: any) {
  return {
    ...s,
    aiInsights: s.aiInsights ? JSON.parse(s.aiInsights) : null,
  }
}
