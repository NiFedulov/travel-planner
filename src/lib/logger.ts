/**
 * Structured JSON logger.
 *
 * В проде CloudWatch Logs Insights парсит JSON автоматически.
 * Stack traces никогда не возвращаются клиенту — только в логах.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const LEVELS: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 }
const MIN_LEVEL: number = LEVELS[(process.env.LOG_LEVEL as LogLevel) ?? (process.env.NODE_ENV === 'production' ? 'info' : 'debug')] ?? 20

function serializeErr(err: unknown): object {
  if (err instanceof Error) {
    return {
      name: err.name,
      message: err.message,
      stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
    }
  }
  return { message: String(err) }
}

function emit(level: LogLevel, msg: string, meta?: object, err?: unknown) {
  if (LEVELS[level] < MIN_LEVEL) return
  const entry = {
    level,
    msg,
    ts: new Date().toISOString(),
    ...(err !== undefined ? { err: serializeErr(err) } : {}),
    ...(meta ?? {}),
  }
  const line = JSON.stringify(entry)
  if (level === 'error' || level === 'warn') console.error(line)
  else console.log(line)
}

export const logger = {
  debug: (msg: string, meta?: object) => emit('debug', msg, meta),
  info: (msg: string, meta?: object) => emit('info', msg, meta),
  warn: (msg: string, meta?: object) => emit('warn', msg, meta),
  error: (msg: string, err?: unknown, meta?: object) => emit('error', msg, meta, err),
}
