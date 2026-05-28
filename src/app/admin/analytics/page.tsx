import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim()).filter(Boolean)

export default async function AnalyticsDashboard() {
  const user = await getSession()
  if (!user) redirect('/auth/signin?from=/admin/analytics')
  // Fail-closed: empty ADMIN_EMAILS means nobody is admin, not "anyone is admin"
  if (ADMIN_EMAILS.length === 0 || !ADMIN_EMAILS.includes(user.email)) {
    redirect('/')
  }

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const [eventCounts, recentEvents, userCount, tripCount] = await Promise.all([
    prisma.event.groupBy({
      by: ['event'],
      where: { createdAt: { gte: since } },
      _count: { event: true },
      orderBy: { _count: { event: 'desc' } },
    }),
    prisma.event.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.user.count(),
    prisma.trip.count(),
  ])

  const totalEvents = eventCounts.reduce((sum, e) => sum + e._count.event, 0)

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
        <p className="text-gray-500 mb-8">Last 30 days</p>

        {/* Top counters */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Users', value: userCount },
            { label: 'Total Trips', value: tripCount },
            { label: 'Events (30d)', value: totalEvents },
            { label: 'Event Types', value: eventCounts.length },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white rounded-xl border p-5">
              <p className="text-sm text-gray-500">{label}</p>
              <p className="text-3xl font-bold text-teal-600 mt-1">{value}</p>
            </div>
          ))}
        </div>

        {/* Event breakdown */}
        <div className="bg-white rounded-xl border p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Events by Type (30d)</h2>
          <div className="space-y-3">
            {eventCounts.map(({ event, _count }) => {
              const pct = totalEvents > 0 ? Math.round((_count.event / totalEvents) * 100) : 0
              return (
                <div key={event}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-mono text-gray-700">{event}</span>
                    <span className="text-gray-500">{_count.event} ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-2 bg-teal-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
            {eventCounts.length === 0 && (
              <p className="text-gray-400 text-sm">No events yet. Start using the app!</p>
            )}
          </div>
        </div>

        {/* Recent events */}
        <div className="bg-white rounded-xl border p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Events</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-2 pr-4">Event</th>
                  <th className="pb-2 pr-4">User</th>
                  <th className="pb-2 pr-4">Properties</th>
                  <th className="pb-2">Time</th>
                </tr>
              </thead>
              <tbody>
                {recentEvents.map(e => (
                  <tr key={e.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="py-2 pr-4 font-mono text-teal-700">{e.event}</td>
                    <td className="py-2 pr-4 text-gray-500 text-xs">{e.userId?.slice(0, 8) ?? '—'}</td>
                    <td className="py-2 pr-4 text-gray-400 text-xs max-w-xs truncate">
                      {e.properties ?? '—'}
                    </td>
                    <td className="py-2 text-gray-400 text-xs whitespace-nowrap">
                      {new Date(e.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
                {recentEvents.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-gray-400">No events yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
