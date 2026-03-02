import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

function checkAuth(request: Request): boolean {
  return request.headers.get('Authorization')?.replace('Bearer ', '') === process.env.DEV_PASSWORD
}

// POST /api/admin/sponsors/[id]/events - Assign sponsor to event
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkAuth(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id: sponsorId } = await params
    const body = await request.json()
    const { eventId, placementType = 'featured', priority = 0, endDate } = body

    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 })
    }

    // Check sponsor exists and get tier
    const sponsor = await db.sponsor.findUnique({
      where: { id: sponsorId },
      include: {
        _count: {
          select: { sponsoredEvents: true },
        },
      },
    })

    if (!sponsor) {
      return NextResponse.json({ error: 'Sponsor not found' }, { status: 404 })
    }

    // Check tier limits
    const tierLimits = { BRONZE: 5, SILVER: 15, GOLD: Infinity }
    const currentCount = sponsor._count.sponsoredEvents
    const limit = tierLimits[sponsor.tier]

    if (currentCount >= limit) {
      return NextResponse.json(
        { error: `Sponsor has reached their ${sponsor.tier} tier limit of ${limit} events` },
        { status: 400 }
      )
    }

    // Create sponsored event
    const sponsoredEvent = await db.sponsoredEvent.create({
      data: {
        sponsorId,
        eventId,
        placementType,
        priority,
        endDate: endDate ? new Date(endDate) : null,
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            slug: true,
            startDate: true,
            imageUrl: true,
          },
        },
      },
    })

    return NextResponse.json({ sponsoredEvent }, { status: 201 })
  } catch (error) {
    console.error('Error assigning sponsor to event:', error)
    return NextResponse.json({ error: 'Failed to assign sponsor to event' }, { status: 500 })
  }
}

// DELETE /api/admin/sponsors/[id]/events - Remove sponsor from event
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkAuth(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id: sponsorId } = await params
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('eventId')

    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 })
    }

    await db.sponsoredEvent.deleteMany({
      where: {
        sponsorId,
        eventId,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing sponsor from event:', error)
    return NextResponse.json({ error: 'Failed to remove sponsor from event' }, { status: 500 })
  }
}
