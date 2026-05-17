import { NextRequest, NextResponse } from 'next/server'
import { getAnthropicClient } from '@/lib/ai/client'

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json()
    if (!text?.trim()) return NextResponse.json({ destinations: [] })

    const client = getAnthropicClient()
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      messages: [{
        role: 'user',
        content: `Extract travel destinations from this text. Return a JSON array of destination objects.

Text: "${text}"

Return ONLY a valid JSON array like this:
[
  { "city": "Florence", "country": "Italy", "countryCode": "IT", "region": "Tuscany" },
  { "city": "Lake Garda", "country": "Italy", "countryCode": "IT", "region": "Northern Italy" }
]

Rules:
- Extract every specific place, city, region, lake, or area mentioned
- If a region is mentioned (e.g. "Tuscany"), list its main city as city
- If lakes are mentioned, use "Lake X" as city
- Always include ISO 2-letter countryCode
- If country is unclear from context, infer it
- Return ONLY the JSON array, no other text`
      }],
    })

    const text2 = message.content[0].type === 'text' ? message.content[0].text : '[]'
    const match = text2.match(/\[[\s\S]*\]/)
    const destinations = match ? JSON.parse(match[0]) : []
    return NextResponse.json({ destinations })
  } catch (err) {
    console.error('parse-destinations error:', err)
    return NextResponse.json({ destinations: [], error: 'Parse failed' })
  }
}
