'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ChevronLeft, ChevronRight, Check, MapPin, Calendar, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

// Step 1: Origin
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

// Step 2: Destinations
interface Destination { city: string; country: string; arrivalDate: string; departureDate: string }
function DestinationsStep({ data, update }: { data: TripDraft; update: (p: Partial<TripDraft>) => void }) {
  const dests = data.destinations
  const [city, setCity] = useState('')
  const [country, setCountry] = useState('')
  const [arrival, setArrival] = useState('')
  const [departure, setDeparture] = useState('')

  function add() {
    if (!city || !country || !arrival || !departure) return
    update({ destinations: [...dests, { city: city.trim(), country: country.trim().toUpperCase(), arrivalDate: arrival, departureDate: departure }] })
    setCity(''); setCountry(''); setArrival(''); setDeparture('')
  }

  function remove(i: number) {
    update({ destinations: dests.filter((_, idx) => idx !== i) })
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Where do you want to go?</h2>
        <p className="text-sm text-gray-500">Add one or more destinations</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs text-gray-500">City</Label>
          <Input value={city} onChange={e => setCity(e.target.value)} placeholder="Florence" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-gray-500">Country code</Label>
          <Input value={country} onChange={e => setCountry(e.target.value)} placeholder="IT" maxLength={2} className="uppercase" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-gray-500">Arrival</Label>
          <Input type="date" value={arrival} onChange={e => setArrival(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-gray-500">Departure</Label>
          <Input type="date" value={departure} onChange={e => setDeparture(e.target.value)} />
        </div>
      </div>
      <Button onClick={add} disabled={!city || !country || !arrival || !departure} className="w-full bg-teal-600 hover:bg-teal-700">
        + Add destination
      </Button>

      <div className="space-y-2">
        {dests.map((d, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-teal-50 border border-teal-200">
            <MapPin className="h-4 w-4 text-teal-500 flex-shrink-0" />
            <div className="flex-1">
              <span className="font-medium text-sm text-teal-800">{d.city}, {d.country}</span>
              <div className="text-xs text-teal-600">{new Date(d.arrivalDate).toLocaleDateString()} → {new Date(d.departureDate).toLocaleDateString()}</div>
            </div>
            <button onClick={() => remove(i)} className="text-teal-400 hover:text-red-500 text-lg leading-none">×</button>
          </div>
        ))}
      </div>
    </div>
  )
}

// Step 3: Dates overview + flexibility
function DatesStep({ data, update }: { data: TripDraft; update: (p: Partial<TripDraft>) => void }) {
  const firstArrival = data.destinations[0]?.arrivalDate ?? ''
  const lastDeparture = data.destinations[data.destinations.length - 1]?.departureDate ?? ''

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Trip dates</h2>
        <p className="text-sm text-gray-500">Confirm your overall trip window</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-sm font-semibold text-gray-700">Start date</Label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="date"
              value={data.startDate || firstArrival}
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
              value={data.endDate || lastDeparture}
              onChange={e => update({ endDate: e.target.value })}
              className="pl-9"
            />
          </div>
        </div>
      </div>

      <div
        onClick={() => update({ datesFlexible: !data.datesFlexible })}
        className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
          data.datesFlexible ? 'border-teal-400 bg-teal-50' : 'border-gray-200 hover:border-gray-300'
        }`}
      >
        <div>
          <p className="font-medium text-sm text-gray-800">Flexible dates</p>
          <p className="text-xs text-gray-500">±3 days can save up to 30% on flights</p>
        </div>
        <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center ${data.datesFlexible ? 'border-teal-500 bg-teal-500' : 'border-gray-300'}`}>
          {data.datesFlexible && <Check className="h-3.5 w-3.5 text-white" />}
        </div>
      </div>

      {data.startDate && data.endDate && (
        <div className="bg-sky-50 rounded-xl p-3 text-sm text-sky-700">
          Total trip: {Math.round((new Date(data.endDate).getTime() - new Date(data.startDate).getTime()) / 86400000)} nights
        </div>
      )}
    </div>
  )
}

// Step 4: AI checks (visa + health)
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
          {(aiResults.visa.requirements ?? []).map((req: any, i: number) => (
            <div key={i} className={`p-3 rounded-xl border text-sm ${
              req.visaRequired ? 'bg-orange-50 border-orange-200' : 'bg-green-50 border-green-200'
            }`}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium">{req.destination}</span>
                <Badge className={req.visaRequired ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}>
                  {req.visaRequired ? 'Visa required' : 'No visa'}
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
          {(aiResults.health.requirements ?? []).map((req: any, i: number) => (
            <div key={i} className={`p-3 rounded-xl border text-sm ${
              req.required ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium">{req.destination}</span>
                {req.required && <Badge className="bg-yellow-100 text-yellow-700">Action needed</Badge>}
              </div>
              {req.vaccinations?.length > 0 && (
                <p className="text-xs text-gray-600">Vaccines: {req.vaccinations.join(', ')}</p>
              )}
              {req.notes && <p className="text-xs text-gray-600 mt-1">{req.notes}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Step 5: Summary + AI recommendations
function SummaryStep({ data, aiResults, recommendations, loadingRecs, getRecommendations }: {
  data: TripDraft
  aiResults: AICheckResult
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  recommendations: any
  loadingRecs: boolean
  getRecommendations: () => void
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Trip summary</h2>
        <p className="text-sm text-gray-500">Review and get AI recommendations</p>
      </div>

      <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">From</span>
          <span className="font-medium">{data.originCity}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Destinations</span>
          <span className="font-medium">{data.destinations.map(d => d.city).join(', ')}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Dates</span>
          <span className="font-medium">{data.startDate} → {data.endDate}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Flexible</span>
          <span className="font-medium">{data.datesFlexible ? 'Yes' : 'No'}</span>
        </div>
      </div>

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

// ————————————————————————————
interface TripDraft {
  originCity: string
  destinations: Destination[]
  startDate: string
  endDate: string
  datesFlexible: boolean
}

const STEPS = [
  { label: 'Origin', emoji: '🏠' },
  { label: 'Destinations', emoji: '📍' },
  { label: 'Dates', emoji: '📅' },
  { label: 'AI Checks', emoji: '🛂' },
  { label: 'Summary', emoji: '✅' },
]

const DEFAULT: TripDraft = { originCity: '', destinations: [], startDate: '', endDate: '', datesFlexible: false }

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

  function update(patch: Partial<TripDraft>) {
    setData(prev => ({ ...prev, ...patch }))
  }

  async function runChecks() {
    setChecking(true)
    setChecksDone(false)
    try {
      const [visaRes, healthRes] = await Promise.all([
        fetch('/api/ai/visa-check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ passports: [], destinations: data.destinations.map(d => d.country) }),
        }),
        fetch('/api/ai/health-check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ destinations: data.destinations.map(d => d.country), travelers: [] }),
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
      const res = await fetch('/api/ai/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trip: data, profile: {} }),
      })
      const recs = await res.json()
      setRecommendations(recs)
    } catch {
      toast.error('Failed to get recommendations')
    } finally {
      setLoadingRecs(false)
    }
  }

  async function saveTrip() {
    if (!data.originCity || data.destinations.length === 0 || !data.startDate || !data.endDate) {
      toast.error('Please fill in all required fields')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          visaRequirements: aiResults.visa ?? null,
          vaccinationReqs: aiResults.health ?? null,
          aiRecommendations: recommendations ?? null,
        }),
      })
      const trip = await res.json()
      toast.success('Trip created!')
      router.push(`/trips/${trip.id}`)
    } catch {
      toast.error('Failed to save trip')
    } finally {
      setSaving(false)
    }
  }

  function canProceed() {
    if (step === 0) return !!data.originCity.trim()
    if (step === 1) return data.destinations.length > 0
    if (step === 2) return !!data.startDate && !!data.endDate
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

      <div className="flex gap-1.5">
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
          {step === 3 && <AIChecksStep data={data} aiResults={aiResults} runChecks={runChecks} checksDone={checksDone} checking={checking} />}
          {step === 4 && <SummaryStep data={data} aiResults={aiResults} recommendations={recommendations} loadingRecs={loadingRecs} getRecommendations={getRecommendations} />}
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
            {saving ? 'Saving...' : 'Create Trip ✈️'}
          </Button>
        )}
      </div>
    </div>
  )
}
