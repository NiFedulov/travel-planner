'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, MapPin, Calendar, Users, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function TripsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [trips, setTrips] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetch('/api/trips').then(r => r.json()).then(data => {
      setTrips(data ?? [])
      setLoading(false)
    })
  }, [])

  const statusColors: Record<string, string> = {
    planning: 'bg-yellow-100 text-yellow-700',
    confirmed: 'bg-green-100 text-green-700',
    completed: 'bg-gray-100 text-gray-600',
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Trips</h1>
          <p className="text-sm text-gray-500 mt-1">Plan, book, and manage your journeys</p>
        </div>
        <Button onClick={() => router.push('/trips/new')} className="bg-teal-600 hover:bg-teal-700">
          <Plus className="h-4 w-4 mr-2" /> New Trip
        </Button>
      </div>

      {loading && (
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 rounded-2xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      )}

      {!loading && trips.length === 0 && (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">✈️</div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">No trips yet</h2>
          <p className="text-gray-500 mb-6">Start planning your first adventure</p>
          <Button onClick={() => router.push('/trips/new')} className="bg-teal-600 hover:bg-teal-700">
            <Plus className="h-4 w-4 mr-2" /> Create first trip
          </Button>
        </div>
      )}

      <div className="grid gap-4">
        {trips.map(trip => {
          const destinations = typeof trip.destinations === 'string' ? JSON.parse(trip.destinations) : trip.destinations
          const startDate = new Date(trip.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          const endDate = new Date(trip.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

          return (
            <Card key={trip.id} className="border-0 shadow-md hover:shadow-lg transition-all cursor-pointer group" onClick={() => router.push(`/trips/${trip.id}`)}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg text-gray-900">
                        {trip.originCity} → {destinations?.map((d: { city: string }) => d.city).join(' → ')}
                      </span>
                      <Badge className={statusColors[trip.status] ?? 'bg-gray-100 text-gray-600'}>
                        {trip.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {startDate} – {endDate}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {destinations?.length ?? 0} destination{destinations?.length !== 1 ? 's' : ''}
                      </span>
                      {trip.datesFlexible && (
                        <span className="text-teal-600 text-xs font-medium">Flexible dates</span>
                      )}
                    </div>
                    {trip.estimatedTotal && (
                      <div className="text-sm font-semibold text-teal-700">
                        Est. total: {trip.estimatedTotal.toLocaleString()} EUR
                      </div>
                    )}
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-300 group-hover:text-teal-500 transition-colors mt-1 flex-shrink-0" />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
