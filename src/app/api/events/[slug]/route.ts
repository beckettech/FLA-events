import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Cache individual events for 5 minutes
export const revalidate = 300

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const startTime = Date.now()
  
  try {
    const { slug } = await params

    const event = await db.event.findUnique({
      where: { slug },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        longDescription: true,
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
        phone: true,
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
            description: true,
          },
        },
        region: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            latitude: true,
            longitude: true,
            zoom: true,
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
                description: true,
              },
            },
          },
        },
      },
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Increment view count asynchronously (don't await)
    db.event.update({
      where: { slug },
      data: { viewCount: { increment: 1 } },
    }).catch(err => console.error('[event-view-count] Failed to increment:', err))

    // Transform to flatten tags
    const eventWithTags = {
      ...event,
      tags: event.tags.map(t => t.tag),
    }

    const responseTime = Date.now() - startTime
    console.log(`[events/${slug}/GET] Returned event in ${responseTime}ms`)

    const response = NextResponse.json(eventWithTags)
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600')
    
    return response
  } catch (error) {
    const errorTime = Date.now() - startTime
    console.error(`[events/[slug]/GET] Error after ${errorTime}ms:`, error)
    return NextResponse.json({ error: 'Failed to fetch event' }, { status: 500 })
  }
}
