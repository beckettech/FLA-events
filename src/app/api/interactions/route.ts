import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/interactions?userId=guest&action=swipe_right
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'guest';
    const action = searchParams.get('action');

    const where: any = { userId };
    if (action) where.action = action;

    const interactions = await db.userInteraction.findMany({
      where,
      include: { event: true },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(interactions);
  } catch (error) {
    console.error('Error fetching interactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch interactions' },
      { status: 500 }
    );
  }
}

// POST /api/interactions - Create interaction
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId = 'guest', eventId, action } = body;

    if (!eventId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: eventId, action' },
        { status: 400 }
      );
    }

    // Validate action
    if (!['swipe_right', 'swipe_left'].includes(action)) {
      return NextResponse.json(
        { error: 'Action must be "swipe_right" or "swipe_left"' },
        { status: 400 }
      );
    }

    const interaction = await db.userInteraction.create({
      data: {
        userId,
        eventId,
        action,
      },
      include: { event: true },
    });

    return NextResponse.json(interaction, { status: 201 });
  } catch (error) {
    console.error('Error creating interaction:', error);
    return NextResponse.json(
      { error: 'Failed to create interaction' },
      { status: 500 }
    );
  }
}
