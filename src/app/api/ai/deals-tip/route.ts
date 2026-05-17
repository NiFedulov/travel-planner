import { NextRequest, NextResponse } from 'next/server'
import { getAnthropicClient } from '@/lib/ai/client'

export async function POST(req: NextRequest) {
  try {
    const { origin, destinations, startDate, endDate } = await req.json()
    if (!destinations?.length || !startDate) return NextResponse.json({ tip: null })

    const destList = destinations.map((d: { city: string; country: string }) => `${d.city}, ${d.country}`).join(' · ')
    const month = new Date(startDate).toLocaleString('en', { month: 'long' })

    const client = getAnthropicClient()
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: `A traveler from ${origin || 'Europe'} wants to visit: ${destList}
Trip dates: ${startDate} to ${endDate || 'open'} (${month})

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
    console.error('deals-tip error:', err)
    return NextResponse.json({ tip: null })
  }
}
