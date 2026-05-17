import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  const flights = await prisma.mockFlight.findMany({
    where: {
      ...(from ? { fromCode: from } : {}),
      ...(to ? { toCode: to } : {}),
    },
  })

  return NextResponse.json(flights)
}
