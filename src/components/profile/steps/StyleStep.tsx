'use client'
import { Label } from '@/components/ui/label'
import type { VacationStyleType, TravelPace } from '@/lib/types/profile'

const STYLES: Array<{ value: VacationStyleType; emoji: string; label: string }> = [
  { value: 'beach', emoji: '🏖️', label: 'Beach' },
  { value: 'hiking', emoji: '🥾', label: 'Hiking' },
  { value: 'cultural', emoji: '🏛️', label: 'Cultural' },
  { value: 'adventure', emoji: '🧗', label: 'Adventure' },
  { value: 'spa', emoji: '💆', label: 'Spa & Wellness' },
  { value: 'city', emoji: '🏙️', label: 'City' },
  { value: 'nature', emoji: '🌿', label: 'Nature' },
  { value: 'wine', emoji: '🍷', label: 'Wine & Vineyards' },
  { value: 'gastronomy', emoji: '🍽️', label: 'Food & Gastronomy' },
]

const PACES: Array<{ value: TravelPace; label: string; desc: string; emoji: string }> = [
  { value: 'slow', label: 'Slow', desc: '3+ days per city', emoji: '🌅' },
  { value: 'moderate', label: 'Moderate', desc: '2 days per city', emoji: '🚶' },
  { value: 'fast', label: 'Fast packer', desc: '1 day per city', emoji: '🏃' },
]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function StyleStep({ data, update }: { data: any; update: (p: any) => void }) {
  const selected: VacationStyleType[] = data.vacationStyle ?? []
  const pace: TravelPace = data.travelPace ?? 'moderate'

  function toggle(v: VacationStyleType) {
    update({ vacationStyle: selected.includes(v) ? selected.filter(s => s !== v) : [...selected, v] })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Vacation style</h2>
        <p className="text-sm text-gray-500">Select all that apply — we&apos;ll tailor recommendations</p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {STYLES.map(({ value, emoji, label }) => (
          <button
            key={value}
            onClick={() => toggle(value)}
            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-sm font-medium transition-all ${
              selected.includes(value)
                ? 'border-teal-500 bg-teal-50 text-teal-700 shadow-md'
                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <span className="text-2xl">{emoji}</span>
            {label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        <Label className="text-sm font-semibold text-gray-700">Travel pace</Label>
        <div className="grid grid-cols-3 gap-2">
          {PACES.map(({ value, label, desc, emoji }) => (
            <button
              key={value}
              onClick={() => update({ travelPace: value })}
              className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all text-center ${
                pace === value
                  ? 'border-orange-400 bg-orange-50 text-orange-700 shadow-md'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <span className="text-xl">{emoji}</span>
              <span className="font-medium text-sm">{label}</span>
              <span className="text-xs text-gray-400">{desc}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
