import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const trip = await prisma.trip.findUnique({ where: { id } })
  if (!trip) return NextResponse.json(null, { status: 404 })
  return NextResponse.json(parseTrip(trip))
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await req.json()
  const updateData: Record<string, unknown> = {}

  const jsonFields = ['destinations', 'visaRequirements', 'vaccinationReqs', 'entryRestrictions',
    'selectedRoute', 'selectedAccommodations', 'selectedCarRental', 'aiRecommendations']
  const directFields = ['name', 'originCity', 'originCode', 'datesFlexible', 'status', 'notes', 'estimatedTotal']

  for (const key of directFields) {
    if (data[key] !== undefined) updateData[key] = data[key]
  }
  for (const key of jsonFields) {
    if (data[key] !== undefined) updateData[key] = JSON.stringify(data[key])
  }
  if (data.startDate) updateData.startDate = new Date(data.startDate)
  if (data.endDate) updateData.endDate = new Date(data.endDate)

  const trip = await prisma.trip.update({ where: { id }, data: updateData })
  return NextResponse.json(parseTrip(trip))
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.trip.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
