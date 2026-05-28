'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, MapPin, Calendar, Plane, Hotel, Car, MessageSquare, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { useUIStore } from '@/lib/store/uiStore'

function addDays(iso: string, days: number): string {
  const d = new Date(iso)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

function diffDays(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000)
}

interface RawStop {
  city?: string
  country?: string
  countryCode?: string
  arrivalDate?: string
  departureDate?: string
  nights?: number
  stayDays?: number
  cheapestHotel?: unknown
  hotelCostEUR?: number
  [k: string]: unknown
}

/**
 * Sanitize stop dates that may be stored from an older buggy flex-shift pass.
 * Sort by original arrivalDate, then rebuild a consecutive chain from trip.startDate
 * so each stop's departureDate = arrivalDate + nights, no overlaps, no reverse ranges.
 * Preserves each stop's intended `nights` (or computes from raw range, with min 1).
 */
function normalizeStops(stops: RawStop[], tripStartDate: string, tripEndDate: string): RawStop[] {
  if (!Array.isArray(stops) || stops.length === 0) return []

  const tripStart = new Date(tripStartDate).toISOString().slice(0, 10)
  const tripEnd = new Date(tripEndDate).toISOString().slice(0, 10)

  // Sort by original arrivalDate (NaN-tolerant)
  const sorted = [...stops].sort((a, b) => {
    const av = a.arrivalDate ? new Date(a.arrivalDate).getTime() : Infinity
    const bv = b.arrivalDate ? new Date(b.arrivalDate).getTime() : Infinity
    return av - bv
  })

  // Compute intended nights per stop: explicit nights > stayDays > |dep - arr| > 1
  const nightsPer = sorted.map(s => {
    if (typeof s.nights === 'number' && s.nights > 0) return s.nights
    if (typeof s.stayDays === 'number' && s.stayDays > 0) return s.stayDays
    if (s.arrivalDate && s.departureDate) {
      const n = Math.abs(diffDays(s.arrivalDate, s.departureDate))
      if (n > 0) return n
    }
    return 1
  })

  const totalIntended = nightsPer.reduce((a, b) => a + b, 0)
  // Window must fit at least 1 night per stop — never compress below stops.length
  const windowNights = Math.max(sorted.length, totalIntended, diffDays(tripStart, tripEnd))
  // If intended exceeds window, scale down proportionally; if less, leave alone
  const scale = totalIntended > windowNights ? windowNights / totalIntended : 1
  let allocated = nightsPer.map(n => Math.max(1, Math.round(n * scale)))
  let sum = allocated.reduce((a, b) => a + b, 0)
  // Adjust last stop to fit exactly into window if scaled
  if (scale < 1 && sum !== windowNights) {
    allocated[allocated.length - 1] = Math.max(1, allocated[allocated.length - 1] + (windowNights - sum))
    sum = allocated.reduce((a, b) => a + b, 0)
  }

  // Rebuild chain
  let cursor = tripStart
  return sorted.map((s, i) => {
    const nights = allocated[i]
    const arr = cursor
    const dep = addDays(arr, nights)
    cursor = dep
    const newHotelCost = (s.cheapestHotel as { pricePerNightEUR?: number } | undefined)?.pricePerNightEUR
      ? Math.round(((s.cheapestHotel as { pricePerNightEUR: number }).pricePerNightEUR) * nights)
      : s.hotelCostEUR
    return { ...s, arrivalDate: arr, departureDate: dep, nights, hotelCostEUR: newHotelCost }
  })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function TripDetailPage() {
  const { id } = useParams()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [trip, setTrip] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const setChatOpen = useUIStore(s => s.setChatOpen)

  useEffect(() => {
    fetch(`/api/trips/${id}`).then(r => r.json()).then(t => {
      setTrip(t)
      setLoading(false)
    })
  }, [id])

  async function deleteTrip() {
    if (!confirm('Delete this trip?')) return
    await fetch(`/api/trips/${id}`, { method: 'DELETE' })
    toast.success('Trip deleted')
    router.push('/trips')
  }

  if (loading) {
    return <div className="max-w-4xl mx-auto animate-pulse space-y-4">
      {[1, 2, 3].map(i => <div key={i} className="h-32 rounded-2xl bg-gray-100" />)}
    </div>
  }

  if (!trip) return <div className="text-center py-20 text-gray-500">Trip not found</div>

  const rawDestinations = typeof trip.destinations === 'string' ? JSON.parse(trip.destinations) : trip.destinations ?? []
  const destinations = normalizeStops(rawDestinations, trip.startDate, trip.endDate)
  const visaReqs = typeof trip.visaRequirements === 'string' ? JSON.parse(trip.visaRequirements) : trip.visaRequirements
  const vacReqs = typeof trip.vaccinationReqs === 'string' ? JSON.parse(trip.vaccinationReqs) : trip.vaccinationReqs
  const aiRecs = typeof trip.aiRecommendations === 'string' ? JSON.parse(trip.aiRecommendations) : trip.aiRecommendations
  const selectedRouteRaw = typeof trip.selectedRoute === 'string' ? JSON.parse(trip.selectedRoute) : trip.selectedRoute
  const selectedRoute = selectedRouteRaw && Array.isArray(selectedRouteRaw.stops)
    ? { ...selectedRouteRaw, stops: normalizeStops(selectedRouteRaw.stops, trip.startDate, trip.endDate) }
    : selectedRouteRaw
  const selectedAccommodations = typeof trip.selectedAccommodations === 'string' ? JSON.parse(trip.selectedAccommodations) : trip.selectedAccommodations
  const selectedCar = typeof trip.selectedCarRental === 'string' ? JSON.parse(trip.selectedCarRental) : trip.selectedCarRental

  const nights = Math.round((new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / 86400000)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <button onClick={() => router.push('/trips')} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2">
            <ArrowLeft className="h-4 w-4" /> All trips
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            {trip.originCity} → {destinations.map((d) => d.city ?? '').filter(Boolean).join(' & ')}
          </h1>
          <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {new Date(trip.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {new Date(trip.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            <span>{nights} nights</span>
            {trip.datesFlexible && <Badge className="bg-teal-100 text-teal-700">Flexible</Badge>}
          </div>
        </div>
        <button onClick={deleteTrip} className="text-gray-400 hover:text-red-500 p-2">
          <Trash2 className="h-5 w-5" />
        </button>
      </div>

      {/* Planning actions */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Plane, label: 'Flights', href: `/trips/${id}/route`, color: 'bg-sky-50 border-sky-200 text-sky-700', done: !!selectedRoute },
          { icon: Hotel, label: 'Accommodation', href: `/trips/${id}/accommodation`, color: 'bg-violet-50 border-violet-200 text-violet-700', done: !!selectedAccommodations },
          { icon: Car, label: 'Car Rental', href: `/trips/${id}/car-rental`, color: 'bg-orange-50 border-orange-200 text-orange-700', done: !!selectedCar },
        ].map(({ icon: Icon, label, href, color, done }) => (
          <button
            key={label}
            onClick={() => router.push(href)}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all hover:shadow-md ${color}`}
          >
            <Icon className="h-6 w-6" />
            <span className="text-sm font-medium">{label}</span>
            {done && <span className="text-xs">✓ Selected</span>}
          </button>
        ))}
      </div>

      {/* Destinations */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-5">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-teal-500" /> Itinerary
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <div className="h-8 w-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-xs flex-shrink-0">
                DEP
              </div>
              <span className="font-medium text-gray-700">{trip.originCity}</span>
              <span className="text-gray-400 text-xs">{new Date(trip.startDate).toLocaleDateString()}</span>
            </div>
            {destinations.map((d, i: number) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <div className="h-8 w-8 rounded-full bg-sky-100 flex items-center justify-center text-sky-700 font-bold text-xs flex-shrink-0">
                  {i + 1}
                </div>
                <div>
                  <span className="font-medium text-gray-700">{d.city ?? ''}{d.country ? `, ${d.country}` : ''}</span>
                  <div className="text-xs text-gray-400">
                    {d.arrivalDate ? new Date(d.arrivalDate).toLocaleDateString() : ''} – {d.departureDate ? new Date(d.departureDate).toLocaleDateString() : ''}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Flights — outbound + return with full details */}
      {selectedRoute && (selectedRoute.flightsInbound || selectedRoute.flightsOutbound) && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Plane className="h-4 w-4 text-sky-500" /> Flights
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {selectedRoute.flightsInbound && (() => {
                const f = selectedRoute.flightsInbound
                const tripStart = new Date(trip.startDate).toISOString().slice(0, 10)
                const departDate = f.departureDate ?? tripStart
                const arriveDate = f.arrivalDate ?? tripStart
                return (
                  <div className="rounded-xl border border-sky-100 bg-sky-50/40 p-4 text-sm space-y-1.5">
                    <p className="text-[10px] uppercase tracking-wide text-sky-600 font-semibold">Outbound</p>
                    <p className="text-xs text-gray-500">{trip.originCode} → {selectedRoute.arrivalIata}</p>
                    <p className="font-semibold text-base text-gray-900">{f.airline}</p>
                    <p className="text-xs text-gray-600">
                      {f.stops === 0 ? 'Direct' : `${f.stops} stop${f.stops > 1 ? 's' : ''}`}
                      {f.durationMin ? ` · ${Math.floor(f.durationMin/60)}h ${f.durationMin%60}m` : ''}
                    </p>
                    <p className="text-xs text-gray-700">🛫 Depart: {departDate}{f.departureTime ? ` · ${f.departureTime}` : ''}</p>
                    <p className="text-xs text-gray-700">🛬 Arrive: {arriveDate}{f.arrivalTime ? ` · ${f.arrivalTime}` : ''}</p>
                    <p className="font-bold text-teal-700 text-base pt-1">€{f.priceEUR}</p>
                  </div>
                )
              })()}
              {selectedRoute.flightsOutbound && (() => {
                const f = selectedRoute.flightsOutbound
                const tripEnd = new Date(trip.endDate).toISOString().slice(0, 10)
                const departDate = f.departureDate ?? tripEnd
                const arriveDate = f.arrivalDate ?? tripEnd
                return (
                  <div className="rounded-xl border border-orange-100 bg-orange-50/40 p-4 text-sm space-y-1.5">
                    <p className="text-[10px] uppercase tracking-wide text-orange-600 font-semibold">Return</p>
                    <p className="text-xs text-gray-500">{selectedRoute.departureIata} → {trip.originCode}</p>
                    <p className="font-semibold text-base text-gray-900">{f.airline}</p>
                    <p className="text-xs text-gray-600">
                      {f.stops === 0 ? 'Direct' : `${f.stops} stop${f.stops > 1 ? 's' : ''}`}
                      {f.durationMin ? ` · ${Math.floor(f.durationMin/60)}h ${f.durationMin%60}m` : ''}
                    </p>
                    <p className="text-xs text-gray-700">🛫 Depart: {departDate}{f.departureTime ? ` · ${f.departureTime}` : ''}</p>
                    <p className="text-xs text-gray-700">🛬 Arrive: {arriveDate}{f.arrivalTime ? ` · ${f.arrivalTime}` : ''}</p>
                    <p className="font-bold text-teal-700 text-base pt-1">€{f.priceEUR}</p>
                  </div>
                )
              })()}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Accommodation — selected hotels per stop with details */}
      {selectedRoute?.stops?.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Hotel className="h-4 w-4 text-violet-500" /> Accommodation
            </h3>
            <div className="space-y-2">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {selectedRoute.stops.map((s: any, i: number) => (
                <div key={i} className="rounded-xl border border-violet-100 bg-violet-50/30 p-3">
                  <div className="flex items-baseline justify-between mb-1">
                    <span className="font-semibold text-sm text-gray-900">{i + 1}. {s.city}, {s.country}</span>
                    <span className="text-xs text-violet-700">{s.arrivalDate} → {s.departureDate} ({s.nights}n)</span>
                  </div>
                  {s.cheapestHotel ? (
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <div className="min-w-0">
                        <p className="font-medium text-gray-800 truncate">🏨 {s.cheapestHotel.name}</p>
                        <p className="text-gray-500">
                          {s.cheapestHotel.stars ? '⭐'.repeat(s.cheapestHotel.stars) + ' · ' : ''}
                          {s.cheapestHotel.rating ? `${s.cheapestHotel.rating.toFixed(1)}` : ''}
                          {s.cheapestHotel.parking && ' · 🅿️ parking'}
                        </p>
                      </div>
                      <div className="text-right whitespace-nowrap">
                        <p className="font-semibold text-teal-700">€{s.cheapestHotel.pricePerNightEUR}/night</p>
                        <p className="text-gray-500">total €{s.hotelCostEUR ?? s.cheapestHotel.pricePerNightEUR * s.nights}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400">No hotel selected for this stop</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI visa checks */}
      {visaReqs && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <h3 className="font-semibold text-gray-800 mb-3">🛂 Visa Requirements</h3>
            <div className="space-y-2">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {(visaReqs.requirements ?? []).map((req: any, i: number) => (
                <div key={i} className={`flex items-center justify-between p-3 rounded-xl text-sm ${req.visaRequired ? 'bg-orange-50' : 'bg-green-50'}`}>
                  <span className="font-medium">{req.destination}</span>
                  <Badge className={req.visaRequired ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}>
                    {req.visaRequired ? 'Visa required' : 'Visa-free'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI recommendations */}
      {aiRecs?.highlights?.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <h3 className="font-semibold text-gray-800 mb-3">✨ AI Recommendations</h3>
            <ul className="space-y-1.5">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {aiRecs.highlights.map((h: any, i: number) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-teal-500 mt-0.5">•</span>{h}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* AI Chat */}
      <Card className="border-0 shadow-sm bg-gradient-to-r from-teal-50 to-sky-50">
        <CardContent className="p-5 flex items-center justify-between">
          <div>
            <p className="font-semibold text-gray-800">Have questions about this trip?</p>
            <p className="text-sm text-gray-500">Ask the AI assistant anything</p>
          </div>
          <Button onClick={() => setChatOpen(true)} className="bg-teal-600 hover:bg-teal-700">
            <MessageSquare className="h-4 w-4 mr-2" /> Chat
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
