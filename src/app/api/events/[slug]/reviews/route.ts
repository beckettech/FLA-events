import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    const event = await db.event.findUnique({
      where: { slug },
      select: { id: true },
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    const reviews = await db.review.findMany({
      where: { eventId: event.id },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    })

    const total = await db.review.count({
      where: { eventId: event.id },
    })

    return NextResponse.json({
      reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching reviews:', error)
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const body = await request.json()
    const { rating, title, comment, authorName, authorEmail } = body

    // Validate required fields
    if (!rating || !comment || !authorName) {
      return NextResponse.json(
        { error: 'Rating, comment, and author name are required' },
        { status: 400 }
      )
    }

    // Validate rating range
    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      )
    }

    const event = await db.event.findUnique({
      where: { slug },
      select: { id: true, rating: true, reviewCount: true },
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Create review
    const review = await db.review.create({
      data: {
        rating,
        title,
        comment,
        authorName,
        authorEmail,
        eventId: event.id,
      },
    })

    // Update event rating and review count
    const newReviewCount = event.reviewCount + 1
    const newRating = ((event.rating * event.reviewCount) + rating) / newReviewCount

    await db.event.update({
      where: { id: event.id },
      data: {
        reviewCount: newReviewCount,
        rating: Math.round(newRating * 10) / 10, // Round to 1 decimal place
      },
    })

    return NextResponse.json(review, { status: 201 })
  } catch (error) {
    console.error('Error creating review:', error)
    return NextResponse.json({ error: 'Failed to create review' }, { status: 500 })
  }
}
