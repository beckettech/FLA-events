import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || session.user.id

    // Only allow users to view their own stats (unless admin)
    if (userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Get referral stats
    const [
      totalReferrals,
      convertedReferrals,
      pendingReferrals,
      referralsByEvent,
      recentReferrals,
    ] = await Promise.all([
      // Total referrals
      prisma.referral.count({
        where: { referrerId: userId },
      }),
      
      // Converted referrals (registered users)
      prisma.referral.count({
        where: {
          referrerId: userId,
          status: { in: ['registered', 'converted'] },
        },
      }),
      
      // Pending referrals
      prisma.referral.count({
        where: {
          referrerId: userId,
          status: 'pending',
        },
      }),
      
      // Referrals by event
      prisma.referral.groupBy({
        by: ['eventId'],
        where: {
          referrerId: userId,
          eventId: { not: null },
        },
        _count: true,
      }),
      
      // Recent referrals with event details
      prisma.referral.findMany({
        where: { referrerId: userId },
        include: {
          event: {
            select: {
              id: true,
              title: true,
              slug: true,
              imageUrl: true,
            },
          },
          referee: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ])

    // Calculate conversion rate
    const conversionRate = totalReferrals > 0
      ? (convertedReferrals / totalReferrals) * 100
      : 0

    // Get total shares
    const totalShares = await prisma.shareEvent.count({
      where: { userId },
    })

    // Get shares by platform
    const sharesByPlatform = await prisma.shareEvent.groupBy({
      by: ['platform'],
      where: { userId },
      _count: true,
    })

    return NextResponse.json({
      referrals: {
        total: totalReferrals,
        converted: convertedReferrals,
        pending: pendingReferrals,
        conversionRate: conversionRate.toFixed(1),
      },
      shares: {
        total: totalShares,
        byPlatform: sharesByPlatform.map(s => ({
          platform: s.platform,
          count: s._count,
        })),
      },
      byEvent: referralsByEvent.map(r => ({
        eventId: r.eventId,
        count: r._count,
      })),
      recent: recentReferrals,
    })
  } catch (error) {
    console.error('Error fetching referral stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch referral stats' },
      { status: 500 }
    )
  }
}

// Get leaderboard of top referrers
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { limit = 10, timeframe = 'all' } = body

    // Build date filter
    let dateFilter = {}
    if (timeframe === 'week') {
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      dateFilter = { createdAt: { gte: weekAgo } }
    } else if (timeframe === 'month') {
      const monthAgo = new Date()
      monthAgo.setMonth(monthAgo.getMonth() - 1)
      dateFilter = { createdAt: { gte: monthAgo } }
    }

    // Get top referrers
    const topReferrers = await prisma.referral.groupBy({
      by: ['referrerId'],
      where: {
        ...dateFilter,
        status: { in: ['registered', 'converted'] },
      },
      _count: true,
      orderBy: { _count: { referrerId: 'desc' } },
      take: limit,
    })

    // Fetch user details for top referrers
    const referrerIds = topReferrers.map(r => r.referrerId)
    const users = await prisma.user.findMany({
      where: { id: { in: referrerIds } },
      select: {
        id: true,
        name: true,
        image: true,
      },
    })

    const leaderboard = topReferrers.map(r => {
      const user = users.find(u => u.id === r.referrerId)
      return {
        userId: r.referrerId,
        name: user?.name || 'Anonymous',
        image: user?.image,
        referralCount: r._count,
      }
    })

    return NextResponse.json({ leaderboard })
  } catch (error) {
    console.error('Error fetching leaderboard:', error)
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    )
  }
}
