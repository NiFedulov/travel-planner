export interface Destination {
  city: string
  country: string
  countryCode: string
  arrivalDate: string
  departureDate: string
  nights: number
}

export interface VisaRequirement {
  country: string
  countryCode: string
  required: boolean
  type: string | null
  processingDays?: number
  cost?: number
  notes: string
  confidence: 'high' | 'medium' | 'low'
}

export interface VaccinationRequirement {
  vaccine: string
  country: string
  required: boolean
  recommended: boolean
  notes: string
}

export interface EntryRestriction {
  type:
    | 'passport_validity'
    | 'blank_pages'
    | 'eta'
    | 'proof_of_funds'
    | 'return_ticket'
    | 'insurance'
    | 'other'
  country: string
  description: string
  severity: 'blocking' | 'warning' | 'info'
}

export interface RouteSegment {
  fromCode: string
  fromCity: string
  toCode: string
  toCity: string
  airline: string
  flightNumber: string
  departureTime: string
  arrivalTime: string
  durationMin: number
  priceEconomy: number
  priceBusiness: number
  transitVisaRequired: boolean
  transitType?: 'airside' | 'landside'
}

export type RouteType = 'direct' | 'layover' | 'stopover'

export interface RouteOption {
  id: string
  type: RouteType
  segments: RouteSegment[]
  totalDurationMin: number
  totalPrice: number
  layoverCode?: string
  layoverCity?: string
  layoverCountry?: string
  layoverDurationMin?: number
  stopoverNights?: number
  stopoverHotelPrice?: number
  directComparativePrice?: number
  savings?: number
  savingsPercent?: number
  score: number
  aiRank?: number
  aiExplanation?: string
  badges: string[]
}

export interface SelectedAccommodation {
  destinationCity: string
  hotelId: string
  hotelName: string
  nights: number
  pricePerNight: number
  totalPrice: number
  checkIn: string
  checkOut: string
}

export interface SelectedCarRental {
  carId: string
  company: string
  model: string
  category: string
  pickupCity: string
  dropoffCity: string
  pickupDate: string
  dropoffDate: string
  days: number
  pricePerDay: number
  crossBorderFee: number
  totalPrice: number
}

export interface AITripRecommendation {
  overview: string
  itinerary: string[]
  budgetBreakdown: {
    flights: number
    accommodation: number
    food: number
    activities: number
    carRental: number
    total: number
  }
  tips: string[]
  warnings: string[]
  bestTimeToVisit?: string
}

export type TripStatus = 'planning' | 'booked' | 'completed' | 'cancelled'

export interface Trip {
  id: string
  profileId: string
  name: string
  originCity: string
  originCode: string
  destinations: Destination[]
  startDate: string
  endDate: string
  datesFlexible: boolean
  visaRequirements?: VisaRequirement[]
  vaccinationReqs?: VaccinationRequirement[]
  entryRestrictions?: EntryRestriction[]
  selectedRoute?: RouteOption
  selectedAccommodations?: SelectedAccommodation[]
  selectedCarRental?: SelectedCarRental
  aiRecommendations?: AITripRecommendation
  estimatedTotal?: number
  status: TripStatus
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface MockFlight {
  id: string
  fromCode: string
  fromCity: string
  fromCountry: string
  toCode: string
  toCity: string
  toCountry: string
  airline: string
  flightNumber: string
  departureTime: string
  arrivalTime: string
  durationMin: number
  stops: number
  layoverCode?: string | null
  layoverCity?: string | null
  layoverCountry?: string | null
  layoverMin?: number | null
  transitVisa: boolean
  priceEconomy: number
  priceBusiness: number
  priceFirst: number
  seatsLeft: number
  isStopover: boolean
  stopoverNights?: number | null
}

export interface MockHotel {
  id: string
  city: string
  country: string
  name: string
  stars: number
  type: string
  pricePerNight: number
  petFriendly: boolean
  wheelchairAccess: boolean
  breakfastIncl: boolean
  parking: boolean
  pool: boolean
  gym: boolean
  wifi: boolean
  distanceCenter: number
  rating: number
  reviewCount: number
  imageSlug: string
  address: string
}

export interface MockCar {
  id: string
  city: string
  country: string
  company: string
  model: string
  category: string
  seats: number
  automatic: boolean
  pricePerDay: number
  crossBorderAllowed: boolean
  crossBorderFee: number
  unlimitedMiles: boolean
  deposit: number
  minAge: number
  airportPickup: boolean
  imageSlug: string
}
