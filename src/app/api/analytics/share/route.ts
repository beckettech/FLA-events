import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      // Allow anonymous tracking but don't store user relation
      const body = await request.json()
      const { eventId, platform } = body

      // Just log the share without user tracking
      console.log(`Anonymous share: event=${eventId}, platform=${platform}`)
      
      return NextResponse.json({ success: true, anonymous: true })
    }

    const body = await request.json()
    const { eventId, platform, successful = true, metadata } = body

    if (!eventId || !platform) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create share event record
    await prisma.shareEvent.create({
      data: {
        userId: session.user.id,
        eventId,
        platform,
        successful,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error tracking share:', error)
    return NextResponse.json(
      { error: 'Failed to track share' },
      { status: 500 }
    )
  }
}

// Get share stats for an event
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('eventId')

    if (!eventId) {
      return NextResponse.json(
        { error: 'Missing eventId' },
        { status: 400 }
      )
    }

    // Get share count by platform
    const shares = await prisma.shareEvent.groupBy({
      by: ['platform'],
      where: { eventId },
      _count: true,
    })

    const totalShares = shares.reduce((sum, s) => sum + s._count, 0)

    return NextResponse.json({
      totalShares,
      byPlatform: shares.map(s => ({
        platform: s.platform,
        count: s._count,
      })),
    })
  } catch (error) {
    console.error('Error fetching share stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch share stats' },
      { status: 500 }
    )
  }
}
