'use client'

import { useState, useCallback } from 'react'
import { SERVICES, SERVICE_CATEGORIES, ServiceCategory, ServiceConfig } from '@/lib/services/config'
import { Sparkles, Plug, Trash2, ChevronDown, ChevronUp, CheckCircle, Loader2, AlertCircle } from 'lucide-react'

interface ConnectedService {
  id: string
  provider: string
  category: string
  username?: string | null
  membershipId?: string | null
  membershipLevel?: string | null
  historyPasted?: string | null
  aiInsights?: Record<string, unknown> | null
  analysisStatus: string
  updatedAt: string
}

interface Props {
  initial: ConnectedService[]
}

export function ServicesClient({ initial }: Props) {
  const [services, setServices] = useState<ConnectedService[]>(initial)
  const [activeDialog, setActiveDialog] = useState<ServiceConfig | null>(null)
  const [expandedInsights, setExpandedInsights] = useState<Set<string>>(new Set())
  const [analyzing, setAnalyzing] = useState<Set<string>>(new Set())

  const connectedMap = Object.fromEntries(services.map(s => [s.provider, s]))

  const handleSaved = useCallback((updated: ConnectedService) => {
    setServices(prev => {
      const idx = prev.findIndex(s => s.provider === updated.provider)
      return idx >= 0 ? prev.map((s, i) => i === idx ? updated : s) : [...prev, updated]
    })
    setActiveDialog(null)
  }, [])

  const handleDelete = useCallback(async (id: string, provider: string) => {
    await fetch(`/api/services/${id}`, { method: 'DELETE' })
    setServices(prev => prev.filter(s => s.provider !== provider))
  }, [])

  const handleAnalyze = useCallback(async (serviceId: string) => {
    setAnalyzing(prev => new Set(prev).add(serviceId))
    try {
      const res = await fetch('/api/ai/analyze-preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceId }),
      })
      const data = await res.json()
      if (data.service) {
        setServices(prev => prev.map(s => s.id === serviceId ? data.service : s))
        setExpandedInsights(prev => new Set(prev).add(serviceId))
      }
    } finally {
      setAnalyzing(prev => { const n = new Set(prev); n.delete(serviceId); return n })
    }
  }, [])

  const categories: ServiceCategory[] = ['accommodation', 'car_rental', 'travel_intel']

  return (
    <div className="space-y-10">
      {categories.map(cat => {
        const meta = SERVICE_CATEGORIES[cat]
        const catServices = SERVICES.filter(s => s.category === cat)
        return (
          <section key={cat}>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">{meta.icon}</span>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{meta.label}</h2>
                <p className="text-sm text-gray-500">{meta.description}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {catServices.map(svc => {
                const connected = connectedMap[svc.id]
                return (
                  <ServiceCard
                    key={svc.id}
                    config={svc}
                    connected={connected}
                    analyzing={connected ? analyzing.has(connected.id) : false}
                    insightsExpanded={connected ? expandedInsights.has(connected.id) : false}
                    onConnect={() => setActiveDialog(svc)}
                    onDelete={connected ? () => handleDelete(connected.id, connected.provider) : undefined}
                    onAnalyze={connected && connected.historyPasted ? () => handleAnalyze(connected.id) : undefined}
                    onToggleInsights={() => {
                      if (!connected) return
                      setExpandedInsights(prev => {
                        const n = new Set(prev)
                        n.has(connected.id) ? n.delete(connected.id) : n.add(connected.id)
                        return n
                      })
                    }}
                  />
                )
              })}
            </div>
          </section>
        )
      })}

      {activeDialog && (
        <ConnectDialog
          config={activeDialog}
          existing={connectedMap[activeDialog.id]}
          onClose={() => setActiveDialog(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}

/* ── ServiceCard ── */
interface CardProps {
  config: ServiceConfig
  connected?: ConnectedService
  analyzing: boolean
  insightsExpanded: boolean
  onConnect: () => void
  onDelete?: () => void
  onAnalyze?: () => void
  onToggleInsights: () => void
}

function ServiceCard({ config, connected, analyzing, insightsExpanded, onConnect, onDelete, onAnalyze, onToggleInsights }: CardProps) {
  const isConnected = !!connected
  const hasInsights = connected?.analysisStatus === 'done' && connected?.aiInsights
  const hasPending = connected?.historyPasted && connected?.analysisStatus === 'pending'

  return (
    <div className={`rounded-xl border-2 transition-all ${isConnected ? 'border-teal-300 bg-white shadow-sm' : 'border-gray-100 bg-gray-50 hover:border-gray-200'}`}>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{config.icon}</span>
            <div>
              <p className="font-semibold text-gray-900 text-sm leading-tight">{config.name}</p>
              <p className="text-xs text-gray-400">{config.website}</p>
            </div>
          </div>
          {isConnected && (
            <span className="flex-shrink-0 flex items-center gap-1 text-xs text-teal-600 font-medium bg-teal-50 px-2 py-0.5 rounded-full">
              <CheckCircle size={11} /> Connected
            </span>
          )}
        </div>

        {isConnected && (
          <div className="text-xs text-gray-500 mb-3 space-y-0.5">
            {connected.username && <p>👤 {connected.username}</p>}
            {connected.membershipId && <p>🪪 {connected.membershipId}</p>}
            {connected.membershipLevel && <p>⭐ {connected.membershipLevel}</p>}
            {connected.historyPasted && (
              <p className="text-teal-600">📋 Booking history added</p>
            )}
          </div>
        )}

        <p className="text-xs text-gray-400 mb-3 line-clamp-2">{config.extractsInfo}</p>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onConnect}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
              isConnected
                ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                : 'bg-teal-600 text-white hover:bg-teal-700'
            }`}
          >
            <Plug size={11} />
            {isConnected ? 'Edit' : 'Connect'}
          </button>

          {(hasPending || (connected?.historyPasted && connected?.analysisStatus !== 'done')) && onAnalyze && (
            <button
              onClick={onAnalyze}
              disabled={analyzing}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-60 transition-colors"
            >
              {analyzing ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
              {analyzing ? 'Analyzing...' : 'Analyze'}
            </button>
          )}

          {hasInsights && (
            <button
              onClick={onToggleInsights}
              className="flex items-center gap-1 text-xs px-2 py-1.5 rounded-lg font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 transition-colors"
            >
              <Sparkles size={11} />
              Insights
              {insightsExpanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
            </button>
          )}

          {onDelete && (
            <button
              onClick={onDelete}
              className="ml-auto text-gray-300 hover:text-red-500 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      {hasInsights && insightsExpanded && connected?.aiInsights && (
        <InsightsPanel insights={connected.aiInsights} category={config.category} />
      )}
    </div>
  )
}

/* ── InsightsPanel ── */
function InsightsPanel({ insights, category }: { insights: Record<string, unknown>; category: string }) {
  const { insights: insightText, ...rest } = insights

  const formatKey = (k: string) =>
    k.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase())

  const formatValue = (v: unknown): string => {
    if (Array.isArray(v)) return v.join(', ') || '—'
    if (v === null || v === undefined) return '—'
    if (typeof v === 'object') {
      const obj = v as Record<string, unknown>
      if ('min' in obj && 'max' in obj) return `${obj.currency ?? '€'}${obj.min}–${obj.max}/${obj.per ?? 'night'}`
      return JSON.stringify(v)
    }
    return String(v)
  }

  const skipKeys = new Set(['insights'])
  if (category === 'accommodation') skipKeys.add('superhostOnly')

  return (
    <div className="px-4 pb-4 border-t border-purple-100 pt-3 bg-purple-50/50 rounded-b-xl">
      {typeof insightText === 'string' && insightText && (
        <p className="text-xs text-purple-700 italic mb-3 leading-relaxed">✨ {insightText}</p>
      )}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        {Object.entries(rest)
          .filter(([k]) => !skipKeys.has(k))
          .map(([k, v]) => (
            <div key={k} className="text-xs">
              <span className="text-gray-400">{formatKey(k)}: </span>
              <span className="text-gray-700 font-medium">{formatValue(v)}</span>
            </div>
          ))}
      </div>
    </div>
  )
}

/* ── ConnectDialog ── */
interface DialogProps {
  config: ServiceConfig
  existing?: ConnectedService
  onClose: () => void
  onSaved: (s: ConnectedService) => void
}

function ConnectDialog({ config, existing, onClose, onSaved }: DialogProps) {
  const [form, setForm] = useState({
    username: existing?.username ?? '',
    membershipId: existing?.membershipId ?? '',
    membershipLevel: existing?.membershipLevel ?? '',
    historyPasted: existing?.historyPasted ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: config.id, ...form }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Save failed')
      onSaved(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <span className="text-3xl">{config.icon}</span>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{config.name}</h2>
              <p className="text-sm text-gray-500">{config.website}</p>
            </div>
          </div>

          {/* Fields */}
          <div className="space-y-4">
            {config.fields.map(field => (
              <div key={field.key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                {field.type === 'select' ? (
                  <select
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    value={form[field.key as keyof typeof form]}
                    onChange={e => setForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                  >
                    <option value="">Select...</option>
                    {field.options?.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder={field.placeholder}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    value={form[field.key as keyof typeof form]}
                    onChange={e => setForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                  />
                )}
              </div>
            ))}

            {/* Booking history textarea */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Booking History
                <span className="ml-1 text-xs font-normal text-gray-400">(optional — for AI analysis)</span>
              </label>
              <p className="text-xs text-gray-400 mb-2">{config.historyPrompt}</p>
              <textarea
                rows={6}
                placeholder="Paste your booking confirmations, email receipts, or describe your preferences..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-y"
                value={form.historyPasted}
                onChange={e => setForm(prev => ({ ...prev, historyPasted: e.target.value }))}
              />
              <p className="text-xs text-gray-400 mt-1">
                🤖 AI will extract: {config.extractsInfo}
              </p>
            </div>
          </div>

          {error && (
            <div className="mt-4 flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
              <AlertCircle size={14} /> {error}
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-xl text-sm font-medium hover:bg-teal-700 disabled:opacity-60 flex items-center justify-center gap-2 transition-colors"
            >
              {saving ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
