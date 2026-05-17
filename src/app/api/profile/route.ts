import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const profile = await prisma.profile.findFirst({ orderBy: { createdAt: 'desc' } })
  if (!profile) return NextResponse.json(null)
  return NextResponse.json(parseProfile(profile))
}

export async function POST(req: NextRequest) {
  const data = await req.json()
  const profile = await prisma.profile.create({ data: serializeProfile(data) })
  return NextResponse.json(parseProfile(profile))
}

export async function PUT(req: NextRequest) {
  const data = await req.json()
  const { id, ...rest } = data
  const profile = await prisma.profile.update({ where: { id }, data: serializeProfile(rest) })
  return NextResponse.json(parseProfile(profile))
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function serializeProfile(data: any) {
  return {
    travelers: JSON.stringify(data.travelers ?? []),
    vacationStyle: JSON.stringify(data.vacationStyle ?? []),
    travelPace: data.travelPace ?? 'moderate',
    flightClass: data.flightClass ?? 'economy',
    maxLayovers: data.maxLayovers ?? 1,
    health: JSON.stringify(data.health ?? {}),
    accommodation: JSON.stringify(data.accommodation ?? {}),
    passports: JSON.stringify(data.passports ?? []),
    existingVisas: JSON.stringify(data.existingVisas ?? []),
    existingETAs: JSON.stringify(data.existingETAs ?? []),
    hasIsraeliStamps: data.hasIsraeliStamps ?? false,
    criminalRecord: data.criminalRecord ?? false,
    travelInsurance: data.travelInsurance ?? false,
    budgetTotal: data.budgetTotal ?? null,
    budgetCurrency: data.budgetCurrency ?? 'EUR',
    budgetBreakdown: data.budgetBreakdown ? JSON.stringify(data.budgetBreakdown) : null,
    cuisinePreferences: JSON.stringify(data.cuisinePreferences ?? []),
    languagesSpoken: JSON.stringify(data.languagesSpoken ?? []),
    loyaltyPrograms: JSON.stringify(data.loyaltyPrograms ?? []),
    visitedCountries: JSON.stringify(data.visitedCountries ?? []),
    favoriteDestinations: JSON.stringify(data.favoriteDestinations ?? []),
    minorsTraveling: data.minorsTraveling ? JSON.stringify(data.minorsTraveling) : null,
    preferredAirlines: JSON.stringify(data.preferredAirlines ?? []),
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseProfile(p: any) {
  return {
    ...p,
    travelers: JSON.parse(p.travelers),
    vacationStyle: JSON.parse(p.vacationStyle),
    health: JSON.parse(p.health),
    accommodation: JSON.parse(p.accommodation),
    passports: JSON.parse(p.passports),
    existingVisas: JSON.parse(p.existingVisas),
    existingETAs: JSON.parse(p.existingETAs),
    budgetBreakdown: p.budgetBreakdown ? JSON.parse(p.budgetBreakdown) : null,
    cuisinePreferences: JSON.parse(p.cuisinePreferences),
    languagesSpoken: JSON.parse(p.languagesSpoken),
    loyaltyPrograms: JSON.parse(p.loyaltyPrograms),
    visitedCountries: JSON.parse(p.visitedCountries),
    favoriteDestinations: JSON.parse(p.favoriteDestinations),
    minorsTraveling: p.minorsTraveling ? JSON.parse(p.minorsTraveling) : null,
    preferredAirlines: JSON.parse(p.preferredAirlines),
  }
}
