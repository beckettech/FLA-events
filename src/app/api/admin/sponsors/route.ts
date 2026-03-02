import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

function checkAuth(request: Request): boolean {
  return request.headers.get('Authorization')?.replace('Bearer ', '') === process.env.DEV_PASSWORD
}

// GET /api/admin/sponsors - List all sponsors
export async function GET(request: Request) {
  if (!checkAuth(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const sponsors = await db.sponsor.findMany({
      include: {
        _count: {
          select: {
            sponsoredEvents: true,
            analytics: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ sponsors })
  } catch (error) {
    console.error('Error fetching sponsors:', error)
    return NextResponse.json({ error: 'Failed to fetch sponsors' }, { status: 500 })
  }
}

// POST /api/admin/sponsors - Create new sponsor
export async function POST(request: Request) {
  if (!checkAuth(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const {
      name,
      email,
      logoUrl,
      website,
      description,
      tier = 'BRONZE',
      billingEmail,
      phone,
      contactName,
      monthlyBudget,
    } = body

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
    }

    // Set monthly budget based on tier if not provided
    const budgetByTier = { BRONZE: 50, SILVER: 150, GOLD: 500 }
    const finalBudget = monthlyBudget || budgetByTier[tier as keyof typeof budgetByTier] || 50

    const sponsor = await db.sponsor.create({
      data: {
        name,
        email,
        logoUrl,
        website,
        description,
        tier,
        billingEmail: billingEmail || email,
        phone,
        contactName,
        monthlyBudget: finalBudget,
      },
    })

    return NextResponse.json({ sponsor }, { status: 201 })
  } catch (error) {
    console.error('Error creating sponsor:', error)
    return NextResponse.json({ error: 'Failed to create sponsor' }, { status: 500 })
  }
}
