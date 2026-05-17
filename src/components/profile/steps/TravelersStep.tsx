'use client'
import { Plus, Minus, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import type { Traveler } from '@/lib/types/profile'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function TravelersStep({ data, update }: { data: any; update: (p: any) => void }) {
  const travelers: Traveler[] = data.travelers ?? []

  function addTraveler(type: Traveler['type']) {
    update({ travelers: [...travelers, { type, age: type === 'child' ? 10 : type === 'infant' ? 1 : undefined }] })
  }

  function removeTraveler(i: number) {
    update({ travelers: travelers.filter((_, idx) => idx !== i) })
  }

  function updateAge(i: number, age: number) {
    update({ travelers: travelers.map((t, idx) => idx === i ? { ...t, age } : t) })
  }

  const counts = {
    adult: travelers.filter(t => t.type === 'adult').length,
    child: travelers.filter(t => t.type === 'child').length,
    infant: travelers.filter(t => t.type === 'infant').length,
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Who&apos;s traveling?</h2>
        <p className="text-sm text-gray-500">Add all travelers including yourself</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {(['adult', 'child', 'infant'] as const).map(type => (
          <div key={type} className="rounded-xl border bg-gray-50 p-4 text-center">
            <div className="text-2xl mb-1">{type === 'adult' ? '🧑' : type === 'child' ? '👧' : '👶'}</div>
            <div className="font-medium capitalize text-sm text-gray-700">{type}s</div>
            {type !== 'adult' && <div className="text-xs text-gray-400">{type === 'child' ? '2–17 yrs' : 'under 2'}</div>}
            <div className="flex items-center justify-center gap-3 mt-3">
              <Button size="sm" variant="outline" className="h-7 w-7 p-0 rounded-full" onClick={() => removeTraveler(travelers.map(t => t.type).lastIndexOf(type))}>
                <Minus className="h-3 w-3" />
              </Button>
              <span className="font-bold text-lg w-4 text-center">{counts[type]}</span>
              <Button size="sm" variant="outline" className="h-7 w-7 p-0 rounded-full bg-teal-50 border-teal-200 hover:bg-teal-100" onClick={() => addTraveler(type)}>
                <Plus className="h-3 w-3 text-teal-600" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Age inputs for children */}
      {travelers.filter(t => t.type === 'child').length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Children&apos;s ages</Label>
          <div className="flex flex-wrap gap-2">
            {travelers.map((t, i) => t.type === 'child' ? (
              <div key={i} className="flex items-center gap-2 bg-orange-50 rounded-lg px-3 py-2">
                <User className="h-4 w-4 text-orange-400" />
                <Input
                  type="number"
                  min={2} max={17}
                  value={t.age ?? 10}
                  onChange={e => updateAge(i, parseInt(e.target.value))}
                  className="w-16 h-7 text-center text-sm border-orange-200"
                />
                <span className="text-xs text-gray-500">yrs</span>
              </div>
            ) : null)}
          </div>
        </div>
      )}

      {travelers.length === 0 && (
        <div className="text-center py-6 text-gray-400">
          <div className="text-4xl mb-2">👥</div>
          <p className="text-sm">Add at least one traveler to continue</p>
        </div>
      )}

      {travelers.length > 0 && (
        <div className="bg-teal-50 rounded-xl p-3 text-sm text-teal-700 font-medium">
          ✓ {travelers.length} traveler{travelers.length > 1 ? 's' : ''} added
        </div>
      )}
    </div>
  )
}
