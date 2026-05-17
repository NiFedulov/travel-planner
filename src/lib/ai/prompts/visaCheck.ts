import type { Passport } from '@/lib/types/profile'

export function buildVisaCheckPrompt(
  passports: Passport[],
  destinations: Array<{ country: string; countryCode: string }>,
  startDate: string,
  existingVisas: string[],
): string {
  return `You are a travel visa expert. Analyze visa requirements accurately.

Traveler passports: ${passports.map(p => `${p.country} (${p.countryCode}), expires ${p.expiryDate}`).join(', ')}
Existing visas/permits: ${existingVisas.length > 0 ? existingVisas.join(', ') : 'none'}
Travel start date: ${startDate}
Destinations: ${destinations.map(d => `${d.country} (${d.countryCode})`).join(', ')}

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
  return `You are a travel health expert. Analyze vaccination and health requirements.

Destinations: ${destinations.map(d => `${d.country} (${d.countryCode})`).join(', ')}
Travel dates: ${travelDates.start} to ${travelDates.end}

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
