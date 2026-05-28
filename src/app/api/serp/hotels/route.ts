import { NextRequest, NextResponse } from 'next/server'
import { searchHotels } from '@/lib/serp'
import { getSession } from '@/lib/auth'
import { rateLimit, apiLimiter, getIdentifier } from '@/lib/rateLimit'

export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const limited = await rateLimit(apiLimiter, getIdentifier(req, user.id))
  if (limited) return limited

  const { city, checkIn, checkOut, needsParking, maxPricePerNight } = await req.json()
  if (!city || !checkIn || !checkOut) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 })
  }
  const hotels = await searchHotels({ city, checkIn, checkOut, needsParking, maxPricePerNight })
  return NextResponse.json({ hotels })
}
