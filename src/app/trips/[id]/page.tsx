'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, MapPin, Calendar, Plane, Hotel, Car, MessageSquare, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function TripDetailPage() {
  const { id } = useParams()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [trip, setTrip] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

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

  const destinations = typeof trip.destinations === 'string' ? JSON.parse(trip.destinations) : trip.destinations ?? []
  const visaReqs = typeof trip.visaRequirements === 'string' ? JSON.parse(trip.visaRequirements) : trip.visaRequirements
  const vacReqs = typeof trip.vaccinationReqs === 'string' ? JSON.parse(trip.vaccinationReqs) : trip.vaccinationReqs
  const aiRecs = typeof trip.aiRecommendations === 'string' ? JSON.parse(trip.aiRecommendations) : trip.aiRecommendations
  const selectedRoute = typeof trip.selectedRoute === 'string' ? JSON.parse(trip.selectedRoute) : trip.selectedRoute
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
            {trip.originCity} → {destinations.map((d: { city: string }) => d.city).join(' & ')}
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
            {destinations.map((d: { city: string; country: string; arrivalDate: string; departureDate: string }, i: number) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <div className="h-8 w-8 rounded-full bg-sky-100 flex items-center justify-center text-sky-700 font-bold text-xs flex-shrink-0">
                  {i + 1}
                </div>
                <div>
                  <span className="font-medium text-gray-700">{d.city}, {d.country}</span>
                  <div className="text-xs text-gray-400">
                    {new Date(d.arrivalDate).toLocaleDateString()} – {new Date(d.departureDate).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

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
          <Button className="bg-teal-600 hover:bg-teal-700">
            <MessageSquare className="h-4 w-4 mr-2" /> Chat
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
