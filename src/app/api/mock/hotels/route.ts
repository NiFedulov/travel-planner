import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
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

  return NextResponse.json(hotels)
}
