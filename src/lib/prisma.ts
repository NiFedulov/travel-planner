import { PrismaClient } from '@/generated/prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { resolve } from 'path'

const createPrismaClient = () => {
  const dbPath = resolve(process.cwd(), 'dev.db')
  const adapter = new PrismaLibSql({ url: `file:${dbPath}` })
  return new PrismaClient({ adapter })
}

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
