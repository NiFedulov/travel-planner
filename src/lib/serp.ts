export class SerpQuotaError extends Error {
  constructor(public message: string, public status: number) {
    super(message)
    this.name = 'SerpQuotaError'
  }
}

function isQuotaError(status: number, body?: { error?: string }): boolean {
  if (status === 401 || status === 429) return true
  if (body?.error && /run out of searches|exceeded|quota|plan/i.test(body.error)) return true
  return false
}

export interface SerpFlightOption {
  airline: string
  flightNumber?: string
  fromCode: string
  toCode: string
  departureTime?: string
  arrivalTime?: string
  durationMin?: number
  stops: number
  priceEUR: number
  bookingLink?: string
}

export interface SerpHotelOption {
  id: string
  name: string
  city: string
  pricePerNightEUR: number
  totalPriceEUR?: number
  rating?: number
  stars?: number
  parking: boolean
  link?: string
  thumbnail?: string
}

const EUR_PER_USD = 0.92

function key(): string | null {
  return process.env.SERPAPI_KEY?.trim() || null
}

function isoCheckPair(checkIn: string, checkOut: string): { check_in_date: string; check_out_date: string } {
  return { check_in_date: checkIn, check_out_date: checkOut }
}

export async function searchFlights(params: {
  originIata: string
  destinationIata: string
  outboundDate: string
  returnDate?: string
  allowMocks?: boolean
}): Promise<SerpFlightOption[]> {
  const apiKey = key()
  if (!apiKey) return mockFlights(params)

  const url = new URL('https://serpapi.com/search.json')
  url.searchParams.set('engine', 'google_flights')
  url.searchParams.set('departure_id', params.originIata)
  url.searchParams.set('arrival_id', params.destinationIata)
  url.searchParams.set('outbound_date', params.outboundDate)
  if (params.returnDate) {
    url.searchParams.set('return_date', params.returnDate)
    url.searchParams.set('type', '1')
  } else {
    url.searchParams.set('type', '2')
  }
  url.searchParams.set('currency', 'EUR')
  url.searchParams.set('hl', 'en')
  url.searchParams.set('api_key', apiKey)

  const res = await fetch(url.toString())
  if (!res.ok) {
    let body: { error?: string } | undefined
    try { body = await res.clone().json() } catch {}
    console.error('serp flights non-200', res.status, body?.error)
    if (isQuotaError(res.status, body) && !params.allowMocks) {
      throw new SerpQuotaError(body?.error ?? 'SerpApi quota exceeded', res.status)
    }
    return mockFlights(params)
  }
  const data = await res.json()
  // Some plans return 200 with {error: '...searches...'} body
  if (data?.error && isQuotaError(200, data) && !params.allowMocks) {
    throw new SerpQuotaError(data.error, 200)
  }
  const best = data.best_flights ?? data.other_flights ?? []
  return best.slice(0, 6).map((row: { flights: Array<{ airline: string; flight_number?: string; departure_airport?: { time?: string }; arrival_airport?: { time?: string } }>; total_duration?: number; price?: number; booking_token?: string }) => {
    const first = row.flights[0]
    const last = row.flights[row.flights.length - 1]
    return {
      airline: first?.airline ?? 'Unknown',
      flightNumber: first?.flight_number,
      fromCode: params.originIata,
      toCode: params.destinationIata,
      departureTime: first?.departure_airport?.time,
      arrivalTime: last?.arrival_airport?.time,
      durationMin: row.total_duration,
      stops: Math.max(0, row.flights.length - 1),
      priceEUR: typeof row.price === 'number' ? row.price : 0,
      bookingLink: row.booking_token ? `https://serpapi.com/booking?token=${row.booking_token}` : undefined,
    } satisfies SerpFlightOption
  })
}

export async function searchHotels(params: {
  city: string
  checkIn: string
  checkOut: string
  needsParking?: boolean
  maxPricePerNight?: number
  maxStars?: number
  minStars?: number
  allowMocks?: boolean
}): Promise<SerpHotelOption[]> {
  const apiKey = key()
  if (!apiKey) return mockHotels(params)

  const url = new URL('https://serpapi.com/search.json')
  url.searchParams.set('engine', 'google_hotels')
  url.searchParams.set('q', `${params.city} hotels`)
  const dates = isoCheckPair(params.checkIn, params.checkOut)
  url.searchParams.set('check_in_date', dates.check_in_date)
  url.searchParams.set('check_out_date', dates.check_out_date)
  url.searchParams.set('currency', 'EUR')
  url.searchParams.set('hl', 'en')
  if (params.needsParking) url.searchParams.set('amenities', '6')
  if (params.maxPricePerNight) url.searchParams.set('max_price', String(params.maxPricePerNight))
  url.searchParams.set('api_key', apiKey)

  const res = await fetch(url.toString())
  if (!res.ok) {
    let body: { error?: string } | undefined
    try { body = await res.clone().json() } catch {}
    console.error('serp hotels non-200', res.status, body?.error)
    if (isQuotaError(res.status, body) && !params.allowMocks) {
      throw new SerpQuotaError(body?.error ?? 'SerpApi quota exceeded', res.status)
    }
    return mockHotels(params)
  }
  const data = await res.json()
  if (data?.error && isQuotaError(200, data) && !params.allowMocks) {
    throw new SerpQuotaError(data.error, 200)
  }
  const props = data.properties ?? []
  const nights = Math.max(1, Math.round((new Date(params.checkOut).getTime() - new Date(params.checkIn).getTime()) / 86400000))
  const mapped: SerpHotelOption[] = props.map((p: { property_token?: string; name?: string; rate_per_night?: { extracted_lowest?: number }; total_rate?: { extracted_lowest?: number }; overall_rating?: number; hotel_class?: string; amenities?: string[]; link?: string; images?: Array<{ thumbnail?: string }> }, i: number) => {
    const totalLowest = p.total_rate?.extracted_lowest
    const perNight = p.rate_per_night?.extracted_lowest
      ?? (totalLowest ? Math.round(totalLowest / nights) : 0)
    return {
      id: p.property_token ?? `serp-${i}`,
      name: p.name ?? 'Hotel',
      city: params.city,
      pricePerNightEUR: perNight,
      totalPriceEUR: totalLowest ?? perNight * nights,
      rating: p.overall_rating,
      stars: p.hotel_class ? parseInt(String(p.hotel_class).match(/\d/)?.[0] ?? '0', 10) : undefined,
      parking: (p.amenities ?? []).some(a => /parking/i.test(a)),
      link: p.link,
      thumbnail: p.images?.[0]?.thumbnail,
    } satisfies SerpHotelOption
  })

  // Apply filters: drop unpriced, optional parking, optional star range
  const onlyPriced = mapped.filter(h => h.pricePerNightEUR > 0)
  const withParking = params.needsParking ? onlyPriced.filter(h => h.parking) : onlyPriced
  const inStarRange = withParking.filter(h => {
    if (params.maxStars !== undefined && h.stars !== undefined && h.stars > params.maxStars) return false
    if (params.minStars !== undefined && h.stars !== undefined && h.stars < params.minStars) return false
    return true
  })

  // If star filter wipes everything, relax it (better to show something than nothing)
  const final = inStarRange.length > 0 ? inStarRange : withParking
  return final.slice(0, 8)
}

// ─── Mock fallback ────────────────────────────────────────────────────────────

function hashCode(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

function mockFlights(params: { originIata: string; destinationIata: string; outboundDate: string; returnDate?: string }): SerpFlightOption[] {
  const seed = hashCode(`${params.originIata}-${params.destinationIata}-${params.outboundDate}`)
  const base = 60 + (seed % 220)
  const carriers = ['Ryanair', 'Wizz Air', 'easyJet', 'Lufthansa', 'KLM']
  return Array.from({ length: 4 }, (_, i) => ({
    airline: carriers[(seed + i) % carriers.length],
    flightNumber: `${carriers[(seed + i) % carriers.length].slice(0, 2).toUpperCase()}${1000 + ((seed + i * 7) % 9000)}`,
    fromCode: params.originIata,
    toCode: params.destinationIata,
    departureTime: `0${6 + i}:30`.slice(-5),
    arrivalTime: `${9 + i}:45`,
    durationMin: 150 + i * 30,
    stops: i === 3 ? 1 : 0,
    priceEUR: Math.round(base + i * 35 + (params.returnDate ? 60 : 0)),
  }))
}

function mockHotels(params: { city: string; checkIn: string; checkOut: string; needsParking?: boolean }): SerpHotelOption[] {
  const seed = hashCode(`${params.city}-${params.checkIn}`)
  const cheapBase = 55 + (seed % 90)
  const names = ['Hotel Aurora', 'B&B Centro', 'Villa Bella', 'Locanda del Lago', 'Albergo Stella', 'Garni Alpenblick']
  const nights = Math.max(1, Math.round((new Date(params.checkOut).getTime() - new Date(params.checkIn).getTime()) / 86400000))
  return Array.from({ length: 6 }, (_, i) => {
    const pricePerNight = cheapBase + i * 20 + (i % 2 === 0 ? 5 : 0)
    return {
      id: `mock-${params.city.toLowerCase()}-${i}`,
      name: `${names[(seed + i) % names.length]} ${params.city}`,
      city: params.city,
      pricePerNightEUR: pricePerNight,
      totalPriceEUR: pricePerNight * nights,
      rating: 7.5 + (i % 3) * 0.4,
      stars: 2 + (i % 4),
      parking: true,
    }
  })
}
