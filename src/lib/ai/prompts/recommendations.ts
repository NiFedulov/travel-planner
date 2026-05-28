import type { TouristProfile } from '@/lib/types/profile'
import type { Destination } from '@/lib/types/trip'
import { sanitizeForPrompt, sanitizeArray } from '@/lib/sanitize'
import { AI_SAFETY_PREAMBLE } from '@/lib/aiInput'

export function buildRecommendationsPrompt(
  profile: Partial<TouristProfile> | null | undefined,
  originCity: string,
  destinations: Destination[],
  startDate: string,
  endDate: string,
  budgetTotal?: number,
): string {
  const p = profile ?? {}
  const travelers = Array.isArray(p.travelers) ? p.travelers : []
  const vacationStyle = sanitizeArray(p.vacationStyle, 20, 40)
  const languagesSpoken = sanitizeArray(p.languagesSpoken, 20, 40)
  const cuisinePreferences = sanitizeArray(p.cuisinePreferences, 30, 40)
  const health = p.health ?? { mobilityIssues: false, dietaryRestrictions: [] as string[] }
  const dietary = sanitizeArray(health.dietaryRestrictions, 20, 40)

  const travelerSummary = travelers.length
    ? travelers.map(t => `${sanitizeForPrompt(t.type, 20)}${t.age ? ` (${Math.max(0, Math.min(120, Number(t.age) || 0))}yo)` : ''}`).join(', ')
    : 'solo traveler (assumed)'
  const nights = destinations.reduce((sum, d) => sum + (d.nights ?? 0), 0)

  return `${AI_SAFETY_PREAMBLE}

You are an expert travel planner. Create a personalized trip recommendation.

<traveler_profile>
- Travelers: ${travelerSummary}
- Vacation style: ${vacationStyle.join(', ') || 'not specified'}
- Travel pace: ${sanitizeForPrompt(p.travelPace, 20) || 'moderate'}
- Languages: ${languagesSpoken.join(', ') || 'English'}
- Cuisine preferences: ${cuisinePreferences.join(', ') || 'no restrictions'}
- Health notes: ${health.mobilityIssues ? 'mobility issues — avoid steep hills/stairs' : 'no restrictions'}${dietary.length ? ', dietary: ' + dietary.join(', ') : ''}
- Budget: ${budgetTotal ? `€${Math.max(0, Math.min(10_000_000, budgetTotal))} total for the trip` : 'budget not specified'}
</traveler_profile>

<current_trip>
- Origin: ${sanitizeForPrompt(originCity, 80)}
- Dates: ${sanitizeForPrompt(startDate, 30)} to ${sanitizeForPrompt(endDate, 30)} (${nights} nights total)
- Destinations: ${destinations.map(d => `${sanitizeForPrompt(d.city, 60)}, ${sanitizeForPrompt(d.country, 60)} (${d.nights} nights: ${sanitizeForPrompt(d.arrivalDate, 30)}–${sanitizeForPrompt(d.departureDate, 30)})`).join('\n  ')}
</current_trip>

Return a JSON object with this exact structure:
{
  "overview": "2-3 sentence trip summary tailored to this traveler",
  "itinerary": [
    "Day 1: Arrive Florence, evening walk in Oltrarno district",
    "Day 2: Uffizi Gallery (book ahead), lunch San Lorenzo market, sunset Piazzale Michelangelo"
  ],
  "highlights": [
    "Sunset boat ride on Lake Como from Bellagio",
    "Truffle tasting in Alba on weekend"
  ],
  "extraPlaces": [
    {"name": "Bellagio", "type": "town", "nearStop": "Lake Como", "why": "Most photogenic village on the lake, 30 min ferry from Como"},
    {"name": "Tre Cime di Lavaredo", "type": "viewpoint", "nearStop": "Dolomites", "why": "Iconic three-peak hike, 2h drive from Cortina"},
    {"name": "Sirmione Old Town", "type": "sight", "nearStop": "Lake Garda", "why": "Medieval castle on a peninsula"}
  ],
  "budgetBreakdown": {
    "flights": 600,
    "accommodation": 1800,
    "food": 950,
    "activities": 500,
    "carRental": 700,
    "total": 4550
  },
  "tips": [
    "Book Uffizi and Accademia tickets at least 2 weeks in advance",
    "Florence ZTL zone — park outside the historic center"
  ],
  "warnings": [
    "June is peak season on Lake Como — book accommodation now",
    "Sirmione historic center has vehicle restrictions"
  ],
  "bestTimeToVisit": "June is excellent for the Italian Lakes, slightly crowded but beautiful"
}

For extraPlaces: provide 6-10 additional places worth visiting along or near the planned route.
Each must include name, type (sight/viewpoint/town/nature/food/museum), nearStop (which planned city it's near), and why (one short sentence).
Mix popular and lesser-known spots. Match traveler's vacation style.

Make itinerary day-by-day, practical, specific. Budget should be realistic in EUR.
Return ONLY valid JSON, no other text.`
}

export function buildRouteOptimizePrompt(
  flights: Array<{
    id: string
    airline: string
    from: string
    to: string
    stops: number
    durationMin: number
    price: number
    isStopover: boolean
    layoverCity?: string
    savings?: number
    score: number
    mctRisk?: string
  }>,
  profile: Partial<TouristProfile> | null | undefined,
  destinations?: Array<{ city: string; stayDays?: number }>,
  startDate?: string,
  endDate?: string,
  flexDays?: number,
  originCity?: string,
  hotels?: Array<{ city: string; pricePerNight: number; stars: number; name: string }>,
): string {
  profile = profile ?? {}
  const flightsSummary = flights.map((f, i) =>
    `${i + 1}. [${sanitizeForPrompt(f.id, 40)}] ${sanitizeForPrompt(f.airline, 40)} ${sanitizeForPrompt(f.from, 10)}→${sanitizeForPrompt(f.to, 10)}, ${Math.max(0, Math.min(5, f.stops))} stop(s)${f.isStopover ? ` (STOPOVER in ${sanitizeForPrompt(f.layoverCity, 40)})` : ''}, ${Math.round(f.durationMin / 60)}h, €${Math.max(0, Math.min(1_000_000, f.price))}${f.savings ? `, saves €${Math.max(0, Math.min(1_000_000, f.savings))} vs direct` : ''}${f.mctRisk ? `, connection: ${sanitizeForPrompt(f.mctRisk, 40)}` : ''}`
  ).join('\n')

  const travelerInfo = [
    profile.travelers?.some((t: { type: string }) => t.type === 'infant') ? 'traveling with infant' : '',
    profile.travelers?.some((t: { type: string }) => t.type === 'child') ? 'traveling with children' : '',
    profile.health?.mobilityIssues ? 'mobility issues' : '',
    profile.travelPace === 'slow' ? 'prefers relaxed travel' : '',
  ].filter(Boolean).join(', ')

  const hasDestinations = destinations && destinations.length > 0
  const flex = Math.max(0, Math.min(5, flexDays ?? 0))

  const hotelsSummary = hotels && hotels.length > 0
    ? `\nHOTEL PRICE INDEX (avg per night by city):\n${
        Array.from(new Map(hotels.map(h => [h.city.toLowerCase(), h])).values())
          .map(h => `- ${h.city}: from €${h.pricePerNight}/night (${h.stars}★)`)
          .join('\n')
      }`
    : ''

  const destinationsSection = hasDestinations ? `

ORIGIN: ${originCity ?? 'unknown'}
DESTINATIONS TO PLAN (visit-order should be optimized for geography & flight prices):
${destinations!.map((d, i) => `${i + 1}. ${d.city}${d.stayDays ? ` (suggested stay: ${d.stayDays} days)` : ''}`).join('\n')}
OVERALL TRIP WINDOW: ${startDate} → ${endDate}${flex > 0 ? `  (flexible ±${flex} days on both ends — shift to cheapest weekday combos)` : ''}${hotelsSummary}
` : ''

  const itineraryInstruction = hasDestinations ? `
  "arrivalAirportCity": "${destinations![0].city}",
  "departureAirportCity": "${destinations![destinations!.length-1].city}",
  "optimalStartDate": "${startDate}",
  "optimalEndDate": "${endDate}",
  "estimatedFlightCost": 0,
  "estimatedHotelCost": 0,
  "suggestedItinerary": [
    {"city": "Lake Garda", "arrivalDate": "2026-06-01", "departureDate": "2026-06-04", "nights": 3, "reason": "Cheapest Monday arrivals, 3 days enough for highlights"},
    {"city": "Dolomites", "arrivalDate": "2026-06-04", "departureDate": "2026-06-08", "nights": 4, "reason": "Mid-week to avoid weekend crowds"}
  ],` : ''

  return `You are a flight routing and travel planning expert. Rank these flight options and${hasDestinations ? ' plan an optimal date itinerary for the trip' : ' provide recommendations'}.

TRAVELER: ${travelerInfo || 'standard traveler'}
Max layovers preference: ${profile.maxLayovers ?? 1}
Flight class: ${profile.flightClass ?? 'economy'}
${destinationsSection}
FLIGHT OPTIONS:
${flightsSummary}

Return JSON:
{
  "rankedIds": ["id3", "id1", "id2"],
  "explanations": {
    "id3": "Best overall — direct flight, saves 2.5h. Worth the €35 premium.",
    "id1": "Budget pick — stopover in Istanbul adds a free evening in a great city.",
    "id2": "Tight connection at CDG for travelers with children — risky."
  },
  "topPick": "id3",${itineraryInstruction}
  "planningNote": "Brief note about the date plan rationale"
}
${hasDestinations ? `
For suggestedItinerary: distribute the trip window across destinations. Use stayDays hints when provided. Dates must be consecutive with no gaps.
${flex > 0
  ? `You may pick optimalStartDate within [${startDate} −${flex}d ; ${startDate} +${flex}d] and optimalEndDate within [${endDate} −${flex}d ; ${endDate} +${flex}d]. Prefer Tue/Wed for flight arrivals (cheapest), avoid Fri/Sun departures.`
  : `First city starts on ${startDate}, last city ends on ${endDate}.`}
arrivalAirportCity = best entry city (matches earliest available cheap flight from origin).
departureAirportCity = best exit city (best return flight price).
Order destinations geographically to minimize backtracking. Compute estimatedFlightCost (round-trip from origin) and estimatedHotelCost (sum of nights × city avg from HOTEL PRICE INDEX).` : ''}

Consider: connection times for traveler profile, stopover city appeal, total trip time, price, comfort.
Return ONLY valid JSON, no other text.`
}
