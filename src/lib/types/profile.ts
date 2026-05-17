export type TravelerType = 'adult' | 'child' | 'infant'

export interface Traveler {
  type: TravelerType
  age?: number
}

export interface HealthInfo {
  mobilityIssues: boolean
  requiresWheelchairAccess: boolean
  dietaryRestrictions: string[]
  allergies: string[]
  medicalConditions: string[]
  travelingWithPets: boolean
  petType?: string
}

export type VacationStyleType =
  | 'beach'
  | 'hiking'
  | 'cultural'
  | 'adventure'
  | 'spa'
  | 'city'
  | 'nature'
  | 'wine'
  | 'gastronomy'

export type TravelPace = 'slow' | 'moderate' | 'fast'

export type FlightClass = 'economy' | 'premium_economy' | 'business' | 'first'

export type AccommodationType =
  | 'hotel'
  | 'hostel'
  | 'airbnb'
  | 'resort'
  | 'boutique'
  | 'camping'

export interface AccommodationPrefs {
  types: AccommodationType[]
  minStars: number
  petFriendly: boolean
  mustHavePool: boolean
  mustHaveParking: boolean
  breakfastIncluded: boolean
}

export interface Passport {
  country: string
  countryCode: string
  expiryDate: string
  blankPages: number
}

export interface LoyaltyProgram {
  program: string
  airline?: string
  memberId?: string
  tier?: string
}

export interface BudgetBreakdown {
  flights: number
  accommodation: number
  food: number
  activities: number
  transport: number
}

export interface MinorsTravelingInfo {
  withBothParents: boolean
  hasConsentLetter: boolean
}

export interface TouristProfile {
  id: string
  travelers: Traveler[]
  vacationStyle: VacationStyleType[]
  travelPace: TravelPace
  flightClass: FlightClass
  maxLayovers: number
  health: HealthInfo
  accommodation: AccommodationPrefs
  passports: Passport[]
  existingVisas: string[]
  existingETAs: string[]
  hasIsraeliStamps: boolean
  criminalRecord: boolean
  travelInsurance: boolean
  budgetTotal?: number
  budgetCurrency: string
  budgetBreakdown?: BudgetBreakdown
  cuisinePreferences: string[]
  languagesSpoken: string[]
  loyaltyPrograms: LoyaltyProgram[]
  visitedCountries: string[]
  favoriteDestinations: string[]
  minorsTraveling?: MinorsTravelingInfo
  preferredAirlines: string[]
  createdAt: string
  updatedAt: string
}
