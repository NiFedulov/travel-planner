import { NextRequest } from 'next/server'
import { getAnthropicClient } from '@/lib/ai/client'

export async function POST(req: NextRequest) {
  const { messages, profile, trip } = await req.json()

  const systemPrompt = `You are a friendly travel assistant helping plan a trip.
${profile ? `Traveler profile: ${profile.travelers?.length} traveler(s), style: ${profile.vacationStyle?.join(', ')}, budget: €${profile.budgetTotal ?? 'unset'}, languages: ${profile.languagesSpoken?.join(', ')}.` : ''}
${trip ? `Current trip: ${trip.originCity} → ${trip.destinations?.map((d: { city: string }) => d.city).join(', ')}, ${trip.startDate} to ${trip.endDate}.` : ''}
Be concise, practical, and enthusiastic. Answer in the same language the user writes in.`

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const client = getAnthropicClient()
      const response = client.messages.stream({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: systemPrompt,
        messages: messages.map((m: { role: string; content: string }) => ({
          role: m.role,
          content: m.content,
        })),
      })

      for await (const chunk of response) {
        if (
          chunk.type === 'content_block_delta' &&
          chunk.delta.type === 'text_delta'
        ) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`))
        }
      }
      controller.enqueue(encoder.encode('data: [DONE]\n\n'))
      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
