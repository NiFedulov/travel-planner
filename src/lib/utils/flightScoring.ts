import type { MockFlight } from '@/lib/types/trip'
import type { TouristProfile } from '@/lib/types/profile'
import { calculateMCT } from './mct'
import { checkSchengenTransit } from './transitCheck'

export interface ScoredFlight extends MockFlight {
  score: number
  mctResult?: ReturnType<typeof calculateMCT>
  transitBlocked?: boolean
  transitBlockReason?: string
  savings?: number
  savingsPercent?: number
  stopoverHotelPrice?: number
  badges: string[]
}

const STOPOVER_HUBS: Record<string, string> = {
  IST: 'Istanbul', DXB: 'Dubai', DOH: 'Doha',
  SIN: 'Singapore', BKK: 'Bangkok', AMS: 'Amsterdam', FRA: 'Frankfurt'
}

export function scoreFlights(
  flights: MockFlight[],
  profile: TouristProfile,
  flightClass: string,
  stopoverHotelPrices: Record<string, number>,
): ScoredFlight[] {
  const passport = profile.passports[0]?.countryCode ?? 'EU'
  const prices = flights.map(f => flightClass === 'business' ? f.priceBusiness : f.priceEconomy)
  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)
  const minDuration = Math.min(...flights.map(f => f.durationMin))

  const directFlightPrice = flights.find(f => f.stops === 0 && !f.isStopover)
    ? (flightClass === 'business'
      ? flights.find(f => f.stops === 0 && !f.isStopover)!.priceBusiness
      : flights.find(f => f.stops === 0 && !f.isStopover)!.priceEconomy)
    : null

  return flights
    .map((flight): ScoredFlight => {
      const price = flightClass === 'business' ? flight.priceBusiness : flight.priceEconomy
      const badges: string[] = []

      // Transit check for layover flights
      let transitBlocked = false
      let transitBlockReason: string | undefined
      if (flight.layoverCode) {
        const check = checkSchengenTransit(
          passport,
          flight.layoverCode,
          flight.isStopover,
          false,
          false,
          profile.existingVisas,
        )
        if (!check.allowed) {
          transitBlocked = true
          transitBlockReason = check.reason
        }
      }

      // MCT check
      let mctResult: ReturnType<typeof calculateMCT> | undefined
      if (flight.layoverMin && flight.layoverCode) {
        mctResult = calculateMCT(
          flight.layoverCode,
          flight.layoverMin,
          false,
          false,
          true,
          false,
          true,
          profile,
        )
        if (mctResult.riskLevel === 'impossible') transitBlocked = true
      }

      // Stopover cost comparison
      let savings: number | undefined
      let savingsPercent: number | undefined
      let stopoverHotelPrice: number | undefined

      if (flight.isStopover && flight.stopoverNights && flight.layoverCode) {
        stopoverHotelPrice = stopoverHotelPrices[flight.layoverCode] ?? 80
        const totalStopoverCost = price + stopoverHotelPrice * flight.stopoverNights
        if (directFlightPrice) {
          savings = directFlightPrice - totalStopoverCost
          savingsPercent = Math.round((savings / directFlightPrice) * 100)
        }
        if (savingsPercent && savingsPercent > 0) {
          badges.push(`Save ${savingsPercent}%`)
        }
      }

      // Scoring
      let score: number
      if (flight.isStopover && savings !== undefined) {
        const savingsScore = Math.max(0, Math.min(100, savings / 5))
        const destBonus = STOPOVER_HUBS[flight.layoverCode ?? ''] ? 20 : 0
        const timeScore = Math.max(0, 100 - (flight.durationMin - minDuration) / 20)
        score = savingsScore * 0.4 + destBonus * 0.2 + timeScore * 0.2 + (mctResult?.riskLevel === 'safe' ? 20 : 0) * 0.2
      } else {
        const priceScore = maxPrice === minPrice ? 100 : Math.round(((maxPrice - price) / (maxPrice - minPrice)) * 100)
        const timeScore = Math.max(0, 100 - (flight.durationMin - minDuration) / 10)
        const comfortScore = (flight.stops === 0 ? 100 : flight.stops === 1 ? 60 : 30)
          + (profile.health.mobilityIssues && flight.stops === 0 ? 30 : 0)
        const loyaltyBonus = profile.loyaltyPrograms.some(l => l.airline === flight.airline) ? 100 : 0
        const mctBonus = mctResult ? (mctResult.riskLevel === 'safe' ? 100 : mctResult.riskLevel === 'tight' ? 50 : 0) : 100

        score = priceScore * 0.35 + timeScore * 0.25 + comfortScore * 0.2 + loyaltyBonus * 0.1 + mctBonus * 0.1
      }

      if (price === minPrice) badges.push('Cheapest')
      if (flight.durationMin === minDuration) badges.push('Fastest')
      if (flight.stops === 0 && !flight.isStopover) badges.push('Direct')

      return { ...flight, score, mctResult, transitBlocked, transitBlockReason, savings, savingsPercent, stopoverHotelPrice, badges }
    })
    .filter(f => !f.transitBlocked)
    .sort((a, b) => b.score - a.score)
}
