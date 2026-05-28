import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { rateLimit, apiLimiter, getIdentifier } from '@/lib/rateLimit'
import { updateTripSchema } from '@/lib/schemas/trip'
import { logger } from '@/lib/logger'
import { auditLog } from '@/lib/auditLog'

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

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const limited = await rateLimit(apiLimiter, getIdentifier(req, user.id))
  if (limited) return limited

  const { id } = await params
  const trip = await prisma.trip.findUnique({ where: { id } })
  if (!trip) return NextResponse.json(null, { status: 404 })
  if (trip.userId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  return NextResponse.json(parseTrip(trip))
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const limited = await rateLimit(apiLimiter, getIdentifier(req, user.id))
  if (limited) return limited

  const { id } = await params
  const existing = await prisma.trip.findUnique({ where: { id } })
  if (!existing) return NextResponse.json(null, { status: 404 })
  if (existing.userId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const parsed = updateTripSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', issues: parsed.error.issues.map(i => ({ path: i.path, message: i.message })) },
        { status: 400 }
      )
    }
    const data = parsed.data
    const updateData: Record<string, unknown> = {}

    // explicit whitelist — никаких ...data
    if (data.name !== undefined) updateData.name = data.name
    if (data.originCity !== undefined) updateData.originCity = data.originCity
    if (data.originCode !== undefined) updateData.originCode = data.originCode
    if (data.datesFlexible !== undefined) updateData.datesFlexible = data.datesFlexible
    if (data.status !== undefined) updateData.status = data.status
    if (data.notes !== undefined) updateData.notes = data.notes
    if (data.estimatedTotal !== undefined) updateData.estimatedTotal = data.estimatedTotal

    if (data.destinations !== undefined) updateData.destinations = JSON.stringify(data.destinations)
    if (data.visaRequirements !== undefined) updateData.visaRequirements = data.visaRequirements ? JSON.stringify(data.visaRequirements) : null
    if (data.vaccinationReqs !== undefined) updateData.vaccinationReqs = data.vaccinationReqs ? JSON.stringify(data.vaccinationReqs) : null
    if (data.entryRestrictions !== undefined) updateData.entryRestrictions = data.entryRestrictions ? JSON.stringify(data.entryRestrictions) : null
    if (data.selectedRoute !== undefined) updateData.selectedRoute = data.selectedRoute ? JSON.stringify(data.selectedRoute) : null
    if (data.selectedAccommodations !== undefined) updateData.selectedAccommodations = data.selectedAccommodations ? JSON.stringify(data.selectedAccommodations) : null
    if (data.selectedCarRental !== undefined) updateData.selectedCarRental = data.selectedCarRental ? JSON.stringify(data.selectedCarRental) : null
    if (data.aiRecommendations !== undefined) updateData.aiRecommendations = data.aiRecommendations ? JSON.stringify(data.aiRecommendations) : null

    if (data.startDate) updateData.startDate = new Date(data.startDate)
    if (data.endDate) updateData.endDate = new Date(data.endDate)

    const trip = await prisma.trip.update({ where: { id }, data: updateData })
    return NextResponse.json(parseTrip(trip))
  } catch (err) {
    logger.error('PUT /api/trips/[id] error', err)
    return NextResponse.json({ error: 'Failed to update trip' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const limited = await rateLimit(apiLimiter, getIdentifier(req, user.id))
  if (limited) return limited

  const { id } = await params
  const existing = await prisma.trip.findUnique({ where: { id } })
  if (!existing) return NextResponse.json(null, { status: 404 })
  if (existing.userId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await prisma.trip.delete({ where: { id } })
  await auditLog('trip_deleted', { userId: user.id, req, metadata: { tripId: id } })
  return NextResponse.json({ ok: true })
}
