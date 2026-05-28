import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { rateLimit, apiLimiter, getIdentifier } from '@/lib/rateLimit'

export async function GET(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const limited = await rateLimit(apiLimiter, getIdentifier(req, user.id))
  if (limited) return limited

  const { searchParams } = req.nextUrl
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  const flights = await prisma.mockFlight.findMany({
    where: {
      ...(from ? { fromCode: from } : {}),
      ...(to ? { toCode: to } : {}),
    },
  })

  return NextResponse.json(flights, {
    headers: { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=60' },
  })
}
