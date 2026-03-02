import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/analytics/track - Track impression/click/conversion
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { eventId, metric, sponsorId } = body

    if (!eventId || !metric) {
      return NextResponse.json({ error: 'eventId and metric are required' }, { status: 400 })
    }

    if (!['impression', 'click', 'conversion'].includes(metric)) {
      return NextResponse.json({ error: 'Invalid metric type' }, { status: 400 })
    }

    // Find the sponsored event
    const sponsoredEvent = sponsorId
      ? await db.sponsoredEvent.findFirst({
          where: { eventId, sponsorId, isActive: true },
        })
      : await db.sponsoredEvent.findFirst({
          where: { eventId, isActive: true },
        })

    if (!sponsoredEvent) {
      // Event is not sponsored, skip tracking
      return NextResponse.json({ success: true, tracked: false })
    }

    // Create analytics record
    await db.sponsorAnalytic.create({
      data: {
        sponsorId: sponsoredEvent.sponsorId,
        eventId,
        metric,
      },
    })

    // Update counters on sponsored event
    if (metric === 'impression') {
      await db.sponsoredEvent.update({
        where: { id: sponsoredEvent.id },
        data: { impressions: { increment: 1 } },
      })
    } else if (metric === 'click') {
      await db.sponsoredEvent.update({
        where: { id: sponsoredEvent.id },
        data: { clicks: { increment: 1 } },
      })
    }

    return NextResponse.json({ success: true, tracked: true })
  } catch (error) {
    console.error('Error tracking analytics:', error)
    return NextResponse.json({ error: 'Failed to track analytics' }, { status: 500 })
  }
}
