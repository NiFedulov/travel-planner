import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { rateLimit, apiLimiter, getIdentifier } from '@/lib/rateLimit'

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const limited = await rateLimit(apiLimiter, getIdentifier(req, user.id))
  if (limited) return limited

  const { id } = await params
  const service = await prisma.connectedService.findUnique({ where: { id } })
  if (!service) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (service.userId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await prisma.connectedService.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
