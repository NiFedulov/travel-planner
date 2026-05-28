'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { LogOut, User, MapPin, Settings, ChevronRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function AccountPage() {
  const router = useRouter()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [user, setUser] = useState<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [trips, setTrips] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/auth/me').then(r => r.json()),
      fetch('/api/trips').then(r => r.json()),
    ]).then(([me, t]) => {
      setUser(me.user)
      setTrips(t ?? [])
      setLoading(false)
    })
  }, [])

  async function handleLogout() {
    setLoggingOut(true)
    await fetch('/api/auth/logout', { method: 'POST' })
    toast.success('Signed out')
    router.push('/auth/signin')
    router.refresh()
  }

  if (loading) return (
    <div className="max-w-2xl mx-auto flex items-center justify-center py-20">
      <Loader2 className="h-6 w-6 animate-spin text-teal-500" />
    </div>
  )

  const initials = user?.name
    ? user.name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? '?'

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Profile header */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <div className="h-20 bg-gradient-to-r from-teal-500 to-sky-500" />
        <CardContent className="pt-0 pb-6 px-6">
          <div className="-mt-10 flex items-end justify-between mb-4">
            <div className="relative">
              {user?.image
                ? <img src={user.image} alt="" className="w-20 h-20 rounded-full border-4 border-white shadow-sm object-cover" />
                : <div className="w-20 h-20 rounded-full border-4 border-white shadow-sm bg-gradient-to-br from-teal-400 to-sky-500 flex items-center justify-center text-white text-2xl font-bold">
                    {initials}
                  </div>
              }
            </div>
            <Button onClick={handleLogout} disabled={loggingOut} variant="outline" size="sm" className="text-gray-500 hover:text-red-600 hover:border-red-300">
              {loggingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <><LogOut className="h-4 w-4 mr-1.5" />Sign out</>}
            </Button>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{user?.name ?? 'Traveler'}</h1>
            <p className="text-sm text-gray-500">{user?.email}</p>
          </div>
        </CardContent>
      </Card>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/profile" className="group flex items-center gap-3 bg-white rounded-xl border border-gray-200 hover:border-teal-300 p-4 transition-all">
          <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center group-hover:bg-teal-100">
            <User className="h-5 w-5 text-teal-600" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-gray-800">Travel Profile</div>
            <div className="text-xs text-gray-400">Preferences & docs</div>
          </div>
          <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-teal-400" />
        </Link>
        <Link href="/trips" className="group flex items-center gap-3 bg-white rounded-xl border border-gray-200 hover:border-teal-300 p-4 transition-all">
          <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center group-hover:bg-orange-100">
            <MapPin className="h-5 w-5 text-orange-500" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-gray-800">My Trips</div>
            <div className="text-xs text-gray-400">{trips.length} trip{trips.length !== 1 ? 's' : ''} planned</div>
          </div>
          <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-orange-400" />
        </Link>
        <Link href="/account/services" className="group col-span-2 flex items-center gap-3 bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl border border-purple-100 hover:border-purple-300 p-4 transition-all">
          <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center group-hover:bg-purple-200">
            <span className="text-lg">🔗</span>
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-gray-800">Connected Services</div>
            <div className="text-xs text-gray-500">Airbnb, Booking.com, Hertz and more — AI learns your preferences</div>
          </div>
          <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-purple-400" />
        </Link>
      </div>

      {/* Recent trips */}
      {trips.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-gray-400" /> Recent trips
          </h2>
          {trips.slice(0, 3).map(trip => {
            const dests = typeof trip.destinations === 'string' ? JSON.parse(trip.destinations) : trip.destinations ?? []
            return (
              <Link key={trip.id} href={`/trips/${trip.id}`}
                className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 hover:border-teal-300 p-4 transition-all group">
                <div className="text-2xl">{dests[0]?.emoji ?? '✈️'}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 text-sm truncate">{trip.name}</div>
                  <div className="text-xs text-gray-400">
                    {dests.map((d: { city: string }) => d.city).join(' → ')}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-xs font-medium text-gray-500">{new Date(trip.startDate).toLocaleDateString('en', { month: 'short', day: 'numeric' })}</div>
                  <div className={`text-xs px-2 py-0.5 rounded-full mt-1 ${trip.status === 'planning' ? 'bg-amber-50 text-amber-600' : 'bg-teal-50 text-teal-600'}`}>
                    {trip.status}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* Account settings (placeholder) */}
      <Card className="border border-gray-100">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <Settings className="h-4 w-4" />
            <span>Account settings coming soon</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
