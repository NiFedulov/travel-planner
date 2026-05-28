import { z } from 'zod'

const travelerSchema = z.object({
  name: z.string().trim().max(100).optional(),
  age: z.number().int().min(0).max(120).optional(),
  type: z.string().trim().max(40).optional(),
}).passthrough()

const passportSchema = z.object({
  country: z.string().trim().min(1).max(80),
  number: z.string().trim().max(40).optional().nullable(),
  expiry: z.string().optional().nullable(),
}).passthrough()

export const profileSchema = z.object({
  travelers: z.array(travelerSchema).max(20).optional(),
  vacationStyle: z.array(z.string().max(40)).max(20).optional(),
  travelPace: z.enum(['relaxed', 'moderate', 'fast', 'intensive']).optional(),
  flightClass: z.enum(['economy', 'premium_economy', 'business', 'first']).optional(),
  maxLayovers: z.number().int().min(0).max(3).optional(),
  health: z.record(z.string(), z.unknown()).optional(),
  accommodation: z.record(z.string(), z.unknown()).optional(),
  passports: z.array(passportSchema).max(20).optional(),
  existingVisas: z.array(z.string().max(100)).max(100).optional(),
  existingETAs: z.array(z.string().max(100)).max(100).optional(),
  hasIsraeliStamps: z.boolean().optional(),
  criminalRecord: z.boolean().optional(),
  travelInsurance: z.boolean().optional(),
  budgetTotal: z.number().min(0).max(10_000_000).nullable().optional(),
  budgetCurrency: z.string().trim().length(3).optional(),
  budgetBreakdown: z.record(z.string(), z.unknown()).nullable().optional(),
  cuisinePreferences: z.array(z.string().max(50)).max(50).optional(),
  languagesSpoken: z.array(z.string().max(40)).max(30).optional(),
  loyaltyPrograms: z.array(z.record(z.string(), z.unknown())).max(50).optional(),
  visitedCountries: z.array(z.string().max(80)).max(200).optional(),
  favoriteDestinations: z.array(z.string().max(80)).max(50).optional(),
  minorsTraveling: z.record(z.string(), z.unknown()).nullable().optional(),
  preferredAirlines: z.array(z.string().max(50)).max(30).optional(),
})

export type ProfileInput = z.infer<typeof profileSchema>
