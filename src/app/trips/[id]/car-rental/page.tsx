'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import type { ReactElement } from 'react'
import { ArrowLeft, Users, Fuel, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CarCard({ car, isSelected, onSelect }: { car: any; isSelected: boolean; onSelect: () => void }) {
  const fuelIcons: Record<string, ReactElement> = {
    petrol: <Fuel className="h-3.5 w-3.5" />,
    diesel: <Fuel className="h-3.5 w-3.5 text-gray-700" />,
    hybrid: <Zap className="h-3.5 w-3.5 text-green-500" />,
    electric: <Zap className="h-3.5 w-3.5 text-teal-500" />,
  }

  const categoryEmoji: Record<string, string> = {
    economy: '🚗',
    compact: '🚙',
    suv: '🚐',
    minivan: '🚌',
    luxury: '🏎️',
  }

  return (
    <Card
      className={`border-2 cursor-pointer transition-all hover:shadow-lg ${
        isSelected ? 'border-orange-500 shadow-md' : 'border-gray-200 hover:border-gray-300'
      }`}
      onClick={onSelect}
    >
      <CardContent className="p-5 space-y-3">
        {/* Car type emoji */}
        <div className="flex items-center justify-between">
          <div className="text-4xl">{categoryEmoji[car.category ?? 'compact'] ?? '🚗'}</div>
          <div className="flex gap-2">
            {car.crossBorder && <Badge className="bg-blue-100 text-blue-700 text-xs">🌍 Cross-border</Badge>}
            {car.automatic && <Badge className="bg-gray-100 text-gray-600 text-xs">Auto</Badge>}
          </div>
        </div>

        <div>
          <h3 className="font-bold text-gray-900">{car.name}</h3>
          <p className="text-sm text-gray-500">{car.category} · {car.pickupCity}</p>
        </div>

        <div className="flex items-center gap-3 text-sm text-gray-600">
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" /> {car.seats} seats
          </span>
          <span className="flex items-center gap-1">
            {fuelIcons[car.fuelType ?? 'petrol']} {car.fuelType}
          </span>
          {car.ac && <span>❄️ AC</span>}
        </div>

        {/* Insurance */}
        {car.insuranceOptions && (
          <div className="text-xs text-gray-500">
            Insurance: {car.insuranceOptions.join(' / ')}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div>
            <span className="font-bold text-xl text-gray-900">{car.pricePerDay} EUR</span>
            <span className="text-xs text-gray-500 ml-1">/day</span>
          </div>
          {isSelected && (
            <span className="text-sm font-semibold text-orange-600">✓ Selected</span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default function CarRentalPage() {
  const { id } = useParams()
  const router = useRouter()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [trip, setTrip] = useState<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [cars, setCars] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [crossBorderOnly, setCrossBorderOnly] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch(`/api/trips/${id}`).then(r => r.json()),
      fetch('/api/mock/cars').then(r => r.json()),
    ]).then(([t, c]) => {
      setTrip(t)
      setCars(c ?? [])
      setLoading(false)
    })
  }, [id])

  async function saveSelection() {
    const selected = cars.find(c => c.id === selectedId)
    if (!selected) return
    setSaving(true)
    try {
      await fetch(`/api/trips/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedCarRental: selected }),
      })
      toast.success('Car rental saved!')
      router.push(`/trips/${id}`)
    } catch {
      toast.error('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="max-w-4xl mx-auto space-y-4 animate-pulse">{[1,2,3].map(i => <div key={i} className="h-48 bg-gray-100 rounded-2xl" />)}</div>

  const destinations = typeof trip?.destinations === 'string' ? JSON.parse(trip.destinations) : trip?.destinations ?? []
  const isMultiDestination = destinations.length > 1

  const filteredCars = cars.filter(c => {
    if (crossBorderOnly && !c.crossBorder) return false
    return true
  })

  const nights = trip ? Math.round((new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / 86400000) : 0
  const selected = cars.find(c => c.id === selectedId)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <button onClick={() => router.push(`/trips/${id}`)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2">
          <ArrowLeft className="h-4 w-4" /> Back to trip
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Car Rental</h1>
        <p className="text-sm text-gray-500 mt-1">Pick the right car for your journey</p>
      </div>

      {isMultiDestination && (
        <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-700 border border-blue-200">
          <p className="font-semibold mb-1">🌍 Multi-destination trip</p>
          <p>You&apos;re visiting {destinations.length} countries — you&apos;ll need a car with cross-border coverage.</p>
          <button onClick={() => setCrossBorderOnly(!crossBorderOnly)} className={`mt-2 px-3 py-1 rounded-full text-xs font-medium ${crossBorderOnly ? 'bg-blue-600 text-white' : 'bg-blue-200 text-blue-700'}`}>
            {crossBorderOnly ? '✓ Showing cross-border only' : 'Filter: cross-border only'}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredCars.map(car => (
          <CarCard
            key={car.id}
            car={car}
            isSelected={selectedId === car.id}
            onSelect={() => setSelectedId(car.id)}
          />
        ))}
        {filteredCars.length === 0 && (
          <div className="col-span-2 text-center py-12 text-gray-500">
            No cars available with current filters
          </div>
        )}
      </div>

      {selectedId && selected && (
        <div className="sticky bottom-4">
          <div className="bg-white rounded-2xl shadow-xl border p-4 flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-800">{selected.name}</p>
              <p className="text-sm text-gray-500">
                {nights} nights × {selected.pricePerDay} EUR = <span className="font-bold text-orange-600">{nights * selected.pricePerDay} EUR</span>
              </p>
            </div>
            <Button onClick={saveSelection} disabled={saving} className="bg-orange-500 hover:bg-orange-600 font-semibold">
              {saving ? 'Saving...' : 'Confirm →'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
