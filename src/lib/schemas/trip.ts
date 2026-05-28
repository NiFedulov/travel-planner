import { z } from 'zod'

// Strict regex для city names — буквы, пробелы, дефис, апостроф, точка, запятая
const cityRegex = /^[\p{L}\s\-',.()]+$/u

const destinationSchema = z.object({
  city: z.string().trim().min(1).max(80).regex(cityRegex, 'Invalid city name'),
  country: z.string().trim().max(80).optional().nullable(),
  iata: z.string().trim().regex(/^[A-Z]{3}$/, 'IATA must be 3 uppercase letters').optional().nullable(),
  nights: z.number().int().min(0).max(60).optional(),
  arrivalDate: z.string().optional().nullable(),
  departureDate: z.string().optional().nullable(),
}).passthrough() // allow extra opaque AI-generated fields; sanitized fields above are what matters

const isoDate = z.string().refine(s => !isNaN(Date.parse(s)), 'Invalid date')

// POST / create — userId set from session, NOT from body
export const createTripSchema = z.object({
  profileId: z.string().cuid(),
  name: z.string().trim().max(120).optional().nullable(),
  originCity: z.string().trim().min(1).max(80),
  originCode: z.string().trim().max(8).optional().nullable(),
  destinations: z.array(destinationSchema).min(1).max(20),
  startDate: isoDate,
  endDate: isoDate,
  datesFlexible: z.boolean().optional(),
  visaRequirements: z.unknown().optional().nullable(),
  vaccinationReqs: z.unknown().optional().nullable(),
  entryRestrictions: z.unknown().optional().nullable(),
  aiRecommendations: z.unknown().optional().nullable(),
  selectedRoute: z.unknown().optional().nullable(),
  selectedAccommodations: z.unknown().optional().nullable(),
  selectedCarRental: z.unknown().optional().nullable(),
  estimatedTotal: z.number().min(0).max(1_000_000).optional().nullable(),
  status: z.enum(['planning', 'booked', 'completed', 'cancelled']).optional(),
  notes: z.string().max(5000).optional().nullable(),
})

// PUT / update — все поля опциональны, userId/profileId не меняются через API
export const updateTripSchema = createTripSchema.partial().omit({ profileId: true })

export type CreateTripInput = z.infer<typeof createTripSchema>
export type UpdateTripInput = z.infer<typeof updateTripSchema>
