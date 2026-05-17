'use client'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF', 'RUB', 'AED']
const PRESETS = [2000, 3000, 5000, 8000, 12000, 20000]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function BudgetStep({ data, update }: { data: any; update: (p: any) => void }) {
  const budget = data.budgetTotal
  const currency = data.budgetCurrency ?? 'EUR'

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Budget</h2>
        <p className="text-sm text-gray-500">Total trip budget for all travelers</p>
      </div>

      <div className="space-y-3">
        <Label className="text-sm font-semibold text-gray-700">Currency</Label>
        <div className="flex flex-wrap gap-2">
          {CURRENCIES.map(c => (
            <button
              key={c}
              onClick={() => update({ budgetCurrency: c })}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                currency === c
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <Label className="text-sm font-semibold text-gray-700">Total budget</Label>
        <div className="flex gap-2">
          <span className="flex items-center px-3 bg-gray-100 rounded-l-lg border border-r-0 text-gray-600 font-medium">
            {currency}
          </span>
          <Input
            type="number"
            value={budget ?? ''}
            onChange={e => update({ budgetTotal: e.target.value ? parseInt(e.target.value) : null })}
            placeholder="5000"
            className="rounded-l-none flex-1"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-sm text-gray-500">Quick select</Label>
        <div className="grid grid-cols-3 gap-2">
          {PRESETS.map(p => (
            <button
              key={p}
              onClick={() => update({ budgetTotal: p })}
              className={`py-2 px-3 rounded-xl text-sm font-medium transition-all ${
                budget === p
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {currency} {p.toLocaleString()}
            </button>
          ))}
        </div>
      </div>

      {budget && (
        <div className="bg-green-50 rounded-xl p-4 space-y-1">
          <p className="text-sm font-semibold text-green-800">Budget breakdown estimate</p>
          {[
            ['Flights', 0.3],
            ['Accommodation', 0.35],
            ['Food', 0.2],
            ['Activities', 0.1],
            ['Transport/other', 0.05],
          ].map(([label, pct]) => (
            <div key={label as string} className="flex justify-between text-sm text-green-700">
              <span>{label as string}</span>
              <span>{currency} {Math.round(budget * (pct as number)).toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
