import type Anthropic from '@anthropic-ai/sdk'

function cleanJson(raw: string): string {
  const match = raw.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('No JSON object found in response')
  return match[0]
    .replace(/\/\/[^\n]*/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/,(\s*[}\]])/g, '$1')
}

export async function parseJsonWithRetry(
  client: Anthropic,
  rawText: string,
  model = 'claude-haiku-4-5-20251001',
): Promise<unknown> {
  try {
    return JSON.parse(cleanJson(rawText))
  } catch {
    const reprompt = await client.messages.create({
      model,
      max_tokens: 2048,
      messages: [{
        role: 'user',
        content: `Re-emit the following as STRICT valid JSON only. No comments, no trailing commas, no markdown fences, no prose — just the JSON object:\n\n${rawText}`,
      }],
    })
    const retryText = reprompt.content[0].type === 'text' ? reprompt.content[0].text : ''
    return JSON.parse(cleanJson(retryText))
  }
}
