import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { scrapeWithAI, runAIScrapeAll } from '@/lib/aiScraper'
import type { ParsedEvent } from '@/lib/eventParser'

function checkAuth(request: Request): boolean {
  return request.headers.get('Authorization')?.replace('Bearer ', '') === process.env.DEV_PASSWORD
}

async function upsertEvents(events: ParsedEvent[]) {
  const [categories, regions] = await Promise.all([db.category.findMany(), db.region.findMany()])
  const defaultCat = categories.find(c => c.slug === 'festivals') ?? categories[0]
  const defaultReg = regions.find(r => r.slug === 'soflo') ?? regions[0]
  let saved = 0
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
          title: ev.title, description: ev.description,
          longDescription: ev.longDescription, imageUrl: ev.imageUrl,
          startDate: ev.startDate, endDate: ev.endDate,
          price: ev.price, priceRange: ev.priceRange, website: ev.website,
          latitude: ev.latitude, longitude: ev.longitude,
          categoryId: category.id, regionId: region.id,
        },
      })
      saved++
    } catch { /* skip */ }
  }
  return saved
}

// POST /api/dev/ai-scrape
// body: { url?: string, runAll?: boolean, save?: boolean }
export async function POST(request: Request) {
  if (!checkAuth(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { url, runAll = false, save = false } = await request.json().catch(() => ({}))

  try {
    if (runAll) {
      // Scrape all known FL event sites
      const results = await runAIScrapeAll()
      const allEvents = results.flatMap(r => r.events)

      if (save) {
        const saved = await upsertEvents(allEvents)
        return NextResponse.json({
          message: `AI scraped ${results.length} sites, found ${allEvents.length} events, saved ${saved}`,
          results: results.map(r => ({ site: r.site, count: r.events.length, error: r.error })),
          saved,
        })
      }

      return NextResponse.json({
        results: results.map(r => ({ site: r.site, count: r.events.length, error: r.error, events: r.events })),
        total: allEvents.length,
      })
    }

    if (!url) return NextResponse.json({ error: 'url or runAll required' }, { status: 400 })

    const events = await scrapeWithAI(url)

    if (save) {
      const saved = await upsertEvents(events)
      return NextResponse.json({ message: `Found ${events.length} events, saved ${saved}`, saved, events })
    }

    return NextResponse.json({ count: events.length, events })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
