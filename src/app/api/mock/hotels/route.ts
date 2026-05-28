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
  const petFriendly = searchParams.get('petFriendly') === 'true'
  const minStars = parseInt(searchParams.get('minStars') ?? '0')

  const hotels = await prisma.mockHotel.findMany({
    where: {
      ...(city ? { city: { contains: city } } : {}),
      ...(petFriendly ? { petFriendly: true } : {}),
      ...(minStars > 0 ? { stars: { gte: minStars } } : {}),
    },
    orderBy: { rating: 'desc' },
  })

  return NextResponse.json(hotels, {
    headers: { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=60' },
  })
}
