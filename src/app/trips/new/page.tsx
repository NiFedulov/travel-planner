'use client'
import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ChevronLeft, ChevronRight, Check, MapPin, Calendar, AlertCircle, Loader2, Plane, Hotel } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { RoutesStep, type RouteVariant } from '@/components/trips/RoutesStep'

// ── Types ──────────────────────────────────────────────────────────────────────

interface Destination {
  city: string; country: string; countryCode: string
  region?: string; emoji?: string; highlight?: string; bestFor?: string
  stayDays?: number; arrivalDate?: string; departureDate?: string
}

interface ParsedDestResult {
  city: string; country: string; countryCode: string; region?: string
  emoji?: string; highlight?: string; bestFor?: string
  stayDays?: number; suggestedArrival?: string; suggestedDeparture?: string
}

interface SuggestedTag {
  city: string; country: string; countryCode: string; emoji: string
}

interface DealTip {
  hasDeal: boolean; tip: string | null; alternative?: string; saving?: string; reason?: string
}

interface SuggestedItineraryItem {
  city: string; arrivalDate: string; departureDate: string; nights: number; reason?: string
}

interface OptimizationSummary {
  arrivalAirportCity?: string
  departureAirportCity?: string
  optimalStartDate?: string
  optimalEndDate?: string
  estimatedFlightCost?: number
  estimatedHotelCost?: number
}

interface MockFlight {
  id: string; airline: string; flightNumber: string
  fromCode: string; fromCity: string; toCode: string; toCity: string
  durationMin: number; stops: number; priceEconomy: number
  isStopover: boolean; layoverCity?: string; departureTime: string; arrivalTime: string
}

interface MockHotel {
  id: string; name: string; city: string; country: string; stars: number
  pricePerNight: number; rating: number; type: string; breakfastIncl: boolean
  pool: boolean; parking: boolean
}

// ── Step 1: Origin ─────────────────────────────────────────────────────────────

function OriginStep({ data, update }: { data: TripDraft; update: (p: Partial<TripDraft>) => void }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Where are you flying from?</h2>
        <p className="text-sm text-gray-500">Your departure city or airport</p>
      </div>
      <div className="space-y-2">
        <Label className="text-sm font-semibold text-gray-700">Origin city</Label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={data.originCity}
            onChange={e => update({ originCity: e.target.value })}
            placeholder="e.g. Limassol, CY"
            className="pl-9"
          />
        </div>
      </div>
    </div>
  )
}

// ── Step 2: Destinations (no dates — just places) ──────────────────────────────

function DestinationCards({ dests, onRemove }: {
  dests: Destination[]
  onRemove: (i: number) => void
}) {
  if (!dests.length) return null
  return (
    <div className="space-y-3">
      <Label className="text-sm font-semibold text-gray-700">Your destinations</Label>
      {dests.map((d, i) => (
        <div key={i} className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{d.emoji ?? '📍'}</span>
              <div>
                <div className="font-semibold text-gray-900 text-sm">{d.city}</div>
                <div className="text-xs text-gray-500">
                  {d.region && `${d.region} · `}{d.countryCode}
                  {d.stayDays && <span className="ml-1 text-teal-600 font-medium">· {d.stayDays} days</span>}
                </div>
              </div>
            </div>
            <button onClick={() => onRemove(i)} className="text-gray-300 hover:text-red-400 transition-colors text-lg leading-none">✕</button>
          </div>
          {(d.highlight || d.bestFor) && (
            <div className="px-4 py-2 border-t border-gray-100 space-y-0.5">
              {d.highlight && <p className="text-xs text-gray-600">{d.highlight}</p>}
              {d.bestFor && <p className="text-xs text-teal-600">Best for: {d.bestFor}</p>}
            </div>
          )}
          {(d.arrivalDate || d.departureDate) && (
            <div className="px-4 py-2 border-t border-gray-100 bg-teal-50/50 flex gap-4 text-xs text-teal-700">
              {d.arrivalDate && <span>✈️ Arrive: {d.arrivalDate}</span>}
              {d.departureDate && <span>🛫 Depart: {d.departureDate}</span>}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function DestinationsStep({ data, update }: { data: TripDraft; update: (p: Partial<TripDraft>) => void }) {
  const dests = data.destinations
  const [mode, setMode] = useState<'know' | 'explore' | null>(null)

  const [dealTip, setDealTip] = useState<DealTip | null>(null)
  const [loadingDeal, setLoadingDeal] = useState(false)

  const [knowCity, setKnowCity] = useState('')
  const [knowCountry, setKnowCountry] = useState('')

  const [freeText, setFreeText] = useState(data.travelWish ?? '')
  const [parsing, setParsing] = useState(false)
  const [insight, setInsight] = useState('')
  const [suggestedTags, setSuggestedTags] = useState<SuggestedTag[]>([])
  const [selectedCities, setSelectedCities] = useState<Set<string>>(new Set())
  const [analyzingTags, setAnalyzingTags] = useState(false)

  // Deal tip when destinations are set
  useEffect(() => {
    if (!dests.length || !data.startDate) { setDealTip(null); return }
    const t = setTimeout(async () => {
      setLoadingDeal(true)
      try {
        const res = await fetch('/api/ai/deals-tip', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            origin: data.originCity,
            destinations: dests.map(d => ({ city: d.city, country: d.country })),
            startDate: data.startDate,
            endDate: data.endDate,
          }),
        })
        const result = await res.json()
        setDealTip(result.hasDeal ? result : null)
      } catch { /* silent */ }
      finally { setLoadingDeal(false) }
    }, 600)
    return () => clearTimeout(t)
  }, [dests.length, data.startDate, data.endDate]) // eslint-disable-line react-hooks/exhaustive-deps

  // Suggest tags from free text
  useEffect(() => {
    setSuggestedTags([]); setSelectedCities(new Set())
    if (!freeText.trim() || freeText.trim().length < 15) return
    const t = setTimeout(async () => {
      setAnalyzingTags(true)
      try {
        const res = await fetch('/api/ai/suggest-tags', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: freeText }),
        })
        const result = await res.json()
        const tags: SuggestedTag[] = result.tags ?? []
        setSuggestedTags(tags)
        setSelectedCities(new Set(tags.map(t => t.city)))
      } catch { /* silent */ }
      finally { setAnalyzingTags(false) }
    }, 800)
    return () => clearTimeout(t)
  }, [freeText])

  function toggleTag(city: string) {
    setSelectedCities(prev => { const n = new Set(prev); n.has(city) ? n.delete(city) : n.add(city); return n })
  }

  function removeDestination(i: number) { update({ destinations: dests.filter((_, idx) => idx !== i) }) }

  function addKnownPlace() {
    if (!knowCity.trim() || !knowCountry.trim()) return
    update({ destinations: [...dests, {
      city: knowCity.trim(), country: knowCountry.trim().toUpperCase(),
      countryCode: knowCountry.trim().toUpperCase(),
    }] })
    setKnowCity(''); setKnowCountry('')
  }

  async function parseWithAI() {
    if (!freeText.trim() || selectedCities.size === 0) return
    setParsing(true); setInsight('')
    const selectedTags = suggestedTags.filter(t => selectedCities.has(t.city))
    const hint = selectedTags.map(t => `${t.city}, ${t.country}`).join(' · ')
    const prompt = hint ? `${freeText}\n\nFocus on these specific destinations: ${hint}` : freeText
    try {
      const res = await fetch('/api/ai/parse-destinations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: prompt }),
      })
      const result = await res.json()
      setInsight(result.insight ?? '')
      const newDests = (result.destinations ?? []).map((d: ParsedDestResult) => ({
        city: d.city, country: d.countryCode, countryCode: d.countryCode,
        region: d.region, emoji: d.emoji, highlight: d.highlight, bestFor: d.bestFor,
        stayDays: d.stayDays,
      }))
      update({ destinations: newDests, travelWish: freeText })
    } catch { /* silent */ }
    finally { setParsing(false) }
  }

  if (!mode) return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Where do you want to go? 🗺️</h2>
        <p className="text-sm text-gray-500">Dates will be planned later based on best flight & hotel prices</p>
      </div>
      <div className="grid grid-cols-1 gap-3">
        <button onClick={() => setMode('know')}
          className="group text-left rounded-2xl border-2 border-gray-200 hover:border-teal-400 bg-white hover:bg-teal-50 p-5 transition-all">
          <div className="flex items-start gap-4">
            <span className="text-3xl">🗓️</span>
            <div>
              <div className="font-semibold text-gray-900 group-hover:text-teal-700">I know exactly where I&apos;m going</div>
              <div className="text-sm text-gray-500 mt-0.5">Enter specific cities — we&apos;ll help you find the best dates</div>
            </div>
          </div>
        </button>
        <button onClick={() => setMode('explore')}
          className="group text-left rounded-2xl border-2 border-gray-200 hover:border-orange-400 bg-white hover:bg-orange-50 p-5 transition-all">
          <div className="flex items-start gap-4">
            <span className="text-3xl">✨</span>
            <div>
              <div className="font-semibold text-gray-900 group-hover:text-orange-700">Help me plan my trip</div>
              <div className="text-sm text-gray-500 mt-0.5">Describe what you want — AI picks the best destinations & dates</div>
            </div>
          </div>
        </button>
      </div>
    </div>
  )

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            {mode === 'know' ? '🗓️ Your destinations' : '✨ Plan my trip'}
          </h2>
          <p className="text-sm text-gray-500">
            {mode === 'know' ? 'Add cities to visit — best dates will be found in the next steps' : 'Describe what you\'re looking for — I\'ll suggest the perfect destinations'}
          </p>
        </div>
        <button onClick={() => { setMode(null); update({ destinations: [] }) }}
          className="text-xs text-gray-400 hover:text-gray-600 underline">
          Change
        </button>
      </div>

      {/* ── KNOW MODE ── */}
      {mode === 'know' && (
        <div className="space-y-3">
          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 space-y-3">
            <p className="text-xs font-medium text-gray-500">Add a destination</p>
            <div className="grid grid-cols-3 gap-2">
              <Input value={knowCity} onChange={e => setKnowCity(e.target.value)}
                placeholder="City / Place" className="col-span-2 text-sm"
                onKeyDown={e => e.key === 'Enter' && addKnownPlace()} />
              <Input value={knowCountry} onChange={e => setKnowCountry(e.target.value)}
                placeholder="IT" maxLength={2} className="uppercase text-sm"
                onKeyDown={e => e.key === 'Enter' && addKnownPlace()} />
            </div>
            <Button onClick={addKnownPlace} disabled={!knowCity.trim() || !knowCountry.trim()}
              className="w-full bg-teal-600 hover:bg-teal-700 h-9 text-sm">
              + Add destination
            </Button>
          </div>
        </div>
      )}

      {/* ── EXPLORE MODE ── */}
      {mode === 'explore' && (
        <div className="space-y-3">
          <textarea
            value={freeText}
            onChange={e => { setFreeText(e.target.value); update({ travelWish: e.target.value }) }}
            placeholder={'Describe your ideal holiday...\n\nFor example: "I want to relax by a lake, explore medieval towns, eat amazing Italian food. Not too much walking — we have a 3-year old with us."'}
            rows={4}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent placeholder:text-gray-400 leading-relaxed"
          />

          {analyzingTags && (
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Analysing your wishes...</span>
            </div>
          )}
          {suggestedTags.length > 0 && !analyzingTags && (
            <div className="space-y-2">
              <p className="text-xs text-gray-500 font-medium">I found these destinations — select the ones you want:</p>
              <div className="flex flex-wrap gap-2">
                {suggestedTags.map(tag => {
                  const selected = selectedCities.has(tag.city)
                  return (
                    <button key={tag.city} onClick={() => toggleTag(tag.city)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        selected ? 'bg-teal-500 border-teal-500 text-white shadow-sm' : 'bg-white border-gray-200 text-gray-500 hover:border-teal-300 hover:text-teal-600'
                      }`}>
                      <span>{tag.emoji}</span><span>{tag.city}</span>
                      {selected && <span className="opacity-80">✓</span>}
                    </button>
                  )
                })}
              </div>
              <p className="text-xs text-gray-400">{selectedCities.size} selected — deselect any you don&apos;t want</p>
            </div>
          )}

          <Button onClick={parseWithAI} disabled={!freeText.trim() || selectedCities.size === 0 || parsing}
            className="w-full bg-gradient-to-r from-teal-500 to-sky-500 hover:from-teal-600 hover:to-sky-600 font-semibold py-5 disabled:opacity-40">
            {parsing
              ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Building destination list...</>
              : suggestedTags.length === 0 ? '✨ Suggest destinations'
                : `✨ Add ${selectedCities.size} destination${selectedCities.size !== 1 ? 's' : ''}`}
          </Button>

          {insight && (
            <div className="flex items-start gap-2 bg-gradient-to-r from-teal-50 to-sky-50 rounded-xl p-3 border border-teal-100">
              <span className="text-lg flex-shrink-0">🧳</span>
              <p className="text-sm text-teal-800 italic">{insight}</p>
            </div>
          )}
        </div>
      )}

      {/* ── DESTINATION CARDS ── */}
      <DestinationCards dests={dests} onRemove={removeDestination} />

      {/* ── DEAL ALERT ── */}
      {loadingDeal && dests.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-amber-600">
          <Loader2 className="h-3 w-3 animate-spin" /><span>Checking for better deals...</span>
        </div>
      )}
      {dealTip?.hasDeal && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-base">💡</span>
            <span className="text-sm font-semibold text-amber-800">Travel tip — save money</span>
            {dealTip.saving && <Badge className="ml-auto bg-amber-100 text-amber-700 text-xs">{dealTip.saving}</Badge>}
          </div>
          {dealTip.tip && <p className="text-sm text-amber-700">{dealTip.tip}</p>}
          {dealTip.alternative && <p className="text-xs text-amber-600 font-medium">💬 Alternative: {dealTip.alternative}</p>}
          {dealTip.reason && <p className="text-xs text-amber-500">{dealTip.reason}</p>}
        </div>
      )}
    </div>
  )
}

// ── Step 3: Dates ──────────────────────────────────────────────────────────────

function DatesStep({ data, update }: { data: TripDraft; update: (p: Partial<TripDraft>) => void }) {
  const minNights = Math.max(1, data.destinations.length)
  const suggestedNights = Math.max(
    minNights,
    data.destinations.reduce((s, d) => s + (d.stayDays ?? 2), 0),
  )

  const currentNights = data.startDate && data.endDate
    ? Math.round((new Date(data.endDate).getTime() - new Date(data.startDate).getTime()) / 86400000)
    : 0

  const tooShort = currentNights > 0 && currentNights < minNights

  function applySuggested() {
    const start = data.startDate || new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10)
    const end = new Date(new Date(start).getTime() + suggestedNights * 86400000).toISOString().slice(0, 10)
    update({ startDate: start, endDate: end })
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Trip dates</h2>
        <p className="text-sm text-gray-500">Set your overall trip window — we&apos;ll optimize the route within these dates</p>
      </div>

      {data.destinations.length > 0 && (
        <div className="rounded-xl border border-teal-200 bg-teal-50/50 p-3 space-y-2">
          <div className="flex items-start gap-2 text-sm">
            <span className="text-base">💡</span>
            <div className="flex-1">
              <p className="font-medium text-teal-800">Suggested duration: {suggestedNights} nights</p>
              <p className="text-xs text-teal-700">
                {data.destinations.length} {data.destinations.length === 1 ? 'destination' : 'destinations'} ·
                minimum {minNights} {minNights === 1 ? 'night' : 'nights'} (1 per stop)
              </p>
            </div>
            <button
              onClick={applySuggested}
              className="text-xs bg-teal-600 text-white px-3 py-1.5 rounded-lg hover:bg-teal-700 font-medium whitespace-nowrap"
            >
              Apply
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-sm font-semibold text-gray-700">Start date</Label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="date"
              value={data.startDate}
              onChange={e => update({ startDate: e.target.value })}
              className="pl-9"
            />
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-sm font-semibold text-gray-700">End date</Label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="date"
              value={data.endDate}
              onChange={e => update({ endDate: e.target.value })}
              className="pl-9"
            />
          </div>
        </div>
      </div>

      <div
        className={`p-4 rounded-xl border-2 transition-all ${
          data.datesFlexible ? 'border-teal-400 bg-teal-50' : 'border-gray-200 hover:border-gray-300'
        }`}
      >
        <div
          onClick={() => update({ datesFlexible: !data.datesFlexible, flexDays: !data.datesFlexible && !data.flexDays ? 3 : data.flexDays })}
          className="flex items-center justify-between cursor-pointer"
        >
          <div>
            <p className="font-medium text-sm text-gray-800">Flexible dates</p>
            <p className="text-xs text-gray-500">±{data.datesFlexible ? data.flexDays || 3 : 3} days can save up to 30% on flights</p>
          </div>
          <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center ${data.datesFlexible ? 'border-teal-500 bg-teal-500' : 'border-gray-300'}`}>
            {data.datesFlexible && <Check className="h-3.5 w-3.5 text-white" />}
          </div>
        </div>
        {data.datesFlexible && (
          <div className="mt-4 pt-3 border-t border-teal-200/60 space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-gray-600">Flexibility window</Label>
              <span className="text-xs font-semibold text-teal-700">±{data.flexDays || 1} day{(data.flexDays || 1) !== 1 ? 's' : ''}</span>
            </div>
            <input
              type="range"
              min={1}
              max={5}
              step={1}
              value={data.flexDays || 1}
              onChange={e => update({ flexDays: Number(e.target.value) })}
              className="w-full accent-teal-500"
            />
            <div className="flex justify-between text-[10px] text-gray-400 px-1">
              <span>±1</span><span>±2</span><span>±3</span><span>±4</span><span>±5</span>
            </div>
          </div>
        )}
      </div>

      {data.startDate && data.endDate && (
        <div className={`rounded-xl p-3 text-sm ${tooShort ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-sky-50 text-sky-700'}`}>
          {tooShort ? (
            <>
              ⚠ Trip too short — {currentNights} {currentNights === 1 ? 'night' : 'nights'} cannot fit {data.destinations.length} destinations (min {minNights} required).
            </>
          ) : (
            <>
              Total trip: {currentNights} {currentNights === 1 ? 'night' : 'nights'}
              {data.destinations.length > 0 && currentNights >= minNights && (
                <span className="ml-1 text-xs text-sky-600">
                  · ~{(currentNights / data.destinations.length).toFixed(1)} nights per stop
                </span>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ── Step 4: AI Checks ──────────────────────────────────────────────────────────

interface AICheckResult {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  visa?: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  health?: any
  error?: string
}

function AIChecksStep({ data, aiResults, runChecks, checksDone, checking }: {
  data: TripDraft
  aiResults: AICheckResult
  runChecks: () => void
  checksDone: boolean
  checking: boolean
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Entry requirements</h2>
        <p className="text-sm text-gray-500">AI-powered visa & health checks for your destinations</p>
      </div>

      {!checksDone && !checking && (
        <div className="text-center py-8">
          <div className="text-5xl mb-4">🛂</div>
          <p className="text-gray-600 mb-4 text-sm">We&apos;ll check visa requirements and health advisories for all your destinations</p>
          <Button onClick={runChecks} className="bg-teal-600 hover:bg-teal-700">
            Run AI checks
          </Button>
        </div>
      )}

      {checking && (
        <div className="text-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-teal-500 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Checking visa & health requirements...</p>
        </div>
      )}

      {checksDone && aiResults.error && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-rose-50 border border-rose-200">
          <AlertCircle className="h-5 w-5 text-rose-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-rose-700 text-sm">Check failed</p>
            <p className="text-xs text-rose-600 mt-1">{aiResults.error}</p>
            <button onClick={runChecks} className="text-xs text-rose-700 underline mt-2">Try again</button>
          </div>
        </div>
      )}

      {checksDone && aiResults.visa && (
        <div className="space-y-3">
          <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            🛂 Visa Requirements
          </Label>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {(aiResults.visa.result ?? []).map((req: any, i: number) => (
            <div key={i} className={`p-3 rounded-xl border text-sm ${
              req.required ? 'bg-orange-50 border-orange-200' : 'bg-green-50 border-green-200'
            }`}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium">{req.country}</span>
                <Badge className={req.required ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}>
                  {req.required ? 'Visa required' : 'No visa'}
                </Badge>
              </div>
              {req.notes && <p className="text-xs text-gray-600">{req.notes}</p>}
              {req.confidence === 'low' && (
                <p className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> Verify at embassy before booking
                </p>
              )}
            </div>
          ))}
          {aiResults.visa.disclaimer && (
            <p className="text-xs text-gray-400 italic">{aiResults.visa.disclaimer}</p>
          )}
        </div>
      )}

      {checksDone && aiResults.health && (
        <div className="space-y-3">
          <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            💉 Health Requirements
          </Label>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {(aiResults.health.result ?? []).map((req: any, i: number) => (
            <div key={i} className={`p-3 rounded-xl border text-sm ${
              req.required ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium">{req.vaccine ?? req.country}</span>
                {req.required && <Badge className="bg-yellow-100 text-yellow-700">Required</Badge>}
                {!req.required && req.recommended && <Badge className="bg-blue-100 text-blue-700">Recommended</Badge>}
              </div>
              {req.notes && <p className="text-xs text-gray-600 mt-1">{req.notes}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Step 5: Flights & Hotels ───────────────────────────────────────────────────

function FlightsHotelsStep({ data, update }: { data: TripDraft; update: (p: Partial<TripDraft>) => void }) {
  const [flights, setFlights] = useState<MockFlight[]>([])
  const [hotels, setHotels] = useState<MockHotel[]>([])
  const [loading, setLoading] = useState(true)
  const [optimizing, setOptimizing] = useState(false)
  const [itinerary, setItinerary] = useState<SuggestedItineraryItem[]>([])
  const [planningNote, setPlanningNote] = useState('')
  const [applied, setApplied] = useState(false)
  const [optSummary, setOptSummary] = useState<OptimizationSummary | null>(null)

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const [flightsRes, hotelsRes] = await Promise.all([
          fetch('/api/mock/flights'),
          fetch('/api/mock/hotels'),
        ])
        const [flightsData, hotelsData] = await Promise.all([flightsRes.json(), hotelsRes.json()])
        setFlights(flightsData ?? [])

        const destCities = data.destinations.map((d: Destination) => d.city.toLowerCase())
        const filtered = (hotelsData ?? []).filter((h: MockHotel) =>
          destCities.some((c: string) => h.city.toLowerCase().includes(c) || c.includes(h.city.toLowerCase()))
        )
        setHotels(filtered.length > 0 ? filtered : (hotelsData ?? []).slice(0, 6))
      } catch { /* silent */ }
      finally { setLoading(false) }
    }
    loadData()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function autoplanDates() {
    if (!data.startDate || !data.endDate) {
      toast.error('Please set trip dates first (Step 3)')
      return
    }
    setOptimizing(true)
    try {
      const profileRes = await fetch('/api/profile')
      const profile = profileRes.ok ? await profileRes.json() : {}
      const res = await fetch('/api/ai/route-optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flights: flights.slice(0, 12).map(f => ({
            id: f.id,
            airline: f.airline,
            from: f.fromCode,
            to: f.toCode,
            stops: f.stops,
            durationMin: f.durationMin,
            price: f.priceEconomy,
            isStopover: f.isStopover,
            layoverCity: f.layoverCity,
            savings: 0,
            score: 0,
          })),
          hotels: hotels.slice(0, 12).map(h => ({
            city: h.city, pricePerNight: h.pricePerNight, stars: h.stars, name: h.name,
          })),
          profile: profile ?? {},
          originCity: data.originCity,
          destinations: data.destinations.map((d: Destination) => ({ city: d.city, stayDays: d.stayDays })),
          startDate: data.startDate,
          endDate: data.endDate,
          flexDays: data.datesFlexible ? (data.flexDays || 3) : 0,
        }),
      })
      const json = await res.json()
      const result = json.result ?? {}
      if (result.suggestedItinerary?.length > 0) {
        setItinerary(result.suggestedItinerary)
        setPlanningNote(result.planningNote ?? '')
        setOptSummary({
          arrivalAirportCity: result.arrivalAirportCity,
          departureAirportCity: result.departureAirportCity,
          optimalStartDate: result.optimalStartDate,
          optimalEndDate: result.optimalEndDate,
          estimatedFlightCost: result.estimatedFlightCost,
          estimatedHotelCost: result.estimatedHotelCost,
        })
      } else {
        toast.error('AI could not generate a date plan. Try adjusting your destinations or dates.')
      }
    } catch {
      toast.error('Failed to get AI date plan')
    } finally {
      setOptimizing(false)
    }
  }

  function applyItinerary() {
    const updated = data.destinations.map((d: Destination) => {
      const match = itinerary.find(s => s.city.toLowerCase() === d.city.toLowerCase())
      return match ? { ...d, arrivalDate: match.arrivalDate, departureDate: match.departureDate } : d
    })
    const patch: Partial<TripDraft> = { destinations: updated }
    if (optSummary?.optimalStartDate) patch.startDate = optSummary.optimalStartDate
    if (optSummary?.optimalEndDate) patch.endDate = optSummary.optimalEndDate
    update(patch)
    setApplied(true)
    toast.success('Dates applied to your trip!')
  }

  if (loading) return (
    <div className="text-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-teal-500 mx-auto mb-3" />
      <p className="text-sm text-gray-500">Loading available flights & hotels...</p>
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Flights & Hotels</h2>
        <p className="text-sm text-gray-500">Browse options and let AI plan your dates around the best prices</p>
      </div>

      {/* ── AUTO-PLAN BANNER ── */}
      <div className="rounded-2xl bg-gradient-to-r from-teal-500 to-sky-500 p-5 text-white">
        <div className="flex items-start gap-3">
          <div className="text-2xl">🗓️</div>
          <div className="flex-1">
            <p className="font-semibold mb-1">Auto-plan your dates with AI</p>
            <p className="text-sm text-teal-100 mb-3">
              AI analyses available flights and distributes your {data.destinations.length} destination{data.destinations.length !== 1 ? 's' : ''} across {
                data.startDate && data.endDate
                  ? `${Math.round((new Date(data.endDate).getTime() - new Date(data.startDate).getTime()) / 86400000)} days`
                  : 'your trip window'
              } for the optimal route.
            </p>
            <Button
              onClick={autoplanDates}
              disabled={optimizing || !data.destinations.length}
              className="bg-white text-teal-700 hover:bg-teal-50 font-semibold h-9 text-sm"
            >
              {optimizing ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Planning...</> : '✨ Auto-plan dates'}
            </Button>
          </div>
        </div>
      </div>

      {/* ── OPTIMIZATION SUMMARY ── */}
      {optSummary && (optSummary.arrivalAirportCity || optSummary.optimalStartDate) && (
        <div className="rounded-2xl border border-teal-200 bg-white p-4 space-y-2 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-base">🎯</span>
            <span className="text-sm font-semibold text-gray-800">Optimal plan</span>
          </div>
          <div className="grid grid-cols-2 gap-y-1.5 text-xs">
            {optSummary.arrivalAirportCity && (
              <>
                <span className="text-gray-500">Fly into</span>
                <span className="font-medium text-gray-800 text-right">{optSummary.arrivalAirportCity}</span>
              </>
            )}
            {optSummary.departureAirportCity && (
              <>
                <span className="text-gray-500">Fly out of</span>
                <span className="font-medium text-gray-800 text-right">{optSummary.departureAirportCity}</span>
              </>
            )}
            {optSummary.optimalStartDate && (
              <>
                <span className="text-gray-500">Best dates</span>
                <span className="font-medium text-gray-800 text-right">{optSummary.optimalStartDate} → {optSummary.optimalEndDate}</span>
              </>
            )}
            {optSummary.estimatedFlightCost ? (
              <>
                <span className="text-gray-500">Est. flights</span>
                <span className="font-medium text-teal-700 text-right">€{optSummary.estimatedFlightCost}</span>
              </>
            ) : null}
            {optSummary.estimatedHotelCost ? (
              <>
                <span className="text-gray-500">Est. hotels</span>
                <span className="font-medium text-teal-700 text-right">€{optSummary.estimatedHotelCost}</span>
              </>
            ) : null}
            {(optSummary.estimatedFlightCost || optSummary.estimatedHotelCost) ? (
              <>
                <span className="text-gray-700 font-semibold">Total</span>
                <span className="font-bold text-teal-700 text-right">€{(optSummary.estimatedFlightCost ?? 0) + (optSummary.estimatedHotelCost ?? 0)}</span>
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* ── SUGGESTED ITINERARY ── */}
      {itinerary.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold text-gray-700">AI-suggested itinerary</Label>
            {!applied && (
              <Button onClick={applyItinerary} size="sm"
                className="bg-teal-600 hover:bg-teal-700 h-8 text-xs px-3">
                Apply dates ✓
              </Button>
            )}
            {applied && <Badge className="bg-teal-100 text-teal-700">Applied ✓</Badge>}
          </div>
          {planningNote && (
            <p className="text-xs text-gray-500 italic">{planningNote}</p>
          )}
          {itinerary.map((item, i) => (
            <div key={i} className="rounded-xl border border-teal-100 bg-teal-50/50 p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-sm text-gray-900">
                  {data.destinations.find((d: Destination) => d.city.toLowerCase() === item.city.toLowerCase())?.emoji ?? '📍'} {item.city}
                </span>
                <Badge className="bg-sky-100 text-sky-700 text-xs">{item.nights} nights</Badge>
              </div>
              <div className="flex gap-4 text-xs text-teal-700">
                <span>✈️ Arrive: {item.arrivalDate}</span>
                <span>🛫 Depart: {item.departureDate}</span>
              </div>
              {item.reason && <p className="text-xs text-gray-500 mt-1">{item.reason}</p>}
            </div>
          ))}
        </div>
      )}

      {/* ── FLIGHTS LIST ── */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Plane className="h-4 w-4 text-teal-600" />
          <Label className="text-sm font-semibold text-gray-700">Available Flights</Label>
          <Badge className="bg-gray-100 text-gray-500 text-xs">{flights.length}</Badge>
        </div>
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {flights.slice(0, 12).map(f => (
            <div key={f.id} className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-gray-900">{f.airline}</span>
                  <span className="text-xs text-gray-400">{f.flightNumber}</span>
                </div>
                <span className="font-bold text-teal-600">€{f.priceEconomy}</span>
              </div>
              <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                <span className="font-medium text-gray-700">{f.fromCode}</span>
                <span>→</span>
                <span className="font-medium text-gray-700">{f.toCode}</span>
                <span>·</span>
                <span>{Math.floor(f.durationMin / 60)}h{f.durationMin % 60 > 0 ? ` ${f.durationMin % 60}m` : ''}</span>
                <span>·</span>
                <span>{f.stops === 0 ? 'Direct' : `${f.stops} stop${f.stops > 1 ? 's' : ''}`}</span>
                {f.isStopover && f.layoverCity && (
                  <Badge className="bg-orange-100 text-orange-600 text-xs">Stopover: {f.layoverCity}</Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── HOTELS LIST ── */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Hotel className="h-4 w-4 text-teal-600" />
          <Label className="text-sm font-semibold text-gray-700">Hotels in Your Destinations</Label>
          <Badge className="bg-gray-100 text-gray-500 text-xs">{hotels.length}</Badge>
        </div>
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {hotels.slice(0, 12).map(h => (
            <div key={h.id} className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-sm text-gray-900">{h.name}</div>
                  <div className="text-xs text-gray-500">{h.city} · {'⭐'.repeat(h.stars)} · {h.type}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-teal-600">€{h.pricePerNight}<span className="text-xs font-normal text-gray-400">/night</span></div>
                  <div className="text-xs text-gray-400">⭐ {h.rating}</div>
                </div>
              </div>
              <div className="flex gap-2 mt-1.5 flex-wrap">
                {h.breakfastIncl && <Badge className="bg-green-100 text-green-600 text-xs">Breakfast</Badge>}
                {h.pool && <Badge className="bg-blue-100 text-blue-600 text-xs">Pool</Badge>}
                {h.parking && <Badge className="bg-gray-100 text-gray-600 text-xs">Parking</Badge>}
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400">Full hotel selection available after creating your trip</p>
      </div>
    </div>
  )
}

// ── Step 6: Summary ────────────────────────────────────────────────────────────

const SummaryMap = dynamic(() => import('@/components/trips/RouteMap'), {
  ssr: false,
  loading: () => (
    <div className="rounded-xl border border-gray-200 bg-gray-50 h-[320px] flex items-center justify-center text-xs text-gray-400">
      Loading map…
    </div>
  ),
})

function SummaryStep({ data, aiResults, recommendations, loadingRecs, getRecommendations }: {
  data: TripDraft
  aiResults: AICheckResult
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  recommendations: any
  loadingRecs: boolean
  getRecommendations: () => void
}) {
  const hasItinerary = data.destinations.some(d => d.arrivalDate)
  const route = data.selectedRoute
  const cb = route?.costBreakdown

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Trip summary</h2>
        <p className="text-sm text-gray-500">{route?.label ?? 'Review your trip before booking'}</p>
      </div>

      {/* ── MAP ── */}
      {route && (
        <SummaryMap
          height={320}
          arrival={route.arrivalLat !== undefined && route.arrivalLng !== undefined
            ? { city: route.arrivalCity, iata: route.arrivalIata, lat: route.arrivalLat, lng: route.arrivalLng }
            : undefined}
          departure={route.departureLat !== undefined && route.departureLng !== undefined
            ? { city: route.departureCity, iata: route.departureIata, lat: route.departureLat, lng: route.departureLng }
            : undefined}
          stops={route.stops
            .filter(s => s.lat !== undefined && s.lng !== undefined)
            .map(s => ({ city: s.city, lat: s.lat!, lng: s.lng!, nights: s.nights }))}
          pois={(route.recommendedPois ?? []).map(p => ({ name: p.name, type: p.type, lat: p.lat, lng: p.lng }))}
        />
      )}

      {/* ── KEY FACTS ── */}
      <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">From</span>
          <span className="font-medium">{data.originCity}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Dates</span>
          <span className="font-medium">{data.startDate} → {data.endDate}</span>
        </div>
        {route?.flexShift && (route.flexShift.outDays !== 0 || route.flexShift.retDays !== 0) && (
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Flex shift applied</span>
            <span className="text-teal-700">
              {route.flexShift.outDays > 0 ? '+' : ''}{route.flexShift.outDays}d out / {route.flexShift.retDays > 0 ? '+' : ''}{route.flexShift.retDays}d ret
            </span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-gray-500">Destinations</span>
          <span className="font-medium text-right max-w-[60%]">
            {data.destinations.length > 0 ? data.destinations.map(d => d.city).join(', ') : data.travelWish ?? '—'}
          </span>
        </div>
        {cb && (
          <div className="flex justify-between pt-2 border-t border-gray-200 mt-2">
            <span className="text-gray-700 font-semibold">Estimated total</span>
            <span className={`font-bold ${route?.overBudget ? 'text-rose-600' : 'text-teal-700'}`}>€{cb.total}</span>
          </div>
        )}
      </div>

      {/* ── FLIGHTS ── */}
      {route && (route.flightsInbound || route.flightsOutbound) && (
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Plane className="h-4 w-4 text-teal-600" /> Flights
          </Label>
          <div className="grid grid-cols-2 gap-2">
            {route.flightsInbound && (
              <div className="rounded-xl border border-gray-200 p-2.5 text-xs">
                <p className="text-[10px] uppercase text-gray-400">Outbound</p>
                <p className="text-gray-500">origin → {route.arrivalIata}</p>
                <p className="font-semibold text-sm text-gray-900 mt-0.5">{route.flightsInbound.airline}</p>
                <p className="text-gray-500">{route.flightsInbound.stops === 0 ? 'Direct' : `${route.flightsInbound.stops} stop`}{route.flightsInbound.durationMin ? ` · ${Math.floor(route.flightsInbound.durationMin/60)}h ${route.flightsInbound.durationMin%60}m` : ''}</p>
                {(route.flightsInbound.departureDate || route.flightsInbound.departureTime) && (
                  <p className="text-[11px] text-gray-600 mt-1">🛫 {route.flightsInbound.departureDate}{route.flightsInbound.departureTime ? ` · ${route.flightsInbound.departureTime}` : ''}</p>
                )}
                {(route.flightsInbound.arrivalDate || route.flightsInbound.arrivalTime) && (
                  <p className="text-[11px] text-gray-600">🛬 {route.flightsInbound.arrivalDate}{route.flightsInbound.arrivalTime ? ` · ${route.flightsInbound.arrivalTime}` : ''}</p>
                )}
                <p className="font-bold text-teal-700 mt-1">€{route.flightsInbound.priceEUR}</p>
              </div>
            )}
            {route.flightsOutbound && (
              <div className="rounded-xl border border-gray-200 p-2.5 text-xs">
                <p className="text-[10px] uppercase text-gray-400">Return</p>
                <p className="text-gray-500">{route.departureIata} → origin</p>
                <p className="font-semibold text-sm text-gray-900 mt-0.5">{route.flightsOutbound.airline}</p>
                <p className="text-gray-500">{route.flightsOutbound.stops === 0 ? 'Direct' : `${route.flightsOutbound.stops} stop`}{route.flightsOutbound.durationMin ? ` · ${Math.floor(route.flightsOutbound.durationMin/60)}h ${route.flightsOutbound.durationMin%60}m` : ''}</p>
                {(route.flightsOutbound.departureDate || route.flightsOutbound.departureTime) && (
                  <p className="text-[11px] text-gray-600 mt-1">🛫 {route.flightsOutbound.departureDate}{route.flightsOutbound.departureTime ? ` · ${route.flightsOutbound.departureTime}` : ''}</p>
                )}
                {(route.flightsOutbound.arrivalDate || route.flightsOutbound.arrivalTime) && (
                  <p className="text-[11px] text-gray-600">🛬 {route.flightsOutbound.arrivalDate}{route.flightsOutbound.arrivalTime ? ` · ${route.flightsOutbound.arrivalTime}` : ''}</p>
                )}
                <p className="font-bold text-teal-700 mt-1">€{route.flightsOutbound.priceEUR}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── ITINERARY WITH HOTELS ── */}
      {route?.stops?.length ? (
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-gray-700">Itinerary & hotels</Label>
          {route.stops.map((s, i) => (
            <div key={i} className="rounded-xl border border-teal-100 bg-teal-50/40 p-3">
              <div className="flex items-baseline justify-between">
                <span className="font-semibold text-sm text-gray-900">{i + 1}. {s.city}, {s.country}</span>
                <span className="text-xs text-teal-700">{s.arrivalDate} → {s.departureDate} ({s.nights}n)</span>
              </div>
              {s.cheapestHotel && (
                <div className="mt-1.5 text-xs text-gray-700">
                  🏨 <span className="font-medium">{s.cheapestHotel.name}</span>
                  {s.cheapestHotel.stars ? <span className="ml-1 text-yellow-500">{'⭐'.repeat(s.cheapestHotel.stars)}</span> : null}
                  {s.cheapestHotel.parking && <span className="ml-1">🅿️</span>}
                  <span className="float-right font-semibold text-teal-700">€{s.cheapestHotel.pricePerNightEUR}/n</span>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : hasItinerary && (
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-gray-700">Planned itinerary</Label>
          {data.destinations.filter(d => d.arrivalDate).map((d, i) => (
            <div key={i} className="flex items-center justify-between text-xs bg-teal-50 border border-teal-100 rounded-lg px-3 py-2">
              <span className="font-medium text-gray-800">{d.emoji ?? '📍'} {d.city}</span>
              <span className="text-teal-700">{d.arrivalDate} → {d.departureDate}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── COST BREAKDOWN ── */}
      {cb && (
        <div className="rounded-xl border border-gray-200 p-3">
          <Label className="text-sm font-semibold text-gray-700">Cost breakdown</Label>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs mt-2 text-gray-600">
            <span>✈ Flights</span><span className="text-right">€{cb.flights}</span>
            <span>🏨 Hotels</span><span className="text-right">€{cb.hotels}</span>
            <span>🚗 Car</span><span className="text-right">€{cb.car}</span>
            <span>⛽ Fuel + tolls</span><span className="text-right">€{cb.fuelAndTolls}</span>
            <span>🍽 Food</span><span className="text-right">€{cb.food}</span>
            <span>🎫 Sights</span><span className="text-right">€{cb.sights}</span>
            <span className="font-bold text-gray-800 pt-1 border-t border-gray-100 mt-1">TOTAL</span>
            <span className={`text-right pt-1 border-t border-gray-100 mt-1 font-bold ${route?.overBudget ? 'text-rose-600' : 'text-teal-700'}`}>€{cb.total}</span>
          </div>
        </div>
      )}

      {/* ── POI LIST ── */}
      {route?.recommendedPois?.length ? (
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-gray-700">Worth a stop along the way</Label>
          <div className="flex flex-wrap gap-1.5">
            {route.recommendedPois.map((p, i) => (
              <Badge key={i} className="bg-amber-100 text-amber-800 text-xs font-normal">
                {p.type === 'viewpoint' ? '🔭' : p.type === 'town' ? '🏘' : p.type === 'nature' ? '🌳' : p.type === 'food' ? '🍝' : '⭐'} {p.name}
              </Badge>
            ))}
          </div>
        </div>
      ) : null}

      {/* ── ENTRY REQUIREMENTS ── */}
      {aiResults.visa?.result?.length > 0 && (
        <div className="rounded-xl border border-gray-200 p-3">
          <Label className="text-sm font-semibold text-gray-700">Entry requirements</Label>
          <div className="space-y-1.5 mt-2">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {aiResults.visa.result.map((v: any, i: number) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="text-gray-700">{v.country}</span>
                <Badge className={v.required ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}>
                  {v.required ? 'Visa needed' : 'No visa'}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {!recommendations && !loadingRecs && (
        <Button onClick={getRecommendations} className="w-full bg-gradient-to-r from-teal-500 to-sky-500 hover:from-teal-600 hover:to-sky-600">
          ✨ Get AI recommendations
        </Button>
      )}

      {loadingRecs && (
        <div className="text-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-teal-500 mx-auto mb-2" />
          <p className="text-xs text-gray-500">Claude is analyzing your trip...</p>
        </div>
      )}

      {recommendations && (
        <div className="space-y-3">
          {recommendations.highlights?.length > 0 && (
            <div className="p-4 rounded-xl bg-teal-50 border border-teal-200">
              <p className="font-semibold text-teal-800 text-sm mb-2">✨ Highlights</p>
              <ul className="space-y-1">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {recommendations.highlights.map((h: any, i: number) => (
                  <li key={i} className="text-xs text-teal-700 flex items-start gap-2">
                    <span className="mt-0.5">•</span>{h}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {recommendations.extraPlaces?.length > 0 && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
              <p className="font-semibold text-amber-800 text-sm mb-2">📍 Extra places worth visiting</p>
              <div className="space-y-2">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {recommendations.extraPlaces.map((p: any, i: number) => (
                  <div key={i} className="rounded-lg bg-white border border-amber-100 p-2.5 text-xs">
                    <div className="flex items-baseline justify-between gap-2 mb-0.5">
                      <span className="font-semibold text-gray-900">
                        {p.type === 'viewpoint' ? '🔭' : p.type === 'town' ? '🏘' : p.type === 'nature' ? '🌳' : p.type === 'food' ? '🍝' : p.type === 'museum' ? '🏛' : '⭐'} {p.name}
                      </span>
                      {p.nearStop && <span className="text-amber-700 text-[10px] whitespace-nowrap">near {p.nearStop}</span>}
                    </div>
                    {p.why && <p className="text-gray-600">{p.why}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
          {recommendations.warnings?.length > 0 && (
            <div className="p-4 rounded-xl bg-orange-50 border border-orange-200">
              <p className="font-semibold text-orange-800 text-sm mb-2">⚠️ Heads up</p>
              <ul className="space-y-1">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {recommendations.warnings.map((w: any, i: number) => (
                  <li key={i} className="text-xs text-orange-700 flex items-start gap-2">
                    <span className="mt-0.5">•</span>{w}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {recommendations.budgetBreakdown && (
            <div className="p-4 rounded-xl bg-sky-50 border border-sky-200">
              <p className="font-semibold text-sky-800 text-sm mb-2">💰 Budget estimate</p>
              <div className="space-y-1">
                {Object.entries(recommendations.budgetBreakdown).map(([k, v]) => (
                  <div key={k} className="flex justify-between text-xs text-sky-700">
                    <span className="capitalize">{k}</span>
                    <span>{String(v)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function generateTripName(data: TripDraft): string {
  const cities = data.destinations.slice(0, 3).map(d => d.city)
  const month = data.startDate
    ? new Date(data.startDate).toLocaleString('en', { month: 'short', year: 'numeric' })
    : ''
  if (cities.length === 0) return `Trip${month ? ' · ' + month : ''}`
  return `${cities.join(' · ')}${cities.length < data.destinations.length ? ' +more' : ''}${month ? ' · ' + month : ''}`
}

function extractOriginCode(originCity: string, resolvedIata?: string): string {
  if (resolvedIata && /^[A-Z]{3}$/.test(resolvedIata)) return resolvedIata
  const parts = originCity.split(',')
  const last = parts[parts.length - 1].trim().toUpperCase()
  if (/^[A-Z]{3}$/.test(last)) return last
  return 'UNK'
}

// ── Main wizard ────────────────────────────────────────────────────────────────

interface TripDraft {
  originCity: string
  originIata?: string
  destinations: Destination[]
  startDate: string
  endDate: string
  datesFlexible: boolean
  flexDays: number
  travelWish?: string
  selectedRoute?: RouteVariant
  selectedRouteIndex?: number
}

const STEPS = [
  { label: 'Origin', emoji: '🏠' },
  { label: 'Destinations', emoji: '📍' },
  { label: 'Dates', emoji: '📅' },
  { label: 'Routes', emoji: '🗺️' },
  { label: 'AI Checks', emoji: '🛂' },
  { label: 'Summary', emoji: '✅' },
]

const DEFAULT: TripDraft = { originCity: '', destinations: [], startDate: '', endDate: '', datesFlexible: false, flexDays: 0 }
const ORIGIN_LS_KEY = 'travelplan:origin-city'

export default function NewTripPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [data, setData] = useState<TripDraft>(DEFAULT)
  const [aiResults, setAiResults] = useState<AICheckResult>({})
  const [checksDone, setChecksDone] = useState(false)
  const [checking, setChecking] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [recommendations, setRecommendations] = useState<any>(null)
  const [loadingRecs, setLoadingRecs] = useState(false)
  const [saving, setSaving] = useState(false)
  const [budgetTotal, setBudgetTotal] = useState<number | null>(null)
  const [accommodation, setAccommodation] = useState<{ minStars?: number; mustHaveParking?: boolean } | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/profile').then(r => r.ok ? r.json() : null).then(p => {
      if (cancelled) return
      if (p?.budgetTotal) setBudgetTotal(p.budgetTotal)
      if (p?.accommodation) setAccommodation(p.accommodation)
    }).catch(() => {})
    return () => { cancelled = true }
  }, [])

  function update(patch: Partial<TripDraft>) {
    setData(prev => {
      const next = { ...prev, ...patch }
      if (typeof window !== 'undefined' && patch.originCity !== undefined) {
        try { window.localStorage.setItem(ORIGIN_LS_KEY, patch.originCity) } catch {}
      }
      return next
    })
  }

  useEffect(() => {
    if (typeof window === 'undefined') return
    const saved = window.localStorage.getItem(ORIGIN_LS_KEY)
    if (saved) setData(prev => prev.originCity ? prev : { ...prev, originCity: saved })
  }, [])

  async function runChecks() {
    setChecking(true)
    setChecksDone(false)
    try {
      const profileRes = await fetch('/api/profile')
      const profile = profileRes.ok ? await profileRes.json() : null
      const passports = profile?.passports ?? []
      const existingVisas = profile?.existingVisas ?? []

      const destObjects = data.destinations.map(d => ({
        country: d.city,
        countryCode: d.countryCode || d.country,
      }))
      const startDate = data.startDate || ''
      const endDate = data.endDate || ''

      const [visaRes, healthRes] = await Promise.all([
        fetch('/api/ai/visa-check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ passports, destinations: destObjects, startDate, existingVisas }),
        }),
        fetch('/api/ai/health-check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ destinations: destObjects, startDate, endDate, checkType: 'health' }),
        }),
      ])
      const [visa, health] = await Promise.all([visaRes.json(), healthRes.json()])
      setAiResults({ visa, health })
    } catch {
      setAiResults({ error: 'Failed to run AI checks. Check your API key.' })
    } finally {
      setChecking(false)
      setChecksDone(true)
    }
  }

  async function getRecommendations() {
    setLoadingRecs(true)
    try {
      const profileRes = await fetch('/api/profile')
      const profile = profileRes.ok ? await profileRes.json() : null
      const res = await fetch('/api/ai/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile: profile ?? {},
          originCity: data.originCity,
          destinations: data.destinations.map(d => ({
            city: d.city,
            country: d.country,
            countryCode: d.countryCode,
            arrivalDate: d.arrivalDate ?? data.startDate,
            departureDate: d.departureDate ?? data.endDate,
            nights: d.stayDays ?? 1,
          })),
          startDate: data.startDate,
          endDate: data.endDate,
        }),
      })
      const json = await res.json()
      setRecommendations(json.result ?? null)
      if (json.error) toast.error('AI recommendations failed')
    } catch {
      toast.error('Failed to get recommendations')
    } finally {
      setLoadingRecs(false)
    }
  }

  async function saveTrip() {
    setSaving(true)
    try {
      // Fetch profile to get profileId
      const profileRes = await fetch('/api/profile')
      const profile = profileRes.ok ? await profileRes.json() : null
      if (!profile?.id) {
        toast.error('Please complete your profile first')
        router.push('/profile')
        return
      }

      const name = generateTripName(data)
      const originCode = extractOriginCode(data.originCity, data.originIata)

      const res = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          profileId: profile.id,
          name,
          originCode,
          visaRequirements: aiResults.visa ?? null,
          vaccinationReqs: aiResults.health ?? null,
          aiRecommendations: recommendations ?? null,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to save trip')
      }

      const trip = await res.json()
      toast.success('Trip created!')
      router.push(`/trips/${trip.id}`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save trip')
    } finally {
      setSaving(false)
    }
  }

  function canProceed() {
    if (step === 0) return !!data.originCity.trim()
    if (step === 1) return data.destinations.length > 0 || !!data.travelWish?.trim()
    if (step === 2) {
      if (!data.startDate || !data.endDate) return false
      const nights = Math.round((new Date(data.endDate).getTime() - new Date(data.startDate).getTime()) / 86400000)
      const minNights = Math.max(1, data.destinations.length)
      return nights >= minNights
    }
    if (step === 3) return data.selectedRouteIndex !== undefined && data.selectedRouteIndex !== null
    return true
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Plan New Trip</h1>
        <p className="text-sm text-gray-500 mt-1">AI-powered travel planning in minutes</p>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-xs text-gray-500">
          <span>Step {step + 1} of {STEPS.length}</span>
          <span className="font-medium text-teal-600">{STEPS[step].label}</span>
        </div>
        <Progress value={((step + 1) / STEPS.length) * 100} className="h-2" />
      </div>

      <div className="flex gap-1.5 flex-wrap">
        {STEPS.map((s, i) => (
          <button
            key={i}
            onClick={() => i <= step && setStep(i)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all ${
              i === step
                ? 'bg-gradient-to-r from-teal-500 to-sky-500 text-white shadow-md'
                : i < step
                  ? 'bg-teal-100 text-teal-700 cursor-pointer'
                  : 'bg-gray-100 text-gray-400 cursor-default'
            }`}
          >
            {i < step ? <Check className="h-3 w-3" /> : <span>{s.emoji}</span>}
            {s.label}
          </button>
        ))}
      </div>

      <Card className="border-0 shadow-md">
        <CardContent className="p-6">
          {step === 0 && <OriginStep data={data} update={update} />}
          {step === 1 && <DestinationsStep data={data} update={update} />}
          {step === 2 && <DatesStep data={data} update={update} />}
          {step === 3 && (
            <RoutesStep
              originCity={data.originCity}
              destinations={data.destinations.map(d => ({ city: d.city, country: d.country, countryCode: d.countryCode, stayDays: d.stayDays }))}
              startDate={data.startDate}
              endDate={data.endDate}
              flexDays={data.datesFlexible ? data.flexDays || 3 : 0}
              budgetTotal={budgetTotal}
              accommodation={accommodation}
              onOriginIataResolved={iata => update({ originIata: iata })}
              selectedVariantIndex={data.selectedRouteIndex ?? null}
              onSelectVariant={(idx, variant) => {
                const updatedDests: Destination[] = variant.stops.map(s => ({
                  city: s.city,
                  country: s.country,
                  countryCode: s.country,
                  arrivalDate: s.arrivalDate,
                  departureDate: s.departureDate,
                  stayDays: s.nights,
                  emoji: data.destinations.find(d => d.city.toLowerCase() === s.city.toLowerCase())?.emoji,
                }))
                update({
                  destinations: updatedDests,
                  startDate: variant.stops[0]?.arrivalDate ?? data.startDate,
                  endDate: variant.stops[variant.stops.length - 1]?.departureDate ?? data.endDate,
                  selectedRoute: variant,
                  selectedRouteIndex: idx,
                })
              }}
            />
          )}
          {step === 4 && <AIChecksStep data={data} aiResults={aiResults} runChecks={runChecks} checksDone={checksDone} checking={checking} />}
          {step === 5 && <SummaryStep data={data} aiResults={aiResults} recommendations={recommendations} loadingRecs={loadingRecs} getRecommendations={getRecommendations} />}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => step === 0 ? router.push('/trips') : setStep(s => s - 1)}>
          <ChevronLeft className="h-4 w-4 mr-1" /> {step === 0 ? 'Cancel' : 'Back'}
        </Button>
        {step < STEPS.length - 1 ? (
          <Button onClick={() => setStep(s => s + 1)} disabled={!canProceed()} className="bg-teal-600 hover:bg-teal-700">
            Next <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button onClick={saveTrip} disabled={saving} className="bg-gradient-to-r from-teal-500 to-sky-500 hover:from-teal-600 hover:to-sky-600 font-semibold px-6">
            {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</> : 'Create Trip ✈️'}
          </Button>
        )}
      </div>
    </div>
  )
}
