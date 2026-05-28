import { PrismaClient } from '@/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error('DATABASE_URL is required (e.g. postgresql://user:pass@host:5432/db)')
  }
  const adapter = new PrismaPg({ connectionString: url })
  return new PrismaClient({
    adapter,
    // Логируем медленные/ошибочные запросы — в prod CloudWatch их подберёт
    log: process.env.NODE_ENV === 'production' ? ['warn', 'error'] : ['warn', 'error'],
  })
}

// Reuse client между hot reloads в dev — иначе пул соединений течёт.
// В prod процесс short-lived в Lambda/ECS task — кэширование не вредит.
export const prisma = globalThis.__prisma ?? createPrismaClient()
if (process.env.NODE_ENV !== 'production') globalThis.__prisma = prisma
