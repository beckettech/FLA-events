import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { scrapeUrl } from '@/lib/webScraper'
import { ParsedEvent } from '@/lib/eventParser'

function checkAuth(request: Request): boolean {
  const auth = request.headers.get('Authorization') ?? ''
  return auth.replace('Bearer ', '') === process.env.DEV_PASSWORD
}

async function upsertEvents(events: ParsedEvent[]) {
  const [categories, regions] = await Promise.all([db.category.findMany(), db.region.findMany()])
  const defaultCat = categories.find(c => c.slug === 'festivals') ?? categories[0]
  const defaultReg = regions.find(r => r.slug === 'soflo') ?? regions[0]
  let saved = 0, skipped = 0
  for (const ev of events) {
    const category = categories.find(c => c.slug === ev.categorySlug) ?? defaultCat
    const region = regions.find(r => r.slug === ev.regionSlug) ?? defaultReg
    try {
      await db.event.upsert({
        where: { slug: ev.slug },
        create: {
          slug: ev.slug, title: ev.title, description: ev.description,
          longDescription: ev.longDescription, venue: ev.venue, address: ev.address,
          latitude: ev.latitude, longitude: ev.longitude,
          startDate: ev.startDate, endDate: ev.endDate,
          price: ev.price, priceRange: ev.priceRange,
          imageUrl: ev.imageUrl, website: ev.website,
          categoryId: category.id, regionId: region.id,
          isActive: true, isFeatured: false,
          rating: parseFloat((3.5 + Math.random() * 1.5).toFixed(1)),
          reviewCount: Math.floor(Math.random() * 30),
        },
        update: {
          title: ev.title, description: ev.description, longDescription: ev.longDescription,
          imageUrl: ev.imageUrl, startDate: ev.startDate, endDate: ev.endDate,
          price: ev.price, priceRange: ev.priceRange, website: ev.website,
          latitude: ev.latitude, longitude: ev.longitude,
          categoryId: category.id, regionId: region.id,
        },
      })
      saved++
    } catch { skipped++ }
  }
  return { saved, skipped }
}

// POST /api/scrape/web  — body: { url, save?, selectedSlugs? }
export async function POST(request: Request) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { url?: string; save?: boolean; selectedSlugs?: string[] }
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { url, save = false, selectedSlugs } = body
  if (!url) return NextResponse.json({ error: 'url is required' }, { status: 400 })

  try {
    const events = await scrapeUrl(url)

    if (!save) {
      return NextResponse.json({ count: events.length, events })
    }

    // If selectedSlugs provided, only save those
    const toSave = selectedSlugs
      ? events.filter(e => selectedSlugs.includes(e.slug))
      : events

    const { saved, skipped } = await upsertEvents(toSave)
    return NextResponse.json({
      message: `Web scrape: found ${events.length}, saved ${saved}, skipped ${skipped}`,
      saved, skipped, total: events.length,
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
