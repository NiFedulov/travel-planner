import { NextRequest, NextResponse } from 'next/server'
import { getAnthropicClient } from '@/lib/ai/client'
import { parseJsonWithRetry } from '@/lib/ai/parseJson'
import { buildRouteOptimizePrompt } from '@/lib/ai/prompts/recommendations'
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
    const { flights, profile, destinations, startDate, endDate, flexDays, originCity, hotels } = body

    const key = cacheKey('route-optimize', { flights, profile, destinations, startDate, endDate, flexDays })
    const cached = getCached(key)
    if (cached) return NextResponse.json(cached)

    const client = getAnthropicClient()
    const prompt = buildRouteOptimizePrompt(flights, profile, destinations, startDate, endDate, flexDays, originCity, hotels)

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const result = await parseJsonWithRetry(client, text)
    const response = { result }
    setCached(key, response)

    return NextResponse.json(response)
  } catch (err) {
    console.error('route-optimize error:', err)
    return NextResponse.json({ error: 'AI optimize failed', result: null }, { status: 500 })
  }
}
