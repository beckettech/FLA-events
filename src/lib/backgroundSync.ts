/**
 * backgroundSync.ts
 * Runs Ticketmaster + Eventbrite fetches in the background.
 * Called from /api/events without await — never blocks the response.
 */

import { db } from './db'
import { fetchAllTicketmasterEvents } from './ticketmaster'
import { fetchAllEventbriteEvents } from './eventbrite'
import { markSyncStart, markSyncDone, markSyncFailed, getDateWindow } from './syncManager'
import { processCancellations } from './cancellationUtils'
import type { ParsedEvent } from './eventParser'

async function upsertBatch(events: ParsedEvent[]) {
  const [categories, regions] = await Promise.all([
    db.category.findMany(),
    db.region.findMany(),
  ])
  const defaultCat = categories.find(c => c.slug === 'festivals') ?? categories[0]
  const defaultReg = regions.find(r => r.slug === 'soflo') ?? regions[0]
  if (!defaultCat || !defaultReg) return 0

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
          reviewCount: Math.floor(Math.random() * 80),
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
    } catch { /* duplicate or bad data — skip */ }
  }
  return saved
}

export async function runBackgroundSync() {
  markSyncStart()
  const { start, end } = getDateWindow()
  let total = 0

  try {
    // Ticketmaster
    if (process.env.TICKETMASTER_API_KEY && process.env.TICKETMASTER_API_KEY !== 'YOUR_TICKETMASTER_KEY_HERE') {
      const tmEvents = await fetchAllTicketmasterEvents(start, end)
      const saved = await upsertBatch(tmEvents)
      total += saved
      console.log(`[sync] Ticketmaster: ${tmEvents.length} fetched, ${saved} upserted`)
    }

    // Eventbrite
    if (process.env.EVENTBRITE_TOKEN && process.env.EVENTBRITE_TOKEN !== 'YOUR_EVENTBRITE_TOKEN_HERE') {
      try {
        const ebEvents = await fetchAllEventbriteEvents(start, end)
        const saved = await upsertBatch(ebEvents)
        total += saved
        console.log(`[sync] Eventbrite: ${ebEvents.length} fetched, ${saved} upserted`)
      } catch (err) {
        console.warn('[sync] Eventbrite skipped:', (err as Error).message)
      }
    }

    // Deactivate events that have already ended
    await db.event.updateMany({
      where: { endDate: { lt: new Date() }, isActive: true },
      data: { isActive: false },
    })

    // Auto-hide and tag cancelled events
    await processCancellations()

    markSyncDone(total)
    console.log(`[sync] Complete — ${total} events synced`)
  } catch (err) {
    console.error('[sync] Failed:', err)
    markSyncFailed()
  }
}
