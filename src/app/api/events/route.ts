import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isStale } from '@/lib/syncManager'
import { runBackgroundSync } from '@/lib/backgroundSync'
import { cache, createCacheKey, TTL } from '@/lib/cache'

// Cache configuration - revalidate every 5 minutes
export const revalidate = 300

export async function GET(request: Request) {
  const startTime = Date.now()
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')
  const region = searchParams.get('region')
  const search = searchParams.get('search')
  const featured = searchParams.get('featured')
  const boundsParam = searchParams.get('bounds')
  const tag = searchParams.get('tag')

  // Create cache key from request parameters
  const cacheKey = createCacheKey('events', {
    category: category || '',
    region: region || '',
    search: search || '',
    featured: featured || '',
    bounds: boundsParam || '',
    tag: tag || '',
  })

  // Try to get from cache first
  const cachedData = cache.get(cacheKey)
  if (cachedData) {
    const cacheHitTime = Date.now() - startTime
    console.log(`[events/GET] Cache HIT in ${cacheHitTime}ms`)
    
    const response = NextResponse.json(cachedData)
    response.headers.set('X-Cache', 'HIT')
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600')
    return response
  }

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
    const andFilters: Record<string, unknown>[] = []

    if (category) where.category = { slug: category }

    if (region) {
      andFilters.push({
        OR: [
          { region: { slug: region } },
          { secondaryRegion: { slug: region } },
        ],
      })
    }

    if (search) {
      andFilters.push({
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { venue: { contains: search, mode: 'insensitive' } },
        ],
      })
    }

    if (featured === 'true') where.isFeatured = true

    if (boundsParam) {
      const [south, west, north, east] = boundsParam.split(',').map(Number)
      if (!isNaN(south) && !isNaN(west) && !isNaN(north) && !isNaN(east)) {
        andFilters.push(
          { latitude: { gte: south } },
          { latitude: { lte: north } },
          { longitude: { gte: west } },
          { longitude: { lte: east } },
        )
      }
    }

    if (tag) {
      where.tags = { some: { tag: { slug: tag } } }
    }

    if (andFilters.length) where.AND = andFilters

    const events = await db.event.findMany({
      where,
      // Only select fields needed for list view
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        venue: true,
        address: true,
        latitude: true,
        longitude: true,
        startDate: true,
        endDate: true,
        price: true,
        priceRange: true,
        imageUrl: true,
        website: true,
        rating: true,
        reviewCount: true,
        viewCount: true,
        isFeatured: true,
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            icon: true,
            color: true,
          },
        },
        region: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        secondaryRegion: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        tags: {
          select: {
            tag: {
              select: {
                id: true,
                name: true,
                slug: true,
                icon: true,
                color: true,
              },
            },
          },
        },
      },
      orderBy: [
        { isFeatured: 'desc' },
        { startDate: 'asc' },
      ],
      take: 200,
    })

    const eventsWithCoords = events.map(event => ({
      ...event,
      tags: event.tags.map(t => t.tag),
    }))

    // Cache the result for 3 minutes
    cache.set(cacheKey, eventsWithCoords, TTL.FIVE_MINUTES)

    const responseTime = Date.now() - startTime
    console.log(`[events/GET] Cache MISS - Returned ${eventsWithCoords.length} events in ${responseTime}ms`)

    const response = NextResponse.json(eventsWithCoords)
    
    // Add caching headers
    response.headers.set('X-Cache', 'MISS')
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600')
    
    return response
  } catch (error) {
    const errorTime = Date.now() - startTime
    console.error(`[events/GET] Error after ${errorTime}ms:`, error)
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 })
  }
}
