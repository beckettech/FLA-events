import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

function checkAuth(request: Request): boolean {
  return request.headers.get('Authorization')?.replace('Bearer ', '') === process.env.DEV_PASSWORD
}

// GET /api/dev/events?search=&skip=&take=&all=true
export async function GET(request: Request) {
  if (!checkAuth(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search') || ''
  const skip = parseInt(searchParams.get('skip') || '0')
  const take = parseInt(searchParams.get('take') || '50')
  const showAll = searchParams.get('all') === 'true'

  const where: Record<string, unknown> = {}
  if (!showAll) where.isActive = true
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { venue: { contains: search } },
      { description: { contains: search } },
    ]
  }

  const [events, total] = await Promise.all([
    db.event.findMany({
      where,
      include: { category: true, region: true },
      orderBy: { startDate: 'asc' },
      skip,
      take,
    }),
    db.event.count({ where }),
  ])

  return NextResponse.json({ events, total, skip, take })
}
