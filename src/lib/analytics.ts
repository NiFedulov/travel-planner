import { prisma } from './prisma'
import { logger } from './logger'

export async function track(
  event: string,
  userId?: string | null,
  properties?: object
): Promise<void> {
  try {
    await prisma.event.create({
      data: {
        event,
        userId: userId ?? null,
        properties: properties ? JSON.stringify(properties) : null,
      },
    })
  } catch (err) {
    logger.error('analytics track failed', err, { event })
  }
}
