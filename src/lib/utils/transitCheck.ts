import transitRules from '@/lib/data/transitRules.json'

interface TransitCheckResult {
  allowed: boolean
  transitType: 'airside' | 'landside' | 'stopover'
  visaRequired: string | null
  reason?: string
}

export function checkSchengenTransit(
  passportCode: string,
  layoverCode: string,
  isStopover: boolean,
  nextFlightDomestic: boolean,
  terminalChange: boolean,
  existingVisas: string[],
): TransitCheckResult {
  const hub = (transitRules.transit_hubs as Record<string, { schengen?: boolean; airside_ok?: boolean; diff_terminal_landside?: boolean }>)[layoverCode]
  const isSchengenHub = hub?.schengen ?? false

  if (!isSchengenHub) {
    return { allowed: true, transitType: 'airside', visaRequired: null }
  }

  const hasSchengen = existingVisas.some(v =>
    v === 'SCHENGEN' || transitRules.schengen_member_codes.includes(v)
  )

  if (isStopover || nextFlightDomestic || (terminalChange && hub?.diff_terminal_landside)) {
    if (hasSchengen) return { allowed: true, transitType: 'landside', visaRequired: null }
    const exemptVisa = transitRules.schengen_landside_exempt_with_visa.find(v =>
      existingVisas.includes(v)
    )
    if (exemptVisa) return { allowed: true, transitType: 'landside', visaRequired: null }
    return {
      allowed: false,
      transitType: isStopover ? 'stopover' : 'landside',
      visaRequired: 'SCHENGEN',
      reason: `Schengen visa required for ${isStopover ? 'overnight stay' : 'landside transit'} in ${layoverCode}`,
    }
  }

  // Airside transit
  const needsATV = (transitRules.schengen_airside_atv_required as string[]).includes(passportCode)
  if (needsATV && !hasSchengen) {
    return {
      allowed: false,
      transitType: 'airside',
      visaRequired: 'ATV',
      reason: `Airport Transit Visa required for ${passportCode} passport at ${layoverCode}`,
    }
  }

  return { allowed: true, transitType: 'airside', visaRequired: null }
}

export function checkMutualBan(passportCode: string, destinationCode: string): boolean {
  return (transitRules.mutual_bans as Array<{ a: string; b: string }>).some(
    ({ a, b }) => (a === passportCode && b === destinationCode) || (b === passportCode && a === destinationCode)
  )
}
