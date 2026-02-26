import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  const auth = request.headers.get('Authorization') ?? ''
  if (auth.replace('Bearer ', '') !== process.env.DEV_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const [total, eventsByRegion, eventsByCategory] = await Promise.all([
      db.event.count({ where: { isActive: true } }),
      db.event.groupBy({ by: ['regionId'], _count: { id: true }, where: { isActive: true } }),
      db.event.groupBy({ by: ['categoryId'], _count: { id: true }, where: { isActive: true } }),
    ])

    const regions = await db.region.findMany({ select: { id: true, name: true, slug: true } })
    const categories = await db.category.findMany({ select: { id: true, name: true, slug: true } })

    const byRegion: Record<string, number> = {}
    for (const r of eventsByRegion) {
      const region = regions.find(reg => reg.id === r.regionId)
      if (region) byRegion[region.name] = r._count.id
    }

    const byCategory: Record<string, number> = {}
    for (const c of eventsByCategory) {
      const cat = categories.find(cat => cat.id === c.categoryId)
      if (cat) byCategory[cat.name] = c._count.id
    }

    return NextResponse.json({ total, byRegion, byCategory })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
