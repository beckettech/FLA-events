import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// GET - Fetch user's saved events
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const savedEvents = await db.savedEvent.findMany({
      where: { userId: session.user.id },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            slug: true,
            description: true,
            venue: true,
            address: true,
            startDate: true,
            imageUrl: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(savedEvents);
  } catch (error) {
    console.error("Error fetching saved events:", error);
    return NextResponse.json(
      { error: "Failed to fetch saved events" },
      { status: 500 }
    );
  }
}

// POST - Save an event
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { eventId } = await req.json();

    if (!eventId) {
      return NextResponse.json({ error: "Event ID required" }, { status: 400 });
    }

    // Check if already saved
    const existing = await db.savedEvent.findUnique({
      where: {
        userId_eventId: {
          userId: session.user.id,
          eventId,
        },
      },
    });

    if (existing) {
      return NextResponse.json({ message: "Already saved" }, { status: 200 });
    }

    const savedEvent = await db.savedEvent.create({
      data: {
        userId: session.user.id,
        eventId,
      },
      include: {
        event: true,
      },
    });

    return NextResponse.json(savedEvent, { status: 201 });
  } catch (error) {
    console.error("Error saving event:", error);
    return NextResponse.json(
      { error: "Failed to save event" },
      { status: 500 }
    );
  }
}

// DELETE - Remove a saved event
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { eventId } = await req.json();

    if (!eventId) {
      return NextResponse.json({ error: "Event ID required" }, { status: 400 });
    }

    await db.savedEvent.deleteMany({
      where: {
        userId: session.user.id,
        eventId,
      },
    });

    return NextResponse.json({ message: "Removed from saved" });
  } catch (error) {
    console.error("Error removing saved event:", error);
    return NextResponse.json(
      { error: "Failed to remove saved event" },
      { status: 500 }
    );
  }
}
