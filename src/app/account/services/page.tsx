import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ServicesClient } from '@/components/services/ServicesClient'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function ServicesPage() {
  const user = await getSession()
  if (!user) redirect('/auth/signin?from=/account/services')

  const raw = await prisma.connectedService.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: 'desc' },
  })

  const services = raw.map(s => ({
    ...s,
    updatedAt: s.updatedAt.toISOString(),
    createdAt: s.createdAt.toISOString(),
    aiInsights: s.aiInsights ? JSON.parse(s.aiInsights) : null,
  }))

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <Link href="/account" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors">
          <ArrowLeft size={14} /> Back to Account
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Connected Services</h1>
        <p className="text-gray-500 mt-1">
          Connect your booking accounts so AI can learn your preferences and suggest similar stays and cars.
          Paste booking confirmations — AI extracts your patterns automatically.
        </p>
      </div>

      {/* How it works */}
      <div className="bg-gradient-to-r from-teal-50 to-sky-50 rounded-2xl p-5 mb-8 border border-teal-100">
        <h3 className="font-semibold text-gray-800 mb-3">How it works</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          {[
            { step: '1', title: 'Connect a service', desc: 'Add your username or membership number' },
            { step: '2', title: 'Paste your history', desc: 'Copy booking confirmation emails or describe past stays' },
            { step: '3', title: 'AI learns your style', desc: 'Get personalised hotel and car suggestions on every trip' },
          ].map(({ step, title, desc }) => (
            <div key={step} className="flex gap-3">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-teal-600 text-white text-xs font-bold flex items-center justify-center">{step}</span>
              <div>
                <p className="font-medium text-gray-800">{title}</p>
                <p className="text-gray-500">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <ServicesClient initial={services} />
    </div>
  )
}
