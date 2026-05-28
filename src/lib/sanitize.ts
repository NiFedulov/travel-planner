/**
 * Prompt injection protection: вырезаем control-чары, инструкции в виде тегов,
 * и обрезаем длину. Используется ВСЁ что попадает в system prompt от пользователя.
 *
 * Дополнительно user-data всегда оборачивается в <user_data> теги в промптах,
 * чтобы модель чётко различала инструкции и данные.
 */
export function sanitizeForPrompt(input: unknown, maxLen = 200): string {
  if (input == null) return ''
  const str = String(input)
  return str
    // вырезаем control chars (кроме обычного space)
    .replace(/[\x00-\x08\x0B-\x1F\x7F]/g, ' ')
    // нормализуем все виды whitespace в один пробел
    .replace(/\s+/g, ' ')
    // вырезаем потенциальные injection-маркеры
    .replace(/<\/?(?:system|user|assistant|instructions?|prompt)[^>]*>/gi, '')
    // вырезаем тройные бэктики (Markdown code fences — частый вектор)
    .replace(/```/g, '')
    // вырезаем "Ignore previous instructions" патерны (необязательно, но не помешает)
    .replace(/\b(ignore|disregard|forget)\s+(all\s+)?(previous|prior|above)\s+(instructions?|prompts?|rules?)/gi, '[redacted]')
    .trim()
    .slice(0, maxLen)
}

export function sanitizeArray(input: unknown, maxItems = 20, maxLen = 80): string[] {
  if (!Array.isArray(input)) return []
  return input.slice(0, maxItems).map(item => sanitizeForPrompt(item, maxLen)).filter(Boolean)
}
