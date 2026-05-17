import { NextRequest, NextResponse } from 'next/server'
import { getAnthropicClient } from '@/lib/ai/client'
import { buildHealthCheckPrompt } from '@/lib/ai/prompts/visaCheck'

export async function POST(req: NextRequest) {
  try {
    const { destinations, startDate, endDate } = await req.json()
    const client = getAnthropicClient()
    const prompt = buildHealthCheckPrompt(destinations, { start: startDate, end: endDate })

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    const result = jsonMatch ? JSON.parse(jsonMatch[0]) : []
    return NextResponse.json({ result })
  } catch (err) {
    console.error('health-check error:', err)
    return NextResponse.json({ error: 'AI check failed', result: [] }, { status: 500 })
  }
}
