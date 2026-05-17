import airportsData from '@/lib/data/airports.json'
import type { TouristProfile } from '@/lib/types/profile'

export type RiskLevel = 'safe' | 'tight' | 'risky' | 'impossible'

export interface MCTResult {
  mct: number
  available: number
  margin: number
  riskLevel: RiskLevel
  breakdown: {
    base: number
    terminalTransfer: number
    checkin: number
    baggage: number
    complexityBuffer: number
    health: number
    children: number
  }
}

const airports = airportsData as Record<string, {
  complexity: string
  efficiency: number
  mct: Record<string, number>
  terminalTransferMin?: Record<string, number>
  securityAvgMin?: number
  passportControlAvgMin?: number
}>

export function calculateMCT(
  layoverCode: string,
  layoverDurationMin: number,
  inboundDomestic: boolean,
  outboundDomestic: boolean,
  sameTerminal: boolean,
  separateTickets: boolean,
  hasBaggage: boolean,
  profile: Pick<TouristProfile, 'health' | 'travelers'>,
): MCTResult {
  const airport = airports[layoverCode]

  let base = 60
  if (airport) {
    const scenario = !outboundDomestic && !inboundDomestic
      ? (sameTerminal ? 'intl_intl_same' : 'intl_intl_diff')
      : 'intl_domestic'
    base = airport.mct[scenario] ?? airport.mct['intl_intl'] ?? airport.mct['intl_intl_same'] ?? 60
  }

  const terminalTransfer = (!sameTerminal && airport?.terminalTransferMin)
    ? Math.max(...Object.values(airport.terminalTransferMin))
    : 0

  const checkin = separateTickets ? 45 : 0
  const baggage = separateTickets && hasBaggage ? 30 : 0

  const complexityMultiplier = { low: 1.0, medium: 1.15, high: 1.35 }[airport?.complexity ?? 'medium'] ?? 1.15
  const complexityBuffer = Math.ceil((base + terminalTransfer) * (complexityMultiplier - 1))

  const health = profile.health.mobilityIssues || profile.health.requiresWheelchairAccess ? 30 : 0
  const children = profile.travelers.some(t => t.type === 'child') ? 20 : 0

  const mct = base + terminalTransfer + checkin + baggage + complexityBuffer + health + children
  const margin = layoverDurationMin - mct

  return {
    mct,
    available: layoverDurationMin,
    margin,
    riskLevel: margin < 0 ? 'impossible' : margin < 20 ? 'risky' : margin < 45 ? 'tight' : 'safe',
    breakdown: { base, terminalTransfer, checkin, baggage, complexityBuffer, health, children },
  }
}
