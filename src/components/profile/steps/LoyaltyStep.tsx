'use client'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import type { LoyaltyProgram } from '@/lib/types/profile'

const PROGRAMS = [
  { name: 'Miles & More', airline: 'Lufthansa Group' },
  { name: 'Flying Blue', airline: 'Air France / KLM' },
  { name: 'Executive Club', airline: 'British Airways' },
  { name: 'Skywards', airline: 'Emirates' },
  { name: 'Privilege Club', airline: 'Qatar Airways' },
  { name: 'Miles&Smiles', airline: 'Turkish Airlines' },
  { name: 'Marriott Bonvoy', airline: 'Marriott Hotels' },
  { name: 'IHG Rewards', airline: 'IHG Hotels' },
  { name: 'Hilton Honors', airline: 'Hilton Hotels' },
]

const TIERS = ['Standard', 'Silver', 'Gold', 'Platinum', 'Diamond']

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function LoyaltyStep({ data, update }: { data: any; update: (p: any) => void }) {
  const programs: LoyaltyProgram[] = data.loyaltyPrograms ?? []
  const [name, setName] = useState('')
  const [number, setNumber] = useState('')
  const [tier, setTier] = useState('Standard')

  function addProgram() {
    if (!name.trim()) return
    update({ loyaltyPrograms: [...programs, { program: name.trim(), memberId: number.trim() || undefined, tier }] })
    setName('')
    setNumber('')
    setTier('Standard')
  }

  function removeProgram(i: number) {
    update({ loyaltyPrograms: programs.filter((_, idx) => idx !== i) })
  }

  function addQuick(programName: string) {
    if (programs.find(p => p.program === programName)) return
    update({ loyaltyPrograms: [...programs, { program: programName, tier: 'Standard' }] })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Loyalty programs</h2>
        <p className="text-sm text-gray-500">We&apos;ll prioritize flights and hotels that earn or use your miles</p>
      </div>

      <div className="space-y-3">
        <Label className="text-sm font-semibold text-gray-700">Quick add</Label>
        <div className="grid grid-cols-1 gap-2">
          {PROGRAMS.map(({ name: pName, airline }) => {
            const added = programs.some(p => p.program === pName)
            return (
              <button
                key={pName}
                onClick={() => added ? null : addQuick(pName)}
                disabled={added}
                className={`flex items-center justify-between px-4 py-2.5 rounded-xl border text-sm transition-all ${
                  added
                    ? 'border-purple-300 bg-purple-50 text-purple-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <span className="font-medium">{pName}</span>
                <span className="text-xs text-gray-400">{airline}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="space-y-3">
        <Label className="text-sm font-semibold text-gray-700">Add custom program</Label>
        <div className="space-y-2">
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="Program name" />
          <Input value={number} onChange={e => setNumber(e.target.value)} placeholder="Member number (optional)" />
          <div className="flex gap-2">
            {TIERS.map(t => (
              <button
                key={t}
                onClick={() => setTier(t)}
                className={`flex-1 py-1.5 text-xs rounded-lg font-medium transition-all ${
                  tier === t ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <Button onClick={addProgram} className="w-full bg-purple-600 hover:bg-purple-700" disabled={!name.trim()}>
            <Plus className="h-4 w-4 mr-2" /> Add program
          </Button>
        </div>
      </div>

      {programs.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-gray-700">Your programs ({programs.length})</Label>
          {programs.map((p, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-purple-50 border border-purple-200">
              <span className="text-xl">✈️</span>
              <div className="flex-1">
                <div className="font-medium text-sm text-purple-800">{p.program}</div>
                <div className="text-xs text-purple-600">
                  {p.tier}{p.memberId ? ` · ${p.memberId}` : ''}
                </div>
              </div>
              <button onClick={() => removeProgram(i)} className="text-purple-400 hover:text-red-500">
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {programs.length === 0 && (
        <div className="text-center py-4 text-gray-400 text-sm">
          No programs added yet — optional but helps us find better deals
        </div>
      )}
    </div>
  )
}
