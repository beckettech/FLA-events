import type { ParsedEvent } from './eventParser'
import { detectRegionFromCity } from './ticketmaster'

const BASE = 'https://www.eventbriteapi.com/v3'

const EB_CATEGORY_MAP: Record<string, string> = {
  '103': 'music',           // Music
  '108': 'sports',          // Sports & Fitness
  '105': 'arts-culture',    // Arts
  '104': 'arts-culture',    // Film & Media
  '110': 'food-drink',      // Food & Drink
  '113': 'festivals',       // Community & Culture
  '101': 'festivals',       // Business & Professional
  '111': 'family',          // Family & Education
  '109': 'festivals',       // Travel & Outdoor
  '107': 'arts-culture',    // Fashion & Beauty
  '119': 'nightlife',       // Nightlife
  '117': 'festivals',       // Charity & Causes
}

interface EBVenue {
  name: string
  address?: {
    address_1?: string
    city?: string
    region?: string
    localized_address_display?: string
    latitude?: string
    longitude?: string
  }
}

interface EBEvent {
  id: string
  name: { text: string }
  description?: { text?: string }
  url: string
  start: { local: string; utc: string }
  end: { local: string; utc: string }
  logo?: { url: string }
  category_id?: string
  is_free?: boolean
  ticket_availability?: { minimum_ticket_price?: { display: string; value: number } }
  venue?: EBVenue
}

interface EBResponse {
  events?: EBEvent[]
  pagination?: { page_count: number; page_number: number; has_more_items: boolean }
}

export async function fetchAllEventbriteEvents(
  startDate: string,
  endDate: string
): Promise<ParsedEvent[]> {
  const token = process.env.EVENTBRITE_TOKEN
  if (!token || token === 'YOUR_EVENTBRITE_TOKEN_HERE') {
    throw new Error('EVENTBRITE_TOKEN not set in .env.local')
  }

  // Eventbrite deprecated their public search API in 2023.
  // We now fetch events from the authenticated organizer's own events,
  // or use their categories-based browse endpoint.
  const allEvents: EBEvent[] = []
  let page = 1
  let hasMore = true

  while (hasMore && page <= 5) {
    const params = new URLSearchParams({
      'start_date.range_start': `${startDate}T00:00:00Z`,
      'start_date.range_end': `${endDate}T23:59:59Z`,
      'expand': 'venue,category,ticket_availability',
      'page_size': '50',
      'page': String(page),
    })

    // Try organizer's own events first
    const res = await fetch(`${BASE}/users/me/events/?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(`Eventbrite error ${res.status}: ${JSON.stringify(err)}`)
    }

    const data: EBResponse = await res.json()
    allEvents.push(...(data.events ?? []))
    hasMore = data.pagination?.has_more_items ?? false
    page++
    if (hasMore) await new Promise(r => setTimeout(r, 200))
  }

  return allEvents.map(normalizeEventbriteEvent).filter(Boolean) as ParsedEvent[]
}

function normalizeEventbriteEvent(ev: EBEvent): ParsedEvent | null {
  try {
    const city = ev.venue?.address?.city ?? 'Florida'
    const address = ev.venue?.address?.localized_address_display
      ?? [ev.venue?.address?.address_1, city, 'FL'].filter(Boolean).join(', ')

    const lat = parseFloat(ev.venue?.address?.latitude ?? 'NaN')
    const lng = parseFloat(ev.venue?.address?.longitude ?? 'NaN')

    const startDate = new Date(ev.start.local)
    const endDate = new Date(ev.end.local)

    const categorySlug = EB_CATEGORY_MAP[ev.category_id ?? ''] ?? 'community'
    const regionSlug = detectRegionFromCity(city)

    const price = ev.is_free ? 0
      : ev.ticket_availability?.minimum_ticket_price?.value ?? null
    const priceRange = ev.is_free ? 'Free'
      : ev.ticket_availability?.minimum_ticket_price?.display ?? null

    const slug = (ev.name.text ?? 'event').toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').slice(0, 55)
      + '-eb' + ev.id.slice(-6)

    const description = (ev.description?.text ?? `${ev.name.text} in ${city}, Florida.`).slice(0, 600)

    return {
      title: ev.name.text,
      description,
      longDescription: description.length > 150 ? description : null,
      venue: ev.venue?.name ?? city,
      address,
      latitude: isNaN(lat) ? 25.7617 : lat,
      longitude: isNaN(lng) ? -80.1918 : lng,
      startDate,
      endDate,
      price,
      priceRange,
      imageUrl: ev.logo?.url ?? null,
      website: ev.url,
      categorySlug,
      regionSlug,
      slug,
      source: 'eventbrite.com',
    }
  } catch {
    return null
  }
}
