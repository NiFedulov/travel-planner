'use client'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import type { FlightClass } from '@/lib/types/profile'

const CLASSES: Array<{ value: FlightClass; label: string; emoji: string; desc: string }> = [
  { value: 'economy', label: 'Economy', emoji: '💺', desc: 'Best value' },
  { value: 'premium_economy', label: 'Premium Eco', emoji: '🪑', desc: 'Extra legroom' },
  { value: 'business', label: 'Business', emoji: '🛋️', desc: 'Lie-flat seats' },
  { value: 'first', label: 'First Class', emoji: '✨', desc: 'Ultimate luxury' },
]

const LAYOVER_OPTIONS = [
  { value: 0, label: 'Direct only' },
  { value: 1, label: 'Max 1 stop' },
  { value: 2, label: 'Max 2 stops' },
]

const AIRLINES = ['Emirates', 'Lufthansa', 'Turkish Airlines', 'Qatar Airways', 'Ryanair', 'EasyJet', 'Wizz Air', 'British Airways', 'Air France', 'KLM']

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function FlightStep({ data, update }: { data: any; update: (p: any) => void }) {
  const flightClass: FlightClass = data.flightClass ?? 'economy'
  const maxLayovers: number = data.maxLayovers ?? 1
  const preferred: string[] = data.preferredAirlines ?? []
  const [airlineInput, setAirlineInput] = useState('')

  function addAirline(name: string) {
    const trimmed = name.trim()
    if (!trimmed || preferred.includes(trimmed)) return
    update({ preferredAirlines: [...preferred, trimmed] })
    setAirlineInput('')
  }

  function removeAirline(a: string) {
    update({ preferredAirlines: preferred.filter(x => x !== a) })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Flight preferences</h2>
        <p className="text-sm text-gray-500">We&apos;ll filter and score flights accordingly</p>
      </div>

      <div className="space-y-3">
        <Label className="text-sm font-semibold text-gray-700">Cabin class</Label>
        <div className="grid grid-cols-2 gap-2">
          {CLASSES.map(({ value, label, emoji, desc }) => (
            <button
              key={value}
              onClick={() => update({ flightClass: value })}
              className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                flightClass === value
                  ? 'border-sky-500 bg-sky-50 shadow-md'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <span className="text-2xl">{emoji}</span>
              <div>
                <div className={`font-medium text-sm ${flightClass === value ? 'text-sky-700' : 'text-gray-700'}`}>{label}</div>
                <div className="text-xs text-gray-400">{desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <Label className="text-sm font-semibold text-gray-700">Maximum layovers</Label>
        <div className="flex gap-2">
          {LAYOVER_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => update({ maxLayovers: value })}
              className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-medium transition-all border-2 ${
                maxLayovers === value
                  ? 'border-sky-500 bg-sky-50 text-sky-700 shadow-md'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <Label className="text-sm font-semibold text-gray-700">Preferred airlines (optional)</Label>
        <div className="flex gap-2">
          <Input
            value={airlineInput}
            onChange={e => setAirlineInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addAirline(airlineInput)}
            placeholder="Type airline name..."
            className="flex-1"
            list="airline-suggestions"
          />
          <datalist id="airline-suggestions">
            {AIRLINES.filter(a => !preferred.includes(a)).map(a => <option key={a} value={a} />)}
          </datalist>
          <button onClick={() => addAirline(airlineInput)} className="h-10 w-10 flex items-center justify-center rounded-lg bg-sky-600 text-white hover:bg-sky-700">
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {preferred.map(a => (
            <Badge key={a} className="bg-sky-100 text-sky-700 hover:bg-sky-200">
              {a} <button onClick={() => removeAirline(a)} className="ml-1"><X className="h-3 w-3" /></button>
            </Badge>
          ))}
        </div>
        {preferred.length === 0 && (
          <p className="text-xs text-gray-400">Leave empty to consider all airlines</p>
        )}
      </div>
    </div>
  )
}
