import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cache, TTL } from '@/lib/cache'

// Cache for 10 minutes - regions don't change often
export const revalidate = 600

const CACHE_KEY = 'regions:all'

export async function GET() {
  const startTime = Date.now()
  
  // Try cache first
  const cachedData = cache.get(CACHE_KEY)
  if (cachedData) {
    const cacheHitTime = Date.now() - startTime
    console.log(`[regions/GET] Cache HIT in ${cacheHitTime}ms`)
    
    const response = NextResponse.json(cachedData)
    response.headers.set('X-Cache', 'HIT')
    response.headers.set('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=1200')
    return response
  }
  
  try {
    const regions = await db.region.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        latitude: true,
        longitude: true,
        zoom: true,
        _count: {
          select: { 
            events: {
              where: {
                isActive: true,
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    })

    // Cache for 10 minutes
    cache.set(CACHE_KEY, regions, TTL.TEN_MINUTES)

    const responseTime = Date.now() - startTime
    console.log(`[regions/GET] Cache MISS - Returned ${regions.length} regions in ${responseTime}ms`)

    const response = NextResponse.json(regions)
    response.headers.set('X-Cache', 'MISS')
    response.headers.set('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=1200')
    
    return response
  } catch (error) {
    const errorTime = Date.now() - startTime
    console.error(`[regions/GET] Error after ${errorTime}ms:`, error)
    return NextResponse.json({ error: 'Failed to fetch regions' }, { status: 500 })
  }
}
