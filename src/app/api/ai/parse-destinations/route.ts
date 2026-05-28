import { NextRequest, NextResponse } from 'next/server'
import { getAnthropicClient } from '@/lib/ai/client'
import { getSession } from '@/lib/auth'
import { rateLimit, aiLimiter, getIdentifier } from '@/lib/rateLimit'
import { sanitizeForPrompt } from '@/lib/sanitize'
import { AI_SAFETY_PREAMBLE } from '@/lib/aiInput'
import { logger } from '@/lib/logger'
import { z } from 'zod'

const inputSchema = z.object({
  text: z.string().min(1).max(3000),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
})

export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const limited = await rateLimit(aiLimiter, getIdentifier(req, user.id))
  if (limited) return limited

  try {
    const parsed = inputSchema.safeParse(await req.json())
    if (!parsed.success) return NextResponse.json({ destinations: [], insight: '' })
    const safeText = sanitizeForPrompt(parsed.data.text, 3000)
    const startDate = parsed.data.startDate ? sanitizeForPrompt(parsed.data.startDate, 30) : ''
    const endDate = parsed.data.endDate ? sanitizeForPrompt(parsed.data.endDate, 30) : ''
    if (!safeText) return NextResponse.json({ destinations: [], insight: '' })

    const totalDays = startDate && endDate
      ? Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000)
      : null

    const client = getAnthropicClient()
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `${AI_SAFETY_PREAMBLE}

You are an expert travel agent with 20 years of experience. Analyze the traveler's wishes and extract specific destinations, then suggest an optimal itinerary.

<user_input>
Traveler's wishes: ${safeText}
${startDate ? `Trip start: ${startDate}` : ''}
${endDate ? `Trip end: ${endDate}` : ''}
${totalDays ? `Total days available: ${totalDays}` : ''}
</user_input>

Extract destinations and plan the optimal visit order and duration. Consider:
- Logical geographic order (don't zigzag unnecessarily)
- Best time allocation per place (cultural city = 2-3 days, beach = 3-5 days, village = 1-2 days)
- Travel time between places
- Leaving buffer days for travel and rest

Return a JSON object:
{
  "insight": "One sentence about why this is a great trip combination and what makes it special",
  "destinations": [
    {
      "city": "Florence",
      "country": "Italy",
      "countryCode": "IT",
      "region": "Tuscany",
      "emoji": "🏛️",
      "stayDays": 3,
      "suggestedArrival": "2026-06-01",
      "suggestedDeparture": "2026-06-04",
      "highlight": "World-class Renaissance art and architecture",
      "bestFor": "Museums, Uffizi Gallery, Ponte Vecchio"
    }
  ]
}

Rules:
- suggestedArrival/suggestedDeparture: only include if startDate was provided, otherwise omit
- stayDays: always include, based on what the place deserves
- emoji: pick the most fitting one (🏖️🏛️🏔️🍷🌊🏰🌿🎭)
- highlight: one short sentence, what's unique about this place
- bestFor: 2-3 comma-separated activities/sights
- Return ONLY valid JSON, no other text`
      }],
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text : '{}'
    const match = raw.match(/\{[\s\S]*\}/)
    if (!match) return NextResponse.json({ destinations: [], insight: '' })

    const result = JSON.parse(match[0])
    return NextResponse.json(result)
  } catch (err) {
    logger.error('parse-destinations error', err)
    return NextResponse.json({ destinations: [], insight: '', error: 'Parse failed' })
  }
}
