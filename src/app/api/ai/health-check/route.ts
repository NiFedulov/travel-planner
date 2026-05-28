import { NextRequest, NextResponse } from 'next/server'
import { getAnthropicClient } from '@/lib/ai/client'
import { buildHealthCheckPrompt } from '@/lib/ai/prompts/visaCheck'
import { getSession } from '@/lib/auth'
import { rateLimit, aiLimiter, getIdentifier } from '@/lib/rateLimit'
import { getCached, setCached, cacheKey } from '@/lib/aiCache'

export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const limited = await rateLimit(aiLimiter, getIdentifier(req, user.id))
  if (limited) return limited

  try {
    const body = await req.json()
    const { destinations, startDate, endDate } = body

    const key = cacheKey('health-check', { destinations, startDate, endDate })
    const cached = getCached(key)
    if (cached) return NextResponse.json(cached)

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
    const response = { result }
    setCached(key, response)

    return NextResponse.json(response)
  } catch (err) {
    console.error('health-check error:', err)
    return NextResponse.json({ error: 'AI check failed', result: [] }, { status: 500 })
  }
}
