import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { rateLimit, apiLimiter, getIdentifier } from '@/lib/rateLimit'
import { track } from '@/lib/analytics'
import { createTripSchema, type CreateTripInput } from '@/lib/schemas/trip'
import { logger } from '@/lib/logger'

export async function GET(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const limited = await rateLimit(apiLimiter, getIdentifier(req, user.id))
  if (limited) return limited

  const profileId = req.nextUrl.searchParams.get('profileId')
  const trips = await prisma.trip.findMany({
    where: { userId: user.id, ...(profileId ? { profileId } : {}) },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(trips.map(parseTrip))
}

export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const limited = await rateLimit(apiLimiter, getIdentifier(req, user.id))
  if (limited) return limited

  try {
    const raw = await req.json()
    const parsed = createTripSchema.safeParse(raw)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', issues: parsed.error.issues.map(i => ({ path: i.path, message: i.message })) },
        { status: 400 }
      )
    }
    const data = parsed.data

    // Verify profile belongs to current user — иначе утечка trips к чужому профилю
    const profile = await prisma.profile.findUnique({ where: { id: data.profileId } })
    if (!profile || profile.userId !== user.id) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const trip = await prisma.trip.create({ data: { ...serializeTrip(data), userId: user.id } })

    await track('trip_created', user.id, {
      tripId: trip.id,
      destination: data.destinations?.[0]?.city,
      datesFlexible: trip.datesFlexible,
    })

    return NextResponse.json(parseTrip(trip))
  } catch (err) {
    logger.error('POST /api/trips error', err)
    return NextResponse.json({ error: 'Failed to create trip' }, { status: 500 })
  }
}

function serializeTrip(data: CreateTripInput) {
  const originCode = data.originCode || (() => {
    const parts = (data.originCity ?? '').split(',')
    const last = parts[parts.length - 1].trim()
    return last.length >= 2 && last.length <= 4 ? last.toUpperCase() : (data.originCity ?? 'UNK').slice(0, 3).toUpperCase()
  })()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const selectedRoute = data.selectedRoute as any
  return {
    profileId: data.profileId,
    name: data.name || data.destinations?.map((d: { city: string }) => d.city).slice(0, 3).join(' · ') || 'My Trip',
    originCity: data.originCity,
    originCode,
    destinations: JSON.stringify(data.destinations ?? []),
    startDate: new Date(data.startDate),
    endDate: new Date(data.endDate),
    datesFlexible: data.datesFlexible ?? false,
    visaRequirements: data.visaRequirements ? JSON.stringify(data.visaRequirements) : null,
    vaccinationReqs: data.vaccinationReqs ? JSON.stringify(data.vaccinationReqs) : null,
    aiRecommendations: data.aiRecommendations ? JSON.stringify(data.aiRecommendations) : null,
    selectedRoute: data.selectedRoute ? JSON.stringify(data.selectedRoute) : null,
    selectedAccommodations: data.selectedAccommodations ? JSON.stringify(data.selectedAccommodations)
      : selectedRoute?.stops ? JSON.stringify(selectedRoute.stops.map((s: { city: string; cheapestHotel?: { id: string; name: string; pricePerNightEUR: number }; nights: number; arrivalDate: string; departureDate: string }) => ({
          destinationCity: s.city,
          hotelId: s.cheapestHotel?.id ?? '',
          hotelName: s.cheapestHotel?.name ?? '',
          nights: s.nights,
          pricePerNight: s.cheapestHotel?.pricePerNightEUR ?? 0,
          totalPrice: (s.cheapestHotel?.pricePerNightEUR ?? 0) * s.nights,
          checkIn: s.arrivalDate,
          checkOut: s.departureDate,
        }))) : null,
    estimatedTotal: selectedRoute?.costBreakdown?.total ?? data.estimatedTotal ?? null,
    status: data.status ?? 'planning',
    notes: data.notes ?? null,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseTrip(t: any) {
  return {
    ...t,
    destinations: JSON.parse(t.destinations),
    visaRequirements: t.visaRequirements ? JSON.parse(t.visaRequirements) : null,
    vaccinationReqs: t.vaccinationReqs ? JSON.parse(t.vaccinationReqs) : null,
    entryRestrictions: t.entryRestrictions ? JSON.parse(t.entryRestrictions) : null,
    selectedRoute: t.selectedRoute ? JSON.parse(t.selectedRoute) : null,
    selectedAccommodations: t.selectedAccommodations ? JSON.parse(t.selectedAccommodations) : null,
    selectedCarRental: t.selectedCarRental ? JSON.parse(t.selectedCarRental) : null,
    aiRecommendations: t.aiRecommendations ? JSON.parse(t.aiRecommendations) : null,
  }
}
