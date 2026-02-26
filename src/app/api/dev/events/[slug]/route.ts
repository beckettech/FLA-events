import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkEventCancellation } from '@/lib/cancellationUtils'

function checkAuth(request: Request): boolean {
  return request.headers.get('Authorization')?.replace('Bearer ', '') === process.env.DEV_PASSWORD
}

// PATCH /api/dev/events/[slug]
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  if (!checkAuth(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { slug } = await params
  const body = await request.json().catch(() => ({}))

  const allowed = [
    'title', 'description', 'venue', 'address', 'latitude', 'longitude',
    'startDate', 'endDate', 'price', 'priceRange', 'imageUrl', 'website',
    'categoryId', 'regionId', 'isActive', 'isFeatured',
  ]

  const data: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) {
      if ((key === 'startDate' || key === 'endDate') && body[key]) {
        data[key] = new Date(body[key])
      } else {
        data[key] = body[key]
      }
    }
  }

  try {
    const updated = await db.event.update({
      where: { slug },
      data,
      include: { category: true, region: true },
    })
    // Auto-cancel if title now contains "cancelled"
    if (typeof body.title === 'string') {
      await checkEventCancellation(updated.id, updated.title)
    }
    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: 'Event not found or update failed' }, { status: 404 })
  }
}

// DELETE /api/dev/events/[slug]
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  if (!checkAuth(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { slug } = await params
  try {
    await db.event.delete({ where: { slug } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 })
  }
}
