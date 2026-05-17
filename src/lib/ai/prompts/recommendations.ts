import type { TouristProfile } from '@/lib/types/profile'
import type { Destination } from '@/lib/types/trip'

export function buildRecommendationsPrompt(
  profile: TouristProfile,
  originCity: string,
  destinations: Destination[],
  startDate: string,
  endDate: string,
  budgetTotal?: number,
): string {
  const travelerSummary = profile.travelers.map(t => `${t.type}${t.age ? ` (${t.age}yo)` : ''}`).join(', ')
  const nights = destinations.reduce((sum, d) => sum + d.nights, 0)

  return `You are an expert travel planner. Create a personalized trip recommendation.

TRAVELER PROFILE:
- Travelers: ${travelerSummary}
- Vacation style: ${profile.vacationStyle.join(', ')}
- Travel pace: ${profile.travelPace}
- Languages: ${profile.languagesSpoken.join(', ')}
- Cuisine preferences: ${profile.cuisinePreferences.join(', ')}
- Health notes: ${profile.health.mobilityIssues ? 'mobility issues — avoid steep hills/stairs' : 'no restrictions'}${profile.health.dietaryRestrictions.length ? ', dietary: ' + profile.health.dietaryRestrictions.join(', ') : ''}
- Budget: ${budgetTotal ? `€${budgetTotal} total for the trip` : 'budget not specified'}

TRIP DETAILS:
- Origin: ${originCity}
- Dates: ${startDate} to ${endDate} (${nights} nights total)
- Destinations: ${destinations.map(d => `${d.city}, ${d.country} (${d.nights} nights: ${d.arrivalDate}–${d.departureDate})`).join('\n  ')}

Return a JSON object with this exact structure:
{
  "overview": "2-3 sentence trip summary tailored to this traveler",
  "itinerary": [
    "Day 1: Arrive Florence, evening walk in Oltrarno district",
    "Day 2: Uffizi Gallery (book ahead), lunch San Lorenzo market, sunset Piazzale Michelangelo"
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
  profile: TouristProfile,
): string {
  const flightsSummary = flights.map((f, i) =>
    `${i + 1}. ${f.airline} ${f.from}→${f.to}, ${f.stops} stop(s)${f.isStopover ? ` (STOPOVER in ${f.layoverCity})` : ''}, ${Math.round(f.durationMin / 60)}h, €${f.price}${f.savings ? `, saves €${f.savings} vs direct` : ''}${f.mctRisk ? `, connection: ${f.mctRisk}` : ''}`
  ).join('\n')

  const travelerInfo = [
    profile.travelers.some(t => t.type === 'infant') ? 'traveling with infant' : '',
    profile.travelers.some(t => t.type === 'child') ? 'traveling with children' : '',
    profile.health.mobilityIssues ? 'mobility issues' : '',
    profile.travelPace === 'slow' ? 'prefers relaxed travel' : '',
  ].filter(Boolean).join(', ')

  return `You are a flight routing expert. Rank these flight options for this specific traveler.

TRAVELER: ${travelerInfo || 'standard traveler'}
Max layovers preference: ${profile.maxLayovers}
Flight class: ${profile.flightClass}

FLIGHT OPTIONS:
${flightsSummary}

For each option, provide ranking and short explanation. Return JSON:
{
  "rankedIds": ["id3", "id1", "id2"],
  "explanations": {
    "id3": "Best overall — direct flight, saves 2.5h. Worth the €35 premium.",
    "id1": "Budget pick — stopover in Istanbul adds a free evening in a great city.",
    "id2": "Tight connection at CDG for travelers with children — risky."
  },
  "topPick": "id3"
}

Consider: connection times for the traveler profile, stopover city appeal, total trip time, price, comfort.
Return ONLY valid JSON, no other text.`
}
