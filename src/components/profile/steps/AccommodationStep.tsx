'use client'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import type { AccommodationType } from '@/lib/types/profile'

const TYPES: Array<{ value: AccommodationType; emoji: string; label: string }> = [
  { value: 'hotel', emoji: '🏨', label: 'Hotel' },
  { value: 'boutique', emoji: '🏰', label: 'Boutique' },
  { value: 'resort', emoji: '🌴', label: 'Resort' },
  { value: 'airbnb', emoji: '🏡', label: 'Apartment' },
  { value: 'hostel', emoji: '🛏️', label: 'Hostel' },
  { value: 'camping', emoji: '⛺', label: 'Camping' },
]

const STARS = [1, 2, 3, 4, 5]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function AccommodationStep({ data, update }: { data: any; update: (p: any) => void }) {
  const acc = data.accommodation ?? { types: ['hotel'], minStars: 3 }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function patch(p: any) { update({ accommodation: { ...acc, ...p } }) }

  function toggleType(t: AccommodationType) {
    const types: AccommodationType[] = acc.types ?? []
    patch({ types: types.includes(t) ? types.filter(x => x !== t) : [...types, t] })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Accommodation preferences</h2>
        <p className="text-sm text-gray-500">What kind of place do you like to stay?</p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {TYPES.map(({ value, emoji, label }) => (
          <button
            key={value}
            onClick={() => toggleType(value)}
            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-sm font-medium transition-all ${
              (acc.types ?? []).includes(value)
                ? 'border-violet-500 bg-violet-50 text-violet-700 shadow-md'
                : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <span className="text-2xl">{emoji}</span>
            {label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-semibold text-gray-700">Minimum stars</Label>
        <div className="flex gap-2">
          {STARS.map(s => (
            <button
              key={s}
              onClick={() => patch({ minStars: s })}
              className={`h-10 w-10 rounded-full text-lg transition-all ${
                s <= (acc.minStars ?? 3)
                  ? 'text-yellow-400 scale-110'
                  : 'text-gray-200 hover:text-gray-300'
              }`}
            >
              ★
            </button>
          ))}
          <span className="ml-2 self-center text-sm text-gray-500">
            {acc.minStars ?? 3}+ stars
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-semibold text-gray-700">Must-haves</Label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { key: 'petFriendly', label: 'Pet friendly 🐾' },
            { key: 'mustHavePool', label: 'Swimming pool 🏊' },
            { key: 'mustHaveParking', label: 'Free parking 🚗' },
            { key: 'breakfastIncluded', label: 'Breakfast included ☕' },
          ].map(({ key, label }) => (
            <div key={key} className="flex items-center gap-2 p-2.5 rounded-lg bg-gray-50">
              <Checkbox
                id={key}
                checked={!!acc[key]}
                onCheckedChange={v => patch({ [key]: v })}
              />
              <Label htmlFor={key} className="cursor-pointer text-sm">{label}</Label>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
