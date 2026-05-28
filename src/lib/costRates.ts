export const COST_RATES = {
  CAR_PER_DAY: 40,
  FUEL_PER_KM: 0.18,
  FOOD_PER_DAY: 30,
  SIGHTS_PER_DAY: 15,
  TOLLS_PER_100KM: 8,
} as const

export interface RouteCostBreakdown {
  flights: number
  hotels: number
  car: number
  fuelAndTolls: number
  food: number
  sights: number
  total: number
}

export interface RouteCostInput {
  nights: number
  drivingKm?: number
  needsCar?: boolean
  flightsCost: number
  hotelsCost: number
}

export function calcRouteCost(input: RouteCostInput): RouteCostBreakdown {
  const days = Math.max(1, input.nights)
  const km = input.drivingKm ?? 0
  const car = input.needsCar === false ? 0 : Math.round(COST_RATES.CAR_PER_DAY * days)
  const fuel = Math.round(km * COST_RATES.FUEL_PER_KM)
  const tolls = Math.round((km / 100) * COST_RATES.TOLLS_PER_100KM)
  const food = Math.round(COST_RATES.FOOD_PER_DAY * days)
  const sights = Math.round(COST_RATES.SIGHTS_PER_DAY * days)
  const flights = Math.round(input.flightsCost)
  const hotels = Math.round(input.hotelsCost)

  return {
    flights,
    hotels,
    car,
    fuelAndTolls: fuel + tolls,
    food,
    sights,
    total: flights + hotels + car + fuel + tolls + food + sights,
  }
}
