import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { rateLimit, apiLimiter, getIdentifier } from '@/lib/rateLimit'
import { track } from '@/lib/analytics'
import { profileSchema, type ProfileInput } from '@/lib/schemas/profile'
import { logger } from '@/lib/logger'

export async function GET(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const limited = await rateLimit(apiLimiter, getIdentifier(req, user.id))
  if (limited) return limited

  const profile = await prisma.profile.findFirst({ where: { userId: user.id } })
  if (!profile) return NextResponse.json(null)
  return NextResponse.json(parseProfile(profile))
}

export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const limited = await rateLimit(apiLimiter, getIdentifier(req, user.id))
  if (limited) return limited

  try {
    const parsed = profileSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', issues: parsed.error.issues.map(i => ({ path: i.path, message: i.message })) },
        { status: 400 }
      )
    }
    const data = parsed.data
    const profile = await prisma.profile.create({ data: { ...serializeProfile(data), userId: user.id } })
    const travelersCount = Array.isArray(data.travelers) ? data.travelers.length : 0
    await track('profile_saved', user.id, { method: 'create', travelersCount })
    return NextResponse.json(parseProfile(profile))
  } catch (err) {
    logger.error('POST /api/profile error', err)
    return NextResponse.json({ error: 'Failed to save profile' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const limited = await rateLimit(apiLimiter, getIdentifier(req, user.id))
  if (limited) return limited

  try {
    const parsed = profileSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', issues: parsed.error.issues.map(i => ({ path: i.path, message: i.message })) },
        { status: 400 }
      )
    }
    const existing = await prisma.profile.findFirst({ where: { userId: user.id } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const profile = await prisma.profile.update({ where: { id: existing.id }, data: serializeProfile(parsed.data) })
    await track('profile_saved', user.id, { method: 'update' })
    return NextResponse.json(parseProfile(profile))
  } catch (err) {
    logger.error('PUT /api/profile error', err)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}

function serializeProfile(data: ProfileInput) {
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
