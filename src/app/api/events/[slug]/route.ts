import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    const event = await db.event.findUnique({
      where: { slug },
      include: {
        category: true,
        region: true,
        secondaryRegion: true,
        tags: {
          include: {
            tag: true
          }
        },
      },
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Increment view count
    await db.event.update({
      where: { slug },
      data: { viewCount: { increment: 1 } },
    })

    // Transform to flatten tags
    const eventWithTags = {
      ...event,
      tags: event.tags.map(t => t.tag),
    }

    return NextResponse.json(eventWithTags)
  } catch (error) {
    console.error('Error fetching event:', error)
    return NextResponse.json({ error: 'Failed to fetch event' }, { status: 500 })
  }
}
