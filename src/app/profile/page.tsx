'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { User, Heart, Sunset, Bed, Wallet, Plane, FileText, Award, Utensils, ChevronLeft, ChevronRight, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { TravelersStep } from '@/components/profile/steps/TravelersStep'
import { HealthStep } from '@/components/profile/steps/HealthStep'
import { StyleStep } from '@/components/profile/steps/StyleStep'
import { AccommodationStep } from '@/components/profile/steps/AccommodationStep'
import { BudgetStep } from '@/components/profile/steps/BudgetStep'
import { FlightStep } from '@/components/profile/steps/FlightStep'
import { DocumentsStep } from '@/components/profile/steps/DocumentsStep'
import { LoyaltyStep } from '@/components/profile/steps/LoyaltyStep'
import { CuisineStep } from '@/components/profile/steps/CuisineStep'

const STEPS = [
  { id: 'travelers', label: 'Travelers', icon: User, color: 'from-teal-400 to-teal-600' },
  { id: 'health', label: 'Health', icon: Heart, color: 'from-rose-400 to-rose-600' },
  { id: 'style', label: 'Style', icon: Sunset, color: 'from-orange-400 to-amber-500' },
  { id: 'accommodation', label: 'Stay', icon: Bed, color: 'from-violet-400 to-violet-600' },
  { id: 'budget', label: 'Budget', icon: Wallet, color: 'from-green-400 to-emerald-600' },
  { id: 'flights', label: 'Flights', icon: Plane, color: 'from-sky-400 to-sky-600' },
  { id: 'documents', label: 'Documents', icon: FileText, color: 'from-blue-400 to-indigo-600' },
  { id: 'loyalty', label: 'Loyalty', icon: Award, color: 'from-yellow-400 to-orange-500' },
  { id: 'cuisine', label: 'Cuisine', icon: Utensils, color: 'from-pink-400 to-pink-600' },
]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const DEFAULT_PROFILE: Record<string, any> = {
  travelers: [],
  health: { mobilityIssues: false, requiresWheelchairAccess: false, dietaryRestrictions: [], allergies: [], medicalConditions: [], travelingWithPets: false },
  vacationStyle: [],
  travelPace: 'moderate',
  accommodation: { types: ['hotel'], minStars: 3, petFriendly: false, mustHavePool: false, mustHaveParking: false, breakfastIncluded: false },
  budgetTotal: null,
  budgetCurrency: 'EUR',
  flightClass: 'economy',
  maxLayovers: 1,
  preferredAirlines: [],
  passports: [],
  existingVisas: [],
  existingETAs: [],
  hasIsraeliStamps: false,
  criminalRecord: false,
  travelInsurance: false,
  loyaltyPrograms: [],
  cuisinePreferences: [],
  languagesSpoken: [],
  visitedCountries: [],
  favoriteDestinations: [],
}

export default function ProfilePage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<Record<string, any>>(DEFAULT_PROFILE)
  const [profileId, setProfileId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/profile').then(r => r.json()).then(p => {
      if (p) { setData({ ...DEFAULT_PROFILE, ...p }); setProfileId(p.id) }
    })
  }, [])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function update(patch: Record<string, any>) {
    setData(prev => ({ ...prev, ...patch }))
  }

  async function save() {
    setSaving(true)
    try {
      const method = profileId ? 'PUT' : 'POST'
      const res = await fetch('/api/profile', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, id: profileId }),
      })
      const saved = await res.json()
      setProfileId(saved.id)
      toast.success('Profile saved!')
      router.push('/')
    } catch {
      toast.error('Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  const StepComponent = [TravelersStep, HealthStep, StyleStep, AccommodationStep, BudgetStep, FlightStep, DocumentsStep, LoyaltyStep, CuisineStep][step]

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Traveler Profile</h1>
        <p className="text-gray-500 text-sm mt-1">Help us personalize your trips</p>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-gray-500">
          <span>Step {step + 1} of {STEPS.length}</span>
          <span className="font-medium text-teal-600">{STEPS[step].label}</span>
        </div>
        <Progress value={((step + 1) / STEPS.length) * 100} className="h-2" />
      </div>

      {/* Step pills */}
      <div className="flex gap-1.5 flex-wrap">
        {STEPS.map((s, i) => {
          const Icon = s.icon
          return (
            <button
              key={s.id}
              onClick={() => setStep(i)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                i === step
                  ? `bg-gradient-to-r ${s.color} text-white shadow-md`
                  : i < step
                    ? 'bg-teal-100 text-teal-700'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {i < step ? <Check className="h-3 w-3" /> : <Icon className="h-3 w-3" />}
              {s.label}
            </button>
          )
        })}
      </div>

      {/* Step content */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-6">
          <StepComponent data={data} update={update} />
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setStep(s => Math.max(0, s - 1))}
          disabled={step === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-1" /> Previous
        </Button>
        {step < STEPS.length - 1 ? (
          <Button
            onClick={() => setStep(s => s + 1)}
            className="bg-teal-600 hover:bg-teal-700"
          >
            Next <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button
            onClick={save}
            disabled={saving}
            className="bg-gradient-to-r from-teal-500 to-sky-500 hover:from-teal-600 hover:to-sky-600 text-white font-semibold px-6"
          >
            {saving ? 'Saving...' : 'Save Profile'}
          </Button>
        )}
      </div>
    </div>
  )
}
