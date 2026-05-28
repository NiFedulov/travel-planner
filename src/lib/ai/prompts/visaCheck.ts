import type { Passport } from '@/lib/types/profile'
import { sanitizeForPrompt, sanitizeArray } from '@/lib/sanitize'
import { AI_SAFETY_PREAMBLE } from '@/lib/aiInput'

export function buildVisaCheckPrompt(
  passports: Passport[],
  destinations: Array<{ country: string; countryCode: string }>,
  startDate: string,
  existingVisas: string[],
): string {
  const safePassports = (Array.isArray(passports) ? passports : []).slice(0, 20).map(p => ({
    country: sanitizeForPrompt(p?.country, 80),
    code: sanitizeForPrompt(p?.countryCode, 4),
    expiry: sanitizeForPrompt(p?.expiryDate, 30),
  })).filter(p => p.country)
  const safeDest = (Array.isArray(destinations) ? destinations : []).slice(0, 20).map(d => ({
    country: sanitizeForPrompt(d?.country, 80),
    code: sanitizeForPrompt(d?.countryCode, 4),
  })).filter(d => d.country)
  const safeVisas = sanitizeArray(existingVisas, 50, 100)

  return `${AI_SAFETY_PREAMBLE}

You are a travel visa expert. Analyze visa requirements accurately.

<traveler_data>
Passports: ${safePassports.map(p => `${p.country} (${p.code}), expires ${p.expiry}`).join(', ') || 'none'}
Existing visas/permits: ${safeVisas.length > 0 ? safeVisas.join(', ') : 'none'}
Travel start date: ${sanitizeForPrompt(startDate, 30)}
Destinations: ${safeDest.map(d => `${d.country} (${d.code})`).join(', ')}
</traveler_data>

For each destination, return a JSON array with this exact structure:
[
  {
    "country": "Italy",
    "countryCode": "IT",
    "required": false,
    "type": null,
    "processingDays": null,
    "cost": null,
    "notes": "EU Schengen zone — free entry for Cypriot passports",
    "confidence": "high"
  }
]

Rules:
- "required": true if a visa or special permit is needed
- "type": visa type (e.g., "tourist", "schengen", "e-visa", "eta") or null if not required
- "confidence": "high" if certain, "medium" if likely, "low" if uncertain
- Always include a disclaimer in "notes" to verify with official embassy
- Return ONLY valid JSON array, no other text`
}

export function buildHealthCheckPrompt(
  destinations: Array<{ country: string; countryCode: string }>,
  travelDates: { start: string; end: string },
): string {
  const safeDest = (Array.isArray(destinations) ? destinations : []).slice(0, 20).map(d => ({
    country: sanitizeForPrompt(d?.country, 80),
    code: sanitizeForPrompt(d?.countryCode, 4),
  })).filter(d => d.country)

  return `${AI_SAFETY_PREAMBLE}

You are a travel health expert. Analyze vaccination and health requirements.

<trip_data>
Destinations: ${safeDest.map(d => `${d.country} (${d.code})`).join(', ')}
Travel dates: ${sanitizeForPrompt(travelDates?.start, 30)} to ${sanitizeForPrompt(travelDates?.end, 30)}
</trip_data>

Return a JSON array of health requirements:
[
  {
    "vaccine": "Yellow Fever",
    "country": "Brazil",
    "required": true,
    "recommended": true,
    "notes": "Required if arriving from endemic country. Recommended for jungle areas."
  }
]

Include: mandatory vaccines, strongly recommended vaccines, malaria prophylaxis if relevant, food/water safety notes.
Return ONLY valid JSON array, no other text.`
}
