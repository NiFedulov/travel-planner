import { NextRequest, NextResponse } from 'next/server'
import { getAnthropicClient } from '@/lib/ai/client'
import { buildRecommendationsPrompt } from '@/lib/ai/prompts/recommendations'

export async function POST(req: NextRequest) {
  try {
    const { profile, originCity, destinations, startDate, endDate } = await req.json()
    const client = getAnthropicClient()
    const prompt = buildRecommendationsPrompt(
      profile,
      originCity,
      destinations,
      startDate,
      endDate,
      profile.budgetTotal,
    )

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON in response')

    const result = JSON.parse(jsonMatch[0])
    return NextResponse.json({ result })
  } catch (err) {
    console.error('recommendations error:', err)
    return NextResponse.json({ error: 'AI recommendations failed', result: null }, { status: 500 })
  }
}
