import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

function checkAuth(request: Request): boolean {
  return request.headers.get('Authorization')?.replace('Bearer ', '') === process.env.DEV_PASSWORD
}

// GET /api/admin/sponsors/[id] - Get single sponsor
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkAuth(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const sponsor = await db.sponsor.findUnique({
      where: { id },
      include: {
        sponsoredEvents: {
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
        },
        _count: {
          select: {
            analytics: true,
          },
        },
      },
    })

    if (!sponsor) {
      return NextResponse.json({ error: 'Sponsor not found' }, { status: 404 })
    }

    return NextResponse.json({ sponsor })
  } catch (error) {
    console.error('Error fetching sponsor:', error)
    return NextResponse.json({ error: 'Failed to fetch sponsor' }, { status: 500 })
  }
}

// PUT /api/admin/sponsors/[id] - Update sponsor
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkAuth(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const body = await request.json()
    const {
      name,
      email,
      logoUrl,
      website,
      description,
      tier,
      isActive,
      billingEmail,
      phone,
      contactName,
      monthlyBudget,
    } = body

    const sponsor = await db.sponsor.update({
      where: { id },
      data: {
        name,
        email,
        logoUrl,
        website,
        description,
        tier,
        isActive,
        billingEmail,
        phone,
        contactName,
        monthlyBudget,
      },
    })

    return NextResponse.json({ sponsor })
  } catch (error) {
    console.error('Error updating sponsor:', error)
    return NextResponse.json({ error: 'Failed to update sponsor' }, { status: 500 })
  }
}

// DELETE /api/admin/sponsors/[id] - Delete sponsor
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkAuth(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    await db.sponsor.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting sponsor:', error)
    return NextResponse.json({ error: 'Failed to delete sponsor' }, { status: 500 })
  }
}
