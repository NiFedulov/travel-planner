import { NextRequest, NextResponse } from 'next/server'
import { getAnthropicClient } from '@/lib/ai/client'
import { buildRouteOptimizePrompt } from '@/lib/ai/prompts/recommendations'

export async function POST(req: NextRequest) {
  try {
    const { flights, profile } = await req.json()
    const client = getAnthropicClient()
    const prompt = buildRouteOptimizePrompt(flights, profile)

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON in response')

    const result = JSON.parse(jsonMatch[0])
    return NextResponse.json({ result })
  } catch (err) {
    console.error('route-optimize error:', err)
    return NextResponse.json({ error: 'AI optimize failed', result: null }, { status: 500 })
  }
}
