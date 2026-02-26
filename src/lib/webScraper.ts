import { ParsedEvent } from './eventParser'
import { detectRegionFromCity } from './ticketmaster'

// Scrapes a URL for event data using JSON-LD structured data + Open Graph fallback

interface JsonLdEvent {
  '@type'?: string | string[]
  name?: string
  description?: string
  startDate?: string
  endDate?: string
  image?: string | { url?: string }
  url?: string
  location?: {
    name?: string
    address?: string | {
      streetAddress?: string
      addressLocality?: string
      addressRegion?: string
    }
    geo?: { latitude?: number | string; longitude?: number | string }
  }
  offers?: Array<{
    price?: number | string
    priceCurrency?: string
    priceRange?: string
  }> | {
    price?: number | string
    priceCurrency?: string
  }
  organizer?: { name?: string }
}

const CATEGORY_KEYWORDS: Array<{ slug: string; keywords: string[] }> = [
  { slug: 'music', keywords: ['concert', 'music', 'festival', 'jazz', 'band', 'live music', 'dj', 'edm', 'hip hop', 'reggae', 'rap', 'country', 'orchestra'] },
  { slug: 'food-drink', keywords: ['food', 'wine', 'beer', 'culinary', 'tasting', 'restaurant', 'dining', 'cocktail', 'brunch', 'chef'] },
  { slug: 'arts-culture', keywords: ['art', 'gallery', 'museum', 'theater', 'theatre', 'film', 'comedy', 'dance', 'ballet', 'exhibit', 'cultural'] },
  { slug: 'sports', keywords: ['sport', 'marathon', 'race', 'tournament', 'championship', 'fitness', 'run', 'golf', 'triathlon', 'cycling'] },
  { slug: 'nightlife', keywords: ['nightclub', 'bar', 'lounge', 'party', 'nightlife', 'rave', 'drag', 'burlesque'] },
  { slug: 'family', keywords: ['family', 'kids', 'children', 'carnival', 'fair', 'parade', 'holiday'] },
  { slug: 'car-show', keywords: ['car show', 'auto show', 'car meet', 'classic car', 'muscle car', 'exotic car', 'car cruise', 'motor show'] },
]

function detectCategory(text: string): string {
  const lower = text.toLowerCase()
  for (const { slug, keywords } of CATEGORY_KEYWORDS) {
    if (keywords.some(k => lower.includes(k))) return slug
  }
  return 'festivals'
}

function extractMetaTag(html: string, property: string): string | null {
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`, 'i'),
    new RegExp(`<meta[^>]+name=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${property}["']`, 'i'),
  ]
  for (const re of patterns) {
    const match = html.match(re)
    if (match?.[1]) return match[1].trim()
  }
  return null
}

function extractJsonLd(html: string): JsonLdEvent[] {
  const results: JsonLdEvent[] = []
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  let match
  while ((match = re.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(match[1])
      const items = Array.isArray(parsed) ? parsed : [parsed]
      for (const item of items) {
        const type = item['@type']
        const isEvent = type === 'Event' || type === 'MusicEvent' || type === 'SportsEvent'
          || (Array.isArray(type) && type.some((t: string) => t.includes('Event')))
        if (isEvent) results.push(item)
        // Check @graph
        if (item['@graph']) {
          for (const g of item['@graph']) {
            const gType = g['@type']
            const gIsEvent = gType === 'Event' || gType === 'MusicEvent'
              || (Array.isArray(gType) && gType.some((t: string) => t.includes('Event')))
            if (gIsEvent) results.push(g)
          }
        }
      }
    } catch { /* skip malformed JSON-LD */ }
  }
  return results
}

function slugify(text: string, suffix = ''): string {
  const base = text.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').slice(0, 55)
  return suffix ? `${base}-${suffix}` : base
}

function shortHash(str: string): string {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0
  return h.toString(36).slice(0, 6)
}

function parseAddress(location: JsonLdEvent['location']): { venue: string; address: string; city: string } {
  if (!location) return { venue: 'Florida', address: 'Florida', city: 'Florida' }
  if (typeof location === 'string') return { venue: location, address: location, city: 'Florida' }
  const name = location.name ?? ''
  if (typeof location.address === 'string') {
    return { venue: name || location.address, address: location.address, city: extractCity(location.address) }
  }
  const addr = location.address ?? {}
  const parts = [addr.streetAddress, addr.addressLocality, addr.addressRegion].filter(Boolean)
  const full = parts.join(', ')
  return { venue: name || addr.addressLocality || 'Florida', address: full || 'Florida', city: addr.addressLocality ?? 'Florida' }
}

function extractCity(address: string): string {
  const parts = address.split(',').map(p => p.trim())
  return parts.length > 1 ? parts[parts.length - 2] : address
}

function parseOfferPrice(offers: JsonLdEvent['offers']): { price: number | null; priceRange: string | null } {
  if (!offers) return { price: null, priceRange: null }
  const arr = Array.isArray(offers) ? offers : [offers]
  if (arr.length === 0) return { price: null, priceRange: null }
  const prices = arr.map(o => parseFloat(String(o.price ?? 'NaN'))).filter(n => !isNaN(n))
  if (prices.length === 0) return { price: null, priceRange: null }
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  if (min === 0) return { price: 0, priceRange: 'Free' }
  if (min === max) return { price: min, priceRange: `$${min}` }
  return { price: min, priceRange: `$${min} – $${max}` }
}

export async function scrapeUrl(url: string): Promise<ParsedEvent[]> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
    },
    signal: AbortSignal.timeout(15000),
  })

  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`)
  const html = await res.text()

  // Try JSON-LD first (best quality)
  const jsonLdEvents = extractJsonLd(html)
  if (jsonLdEvents.length > 0) {
    return jsonLdEvents.map(ev => normalizeJsonLdEvent(ev, url)).filter(Boolean) as ParsedEvent[]
  }

  // Fallback: Open Graph / meta tags — treat the whole page as one event
  const title = extractMetaTag(html, 'og:title')
    ?? html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim()
    ?? 'Event'
  const description = (extractMetaTag(html, 'og:description')
    ?? extractMetaTag(html, 'description')
    ?? '').slice(0, 600)
  const imageUrl = extractMetaTag(html, 'og:image') ?? null
  const fullText = [title, description, url].join(' ')

  return [{
    title: title.replace(/\s*[|\-–].+$/, '').trim(),
    description: description || title,
    longDescription: description.length > 150 ? description : null,
    venue: new URL(url).hostname.replace('www.', ''),
    address: 'Florida',
    latitude: 27.9944,
    longitude: -81.7603,
    startDate: new Date(Date.now() + 14 * 86400000),
    endDate: null,
    price: null,
    priceRange: null,
    imageUrl,
    website: url,
    categorySlug: detectCategory(fullText),
    regionSlug: 'soflo',
    slug: slugify(title.replace(/\s*[|\-–].+$/, '').trim(), shortHash(url)),
    source: new URL(url).hostname.replace('www.', ''),
  }]
}

function normalizeJsonLdEvent(ev: JsonLdEvent, sourceUrl: string): ParsedEvent | null {
  try {
    const title = ev.name ?? 'Event'
    const description = (ev.description ?? '').replace(/<[^>]+>/g, '').slice(0, 600)
    const image = typeof ev.image === 'string' ? ev.image : ev.image?.url ?? null
    const website = ev.url ?? sourceUrl

    const startDate = ev.startDate ? new Date(ev.startDate) : new Date(Date.now() + 14 * 86400000)
    const endDate = ev.endDate ? new Date(ev.endDate) : null

    const { venue, address, city } = parseAddress(ev.location)
    const lat = parseFloat(String(ev.location?.geo?.latitude ?? 'NaN'))
    const lng = parseFloat(String(ev.location?.geo?.longitude ?? 'NaN'))

    const { price, priceRange } = parseOfferPrice(ev.offers)
    const fullText = [title, description, venue, address].join(' ')

    return {
      title,
      description: description || title,
      longDescription: description.length > 150 ? description : null,
      venue,
      address,
      latitude: isNaN(lat) ? 25.7617 : lat,
      longitude: isNaN(lng) ? -80.1918 : lng,
      startDate,
      endDate,
      price,
      priceRange,
      imageUrl: image,
      website,
      categorySlug: detectCategory(fullText),
      regionSlug: detectRegionFromCity(city),
      slug: slugify(title, shortHash(website)),
      source: new URL(sourceUrl).hostname.replace('www.', ''),
    }
  } catch {
    return null
  }
}
