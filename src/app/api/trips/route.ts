import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const profileId = req.nextUrl.searchParams.get('profileId')
  const trips = await prisma.trip.findMany({
    where: profileId ? { profileId } : undefined,
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(trips.map(parseTrip))
}

export async function POST(req: NextRequest) {
  const data = await req.json()
  const trip = await prisma.trip.create({ data: serializeTrip(data) })
  return NextResponse.json(parseTrip(trip))
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function serializeTrip(data: any) {
  return {
    profileId: data.profileId,
    name: data.name,
    originCity: data.originCity,
    originCode: data.originCode,
    destinations: JSON.stringify(data.destinations ?? []),
    startDate: new Date(data.startDate),
    endDate: new Date(data.endDate),
    datesFlexible: data.datesFlexible ?? false,
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
