const cache = new Map<string, { result: unknown; ts: number }>()
const TTL = 5 * 60 * 1000
const MAX = 200

export function getCached(key: string): unknown | null {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() - entry.ts > TTL) {
    cache.delete(key)
    return null
  }
  return entry.result
}

export function setCached(key: string, value: unknown): void {
  if (cache.size >= MAX) {
    const oldest = cache.keys().next().value
    if (oldest) cache.delete(oldest)
  }
  cache.set(key, { result: value, ts: Date.now() })
}

export function cacheKey(endpoint: string, body: unknown): string {
  return `${endpoint}:${JSON.stringify(body)}`
}
