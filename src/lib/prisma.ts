import { PrismaClient } from '@/generated/prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { resolve } from 'path'

const createPrismaClient = () => {
  const dbPath = resolve(process.cwd(), 'dev.db')
  const adapter = new PrismaLibSql({ url: `file:${dbPath}` })
  return new PrismaClient({ adapter })
}

// No global caching — SQLite has no connection limits, and caching causes
// stale clients after schema changes in dev
export const prisma = createPrismaClient()
