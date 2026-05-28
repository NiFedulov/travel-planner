import { NextRequest, NextResponse } from 'next/server'
import { getAnthropicClient } from '@/lib/ai/client'
import { buildRouteVariantsPrompt } from '@/lib/ai/prompts/routeVariants'
import { searchFlights, searchHotels, SerpQuotaError, type SerpHotelOption } from '@/lib/serp'
import { calcRouteCost, type RouteCostBreakdown, COST_RATES } from '@/lib/costRates'
import { getSession } from '@/lib/auth'
import { rateLimit, aiLimiter, getIdentifier } from '@/lib/rateLimit'

function shiftDate(iso: string, days: number): string {
  const d = new Date(iso)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

interface AiStop {
  city: string
  country: string
  nights: number
  arrivalDate: string
  departureDate: string
  drivingKmToNext?: number
  lat?: number
  lng?: number
}

interface AiPoi {
  name: string
  type?: string
  lat: number
  lng: number
  nearStop?: string
}

interface AiVariant {
  label: string
  arrivalCity: string
  arrivalIata: string
  arrivalLat?: number
  arrivalLng?: number
  departureCity: string
  departureIata: string
  departureLat?: number
  departureLng?: number
  stops: AiStop[]
  totalDrivingKm?: number
  rationale?: string
  recommendedPois?: AiPoi[]
}

export interface PricedStop extends AiStop {
  cheapestHotel?: {
    id: string
    name: string
    pricePerNightEUR: number
    rating?: number
    stars?: number
    parking: boolean
  }
  hotelCandidates: Array<{
    id: string
    name: string
    pricePerNightEUR: number
    rating?: number
    stars?: number
    parking: boolean
  }>
  hotelCostEUR: number
}

export interface PricedRouteVariant extends Omit<AiVariant, 'stops'> {
  stops: PricedStop[]
  flexShift?: { outDays: number; retDays: number; extraNights: number }
  flightsInbound?: { airline: string; priceEUR: number; durationMin?: number; stops: number; departureDate?: string; departureTime?: string; arrivalDate?: string; arrivalTime?: string }
  flightsOutbound?: { airline: string; priceEUR: number; durationMin?: number; stops: number; departureDate?: string; departureTime?: string; arrivalDate?: string; arrivalTime?: string }
  costBreakdown: RouteCostBreakdown
  overBudget: boolean
}

export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const limited = await rateLimit(aiLimiter, getIdentifier(req, user.id))
  if (limited) return limited

  try {
    const { originCity, originIata, destinations, startDate, endDate, flexDays, budgetTotal, accommodation, allowMocks } = await req.json()
    const useMockOnQuota: boolean = allowMocks === true

    if (!originCity || !destinations?.length || !startDate || !endDate) {
      return NextResponse.json({ error: 'Missing trip data' }, { status: 400 })
    }

    const targetStars: number | undefined = typeof accommodation?.minStars === 'number' ? accommodation.minStars : undefined
    const maxStars = targetStars !== undefined ? Math.max(1, targetStars + 1) : undefined
    const needsParking = accommodation?.mustHaveParking !== false

    const client = getAnthropicClient()
    const prompt = buildRouteVariantsPrompt({
      originCity, originIata, destinations, startDate, endDate, flexDays: flexDays ?? 0, budgetTotal,
    })

    const variantsSchema = {
      type: 'object' as const,
      properties: {
        originIata: { type: 'string', description: 'IATA code of the main airport serving the origin city' },
        variants: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              label: { type: 'string' },
              arrivalCity: { type: 'string' },
              arrivalIata: { type: 'string' },
              arrivalLat: { type: 'number' },
              arrivalLng: { type: 'number' },
              departureCity: { type: 'string' },
              departureIata: { type: 'string' },
              departureLat: { type: 'number' },
              departureLng: { type: 'number' },
              totalDrivingKm: { type: 'number' },
              rationale: { type: 'string' },
              stops: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    city: { type: 'string' },
                    country: { type: 'string' },
                    nights: { type: 'number' },
                    arrivalDate: { type: 'string' },
                    departureDate: { type: 'string' },
                    drivingKmToNext: { type: 'number' },
                    lat: { type: 'number' },
                    lng: { type: 'number' },
                  },
                  required: ['city', 'country', 'nights', 'arrivalDate', 'departureDate'],
                },
              },
              recommendedPois: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    type: { type: 'string' },
                    lat: { type: 'number' },
                    lng: { type: 'number' },
                    nearStop: { type: 'string' },
                  },
                  required: ['name', 'lat', 'lng'],
                },
              },
            },
            required: ['label', 'arrivalCity', 'arrivalIata', 'departureCity', 'departureIata', 'stops'],
          },
        },
      },
      required: ['variants'],
    }

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8192,
      tools: [{
        name: 'submit_route_variants',
        description: 'Submit the generated route variants',
        input_schema: variantsSchema,
      }],
      tool_choice: { type: 'tool', name: 'submit_route_variants' },
      messages: [{ role: 'user', content: prompt }],
    })

    const toolUse = message.content.find(c => c.type === 'tool_use')
    if (!toolUse || toolUse.type !== 'tool_use') {
      throw new Error('No tool_use in AI response')
    }
    const parsed = toolUse.input as { variants?: AiVariant[]; originIata?: string }
    // Vercel Hobby has a 60s function timeout. Each variant triggers ~10-15 SerpAPI calls,
    // so we cap at 3 variants to stay within the limit. Upgrade to Pro for more.
    const variants = (parsed.variants ?? []).slice(0, 3)

    // Prefer AI-resolved IATA over a literal IATA in the user input.
    // Never fall back to a naive guess — "limassol" sliced to "LIM" = Lima, PE.
    const inferredOriginIata = (parsed.originIata && /^[A-Z]{3}$/.test(parsed.originIata))
      ? parsed.originIata
      : (originIata && /^[A-Z]{3}$/.test(originIata)) ? originIata : guessIata(originCity)

    if (!inferredOriginIata) {
      return NextResponse.json({
        error: `Could not resolve origin airport for "${originCity}". Add country/IATA — e.g. "${originCity}, LCA".`,
        variants: [],
      }, { status: 400 })
    }

    const flexCap = Math.min(5, Math.max(0, flexDays ?? 0))
    // Vercel Hobby 60s constraint: at most 3 shift points (center + 2 extremes).
    // Each shift point = 2 SerpAPI flight calls (out + return) × N variants.
    const shiftPoints = flexCap === 0 ? [0] : [-flexCap, 0, flexCap]

    // Filter out variants the AI may have proposed with too-short windows for the planned stops
    const minStopsNights = (v: AiVariant) => v.stops.length
    const validVariants = variants.filter(v => {
      const baseOut = v.stops[0]?.arrivalDate ?? startDate
      const baseRet = v.stops[v.stops.length - 1]?.departureDate ?? endDate
      const nights = Math.round((new Date(baseRet).getTime() - new Date(baseOut).getTime()) / 86400000)
      return nights >= minStopsNights(v)
    })

    const priced: PricedRouteVariant[] = await Promise.all(validVariants.map(async v => {
      const baseOut = v.stops[0]?.arrivalDate ?? startDate
      const baseRet = v.stops[v.stops.length - 1]?.departureDate ?? endDate

      // Pre-fetch hotels first to learn avg/night cost — needed for the trade-off decision
      const pricedStops: PricedStop[] = await Promise.all(v.stops.map(async stop => {
        const hotels = await searchHotels({
          city: stop.city,
          checkIn: stop.arrivalDate,
          checkOut: stop.departureDate,
          needsParking,
          maxStars,
          allowMocks: useMockOnQuota,
        })
        const sorted = hotels.sort((a, b) => a.pricePerNightEUR - b.pricePerNightEUR)
        const cheapest = sorted[0]
        const nights = Math.max(1, stop.nights ?? 1)
        const hotelCostEUR = cheapest ? Math.round(cheapest.pricePerNightEUR * nights) : 0
        return {
          ...stop,
          cheapestHotel: cheapest && pickHotelView(cheapest),
          hotelCandidates: sorted.slice(0, 6).map(pickHotelView),
          hotelCostEUR,
        }
      }))

      const totalBaseNights = pricedStops.reduce((s, st) => s + (st.nights ?? 0), 0)
      const hotelsCostBase = pricedStops.reduce((s, st) => s + st.hotelCostEUR, 0)
      const avgHotelPerNight = totalBaseNights > 0 ? hotelsCostBase / totalBaseNights : 0
      // Daily extras that scale with trip length when window shifts
      const dailyExtras = avgHotelPerNight + COST_RATES.CAR_PER_DAY + COST_RATES.FOOD_PER_DAY + COST_RATES.SIGHTS_PER_DAY

      // Flex sweep — query flights for each candidate outbound/return date
      type FlightInfo = { airline: string; priceEUR: number; durationMin?: number; stops: number; departureDate: string; departureTime?: string; arrivalDate: string; arrivalTime?: string }
      const outboundByShift: Record<number, FlightInfo | undefined> = {}
      const returnByShift: Record<number, FlightInfo | undefined> = {}

      await Promise.all(shiftPoints.map(async s => {
        const outboundDate = shiftDate(baseOut, s)
        const returnDate = shiftDate(baseRet, s)
        const [outRes, retRes] = await Promise.all([
          searchFlights({ originIata: inferredOriginIata, destinationIata: v.arrivalIata, outboundDate, allowMocks: useMockOnQuota }),
          searchFlights({ originIata: v.departureIata, destinationIata: inferredOriginIata, outboundDate: returnDate, allowMocks: useMockOnQuota }),
        ])
        const cheapOut = outRes.sort((a, b) => a.priceEUR - b.priceEUR)[0]
        const cheapRet = retRes.sort((a, b) => a.priceEUR - b.priceEUR)[0]
        outboundByShift[s] = cheapOut && {
          airline: cheapOut.airline, priceEUR: cheapOut.priceEUR, durationMin: cheapOut.durationMin, stops: cheapOut.stops,
          departureDate: outboundDate, departureTime: cheapOut.departureTime,
          arrivalDate: outboundDate, arrivalTime: cheapOut.arrivalTime,
        }
        returnByShift[s] = cheapRet && {
          airline: cheapRet.airline, priceEUR: cheapRet.priceEUR, durationMin: cheapRet.durationMin, stops: cheapRet.stops,
          departureDate: returnDate, departureTime: cheapRet.departureTime,
          arrivalDate: returnDate, arrivalTime: cheapRet.arrivalTime,
        }
      }))

      // Optimal pair = min(flights(out)+flights(ret) + extraNights*dailyExtras)
      // CONSTRAINT: newNights >= stops.length (need at least 1 night per city)
      const baseNights = Math.max(1, Math.round((new Date(baseRet).getTime() - new Date(baseOut).getTime()) / 86400000))
      const minNights = pricedStops.length  // 1 night per stop minimum
      let bestOutShift = 0, bestRetShift = 0, bestTotalDelta = Infinity
      for (const outS of shiftPoints) {
        const o = outboundByShift[outS]
        if (!o) continue
        for (const retS of shiftPoints) {
          const r = returnByShift[retS]
          if (!r) continue
          const newNights = baseNights + (retS - outS)
          // Disallow trips that don't leave room for at least 1 night per planned stop
          if (newNights < minNights) continue
          const tripDeltaNights = retS - outS
          const flightsCost = o.priceEUR + r.priceEUR
          const totalDelta = flightsCost + tripDeltaNights * dailyExtras
          if (totalDelta < bestTotalDelta) {
            bestTotalDelta = totalDelta
            bestOutShift = outS
            bestRetShift = retS
          }
        }
      }
      // Fallback: if no valid combo (shouldn't happen with base window already >= minNights),
      // keep base dates (shift 0,0) — but only if they pass the constraint.
      if (bestTotalDelta === Infinity) {
        bestOutShift = 0
        bestRetShift = 0
      }

      const cheapestIn = outboundByShift[bestOutShift]
      const cheapestOut = returnByShift[bestRetShift]
      const tripDeltaNights = bestRetShift - bestOutShift

      // Recompute ALL stop dates consecutively from the new trip window.
      // Scale each stop's nights by the new window / old window ratio, preserve order.
      const newTripStart = shiftDate(baseOut, bestOutShift)
      const newTripEnd = shiftDate(baseRet, bestRetShift)
      const newTotalNights = Math.max(pricedStops.length, Math.round(
        (new Date(newTripEnd).getTime() - new Date(newTripStart).getTime()) / 86400000,
      ))

      const baseNightsSum = pricedStops.reduce((s, st) => s + Math.max(1, st.nights ?? 1), 0)
      // Allocate nights proportionally; ensure each stop gets at least 1 night
      const rawAlloc = pricedStops.map(st => (Math.max(1, st.nights ?? 1) / baseNightsSum) * newTotalNights)
      const allocated = rawAlloc.map(n => Math.max(1, Math.floor(n)))
      let leftover = newTotalNights - allocated.reduce((a, b) => a + b, 0)
      // Distribute leftover days starting from stops with largest fractional remainder
      const fracOrder = rawAlloc
        .map((n, i) => ({ i, frac: n - Math.floor(n) }))
        .sort((a, b) => b.frac - a.frac)
      for (let k = 0; leftover > 0 && k < fracOrder.length; k++) {
        allocated[fracOrder[k].i]++
        leftover--
      }
      // If leftover still > 0 (when floors summed to exactly newTotalNights and frac all 0), spread evenly
      let idx = 0
      while (leftover > 0) { allocated[idx % allocated.length]++; idx++; leftover-- }

      const adjustedStops: PricedStop[] = []
      let cursor = newTripStart
      for (let i = 0; i < pricedStops.length; i++) {
        const stop = pricedStops[i]
        const nights = allocated[i]
        const isLast = i === pricedStops.length - 1
        const arr = cursor
        const dep = isLast ? newTripEnd : shiftDate(cursor, nights)
        const realNights = Math.max(1, Math.round((new Date(dep).getTime() - new Date(arr).getTime()) / 86400000))
        const newHotelCost = stop.cheapestHotel ? Math.round(stop.cheapestHotel.pricePerNightEUR * realNights) : 0
        adjustedStops.push({
          ...stop,
          arrivalDate: arr,
          departureDate: dep,
          nights: realNights,
          hotelCostEUR: newHotelCost,
        })
        cursor = dep
      }

      const hotelsCost = adjustedStops.reduce((s, st) => s + st.hotelCostEUR, 0)
      const flightsCost = (cheapestIn?.priceEUR ?? 0) + (cheapestOut?.priceEUR ?? 0)
      const totalNights = adjustedStops.reduce((s, st) => s + (st.nights ?? 0), 0)
      const drivingKm = v.totalDrivingKm ?? adjustedStops.reduce((s, st) => s + (st.drivingKmToNext ?? 0), 0)

      const costBreakdown = calcRouteCost({
        nights: totalNights,
        drivingKm,
        needsCar: drivingKm > 0,
        flightsCost,
        hotelsCost,
      })

      return {
        ...v,
        stops: adjustedStops,
        flexShift: { outDays: bestOutShift, retDays: bestRetShift, extraNights: tripDeltaNights },
        flightsInbound: cheapestIn && {
          airline: cheapestIn.airline, priceEUR: cheapestIn.priceEUR, durationMin: cheapestIn.durationMin, stops: cheapestIn.stops,
          departureDate: cheapestIn.departureDate, departureTime: cheapestIn.departureTime,
          arrivalDate: cheapestIn.arrivalDate, arrivalTime: cheapestIn.arrivalTime,
        },
        flightsOutbound: cheapestOut && {
          airline: cheapestOut.airline, priceEUR: cheapestOut.priceEUR, durationMin: cheapestOut.durationMin, stops: cheapestOut.stops,
          departureDate: cheapestOut.departureDate, departureTime: cheapestOut.departureTime,
          arrivalDate: cheapestOut.arrivalDate, arrivalTime: cheapestOut.arrivalTime,
        },
        costBreakdown,
        overBudget: !!budgetTotal && costBreakdown.total > budgetTotal,
      }
    }))

    priced.sort((a, b) => a.costBreakdown.total - b.costBreakdown.total)

    return NextResponse.json({ variants: priced, budgetTotal: budgetTotal ?? null, originIata: inferredOriginIata })
  } catch (err) {
    if (err instanceof SerpQuotaError) {
      return NextResponse.json({
        quotaExceeded: true,
        provider: 'SerpApi',
        message: err.message,
        variants: [],
      }, { status: 200 })
    }
    console.error('route-variants error:', err)
    return NextResponse.json({ error: 'Failed to build route variants', variants: [] }, { status: 500 })
  }
}

function pickHotelView(h: SerpHotelOption) {
  return {
    id: h.id,
    name: h.name,
    pricePerNightEUR: h.pricePerNightEUR,
    rating: h.rating,
    stars: h.stars,
    parking: h.parking,
  }
}

function guessIata(city: string): string {
  // Only trust an explicit IATA-looking token (UPPERCASE 3 letters) after a comma.
  // Never fall back to slicing city name — "limassol" sliced to "LIM" is the Lima, PE airport,
  // which makes SerpApi return €800 transatlantic flights with 2 stopovers.
  const last = city.split(',').pop()?.trim() ?? ''
  if (/^[A-Z]{3}$/.test(last)) return last
  return ''
}
