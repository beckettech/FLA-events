import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const body = await request.json()
    const { referrerId, eventId, metadata } = body

    if (!referrerId) {
      return NextResponse.json(
        { error: 'Missing referrerId' },
        { status: 400 }
      )
    }

    // Don't track self-referrals
    if (session?.user?.id === referrerId) {
      return NextResponse.json({ success: true, selfReferral: true })
    }

    // Check if this referral already exists
    const existingReferral = await prisma.referral.findFirst({
      where: {
        referrerId,
        ...(session?.user?.id && { refereeId: session.user.id }),
        ...(eventId && { eventId }),
      },
    })

    if (existingReferral) {
      return NextResponse.json({ success: true, existing: true })
    }

    // Create new referral record
    const referral = await prisma.referral.create({
      data: {
        referrerId,
        refereeId: session?.user?.id || null,
        eventId: eventId || null,
        status: session?.user ? 'registered' : 'pending',
        metadata: metadata ? JSON.stringify(metadata) : null,
        convertedAt: session?.user ? new Date() : null,
      },
    })

    return NextResponse.json({ success: true, referral })
  } catch (error) {
    console.error('Error tracking referral:', error)
    return NextResponse.json(
      { error: 'Failed to track referral' },
      { status: 500 }
    )
  }
}

// Convert a pending referral to registered when user signs up
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { referrerId } = body

    if (!referrerId) {
      return NextResponse.json(
        { error: 'Missing referrerId' },
        { status: 400 }
      )
    }

    // Update pending referrals for this user
    const updated = await prisma.referral.updateMany({
      where: {
        referrerId,
        refereeId: null,
        status: 'pending',
      },
      data: {
        refereeId: session.user.id,
        status: 'registered',
        convertedAt: new Date(),
      },
    })

    return NextResponse.json({ success: true, updated: updated.count })
  } catch (error) {
    console.error('Error converting referral:', error)
    return NextResponse.json(
      { error: 'Failed to convert referral' },
      { status: 500 }
    )
  }
}
