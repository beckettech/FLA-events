import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

function checkAuth(request: Request): boolean {
  return request.headers.get('Authorization')?.replace('Bearer ', '') === process.env.DEV_PASSWORD
}

// GET /api/analytics/sponsors/[id] - Get sponsor analytics
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkAuth(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Get sponsor with sponsored events
    const sponsor = await db.sponsor.findUnique({
      where: { id },
      include: {
        sponsoredEvents: {
          where: { isActive: true },
          include: {
            event: {
              select: {
                id: true,
                title: true,
                slug: true,
              },
            },
          },
        },
      },
    })

    if (!sponsor) {
      return NextResponse.json({ error: 'Sponsor not found' }, { status: 404 })
    }

    // Get analytics for time period
    const analytics = await db.sponsorAnalytic.findMany({
      where: {
        sponsorId: id,
        createdAt: { gte: startDate },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Calculate aggregate stats
    const totalImpressions = analytics.filter((a) => a.metric === 'impression').length
    const totalClicks = analytics.filter((a) => a.metric === 'click').length
    const totalConversions = analytics.filter((a) => a.metric === 'conversion').length
    const ctr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0'
    const conversionRate = totalClicks > 0 ? ((totalConversions / totalClicks) * 100).toFixed(2) : '0'

    // Per-event breakdown
    const eventStats = sponsor.sponsoredEvents.map((se) => {
      const eventAnalytics = analytics.filter((a) => a.eventId === se.eventId)
      const impressions = eventAnalytics.filter((a) => a.metric === 'impression').length
      const clicks = eventAnalytics.filter((a) => a.metric === 'click').length
      const conversions = eventAnalytics.filter((a) => a.metric === 'conversion').length

      return {
        eventId: se.eventId,
        eventTitle: se.event.title,
        eventSlug: se.event.slug,
        impressions,
        clicks,
        conversions,
        ctr: impressions > 0 ? ((clicks / impressions) * 100).toFixed(2) : '0',
      }
    })

    // Daily breakdown (last 7 days for chart)
    const dailyStats = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)
      
      const nextDate = new Date(date)
      nextDate.setDate(nextDate.getDate() + 1)

      const dayAnalytics = analytics.filter(
        (a) => a.createdAt >= date && a.createdAt < nextDate
      )

      dailyStats.push({
        date: date.toISOString().split('T')[0],
        impressions: dayAnalytics.filter((a) => a.metric === 'impression').length,
        clicks: dayAnalytics.filter((a) => a.metric === 'click').length,
        conversions: dayAnalytics.filter((a) => a.metric === 'conversion').length,
      })
    }

    return NextResponse.json({
      sponsor: {
        id: sponsor.id,
        name: sponsor.name,
        tier: sponsor.tier,
        activeEvents: sponsor.sponsoredEvents.length,
      },
      summary: {
        totalImpressions,
        totalClicks,
        totalConversions,
        ctr: parseFloat(ctr),
        conversionRate: parseFloat(conversionRate),
        period: `${days} days`,
      },
      eventStats,
      dailyStats,
    })
  } catch (error) {
    console.error('Error fetching sponsor analytics:', error)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}
