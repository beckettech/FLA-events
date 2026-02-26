import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isStale } from '@/lib/syncManager'
import { runBackgroundSync } from '@/lib/backgroundSync'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')
  const region = searchParams.get('region')
  const search = searchParams.get('search')
  const featured = searchParams.get('featured')
  const boundsParam = searchParams.get('bounds')
  const tag = searchParams.get('tag')

  // ── Background sync (non-blocking) ────────────────────────────────────────
  // If TM/EB data is stale (>1hr), kick off a refresh in background.
  // We never await this — users always get an instant DB response.
  if (isStale()) {
    runBackgroundSync().catch(err =>
      console.error('[events] Background sync error:', err)
    )
  }

  try {
    const where: Record<string, unknown> = { isActive: true }

    if (category) where.category = { slug: category }

    if (region) {
      where.OR = [
        { region: { slug: region } },
        { secondaryRegion: { slug: region } },
      ]
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { venue: { contains: search } },
      ]
    }

    if (featured === 'true') where.isFeatured = true

    if (boundsParam) {
      const [south, west, north, east] = boundsParam.split(',').map(Number)
      if (!isNaN(south) && !isNaN(west) && !isNaN(north) && !isNaN(east)) {
        where.AND = [
          { latitude: { gte: south } },
          { latitude: { lte: north } },
          { longitude: { gte: west } },
          { longitude: { lte: east } },
        ]
      }
    }

    if (tag) {
      where.tags = { some: { tag: { slug: tag } } }
    }

    const events = await db.event.findMany({
      where,
      include: {
        category: true,
        region: true,
        secondaryRegion: true,
        tags: { include: { tag: true } },
      },
      orderBy: [
        { isFeatured: 'desc' },
        { startDate: 'asc' },
      ],
      take: 200,
    })

    const eventsWithCoords = events.map(event => ({
      ...event,
      latitude: event.latitude ?? 25.7617,
      longitude: event.longitude ?? -80.1918,
      tags: event.tags.map(t => t.tag),
    }))

    return NextResponse.json(eventsWithCoords)
  } catch (error) {
    console.error('Error fetching events:', error)
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 })
  }
}
