'use client'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useState } from 'react'
import { Plus, X } from 'lucide-react'

const DIETARY = ['Vegetarian', 'Vegan', 'Halal', 'Kosher', 'Gluten-free', 'Lactose-free', 'Nut-free']

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function HealthStep({ data, update }: { data: any; update: (p: any) => void }) {
  const health = data.health ?? {}
  const [allergyInput, setAllergyInput] = useState('')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function patchHealth(patch: any) {
    update({ health: { ...health, ...patch } })
  }

  function toggleDietary(d: string) {
    const current: string[] = health.dietaryRestrictions ?? []
    patchHealth({ dietaryRestrictions: current.includes(d) ? current.filter(x => x !== d) : [...current, d] })
  }

  function addAllergy() {
    if (!allergyInput.trim()) return
    const current: string[] = health.allergies ?? []
    if (!current.includes(allergyInput.trim())) {
      patchHealth({ allergies: [...current, allergyInput.trim()] })
    }
    setAllergyInput('')
  }

  function removeAllergy(a: string) {
    patchHealth({ allergies: (health.allergies ?? []).filter((x: string) => x !== a) })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Health & dietary</h2>
        <p className="text-sm text-gray-500">We&apos;ll factor this into accommodation and activity suggestions</p>
      </div>

      {/* Mobility */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold text-gray-700">Mobility & access</Label>
        <div className="space-y-2">
          {[
            { key: 'mobilityIssues', label: 'Has mobility issues (prefers fewer steps/hills)' },
            { key: 'requiresWheelchairAccess', label: 'Requires wheelchair accessibility' },
            { key: 'travelingWithPets', label: 'Traveling with pets 🐾' },
          ].map(({ key, label }) => (
            <div key={key} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
              <Checkbox
                id={key}
                checked={!!health[key]}
                onCheckedChange={v => patchHealth({ [key]: v })}
              />
              <Label htmlFor={key} className="cursor-pointer text-sm text-gray-700">{label}</Label>
            </div>
          ))}
        </div>
      </div>

      {/* Dietary */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold text-gray-700">Dietary restrictions</Label>
        <div className="flex flex-wrap gap-2">
          {DIETARY.map(d => (
            <button
              key={d}
              onClick={() => toggleDietary(d)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                (health.dietaryRestrictions ?? []).includes(d)
                  ? 'bg-teal-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Allergies */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold text-gray-700">Allergies</Label>
        <div className="flex gap-2">
          <Input
            value={allergyInput}
            onChange={e => setAllergyInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addAllergy()}
            placeholder="E.g. shellfish, peanuts..."
            className="flex-1"
          />
          <button onClick={addAllergy} className="h-10 w-10 flex items-center justify-center rounded-lg bg-teal-600 text-white hover:bg-teal-700">
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {(health.allergies ?? []).map((a: string) => (
            <Badge key={a} className="bg-rose-100 text-rose-700 hover:bg-rose-200">
              {a} <button onClick={() => removeAllergy(a)} className="ml-1"><X className="h-3 w-3" /></button>
            </Badge>
          ))}
        </div>
      </div>
    </div>
  )
}
