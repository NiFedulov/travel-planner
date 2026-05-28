import { NextRequest, NextResponse } from 'next/server'
import { getAnthropicClient } from '@/lib/ai/client'
import { parseJsonWithRetry } from '@/lib/ai/parseJson'
import { buildRecommendationsPrompt } from '@/lib/ai/prompts/recommendations'
import { getSession } from '@/lib/auth'
import { rateLimit, aiLimiter, getIdentifier } from '@/lib/rateLimit'
import { track } from '@/lib/analytics'

export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const limited = await rateLimit(aiLimiter, getIdentifier(req, user.id))
  if (limited) return limited

  try {
    const { profile, originCity, destinations, startDate, endDate, tripId } = await req.json()
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
    const result = await parseJsonWithRetry(client, text, 'claude-sonnet-4-6')

    await track('ai_recommendations', user.id, {
      tripId,
      destCount: destinations?.length ?? 0,
    })

    return NextResponse.json({ result })
  } catch (err) {
    console.error('recommendations error:', err)
    return NextResponse.json({ error: 'AI recommendations failed', result: null }, { status: 500 })
  }
}
