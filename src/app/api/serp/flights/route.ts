import { NextRequest, NextResponse } from 'next/server'
import { searchFlights } from '@/lib/serp'
import { getSession } from '@/lib/auth'
import { rateLimit, apiLimiter, getIdentifier } from '@/lib/rateLimit'

export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const limited = await rateLimit(apiLimiter, getIdentifier(req, user.id))
  if (limited) return limited

  const { originIata, destinationIata, outboundDate, returnDate } = await req.json()
  if (!originIata || !destinationIata || !outboundDate) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 })
  }
  const flights = await searchFlights({ originIata, destinationIata, outboundDate, returnDate })
  return NextResponse.json({ flights })
}
