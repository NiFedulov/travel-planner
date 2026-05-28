import { NextRequest, NextResponse } from 'next/server'
import { getAnthropicClient } from '@/lib/ai/client'
import { getSession } from '@/lib/auth'
import { rateLimit, aiLimiter, getIdentifier } from '@/lib/rateLimit'
import { sanitizeForPrompt } from '@/lib/sanitize'
import { AI_SAFETY_PREAMBLE } from '@/lib/aiInput'
import { logger } from '@/lib/logger'
import { z } from 'zod'

const cityRegex = /^[\p{L}\s\-',.()]+$/u

const inputSchema = z.object({
  origin: z.string().max(80).optional().nullable(),
  destinations: z.array(z.object({
    city: z.string().max(80).regex(cityRegex, 'Invalid city'),
    country: z.string().max(80).optional().nullable(),
  })).min(1).max(20),
  startDate: z.string().min(1).max(30),
  endDate: z.string().max(30).optional().nullable(),
})

export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const limited = await rateLimit(aiLimiter, getIdentifier(req, user.id))
  if (limited) return limited

  try {
    const parsed = inputSchema.safeParse(await req.json())
    if (!parsed.success) return NextResponse.json({ tip: null })
    const { origin, destinations, startDate, endDate } = parsed.data

    const destList = destinations
      .map(d => `${sanitizeForPrompt(d.city, 60)}${d.country ? `, ${sanitizeForPrompt(d.country, 60)}` : ''}`)
      .join(' · ')
    const safeOrigin = sanitizeForPrompt(origin, 80) || 'Europe'
    const safeStart = sanitizeForPrompt(startDate, 30)
    const safeEnd = endDate ? sanitizeForPrompt(endDate, 30) : 'open'
    const month = (() => {
      try { return new Date(startDate).toLocaleString('en', { month: 'long' }) } catch { return 'unknown' }
    })()

    const client = getAnthropicClient()
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: `${AI_SAFETY_PREAMBLE}

<trip_data>
Traveler from: ${safeOrigin}
Wants to visit: ${destList}
Trip dates: ${safeStart} to ${safeEnd} (${month})
</trip_data>

As a travel deal expert, check:
1. Is ${month} peak/expensive season for these destinations?
2. Are there cheaper nearby alternatives (same region, 30-50% savings)?
3. Would shifting dates by 1-2 weeks save significantly?

Return ONLY this JSON (null values if no good tip):
{
  "hasDeal": true,
  "tip": "One sentence about the saving opportunity",
  "alternative": "Rome instead of Florence",
  "saving": "~€120 per person",
  "reason": "July is peak season in Lake Como — shoulder season (May/Sept) has 40% lower hotel rates"
}

If no meaningful saving opportunity, return: { "hasDeal": false, "tip": null }
Return ONLY valid JSON.`
      }],
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text : '{}'
    const match = raw.match(/\{[\s\S]*\}/)
    if (!match) return NextResponse.json({ tip: null })

    return NextResponse.json(JSON.parse(match[0]))
  } catch (err) {
    logger.error('deals-tip error', err)
    return NextResponse.json({ tip: null })
  }
}
