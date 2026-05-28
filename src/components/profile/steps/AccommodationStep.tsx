'use client'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Sparkles } from 'lucide-react'
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

interface AccInsights {
  providerName: string
  preferredTypes?: string[]
  mustHaveAmenities?: string[]
  minStars?: number | null
  breakfastPreference?: string
  cancellationPolicy?: string
  insights?: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function AccommodationStep({ data, update, serviceInsights }: { data: any; update: (p: any) => void; serviceInsights?: AccInsights[] }) {
  const acc = data.accommodation ?? { types: ['hotel'], minStars: 3 }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function patch(p: any) { update({ accommodation: { ...acc, ...p } }) }

  function toggleType(t: AccommodationType) {
    const types: AccommodationType[] = acc.types ?? []
    patch({ types: types.includes(t) ? types.filter(x => x !== t) : [...types, t] })
  }

  function applyInsights(si: AccInsights) {
    const typeMap: Record<string, AccommodationType> = {
      entire_home: 'airbnb', apartment: 'airbnb', hotel_room: 'hotel',
      resort: 'resort', hostel: 'hostel', boutique: 'boutique', villa: 'resort',
    }
    const mappedTypes = si.preferredTypes
      ?.map(t => typeMap[t])
      .filter(Boolean) as AccommodationType[] | undefined

    const amenityMap: Record<string, string> = {
      pool: 'mustHavePool',
      parking: 'mustHaveParking',
      free_parking: 'mustHaveParking',
      breakfast: 'breakfastIncluded',
      pets: 'petFriendly',
      pet_friendly: 'petFriendly',
    }
    const amenityPatches: Record<string, boolean> = {}
    si.mustHaveAmenities?.forEach(a => {
      const field = amenityMap[a.toLowerCase()]
      if (field) amenityPatches[field] = true
    })
    if (si.breakfastPreference === 'included') amenityPatches.breakfastIncluded = true

    patch({
      ...(mappedTypes?.length ? { types: mappedTypes } : {}),
      ...(si.minStars ? { minStars: si.minStars } : {}),
      ...amenityPatches,
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Accommodation preferences</h2>
        <p className="text-sm text-gray-500">What kind of place do you like to stay?</p>
      </div>

      {/* Service insights banners */}
      {serviceInsights && serviceInsights.length > 0 && (
        <div className="space-y-2">
          {serviceInsights.map((si, i) => (
            <div key={i} className="flex items-start gap-3 bg-purple-50 border border-purple-100 rounded-xl p-3">
              <Sparkles size={16} className="text-purple-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-purple-700 mb-0.5">From your {si.providerName} history</p>
                {si.insights && <p className="text-xs text-purple-600 italic mb-2">{si.insights}</p>}
              </div>
              <button
                onClick={() => applyInsights(si)}
                className="flex-shrink-0 text-xs px-2.5 py-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
              >
                Apply
              </button>
            </div>
          ))}
        </div>
      )}

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
