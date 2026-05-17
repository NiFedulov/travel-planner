'use client'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { Plus, X, AlertTriangle } from 'lucide-react'
import type { Passport } from '@/lib/types/profile'

const COMMON_VISAS = ['Schengen', 'US B1/B2', 'UK Standard', 'UAE', 'Canada', 'Australia ETA', 'Japan']

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function DocumentsStep({ data, update }: { data: any; update: (p: any) => void }) {
  const passports: Passport[] = data.passports ?? []
  const existingVisas: string[] = data.existingVisas ?? []
  const existingETAs: string[] = data.existingETAs ?? []
  const hasIsraeliStamps: boolean = data.hasIsraeliStamps ?? false
  const criminalRecord: boolean = data.criminalRecord ?? false

  const [passportCountry, setPassportCountry] = useState('')
  const [passportExpiry, setPassportExpiry] = useState('')
  const [visaInput, setVisaInput] = useState('')

  function addPassport() {
    if (!passportCountry.trim() || !passportExpiry) return
    update({ passports: [...passports, { country: passportCountry.trim().toUpperCase(), expiryDate: passportExpiry, blankPages: 4 }] })
    setPassportCountry('')
    setPassportExpiry('')
  }

  function removePassport(i: number) {
    update({ passports: passports.filter((_, idx) => idx !== i) })
  }

  function updateBlankPages(i: number, v: number) {
    update({ passports: passports.map((p, idx) => idx === i ? { ...p, blankPages: v } : p) })
  }

  function addVisa(name: string) {
    const t = name.trim()
    if (!t || existingVisas.includes(t)) return
    update({ existingVisas: [...existingVisas, t] })
    setVisaInput('')
  }

  function removeVisa(v: string) {
    update({ existingVisas: existingVisas.filter(x => x !== v) })
  }

  function toggleETA(eta: string) {
    update({ existingETAs: existingETAs.includes(eta) ? existingETAs.filter(x => x !== eta) : [...existingETAs, eta] })
  }

  const today = new Date()
  const sixMonths = new Date(today.setMonth(today.getMonth() + 6)).toISOString().split('T')[0]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Travel documents</h2>
        <p className="text-sm text-gray-500">We&apos;ll check visa requirements and entry eligibility</p>
      </div>

      {/* Passports */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold text-gray-700">Passports</Label>
        <div className="flex gap-2">
          <Input
            value={passportCountry}
            onChange={e => setPassportCountry(e.target.value)}
            placeholder="Country code (e.g. RU, CY)"
            className="flex-1 uppercase"
            maxLength={2}
          />
          <Input
            type="date"
            value={passportExpiry}
            onChange={e => setPassportExpiry(e.target.value)}
            className="flex-1"
            min={new Date().toISOString().split('T')[0]}
          />
          <Button onClick={addPassport} size="sm" className="bg-indigo-600 hover:bg-indigo-700 h-10 w-10 p-0 flex-shrink-0">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {passports.map((p, i) => {
          const expiry = new Date(p.expiryDate)
          const isExpiringSoon = p.expiryDate < sixMonths
          return (
            <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border ${isExpiringSoon ? 'border-orange-300 bg-orange-50' : 'border-gray-200 bg-gray-50'}`}>
              <span className="text-2xl">🛂</span>
              <div className="flex-1">
                <div className="font-semibold text-sm">{p.country} Passport</div>
                <div className={`text-xs ${isExpiringSoon ? 'text-orange-600' : 'text-gray-500'}`}>
                  Expires {expiry.toLocaleDateString()}
                  {isExpiringSoon && ' ⚠ Less than 6 months'}
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <span>Blank pages:</span>
                <Input
                  type="number"
                  min={0} max={50}
                  value={p.blankPages ?? 4}
                  onChange={e => updateBlankPages(i, parseInt(e.target.value) || 0)}
                  className="w-14 h-7 text-center text-sm"
                />
              </div>
              <button onClick={() => removePassport(i)} className="text-gray-400 hover:text-red-500">
                <X className="h-4 w-4" />
              </button>
            </div>
          )
        })}
      </div>

      {/* ETAs */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold text-gray-700">Electronic travel authorizations</Label>
        <div className="flex flex-wrap gap-2">
          {['ESTA (USA)', 'eTA (Canada)', 'UK ETA', 'Australia ETA', 'NZ ETA'].map(eta => (
            <button
              key={eta}
              onClick={() => toggleETA(eta)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                existingETAs.includes(eta)
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {eta}
            </button>
          ))}
        </div>
      </div>

      {/* Existing visas */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold text-gray-700">Active visas</Label>
        <div className="flex flex-wrap gap-2 mb-2">
          {COMMON_VISAS.map(v => (
            <button
              key={v}
              onClick={() => existingVisas.includes(v) ? removeVisa(v) : addVisa(v)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                existingVisas.includes(v)
                  ? 'bg-teal-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={visaInput}
            onChange={e => setVisaInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addVisa(visaInput)}
            placeholder="Other visa..."
            className="flex-1"
          />
          <button onClick={() => addVisa(visaInput)} className="h-10 w-10 flex items-center justify-center rounded-lg bg-teal-600 text-white hover:bg-teal-700">
            <Plus className="h-4 w-4" />
          </button>
        </div>
        {existingVisas.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {existingVisas.map(v => (
              <Badge key={v} className="bg-teal-100 text-teal-700">
                {v} <button onClick={() => removeVisa(v)} className="ml-1"><X className="h-3 w-3" /></button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Sensitive flags */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold text-gray-700">Additional flags</Label>
        <div className="space-y-2">
          {[
            { key: 'hasIsraeliStamps', value: hasIsraeliStamps, label: 'Passport has Israeli stamps', warn: 'May block entry to Iran, Iraq, Libya, Yemen, Syria, Lebanon' },
            { key: 'criminalRecord', value: criminalRecord, label: 'Has criminal record', warn: 'USA, Canada, Australia may deny entry via ESTA/eTA' },
          ].map(({ key, value, label, warn }) => (
            <div key={key} className={`p-3 rounded-xl border transition-colors ${value ? 'border-orange-300 bg-orange-50' : 'border-gray-200 bg-gray-50'}`}>
              <div className="flex items-center gap-3">
                <Checkbox
                  id={key}
                  checked={value}
                  onCheckedChange={v => update({ [key]: v })}
                />
                <Label htmlFor={key} className="cursor-pointer text-sm text-gray-700">{label}</Label>
              </div>
              {value && (
                <div className="flex items-start gap-2 mt-2 ml-7">
                  <AlertTriangle className="h-3 w-3 text-orange-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-orange-600">{warn}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
