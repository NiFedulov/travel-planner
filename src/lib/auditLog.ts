import { prisma } from './prisma'
import { logger } from './logger'

/**
 * Audit log для security-sensitive действий.
 * Пишет в таблицу AuditLog + дублирует в structured logger (CloudWatch / Vercel logs).
 *
 * НЕ блокирует основной flow — ошибки записи только логируются.
 *
 * Используй в endpoints для:
 *  - login_success / login_failed
 *  - logout
 *  - user_registered
 *  - profile_changed
 *  - trip_deleted / trip_created
 *  - admin_access
 *  - oauth_callback_success / oauth_callback_failed
 */

export type AuditAction =
  | 'login_success'
  | 'login_failed'
  | 'logout'
  | 'user_registered'
  | 'profile_created'
  | 'profile_updated'
  | 'trip_created'
  | 'trip_updated'
  | 'trip_deleted'
  | 'oauth_success'
  | 'oauth_failed'
  | 'admin_access'
  | 'rate_limit_exceeded'

export interface AuditContext {
  userId?: string | null
  req?: Request
  metadata?: Record<string, unknown>
}

function clientIp(req?: Request): string | null {
  if (!req) return null
  const fwd = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip')
  return fwd?.split(',')[0]?.trim() ?? null
}

function userAgent(req?: Request): string | null {
  if (!req) return null
  const ua = req.headers.get('user-agent')
  return ua?.slice(0, 500) ?? null  // лимит чтоб не разнести БД
}

export async function auditLog(action: AuditAction, ctx: AuditContext = {}): Promise<void> {
  const ip = clientIp(ctx.req)
  const ua = userAgent(ctx.req)
  const meta = ctx.metadata ? JSON.stringify(ctx.metadata).slice(0, 2000) : null

  // Лог в logger ВСЕГДА — даже если БД упадёт, событие останется в CloudWatch/Vercel
  logger.info('audit', {
    action,
    userId: ctx.userId ?? null,
    ip,
    ua,
    metadata: ctx.metadata,
  })

  try {
    await prisma.auditLog.create({
      data: {
        action,
        userId: ctx.userId ?? null,
        ip,
        userAgent: ua,
        metadata: meta,
      },
    })
  } catch (err) {
    // Не падаем — audit не должен ломать основной flow
    logger.error('audit log DB write failed', err, { action, userId: ctx.userId })
  }
}
