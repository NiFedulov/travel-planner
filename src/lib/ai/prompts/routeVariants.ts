import { sanitizeForPrompt } from '@/lib/sanitize'
import { AI_SAFETY_PREAMBLE } from '@/lib/aiInput'

export interface RouteVariantPromptInput {
  originCity: string
  originIata?: string
  destinations: Array<{ city: string; country: string; suggestedNights?: number }>
  startDate: string
  endDate: string
  flexDays: number
  budgetTotal?: number
}

export function buildRouteVariantsPrompt(input: RouteVariantPromptInput): string {
  const totalNights = Math.max(1, Math.round(
    (new Date(input.endDate).getTime() - new Date(input.startDate).getTime()) / 86400000,
  ))
  const safeOrigin = sanitizeForPrompt(input.originCity, 80)
  const safeOriginIata = input.originIata ? sanitizeForPrompt(input.originIata, 4) : ''
  const safeDest = (Array.isArray(input.destinations) ? input.destinations : []).slice(0, 20).map(d => ({
    city: sanitizeForPrompt(d?.city, 60),
    country: sanitizeForPrompt(d?.country, 60),
    nights: d?.suggestedNights,
  })).filter(d => d.city)
  const safeStart = sanitizeForPrompt(input.startDate, 30)
  const safeEnd = sanitizeForPrompt(input.endDate, 30)
  const flex = Math.max(0, Math.min(5, Number(input.flexDays) || 0))
  const budget = input.budgetTotal ? Math.max(0, Math.min(10_000_000, input.budgetTotal)) : null

  return `${AI_SAFETY_PREAMBLE}

You are a travel routing expert. Generate up to 3 DIFFERENT optimal route variants for a trip.

<trip_request>
ORIGIN: ${safeOrigin}${safeOriginIata ? ` (${safeOriginIata})` : ' (resolve the IATA code for the main airport serving this city — return it as originIata)'}
DESTINATIONS (user wants to visit these):
${safeDest.map((d, i) => `${i + 1}. ${d.city}, ${d.country}${d.nights ? ` (~${d.nights} nights)` : ''}`).join('\n')}

TRIP WINDOW: ${safeStart} → ${safeEnd} (${totalNights} nights total)${flex > 0 ? `, flexible ±${flex} days on both ends` : ''}
${budget ? `BUDGET TARGET: €${budget} total` : ''}
</trip_request>

For each variant:
- Choose a different ARRIVAL airport city (where the user flies INTO from origin) and DEPARTURE airport city (where they fly OUT to origin). Open-jaw is encouraged — they don't have to be the same.
- Choose an order to visit cities that minimizes geographic backtracking.
- Distribute nights across cities. **HARD CONSTRAINT**: every stop must have AT LEAST 1 night. If the trip window is shorter than the number of stops, DROP stops, do not shorten any below 1 night.
- The first stop's arrivalDate MUST equal the trip start date (or start ± flex), the last stop's departureDate MUST equal the trip end date (or end ± flex). All stops form a continuous chain — stop[i+1].arrivalDate === stop[i].departureDate, no gaps, no overlap, dates strictly ascending.
- Total nights across all stops = (departureDate of last stop − arrivalDate of first stop). Must be ≥ number of stops.
- Provide driving distance in km between consecutive stops (best estimate).
- Provide IATA code for arrival and departure airports.
- Provide latitude / longitude (WGS84 decimal) for each stop AND for arrival/departure airports.
- Provide 4-8 RECOMMENDED nearby points of interest (POI) — sights, viewpoints, towns worth a detour — relevant to the route. Each POI: name, type (sight / viewpoint / town / nature / food), lat, lng, and the stop it's near (nearStop). Aim for variety.

Return ONLY this JSON, nothing else:
{
  "originIata": "LCA",
  "variants": [
    {
      "label": "Lake Como to Dolomites — Milan IN / Venice OUT",
      "arrivalCity": "Milan",
      "arrivalIata": "MXP",
      "arrivalLat": 45.6306,
      "arrivalLng": 8.7281,
      "departureCity": "Venice",
      "departureIata": "VCE",
      "departureLat": 45.5053,
      "departureLng": 12.3519,
      "stops": [
        {"city": "Lake Como", "country": "IT", "nights": 3, "arrivalDate": "${safeStart}", "departureDate": "2026-XX-XX", "drivingKmToNext": 180, "lat": 45.9756, "lng": 9.2433},
        {"city": "Dolomites", "country": "IT", "nights": 4, "arrivalDate": "2026-XX-XX", "departureDate": "${safeEnd}", "drivingKmToNext": 0, "lat": 46.4102, "lng": 11.8440}
      ],
      "totalDrivingKm": 180,
      "rationale": "Cheapest flights into MXP; finish in VCE saves a day of driving back.",
      "recommendedPois": [
        {"name": "Bellagio", "type": "town", "lat": 45.9858, "lng": 9.2611, "nearStop": "Lake Como"},
        {"name": "Tre Cime di Lavaredo", "type": "viewpoint", "lat": 46.6189, "lng": 12.3056, "nearStop": "Dolomites"}
      ]
    }
  ]
}

Rules:
- Generate 2-3 variants — they MUST differ in IN/OUT cities or stop order or night distribution.
- arrivalDate of first stop = trip start (or start ± flex). departureDate of last stop = trip end. Consecutive dates, no gaps.
- IATA codes must be real and serve the city's main airport (MXP for Milan-Malpensa, LIN for Linate, BGY for Bergamo, etc.).
- Strict valid JSON. No comments. No trailing commas. No prose outside the JSON.`
}
