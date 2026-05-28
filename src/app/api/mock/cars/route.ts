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
  const city = searchParams.get('city')
  const crossBorder = searchParams.get('crossBorder') === 'true'

  const cars = await prisma.mockCar.findMany({
    where: {
      ...(city ? { city: { contains: city } } : {}),
      ...(crossBorder ? { crossBorderAllowed: true } : {}),
    },
    orderBy: { pricePerDay: 'asc' },
  })

  return NextResponse.json(cars, {
    headers: { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=60' },
  })
}
