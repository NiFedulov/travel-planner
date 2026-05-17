import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
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

  return NextResponse.json(cars)
}
