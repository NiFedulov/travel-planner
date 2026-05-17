'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import type { ReactElement } from 'react'
import { ArrowLeft, Star, Wifi, Coffee, Dumbbell, PawPrint, Car, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function HotelCard({ hotel, isSelected, onSelect }: { hotel: any; isSelected: boolean; onSelect: () => void }) {
  const amenityIcons: Record<string, ReactElement> = {
    wifi: <Wifi className="h-3.5 w-3.5" />,
    breakfast: <Coffee className="h-3.5 w-3.5" />,
    gym: <Dumbbell className="h-3.5 w-3.5" />,
    petFriendly: <PawPrint className="h-3.5 w-3.5" />,
    parking: <Car className="h-3.5 w-3.5" />,
  }

  return (
    <Card
      className={`border-2 cursor-pointer transition-all hover:shadow-lg ${
        isSelected ? 'border-violet-500 shadow-md' : 'border-gray-200 hover:border-gray-300'
      }`}
      onClick={onSelect}
    >
      <CardContent className="p-0">
        {/* Image placeholder */}
        <div className="h-40 bg-gradient-to-br from-violet-200 to-indigo-300 rounded-t-xl flex items-center justify-center text-4xl">
          🏨
        </div>
        <div className="p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-bold text-gray-900">{hotel.name}</h3>
              <p className="text-sm text-gray-500">{hotel.city}, {hotel.country}</p>
            </div>
            <div className="flex items-center gap-0.5">
              {Array.from({ length: hotel.stars ?? 3 }).map((_, i) => (
                <Star key={i} className="h-3.5 w-3.5 text-yellow-400 fill-current" />
              ))}
            </div>
          </div>

          {/* Amenities */}
          <div className="flex flex-wrap gap-1.5">
            {(hotel.amenities ?? []).map((a: string) => (
              <span key={a} className="flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded-full text-xs text-gray-600">
                {amenityIcons[a] ?? null} {a}
              </span>
            ))}
          </div>

          {/* Price + rating */}
          <div className="flex items-center justify-between">
            <div>
              <span className="font-bold text-xl text-gray-900">{hotel.pricePerNight} EUR</span>
              <span className="text-xs text-gray-500 ml-1">/night</span>
            </div>
            {hotel.rating && (
              <Badge className="bg-teal-100 text-teal-700">
                ⭐ {hotel.rating}/10
              </Badge>
            )}
          </div>

          {hotel.petFriendly && (
            <Badge className="bg-green-100 text-green-700 text-xs">🐾 Pet friendly</Badge>
          )}

          {isSelected && (
            <div className="text-center text-sm font-semibold text-violet-600">✓ Selected</div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default function AccommodationPage() {
  const { id } = useParams()
  const router = useRouter()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [trip, setTrip] = useState<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [hotels, setHotels] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch(`/api/trips/${id}`).then(r => r.json()),
      fetch('/api/mock/hotels').then(r => r.json()),
    ]).then(([t, h]) => {
      setTrip(t)
      setHotels(h ?? [])
      setLoading(false)
    })
  }, [id])

  function toggleHotel(hotelId: string) {
    setSelectedIds(prev => prev.includes(hotelId) ? prev.filter(x => x !== hotelId) : [...prev, hotelId])
  }

  async function saveSelection() {
    const selected = hotels.filter(h => selectedIds.includes(h.id))
    setSaving(true)
    try {
      await fetch(`/api/trips/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedAccommodations: selected }),
      })
      toast.success('Accommodation saved!')
      router.push(`/trips/${id}`)
    } catch {
      toast.error('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="max-w-4xl mx-auto space-y-4 animate-pulse">{[1,2,3].map(i => <div key={i} className="h-64 bg-gray-100 rounded-2xl" />)}</div>

  const destinations = typeof trip?.destinations === 'string' ? JSON.parse(trip.destinations) : trip?.destinations ?? []
  const destinationCities = destinations.map((d: { city: string }) => d.city.toLowerCase())

  const filteredHotels = hotels.filter(h =>
    destinationCities.some((c: string) => h.city?.toLowerCase().includes(c) || c.includes(h.city?.toLowerCase() ?? ''))
  )

  const displayedHotels = filteredHotels.length > 0 ? filteredHotels : hotels

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <button onClick={() => router.push(`/trips/${id}`)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2">
            <ArrowLeft className="h-4 w-4" /> Back to trip
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Choose Accommodation</h1>
          <p className="text-sm text-gray-500 mt-1">Select hotels for each destination</p>
        </div>
      </div>

      {displayedHotels.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Loader2 className="h-8 w-8 mx-auto mb-3 text-gray-300" />
          <p>No hotels found for your destinations</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayedHotels.map(hotel => (
            <HotelCard
              key={hotel.id}
              hotel={hotel}
              isSelected={selectedIds.includes(hotel.id)}
              onSelect={() => toggleHotel(hotel.id)}
            />
          ))}
        </div>
      )}

      {selectedIds.length > 0 && (
        <div className="sticky bottom-4">
          <Button onClick={saveSelection} disabled={saving} className="w-full bg-violet-600 hover:bg-violet-700 py-6 text-base font-semibold shadow-xl">
            {saving ? 'Saving...' : `Confirm ${selectedIds.length} hotel${selectedIds.length !== 1 ? 's' : ''} →`}
          </Button>
        </div>
      )}
    </div>
  )
}
