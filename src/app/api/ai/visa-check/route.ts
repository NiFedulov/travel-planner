import { NextRequest, NextResponse } from 'next/server'
import { getAnthropicClient } from '@/lib/ai/client'
import { buildVisaCheckPrompt, buildHealthCheckPrompt } from '@/lib/ai/prompts/visaCheck'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { passports, destinations, startDate, endDate, existingVisas, checkType = 'visa' } = body

    const client = getAnthropicClient()
    const prompt = checkType === 'health'
      ? buildHealthCheckPrompt(destinations, { start: startDate, end: endDate })
      : buildVisaCheckPrompt(passports, destinations, startDate, existingVisas ?? [])

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) throw new Error('No JSON array in response')

    const result = JSON.parse(jsonMatch[0])
    return NextResponse.json({ result })
  } catch (err) {
    console.error('visa-check error:', err)
    return NextResponse.json({ error: 'AI check failed', result: [] }, { status: 500 })
  }
}
