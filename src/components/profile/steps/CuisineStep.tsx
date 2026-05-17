'use client'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useState } from 'react'
import { Plus, X } from 'lucide-react'

const CUISINES = [
  { value: 'italian', emoji: '🍝', label: 'Italian' },
  { value: 'japanese', emoji: '🍣', label: 'Japanese' },
  { value: 'french', emoji: '🥐', label: 'French' },
  { value: 'thai', emoji: '🍜', label: 'Thai' },
  { value: 'indian', emoji: '🍛', label: 'Indian' },
  { value: 'mediterranean', emoji: '🫒', label: 'Mediterranean' },
  { value: 'mexican', emoji: '🌮', label: 'Mexican' },
  { value: 'chinese', emoji: '🥟', label: 'Chinese' },
  { value: 'greek', emoji: '🫙', label: 'Greek' },
  { value: 'spanish', emoji: '🥘', label: 'Spanish' },
  { value: 'lebanese', emoji: '🧆', label: 'Lebanese' },
  { value: 'turkish', emoji: '🥙', label: 'Turkish' },
]

const LANGUAGES = [
  { code: 'en', flag: '🇬🇧', label: 'English' },
  { code: 'ru', flag: '🇷🇺', label: 'Russian' },
  { code: 'de', flag: '🇩🇪', label: 'German' },
  { code: 'fr', flag: '🇫🇷', label: 'French' },
  { code: 'es', flag: '🇪🇸', label: 'Spanish' },
  { code: 'it', flag: '🇮🇹', label: 'Italian' },
  { code: 'ar', flag: '🇦🇪', label: 'Arabic' },
  { code: 'tr', flag: '🇹🇷', label: 'Turkish' },
  { code: 'zh', flag: '🇨🇳', label: 'Chinese' },
  { code: 'ja', flag: '🇯🇵', label: 'Japanese' },
]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function CuisineStep({ data, update }: { data: any; update: (p: any) => void }) {
  const cuisines: string[] = data.cuisinePreferences ?? []
  const languages: string[] = data.languagesSpoken ?? []
  const [customCuisine, setCustomCuisine] = useState('')

  function toggleCuisine(v: string) {
    update({ cuisinePreferences: cuisines.includes(v) ? cuisines.filter(c => c !== v) : [...cuisines, v] })
  }

  function toggleLanguage(code: string) {
    update({ languagesSpoken: languages.includes(code) ? languages.filter(l => l !== code) : [...languages, code] })
  }

  function addCustomCuisine() {
    const t = customCuisine.trim().toLowerCase()
    if (!t || cuisines.includes(t)) return
    update({ cuisinePreferences: [...cuisines, t] })
    setCustomCuisine('')
  }

  const customEntries = cuisines.filter(c => !CUISINES.find(k => k.value === c))

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Cuisine & languages</h2>
        <p className="text-sm text-gray-500">Helps us recommend the right restaurants and destinations</p>
      </div>

      <div className="space-y-3">
        <Label className="text-sm font-semibold text-gray-700">Favourite cuisines</Label>
        <div className="grid grid-cols-3 gap-2">
          {CUISINES.map(({ value, emoji, label }) => (
            <button
              key={value}
              onClick={() => toggleCuisine(value)}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                cuisines.includes(value)
                  ? 'border-orange-400 bg-orange-50 text-orange-700 shadow-md'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <span className="text-2xl">{emoji}</span>
              {label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={customCuisine}
            onChange={e => setCustomCuisine(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addCustomCuisine()}
            placeholder="Other cuisine..."
            className="flex-1"
          />
          <button onClick={addCustomCuisine} className="h-10 w-10 flex items-center justify-center rounded-lg bg-orange-500 text-white hover:bg-orange-600">
            <Plus className="h-4 w-4" />
          </button>
        </div>
        {customEntries.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {customEntries.map(c => (
              <Badge key={c} className="bg-orange-100 text-orange-700 capitalize">
                {c} <button onClick={() => toggleCuisine(c)} className="ml-1"><X className="h-3 w-3" /></button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <Label className="text-sm font-semibold text-gray-700">Languages spoken</Label>
        <div className="grid grid-cols-2 gap-2">
          {LANGUAGES.map(({ code, flag, label }) => (
            <button
              key={code}
              onClick={() => toggleLanguage(code)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                languages.includes(code)
                  ? 'border-teal-500 bg-teal-50 text-teal-700 shadow-md'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <span className="text-lg">{flag}</span>
              {label}
            </button>
          ))}
        </div>
      </div>

      {(cuisines.length > 0 || languages.length > 0) && (
        <div className="bg-teal-50 rounded-xl p-3 text-sm text-teal-700">
          ✓ {cuisines.length} cuisine{cuisines.length !== 1 ? 's' : ''} · {languages.length} language{languages.length !== 1 ? 's' : ''} selected
        </div>
      )}
    </div>
  )
}
