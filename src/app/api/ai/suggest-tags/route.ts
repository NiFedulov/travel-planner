import { NextRequest, NextResponse } from 'next/server'
import { getAnthropicClient } from '@/lib/ai/client'

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json()
    if (!text?.trim() || text.trim().length < 10) return NextResponse.json({ tags: [] })

    const client = getAnthropicClient()
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      messages: [{
        role: 'user',
        content: `A traveler wrote: "${text}"

Extract specific destinations they want to visit (cities, regions, lakes, islands, areas). Return 3-8 destination tags.

Return ONLY this JSON:
{
  "tags": [
    { "city": "Florence", "country": "Italy", "countryCode": "IT", "emoji": "🏛️" },
    { "city": "Lake Como", "country": "Italy", "countryCode": "IT", "emoji": "🌊" }
  ]
}

Rules:
- Extract actual places, not vague wishes ("relax", "explore")
- If they mention a region (Tuscany), include 1-2 specific cities from it
- emoji: best fitting (🏖️🏛️🏔️🍷🌊🏰🌿🎭🏝️🌃🕌🎿)
- Return ONLY valid JSON, nothing else`
      }],
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text : '{}'
    const match = raw.match(/\{[\s\S]*\}/)
    if (!match) return NextResponse.json({ tags: [] })

    const result = JSON.parse(match[0])
    return NextResponse.json(result)
  } catch (err) {
    console.error('suggest-tags error:', err)
    return NextResponse.json({ tags: [] })
  }
}
