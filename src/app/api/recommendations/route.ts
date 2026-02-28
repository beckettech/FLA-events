import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/recommendations?userId=guest&limit=10
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'guest';
    const limit = parseInt(searchParams.get('limit') || '10');

    // Get all events
    const allEvents = await db.event.findMany({
      include: { category: true, tags: { include: { tag: true } } },
      where: { isActive: true },
    });

    // Get user's interactions
    const interactions = await db.userInteraction.findMany({
      where: { userId },
    });

    const swipedEventIds = new Set(interactions.map((i) => i.eventId));

    // Filter out already-swiped events
    const availableEvents = allEvents.filter((e) => !swipedEventIds.has(e.id));

    // Score events based on user preferences
    const scoredEvents = availableEvents.map((event) => {
      let score = 0;

      // Base score from event metrics
      score += (event.rating / 5) * 20; // Rating: max 20 points
      score += Math.min(event.viewCount / 100, 20); // Popularity: max 20 points

      // Feature boost
      if (event.isFeatured) score += 15;

      // Recency boost (newer events score higher)
      const eventAge = Date.now() - event.createdAt.getTime();
      const daysSinceCreation = eventAge / (1000 * 60 * 60 * 24);
      if (daysSinceCreation < 7) score += 10;
      if (daysSinceCreation < 3) score += 10;

      // Upcoming event boost
      const daysUntilStart =
        (event.startDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      if (daysUntilStart > 0 && daysUntilStart <= 7) score += 15;
      if (daysUntilStart > 7 && daysUntilStart <= 30) score += 10;

      return { ...event, recommendationScore: score };
    });

    // Sort by score (highest first)
    const recommendations = scoredEvents
      .sort((a, b) => b.recommendationScore - a.recommendationScore)
      .slice(0, limit);

    return NextResponse.json(recommendations);
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recommendations' },
      { status: 500 }
    );
  }
}
