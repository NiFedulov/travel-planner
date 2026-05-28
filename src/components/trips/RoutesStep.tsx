'use client'
import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { toast } from 'sonner'
import { Loader2, RefreshCw, AlertTriangle, Check, Plane, Hotel, Car, Utensils, Camera, Fuel } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

const RouteMap = dynamic(() => import('@/components/trips/RouteMap'), {
  ssr: false,
  loading: () => (
    <div className="rounded-xl border border-gray-200 bg-gray-50 h-[280px] flex items-center justify-center text-xs text-gray-400">
      Loading map…
    </div>
  ),
})

export interface RouteStop {
  city: string
  country: string
  nights: number
  arrivalDate: string
  departureDate: string
  drivingKmToNext?: number
  lat?: number
  lng?: number
  cheapestHotel?: HotelOption
  hotelCandidates: HotelOption[]
  hotelCostEUR: number
}

export interface HotelOption {
  id: string
  name: string
  pricePerNightEUR: number
  rating?: number
  stars?: number
  parking: boolean
}

export interface FlightSummary {
  airline: string
  priceEUR: number
  durationMin?: number
  stops: number
  departureDate?: string
  departureTime?: string
  arrivalDate?: string
  arrivalTime?: string
}

export interface CostBreakdown {
  flights: number
  hotels: number
  car: number
  fuelAndTolls: number
  food: number
  sights: number
  total: number
}

export interface RoutePoi {
  name: string
  type?: string
  lat: number
  lng: number
  nearStop?: string
}

export interface RouteVariant {
  label: string
  arrivalCity: string
  arrivalIata: string
  arrivalLat?: number
  arrivalLng?: number
  departureCity: string
  departureIata: string
  departureLat?: number
  departureLng?: number
  stops: RouteStop[]
  recommendedPois?: RoutePoi[]
  totalDrivingKm?: number
  rationale?: string
  flexShift?: { outDays: number; retDays: number; extraNights: number }
  flightsInbound?: FlightSummary
  flightsOutbound?: FlightSummary
  costBreakdown: CostBreakdown
  overBudget: boolean
}

interface Props {
  originCity: string
  destinations: Array<{ city: string; country: string; countryCode: string; stayDays?: number }>
  startDate: string
  endDate: string
  flexDays: number
  budgetTotal?: number | null
  accommodation?: { minStars?: number; mustHaveParking?: boolean } | null
  selectedVariantIndex: number | null
  onSelectVariant: (idx: number, variant: RouteVariant) => void
  onOriginIataResolved?: (iata: string) => void
}

export function RoutesStep({
  originCity, destinations, startDate, endDate, flexDays, budgetTotal, accommodation,
  selectedVariantIndex, onSelectVariant, onOriginIataResolved,
}: Props) {
  const [variants, setVariants] = useState<RouteVariant[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [openIdx, setOpenIdx] = useState<number | null>(null)
  const [hotelOverrides, setHotelOverrides] = useState<Record<string, string>>({})
  const [quotaInfo, setQuotaInfo] = useState<{ provider: string; message: string } | null>(null)
  const [usingMocks, setUsingMocks] = useState(false)

  async function load(allowMocks = false) {
    setLoading(true); setError(null)
    try {
      const res = await fetch('/api/ai/route-variants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originCity,
          destinations: destinations.map(d => ({
            city: d.city, country: d.country, suggestedNights: d.stayDays,
          })),
          startDate, endDate, flexDays, budgetTotal,
          accommodation: accommodation ?? undefined,
          allowMocks,
        }),
      })
      const json = await res.json()
      if (json.quotaExceeded) {
        setQuotaInfo({ provider: json.provider ?? 'SerpApi', message: json.message ?? 'Quota exceeded' })
        setLoading(false)
        return
      }
      if (!res.ok || json.error) throw new Error(json.error ?? 'Failed')
      setVariants(json.variants ?? [])
      if (allowMocks) setUsingMocks(true)
      if (json.originIata && onOriginIataResolved) onOriginIataResolved(json.originIata)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to build routes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function switchHotel(routeIdx: number, stopIdx: number, hotel: HotelOption) {
    const key = `${routeIdx}-${stopIdx}`
    setHotelOverrides(prev => ({ ...prev, [key]: hotel.id }))
    setVariants(prev => prev.map((v, vi) => {
      if (vi !== routeIdx) return v
      const newStops = v.stops.map((s, si) => {
        if (si !== stopIdx) return s
        return {
          ...s,
          cheapestHotel: hotel,
          hotelCostEUR: Math.round(hotel.pricePerNightEUR * s.nights),
        }
      })
      const hotelsCost = newStops.reduce((sum, s) => sum + s.hotelCostEUR, 0)
      const newTotal = v.costBreakdown.flights + hotelsCost + v.costBreakdown.car + v.costBreakdown.fuelAndTolls + v.costBreakdown.food + v.costBreakdown.sights
      return {
        ...v,
        stops: newStops,
        costBreakdown: { ...v.costBreakdown, hotels: hotelsCost, total: newTotal },
        overBudget: !!budgetTotal && newTotal > budgetTotal,
      }
    }))
  }

  function pickRoute(idx: number) {
    onSelectVariant(idx, variants[idx])
    setOpenIdx(null)
    toast.success(`Route "${variants[idx].label}" selected`)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Choose your route 🗺️</h2>
          <p className="text-sm text-gray-500">
            {budgetTotal ? <>Target budget €{budgetTotal} — over-budget routes are flagged.</> : 'Variants sorted by total cost.'}
          </p>
        </div>
        {!loading && (
          <Button variant="outline" size="sm" onClick={() => load()} className="text-xs h-8">
            <RefreshCw className="h-3 w-3 mr-1" /> Rebuild
          </Button>
        )}
      </div>

      {loading && (
        <div className="text-center py-10 space-y-2">
          <Loader2 className="h-7 w-7 animate-spin text-teal-500 mx-auto" />
          <p className="text-sm text-gray-500">Generating route variants & live prices…</p>
          <p className="text-xs text-gray-400">5 routes × flights × hotels — usually 20-30s</p>
        </div>
      )}

      {usingMocks && !loading && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <span>Live prices unavailable — showing estimated prices. Actual flight/hotel costs may differ.</span>
        </div>
      )}

      {error && !loading && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 p-4 text-sm text-rose-700">
          <p className="font-semibold mb-1">Failed to build routes</p>
          <p className="text-xs">{error}</p>
          <button onClick={() => load()} className="text-xs underline mt-2">Try again</button>
        </div>
      )}

      {!loading && variants.length > 0 && (
        <div className="space-y-3">
          {variants.map((v, idx) => {
            const isSelected = selectedVariantIndex === idx
            return (
              <div
                key={idx}
                className={`rounded-2xl border-2 p-4 transition-all ${
                  isSelected
                    ? 'border-teal-500 bg-teal-50/40 shadow-md'
                    : v.overBudget
                      ? 'border-rose-200 bg-rose-50/30'
                      : 'border-gray-200 bg-white hover:border-teal-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-gray-900">{v.label}</span>
                      {v.overBudget && (
                        <Badge className="bg-rose-100 text-rose-700 text-xs gap-1">
                          <AlertTriangle className="h-3 w-3" /> Over budget
                        </Badge>
                      )}
                      {isSelected && (
                        <Badge className="bg-teal-600 text-white text-xs gap-1">
                          <Check className="h-3 w-3" /> Selected
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      ✈️ {v.arrivalIata} → {v.departureIata} · 🛏 {v.stops.length} cities · 🚗 {v.totalDrivingKm ?? 0} km
                    </p>
                    {(() => {
                      const start = v.stops[0]?.arrivalDate
                      const end = v.stops[v.stops.length - 1]?.departureDate
                      const totalNights = v.stops.reduce((sum, st) => sum + (st.nights ?? 0), 0)
                      const totalDays = totalNights + 1
                      return (
                        <p className="text-xs text-gray-700 mt-0.5 font-medium">
                          📅 {start} → {end} <span className="text-gray-500 font-normal">· {totalDays} days / {totalNights} nights</span>
                          {v.flexShift && (v.flexShift.outDays !== 0 || v.flexShift.retDays !== 0) && (
                            <span className="ml-1 text-teal-700 font-normal">
                              (flex: {v.flexShift.outDays > 0 ? '+' : ''}{v.flexShift.outDays}d / {v.flexShift.retDays > 0 ? '+' : ''}{v.flexShift.retDays}d)
                            </span>
                          )}
                        </p>
                      )
                    })()}
                    {v.rationale && <p className="text-xs text-gray-500 mt-1 italic">{v.rationale}</p>}
                  </div>
                  <div className="text-right">
                    <div className={`text-xl font-bold ${v.overBudget ? 'text-rose-600' : 'text-teal-700'}`}>
                      €{v.costBreakdown.total}
                    </div>
                    {budgetTotal && (
                      <div className="text-[10px] text-gray-400">budget €{budgetTotal}</div>
                    )}
                  </div>
                </div>

                {(v.flightsInbound || v.flightsOutbound) && (
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    {v.flightsInbound && (
                      <div className="rounded-lg border border-sky-100 bg-sky-50/40 px-2 py-1.5 text-[11px]">
                        <p className="text-[9px] uppercase tracking-wide text-sky-700 font-semibold">Outbound · {v.arrivalIata}</p>
                        <p className="text-gray-800 font-medium">{v.flightsInbound.airline} · {v.flightsInbound.stops === 0 ? 'Direct' : `${v.flightsInbound.stops} stop`} · €{v.flightsInbound.priceEUR}</p>
                        <p className="text-gray-500">
                          🛫 {v.flightsInbound.departureDate}{v.flightsInbound.departureTime ? ` ${v.flightsInbound.departureTime}` : ''}
                          {' → '}
                          🛬 {v.flightsInbound.arrivalTime ?? ''}
                        </p>
                      </div>
                    )}
                    {v.flightsOutbound && (
                      <div className="rounded-lg border border-orange-100 bg-orange-50/40 px-2 py-1.5 text-[11px]">
                        <p className="text-[9px] uppercase tracking-wide text-orange-700 font-semibold">Return · {v.departureIata}</p>
                        <p className="text-gray-800 font-medium">{v.flightsOutbound.airline} · {v.flightsOutbound.stops === 0 ? 'Direct' : `${v.flightsOutbound.stops} stop`} · €{v.flightsOutbound.priceEUR}</p>
                        <p className="text-gray-500">
                          🛫 {v.flightsOutbound.departureDate}{v.flightsOutbound.departureTime ? ` ${v.flightsOutbound.departureTime}` : ''}
                          {' → '}
                          🛬 {v.flightsOutbound.arrivalTime ?? ''}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-3 gap-x-2 gap-y-1 text-[11px] text-gray-600 mb-3">
                  <span>✈ Flights €{v.costBreakdown.flights}</span>
                  <span>🏨 Hotels €{v.costBreakdown.hotels}</span>
                  <span>🚗 Car €{v.costBreakdown.car}</span>
                  <span>⛽ Fuel+tolls €{v.costBreakdown.fuelAndTolls}</span>
                  <span>🍽 Food €{v.costBreakdown.food}</span>
                  <span>🎫 Sights €{v.costBreakdown.sights}</span>
                </div>

                <div className="flex gap-2">
                  <Button onClick={() => setOpenIdx(idx)} variant="outline" size="sm" className="text-xs h-8 flex-1">
                    Open details
                  </Button>
                  <Button
                    onClick={() => pickRoute(idx)}
                    size="sm"
                    className={`text-xs h-8 flex-1 ${isSelected ? 'bg-teal-700 hover:bg-teal-700' : 'bg-teal-600 hover:bg-teal-700'}`}
                  >
                    {isSelected ? '✓ Selected' : 'Select this route'}
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── DETAILS MODAL ── */}
      <Dialog open={openIdx !== null} onOpenChange={o => !o && setOpenIdx(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {openIdx !== null && variants[openIdx] && (
            <RouteDetails
              variant={variants[openIdx]}
              budgetTotal={budgetTotal}
              onHotelSwap={(stopIdx, hotel) => switchHotel(openIdx, stopIdx, hotel)}
              onSelect={() => pickRoute(openIdx)}
              hotelOverrides={hotelOverrides}
              routeIdx={openIdx}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* ── QUOTA-EXCEEDED MODAL ── */}
      <Dialog open={quotaInfo !== null} onOpenChange={o => !o && setQuotaInfo(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              {quotaInfo?.provider} account has run out of searches
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm text-gray-700">
            <p>{quotaInfo?.message}</p>
            <p className="text-xs text-gray-500">
              Live flight & hotel prices are unavailable. You can continue with <b>estimated prices</b> (deterministic mock data based on routes &amp; dates), or stop and add SerpApi credits.
            </p>
          </div>
          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setQuotaInfo(null)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={() => { setQuotaInfo(null); load(true) }}
              className="flex-1 bg-amber-500 hover:bg-amber-600 text-white"
            >
              Continue with estimated prices
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function RouteDetails({
  variant, budgetTotal, onHotelSwap, onSelect, hotelOverrides, routeIdx,
}: {
  variant: RouteVariant
  budgetTotal?: number | null
  onHotelSwap: (stopIdx: number, hotel: HotelOption) => void
  onSelect: () => void
  hotelOverrides: Record<string, string>
  routeIdx: number
}) {
  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-lg flex items-center gap-2">
          {variant.label}
          {variant.overBudget && (
            <Badge className="bg-rose-100 text-rose-700 text-xs gap-1">
              <AlertTriangle className="h-3 w-3" /> Over budget
            </Badge>
          )}
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-4">
        {/* Map */}
        <RouteMap
          arrival={variant.arrivalLat !== undefined && variant.arrivalLng !== undefined
            ? { city: variant.arrivalCity, iata: variant.arrivalIata, lat: variant.arrivalLat, lng: variant.arrivalLng }
            : undefined}
          departure={variant.departureLat !== undefined && variant.departureLng !== undefined
            ? { city: variant.departureCity, iata: variant.departureIata, lat: variant.departureLat, lng: variant.departureLng }
            : undefined}
          stops={variant.stops
            .filter(s => s.lat !== undefined && s.lng !== undefined)
            .map(s => ({ city: s.city, lat: s.lat!, lng: s.lng!, nights: s.nights }))}
          pois={(variant.recommendedPois ?? []).map(p => ({ name: p.name, type: p.type, lat: p.lat, lng: p.lng }))}
        />

        {/* Cost table */}
        <div className="rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500">
              <tr><th className="text-left p-2">Category</th><th className="text-right p-2">EUR</th></tr>
            </thead>
            <tbody className="text-gray-700">
              <CostRow icon={<Plane className="h-3.5 w-3.5" />} label="Flights" value={variant.costBreakdown.flights} />
              <CostRow icon={<Hotel className="h-3.5 w-3.5" />} label={`Hotels (${variant.stops.length} cities)`} value={variant.costBreakdown.hotels} />
              <CostRow icon={<Car className="h-3.5 w-3.5" />} label="Car rental" value={variant.costBreakdown.car} />
              <CostRow icon={<Fuel className="h-3.5 w-3.5" />} label={`Fuel + tolls (~${variant.totalDrivingKm ?? 0} km)`} value={variant.costBreakdown.fuelAndTolls} />
              <CostRow icon={<Utensils className="h-3.5 w-3.5" />} label="Food" value={variant.costBreakdown.food} />
              <CostRow icon={<Camera className="h-3.5 w-3.5" />} label="Sights" value={variant.costBreakdown.sights} />
              <tr className="border-t-2 border-gray-200 font-bold">
                <td className="p-2">TOTAL</td>
                <td className={`text-right p-2 ${variant.overBudget ? 'text-rose-600' : 'text-teal-700'}`}>
                  €{variant.costBreakdown.total}
                  {budgetTotal && (
                    <span className="font-normal text-xs text-gray-500 ml-2">/ €{budgetTotal} budget</span>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Flights */}
        <div className="grid grid-cols-2 gap-2">
          <FlightCard title="Outbound" code={`${'origin → '}${variant.arrivalIata}`} flight={variant.flightsInbound} />
          <FlightCard title="Return" code={`${variant.departureIata} → origin`} flight={variant.flightsOutbound} />
        </div>

        {/* Stops with hotel swap */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold text-gray-700">Itinerary · {variant.stops.length} stops</Label>
          {variant.stops.map((s, i) => (
            <div key={i} className="rounded-xl border border-gray-200 p-3 bg-white">
              <div className="flex items-baseline justify-between mb-2">
                <div>
                  <span className="font-semibold text-sm text-gray-900">{i + 1}. {s.city}, {s.country}</span>
                  <span className="text-xs text-gray-500 ml-2">{s.arrivalDate} → {s.departureDate} ({s.nights}n)</span>
                </div>
                <span className="text-xs font-medium text-teal-700">€{s.hotelCostEUR}</span>
              </div>

              {s.cheapestHotel && (
                <div className="rounded-lg bg-teal-50/60 border border-teal-100 p-2 mb-2 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="font-medium text-gray-800">{s.cheapestHotel.name}</p>
                      <p className="text-gray-500">
                        {s.cheapestHotel.stars ? '⭐'.repeat(s.cheapestHotel.stars) : ''}
                        {s.cheapestHotel.rating ? ` · ${s.cheapestHotel.rating.toFixed(1)}` : ''}
                        {s.cheapestHotel.parking && ' · 🅿️ parking'}
                      </p>
                    </div>
                    <span className="font-semibold text-teal-700 whitespace-nowrap">€{s.cheapestHotel.pricePerNightEUR}/night</span>
                  </div>
                </div>
              )}

              {s.hotelCandidates.length > 1 && (
                <details>
                  <summary className="text-xs text-gray-500 cursor-pointer hover:text-teal-600">Swap hotel ({s.hotelCandidates.length - 1} similar nearby)</summary>
                  <div className="space-y-1.5 mt-2">
                    {s.hotelCandidates.filter(h => h.id !== s.cheapestHotel?.id).map(h => {
                      const overridden = hotelOverrides[`${routeIdx}-${i}`] === h.id
                      return (
                        <button
                          key={h.id}
                          onClick={() => onHotelSwap(i, h)}
                          className={`w-full text-left rounded-lg border px-2 py-1.5 text-xs transition-all ${
                            overridden ? 'border-teal-400 bg-teal-50' : 'border-gray-100 hover:border-teal-200'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <p className="font-medium text-gray-800">{h.name}</p>
                              <p className="text-gray-400">
                                {h.stars ? '⭐'.repeat(h.stars) : ''}
                                {h.rating ? ` · ${h.rating.toFixed(1)}` : ''}
                                {h.parking && ' · 🅿️'}
                              </p>
                            </div>
                            <span className="font-semibold text-gray-700 whitespace-nowrap">€{h.pricePerNightEUR}/night</span>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </details>
              )}
            </div>
          ))}
        </div>

        <Button onClick={onSelect} className="w-full bg-gradient-to-r from-teal-500 to-sky-500 hover:from-teal-600 hover:to-sky-600 font-semibold">
          ✓ Select this route
        </Button>
      </div>
    </>
  )
}

function CostRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <tr className="border-t border-gray-100">
      <td className="p-2 flex items-center gap-1.5">{icon} {label}</td>
      <td className="text-right p-2 text-gray-700">€{value}</td>
    </tr>
  )
}

function FlightCard({ title, code, flight }: { title: string; code: string; flight?: FlightSummary }) {
  return (
    <div className="rounded-xl border border-gray-200 p-2.5">
      <p className="text-[10px] uppercase tracking-wide text-gray-400">{title}</p>
      <p className="text-xs text-gray-500">{code}</p>
      {flight ? (
        <>
          <p className="font-semibold text-sm text-gray-900 mt-1">{flight.airline}</p>
          <p className="text-xs text-gray-500">
            {flight.stops === 0 ? 'Direct' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`}
            {flight.durationMin ? ` · ${Math.floor(flight.durationMin / 60)}h ${flight.durationMin % 60}m` : ''}
          </p>
          {(flight.departureDate || flight.departureTime) && (
            <p className="text-[11px] text-gray-600 mt-1">
              🛫 {flight.departureDate}{flight.departureTime ? ` · ${flight.departureTime}` : ''}
            </p>
          )}
          {(flight.arrivalDate || flight.arrivalTime) && (
            <p className="text-[11px] text-gray-600">
              🛬 {flight.arrivalDate}{flight.arrivalTime ? ` · ${flight.arrivalTime}` : ''}
            </p>
          )}
          <p className="font-bold text-teal-700 text-sm mt-1">€{flight.priceEUR}</p>
        </>
      ) : <p className="text-xs text-gray-400 mt-1">No flights found</p>}
    </div>
  )
}
