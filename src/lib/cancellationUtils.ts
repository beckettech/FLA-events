/**
 * cancellationUtils.ts
 * Auto-hides events with "cancelled" in the title and tags them with a Cancelled tag.
 */

import { db } from './db'

const CANCELLED_TAG = {
  slug: 'cancelled',
  name: 'Cancelled',
  icon: '🚫',
  color: '#EF4444',
  description: 'This event has been cancelled.',
}

/** Ensures the Cancelled tag exists in the DB and returns its id. */
async function ensureCancelledTag(): Promise<string> {
  const tag = await db.tag.upsert({
    where: { slug: CANCELLED_TAG.slug },
    create: CANCELLED_TAG,
    update: { icon: CANCELLED_TAG.icon, color: CANCELLED_TAG.color },
  })
  return tag.id
}

/**
 * Finds all events whose title contains "cancelled" (case-insensitive),
 * sets isActive: false, and attaches the Cancelled tag.
 * Returns the number of events processed.
 */
export async function processCancellations(): Promise<number> {
  const cancelledTagId = await ensureCancelledTag()

  // SQLite doesn't support mode: 'insensitive' — use contains with manual filtering
  const candidates = await db.event.findMany({
    where: { isActive: true },
    select: { id: true, title: true },
  })

  const toCancel = candidates.filter(e =>
    e.title.toLowerCase().includes('cancelled') ||
    e.title.toLowerCase().includes('canceled')
  )

  if (toCancel.length === 0) return 0

  const ids = toCancel.map(e => e.id)

  await db.event.updateMany({
    where: { id: { in: ids } },
    data: { isActive: false },
  })

  // Attach cancelled tag to each (upsert to avoid duplicates)
  for (const id of ids) {
    await db.eventTag.upsert({
      where: { eventId_tagId: { eventId: id, tagId: cancelledTagId } },
      create: { eventId: id, tagId: cancelledTagId },
      update: {},
    })
  }

  console.log(`[cancellations] Marked ${ids.length} event(s) as cancelled`)
  return ids.length
}

/**
 * Called when a single event's title is updated via the dev API.
 * Handles the cancellation check for just that one event.
 */
export async function checkEventCancellation(eventId: string, title: string): Promise<void> {
  const isCancelled =
    title.toLowerCase().includes('cancelled') ||
    title.toLowerCase().includes('canceled')

  if (!isCancelled) return

  const cancelledTagId = await ensureCancelledTag()

  await db.event.update({
    where: { id: eventId },
    data: { isActive: false },
  })

  await db.eventTag.upsert({
    where: { eventId_tagId: { eventId: eventId, tagId: cancelledTagId } },
    create: { eventId: eventId, tagId: cancelledTagId },
    update: {},
  })
}
