import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { fetchFloridaEvents, searchGoogleCSE, parseCSEItem, ParsedEvent } from '@/lib/googleSearch'

/**
 * GET /api/scrape
 *
 * Query params:
 *   q        – extra search terms (e.g. "music festival")
 *   save     – "true" to upsert results into the database (default: false)
 *   source   – restrict to one site slug, e.g. "eventbrite.com"
 *   preview  – "true" to return raw CSE items without parsing
 *
 * Returns the list of parsed (or upserted) events.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const extraQuery = searchParams.get('q') ?? ''
  const save = searchParams.get('save') === 'true'
  const source = searchParams.get('source') ?? ''
  const preview = searchParams.get('preview') === 'true'

  try {
    // ── 1. Fetch from Google CSE ──────────────────────────────────────────
    let parsedEvents: ParsedEvent[]

    if (source) {
      // Query a specific site
      const query = `site:${source} Florida events ${extraQuery}`.trim()
      const items = await searchGoogleCSE(query)
      if (preview) return NextResponse.json({ items })
      parsedEvents = items.map(parseCSEItem)
    } else {
      if (preview) {
        const items = await searchGoogleCSE(`Florida events ${extraQuery}`.trim())
        return NextResponse.json({ items })
      }
      parsedEvents = await fetchFloridaEvents(extraQuery)
    }

    if (!save) {
      // Just return the parsed events without touching the DB
      return NextResponse.json({ count: parsedEvents.length, events: parsedEvents })
    }

    // ── 2. Load lookup tables ─────────────────────────────────────────────
    const [categories, regions] = await Promise.all([
      db.category.findMany(),
      db.region.findMany(),
    ])

    // Build fallback / default IDs
    const defaultCategory =
      categories.find((c) => c.slug === 'festivals') ??
      categories[0]

    const defaultRegion =
      regions.find((r) => r.slug === 'soflo') ?? regions[0]

    if (!defaultCategory || !defaultRegion) {
      return NextResponse.json(
        { error: 'Database has no categories or regions. Run seed first.' },
        { status: 500 }
      )
    }

    // ── 3. Upsert each event ──────────────────────────────────────────────
    const upserted: string[] = []
    const skipped: string[] = []

    for (const ev of parsedEvents) {
      const category =
        categories.find((c) => c.slug === ev.categorySlug) ?? defaultCategory
      const region =
        regions.find((r) => r.slug === ev.regionSlug) ?? defaultRegion

      try {
        await db.event.upsert({
          where: { slug: ev.slug },
          create: {
            slug: ev.slug,
            title: ev.title,
            description: ev.description,
            longDescription: ev.longDescription,
            venue: ev.venue,
            address: ev.address,
            startDate: ev.startDate,
            endDate: ev.endDate,
            price: ev.price,
            priceRange: ev.priceRange,
            imageUrl: ev.imageUrl,
            website: ev.website,
            categoryId: category.id,
            regionId: region.id,
            isActive: true,
            isFeatured: false,
          },
          update: {
            title: ev.title,
            description: ev.description,
            longDescription: ev.longDescription,
            imageUrl: ev.imageUrl,
            startDate: ev.startDate,
            endDate: ev.endDate,
            price: ev.price,
            priceRange: ev.priceRange,
            website: ev.website,
            categoryId: category.id,
            regionId: region.id,
          },
        })
        upserted.push(ev.slug)
      } catch (err) {
        console.error(`Failed to upsert event "${ev.slug}":`, err)
        skipped.push(ev.slug)
      }
    }

    return NextResponse.json({
      message: `Scraped ${parsedEvents.length} events. Saved: ${upserted.length}, Skipped: ${skipped.length}`,
      saved: upserted,
      skipped,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('Scrape error:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
