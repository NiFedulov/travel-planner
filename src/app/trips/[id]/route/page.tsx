'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Plane, Clock, DollarSign, Loader2, AlertTriangle, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function FlightCard({ flight, isSelected, onSelect }: { flight: any; isSelected: boolean; onSelect: () => void }) {
  const isStopover = flight.type === 'stopover'
  const isAIChoice = flight.aiHighlight

  return (
    <Card
      className={`border-2 cursor-pointer transition-all hover:shadow-lg ${
        isSelected ? 'border-teal-500 shadow-md' : 'border-gray-200 hover:border-gray-300'
      }`}
      onClick={onSelect}
    >
      <CardContent className="p-5 space-y-3">
        {/* Badges */}
        <div className="flex gap-2 flex-wrap">
          {isAIChoice && <Badge className="bg-teal-600 text-white">✨ AI Pick</Badge>}
          {flight.type === 'direct' && <Badge className="bg-sky-100 text-sky-700">Direct</Badge>}
          {flight.type === 'layover' && <Badge className="bg-purple-100 text-purple-700">Layover</Badge>}
          {isStopover && <Badge className="bg-orange-100 text-orange-700">Stopover ✈️</Badge>}
          {flight.cheapest && <Badge className="bg-green-100 text-green-700">Cheapest</Badge>}
          {flight.fastest && <Badge className="bg-blue-100 text-blue-700">Fastest</Badge>}
          {flight.savings && <Badge className="bg-emerald-100 text-emerald-700">Save {flight.savings}%</Badge>}
        </div>

        {/* Route */}
        <div className="flex items-center gap-3">
          <div className="text-center">
            <div className="font-bold text-lg">{flight.departure}</div>
            <div className="text-xs text-gray-500">{flight.origin}</div>
          </div>
          <div className="flex-1 flex flex-col items-center">
            <div className="text-xs text-gray-400">{flight.duration}</div>
            <div className="w-full flex items-center gap-1">
              <div className="flex-1 h-px bg-gray-300" />
              <Plane className="h-3 w-3 text-gray-400" />
              <div className="flex-1 h-px bg-gray-300" />
            </div>
            {flight.via && <div className="text-xs text-gray-400">via {flight.via}</div>}
          </div>
          <div className="text-center">
            <div className="font-bold text-lg">{flight.arrival}</div>
            <div className="text-xs text-gray-500">{flight.destination}</div>
          </div>
        </div>

        {/* Stopover details */}
        {isStopover && flight.stopovers && (
          <div className="bg-orange-50 rounded-xl p-3 text-xs space-y-1">
            <p className="font-semibold text-orange-800">Stopover breakdown</p>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {flight.stopovers.map((s: any, i: number) => (
              <div key={i} className="text-orange-700">
                {s.city}: {s.nights} night{s.nights !== 1 ? 's' : ''} (+{s.hotelCost} hotel)
              </div>
            ))}
            <div className="pt-1 border-t border-orange-200 text-orange-700">
              Total vs direct: {flight.vsDirectSavings > 0 ? `Save ${flight.vsDirectSavings} EUR` : `+${Math.abs(flight.vsDirectSavings)} EUR`}
            </div>
          </div>
        )}

        {/* MCT warning */}
        {flight.mctWarning && (
          <div className="flex items-start gap-2 bg-yellow-50 rounded-lg p-2 text-xs text-yellow-700">
            <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
            <span>{flight.mctWarning}</span>
          </div>
        )}

        {/* Price + score */}
        <div className="flex items-center justify-between">
          <div>
            <span className="font-bold text-xl text-gray-900">{flight.price} EUR</span>
            {isStopover && <span className="text-xs text-gray-500 ml-1">total incl. hotel</span>}
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Star className="h-3.5 w-3.5 text-yellow-400 fill-current" />
            <span>Score: {Math.round((flight.score ?? 0) * 100)}/100</span>
          </div>
        </div>

        {/* AI explanation */}
        {flight.aiExplanation && (
          <p className="text-xs text-gray-500 italic border-t pt-2">{flight.aiExplanation}</p>
        )}

        {isSelected && (
          <div className="text-center text-sm font-semibold text-teal-600">✓ Selected</div>
        )}
      </CardContent>
    </Card>
  )
}

export default function RoutePage() {
  const { id } = useParams()
  const router = useRouter()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [trip, setTrip] = useState<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [flights, setFlights] = useState<any[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [aiRanked, setAiRanked] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [optimizing, setOptimizing] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch(`/api/trips/${id}`).then(r => r.json()),
      fetch('/api/mock/flights').then(r => r.json()),
    ]).then(([t, f]) => {
      setTrip(t)
      setFlights(f ?? [])
      setLoading(false)
    })
  }, [id])

  async function optimizeRoute() {
    if (!trip) return
    setOptimizing(true)
    try {
      const res = await fetch('/api/ai/route-optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trip, flights, profile: {} }),
      })
      const result = await res.json()
      setAiRanked(result.rankedFlights ?? flights.slice(0, 5).map((f, i) => ({ ...f, aiHighlight: i === 0 })))
    } catch {
      toast.error('AI optimization failed')
      setAiRanked(flights.slice(0, 5))
    } finally {
      setOptimizing(false)
    }
  }

  async function saveSelection() {
    const selected = aiRanked.find(f => f.id === selectedId) ?? flights.find(f => f.id === selectedId)
    if (!selected) return
    setSaving(true)
    try {
      await fetch(`/api/trips/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedRoute: selected }),
      })
      toast.success('Route saved!')
      router.push(`/trips/${id}`)
    } catch {
      toast.error('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="max-w-4xl mx-auto space-y-4 animate-pulse">{[1,2,3].map(i => <div key={i} className="h-48 bg-gray-100 rounded-2xl" />)}</div>

  const displayed = aiRanked.length > 0 ? aiRanked : flights.slice(0, 6)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <button onClick={() => router.push(`/trips/${id}`)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2">
            <ArrowLeft className="h-4 w-4" /> Back to trip
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Choose Your Route</h1>
          <p className="text-sm text-gray-500 mt-1">Direct, layover, and overnight stopover options</p>
        </div>
        <Button onClick={optimizeRoute} disabled={optimizing} className="bg-gradient-to-r from-teal-500 to-sky-500 hover:from-teal-600 hover:to-sky-600">
          {optimizing ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Optimizing...</> : '✨ AI Optimize'}
        </Button>
      </div>

      {/* Legend */}
      <div className="flex gap-3 flex-wrap text-xs">
        {[
          { emoji: '✈️', label: 'Direct — fastest', bg: 'bg-sky-50 text-sky-700' },
          { emoji: '🔄', label: 'Layover — cheaper', bg: 'bg-purple-50 text-purple-700' },
          { emoji: '🌙', label: 'Stopover — see more cities', bg: 'bg-orange-50 text-orange-700' },
        ].map(({ emoji, label, bg }) => (
          <span key={label} className={`px-2.5 py-1 rounded-full font-medium ${bg}`}>{emoji} {label}</span>
        ))}
      </div>

      {optimizing && (
        <div className="text-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-teal-500 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Claude is analyzing {flights.length} routes...</p>
        </div>
      )}

      {!optimizing && (
        <div className="grid gap-4">
          {displayed.map(flight => (
            <FlightCard
              key={flight.id}
              flight={flight}
              isSelected={selectedId === flight.id}
              onSelect={() => setSelectedId(flight.id)}
            />
          ))}
          {displayed.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Plane className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No flights found. Click AI Optimize to search.</p>
            </div>
          )}
        </div>
      )}

      {selectedId && (
        <div className="sticky bottom-4">
          <Button onClick={saveSelection} disabled={saving} className="w-full bg-teal-600 hover:bg-teal-700 py-6 text-base font-semibold shadow-xl">
            {saving ? 'Saving...' : 'Confirm Route Selection →'}
          </Button>
        </div>
      )}
    </div>
  )
}
