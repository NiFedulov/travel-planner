'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, MapPin, Calendar, ArrowRight, User, Plane, Hotel, Car } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Trip } from '@/lib/types/trip'
import type { TouristProfile } from '@/lib/types/profile'
import { format } from 'date-fns'

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    planning: 'bg-blue-100 text-blue-700',
    booked: 'bg-green-100 text-green-700',
    completed: 'bg-gray-100 text-gray-600',
    cancelled: 'bg-red-100 text-red-700',
  }
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[status] ?? colors.planning}`}>
      {status}
    </span>
  )
}

export default function Dashboard() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [profile, setProfile] = useState<TouristProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/trips').then(r => r.json()),
      fetch('/api/profile').then(r => r.json()),
    ]).then(([tripsData, profileData]) => {
      setTrips(tripsData ?? [])
      setProfile(profileData)
      setLoading(false)
    })
  }, [])

  const profileComplete = profile
    ? Math.round([
        profile.travelers.length > 0,
        profile.passports.length > 0,
        !!profile.budgetTotal,
        profile.vacationStyle.length > 0,
        profile.languagesSpoken.length > 0,
      ].filter(Boolean).length / 5 * 100)
    : 0

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-teal-500 via-sky-500 to-blue-600 p-8 text-white">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2">Plan your perfect journey</h1>
          <p className="text-teal-100 text-lg mb-6">AI-powered travel planning — from visas to hotels</p>
          <div className="flex flex-wrap gap-3">
            <Link href="/trips/new">
              <Button className="bg-white text-teal-700 hover:bg-teal-50 font-semibold shadow-lg">
                <Plus className="h-4 w-4 mr-2" />
                New Trip
              </Button>
            </Link>
            {!profile && (
              <Link href="/profile">
                <Button variant="outline" className="border-white/40 text-white hover:bg-white/10">
                  <User className="h-4 w-4 mr-2" />
                  Create Profile
                </Button>
              </Link>
            )}
          </div>
        </div>
        <div className="absolute top-4 right-8 text-8xl opacity-10 select-none">✈️</div>
        <div className="absolute bottom-2 right-24 text-6xl opacity-10 select-none">🗺️</div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { icon: Plane, label: 'Trips', value: trips.length, color: 'text-teal-600', bg: 'bg-teal-50' },
          { icon: MapPin, label: 'Destinations', value: trips.reduce((s, t) => s + (t.destinations?.length ?? 0), 0), color: 'text-sky-600', bg: 'bg-sky-50' },
          { icon: Hotel, label: 'Hotels saved', value: trips.reduce((s, t) => s + (t.selectedAccommodations?.length ?? 0), 0), color: 'text-violet-600', bg: 'bg-violet-50' },
          { icon: Car, label: 'Car rentals', value: trips.filter(t => t.selectedCarRental).length, color: 'text-orange-500', bg: 'bg-orange-50' },
        ].map(({ icon: Icon, label, value, color, bg }) => (
          <Card key={label} className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`h-10 w-10 rounded-xl ${bg} flex items-center justify-center`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{value}</div>
                <div className="text-xs text-gray-500">{label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trips list */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">My Trips</h2>
            <Link href="/trips">
              <Button variant="ghost" size="sm" className="text-teal-600">
                View all <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2].map(i => (
                <div key={i} className="h-24 rounded-xl bg-gray-100 animate-pulse" />
              ))}
            </div>
          ) : trips.length === 0 ? (
            <Card className="border-dashed border-2 border-gray-200">
              <CardContent className="p-8 text-center">
                <Plane className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No trips yet. Start planning!</p>
                <Link href="/trips/new">
                  <Button className="mt-4 bg-teal-600 hover:bg-teal-700">
                    <Plus className="h-4 w-4 mr-2" /> Plan your first trip
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            trips.slice(0, 5).map(trip => (
              <Link key={trip.id} href={`/trips/${trip.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900 truncate">{trip.name}</h3>
                          <StatusBadge status={trip.status} />
                        </div>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {(trip.destinations ?? []).map(d => (
                            <Badge key={d.city} variant="secondary" className="text-xs bg-teal-50 text-teal-700">
                              <MapPin className="h-3 w-3 mr-1" />{d.city}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Calendar className="h-3.5 w-3.5" />
                          {format(new Date(trip.startDate), 'MMM d')} – {format(new Date(trip.endDate), 'MMM d, yyyy')}
                        </div>
                      </div>
                      {trip.estimatedTotal && (
                        <div className="text-right shrink-0">
                          <div className="font-bold text-teal-600">€{trip.estimatedTotal.toLocaleString()}</div>
                          <div className="text-xs text-gray-400">estimated</div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </div>

        {/* Profile card */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Your Profile</h2>
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center justify-between">
                <span>Traveler Profile</span>
                <Link href="/profile">
                  <Button variant="ghost" size="sm" className="text-teal-600 h-7 px-2">Edit</Button>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {!profile ? (
                <div className="text-center py-4">
                  <User className="h-10 w-10 text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 mb-3">No profile yet</p>
                  <Link href="/profile">
                    <Button size="sm" className="bg-teal-600 hover:bg-teal-700 w-full">
                      Create Profile
                    </Button>
                  </Link>
                </div>
              ) : (
                <>
                  {/* Completion bar */}
                  <div>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Profile completeness</span>
                      <span className="font-medium text-teal-600">{profileComplete}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-teal-400 to-sky-400 rounded-full transition-all"
                        style={{ width: `${profileComplete}%` }}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Travelers</span>
                      <span className="font-medium">{profile.travelers.length} person(s)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Budget</span>
                      <span className="font-medium">{profile.budgetTotal ? `€${profile.budgetTotal.toLocaleString()}` : '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Flight class</span>
                      <span className="font-medium capitalize">{profile.flightClass}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Max layovers</span>
                      <span className="font-medium">{profile.maxLayovers}</span>
                    </div>
                  </div>
                  {profile.vacationStyle.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {profile.vacationStyle.slice(0, 4).map(s => (
                        <Badge key={s} variant="secondary" className="text-xs capitalize bg-orange-50 text-orange-700">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
