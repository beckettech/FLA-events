// Google Custom Search Engine client + event result parser

export interface CSEItem {
  title: string
  link: string
  snippet: string
  displayLink: string
  pagemap?: {
    metatags?: Array<Record<string, string>>
    event?: Array<Record<string, string>>
    hcard?: Array<Record<string, string>>
    person?: Array<Record<string, string>>
  }
}

export interface ParsedEvent {
  title: string
  description: string
  longDescription: string | null
  venue: string
  address: string
  startDate: Date
  endDate: Date | null
  price: number | null
  priceRange: string | null
  imageUrl: string | null
  website: string
  categorySlug: string
  regionSlug: string
  slug: string
  source: string
}

// ── Florida region keywords ────────────────────────────────────────────────
const REGION_MAP: Array<{ slug: string; keywords: string[] }> = [
  {
    slug: 'soflo',
    keywords: [
      'miami', 'fort lauderdale', 'boca raton', 'hollywood', 'pompano',
      'coral gables', 'homestead', 'miami beach', 'south florida', 'soflo',
      'broward', 'miami-dade', 'palm beach', 'west palm', 'delray',
    ],
  },
  {
    slug: 'tampa-bay',
    keywords: [
      'tampa', 'st. pete', 'st pete', 'saint pete', 'clearwater', 'sarasota',
      'bradenton', 'lakeland', 'brandon', 'largo', 'pinellas', 'hillsborough',
    ],
  },
  {
    slug: 'central-florida',
    keywords: [
      'orlando', 'kissimmee', 'sanford', 'daytona', 'deltona', 'ocala',
      'gainesville', 'central florida', 'orange county', 'osceola',
    ],
  },
  {
    slug: 'swfl',
    keywords: [
      'naples', 'fort myers', 'cape coral', 'bonita springs', 'marco island',
      'southwest florida', 'swfl', 'collier', 'lee county',
    ],
  },
  {
    slug: 'north-florida',
    keywords: [
      'jacksonville', 'st augustine', 'saint augustine', 'daytona beach',
      'north florida', 'ponte vedra', 'fernandina',
    ],
  },
  {
    slug: 'panhandle',
    keywords: [
      'pensacola', 'panama city', 'tallahassee', 'destin', 'fort walton',
      'panhandle', 'escambia', 'okaloosa', 'bay county',
    ],
  },
]

// ── Category keyword detection ─────────────────────────────────────────────
const CATEGORY_MAP: Array<{ slug: string; keywords: string[] }> = [
  {
    slug: 'music',
    keywords: [
      'concert', 'music', 'festival', 'jazz', 'band', 'live music',
      'edm', 'hip hop', 'reggae', 'classical', 'orchestra', 'dj',
    ],
  },
  {
    slug: 'food-drink',
    keywords: [
      'food', 'drink', 'wine', 'beer', 'restaurant', 'tasting', 'culinary',
      'chef', 'dining', 'cocktail', 'brunch', 'food festival',
    ],
  },
  {
    slug: 'arts-culture',
    keywords: [
      'art', 'gallery', 'museum', 'theater', 'theatre', 'film', 'comedy',
      'cultural', 'exhibit', 'performance', 'dance', 'ballet',
    ],
  },
  {
    slug: 'sports',
    keywords: [
      'sport', 'marathon', 'race', 'triathlon', 'tournament', 'championship',
      'game', 'match', 'fitness', 'run', 'cycling', 'golf',
    ],
  },
  {
    slug: 'nightlife',
    keywords: [
      'nightclub', 'bar', 'lounge', 'party', 'nightlife', 'club night',
      'rave', 'night out', 'happy hour',
    ],
  },
  {
    slug: 'family',
    keywords: [
      'family', 'kids', 'children', 'carnival', 'fair', 'amusement',
      'theme park', 'parade', 'holiday', 'seasonal',
    ],
  },
  {
    slug: 'car-show',
    keywords: [
      'car show', 'auto show', 'car meet', 'vehicle show', 'classic car',
      'muscle car', 'exotic car', 'car cruise', 'auto expo', 'motor show',
    ],
  },
]

// ── Helpers ────────────────────────────────────────────────────────────────

function detectRegion(text: string): string {
  const lower = text.toLowerCase()
  for (const { slug, keywords } of REGION_MAP) {
    if (keywords.some((kw) => lower.includes(kw))) return slug
  }
  return 'soflo' // default to South Florida
}

function detectCategory(text: string): string {
  const lower = text.toLowerCase()
  for (const { slug, keywords } of CATEGORY_MAP) {
    if (keywords.some((kw) => lower.includes(kw))) return slug
  }
  return 'festivals'
}

function parseDate(text: string): Date | null {
  // ISO dates like 2025-03-15 or 2025-03-15T20:00
  const isoMatch = text.match(/\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2})?/)
  if (isoMatch) {
    const d = new Date(isoMatch[0])
    if (!isNaN(d.getTime())) return d
  }

  // "March 15, 2025" or "Mar 15, 2025"
  const longMatch = text.match(
    /(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2},?\s+\d{4}/i
  )
  if (longMatch) {
    const d = new Date(longMatch[0])
    if (!isNaN(d.getTime())) return d
  }

  // "15/03/2025" or "03/15/2025"
  const slashMatch = text.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/)
  if (slashMatch) {
    const d = new Date(`${slashMatch[3]}-${slashMatch[1].padStart(2, '0')}-${slashMatch[2].padStart(2, '0')}`)
    if (!isNaN(d.getTime())) return d
  }

  return null
}

function parsePrice(text: string): { price: number | null; priceRange: string | null } {
  const lower = text.toLowerCase()
  if (lower.includes('free') || lower.includes('no cost')) {
    return { price: 0, priceRange: 'Free' }
  }
  // "$25 - $75" range
  const rangeMatch = text.match(/\$(\d+(?:\.\d{2})?)\s*[-–]\s*\$(\d+(?:\.\d{2})?)/)
  if (rangeMatch) {
    return {
      price: parseFloat(rangeMatch[1]),
      priceRange: `$${rangeMatch[1]} – $${rangeMatch[2]}`,
    }
  }
  // Single price "$50"
  const singleMatch = text.match(/\$(\d+(?:\.\d{2})?)/)
  if (singleMatch) {
    const p = parseFloat(singleMatch[1])
    return { price: p, priceRange: `$${singleMatch[1]}` }
  }
  return { price: null, priceRange: null }
}

function slugify(text: string, suffix = ''): string {
  const base = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 60)
  return suffix ? `${base}-${suffix}` : base
}

function shortHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0
  }
  return hash.toString(36).slice(0, 6)
}

// ── Main parser ────────────────────────────────────────────────────────────

export function parseCSEItem(item: CSEItem): ParsedEvent {
  const meta = item.pagemap?.metatags?.[0] ?? {}
  const eventData = item.pagemap?.event?.[0] ?? {}

  const title =
    meta['og:title'] ||
    meta['twitter:title'] ||
    eventData['name'] ||
    item.title.replace(/\s*[|\-–].+$/, '').trim()

  const description =
    meta['og:description'] ||
    meta['twitter:description'] ||
    eventData['description'] ||
    item.snippet

  const imageUrl =
    meta['og:image'] ||
    meta['twitter:image'] ||
    meta['image'] ||
    null

  // Combine all text for detection
  const fullText = [title, description, item.snippet, item.link].join(' ')

  // Date extraction — prefer structured data
  const rawDate =
    eventData['startdate'] ||
    meta['event:start_date'] ||
    meta['startdate'] ||
    meta['date'] ||
    ''
  let startDate = rawDate ? new Date(rawDate) : null
  if (!startDate || isNaN(startDate.getTime())) {
    startDate = parseDate(item.snippet) ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // fallback 1 week from now
  }

  const rawEnd = eventData['enddate'] || meta['event:end_date'] || ''
  let endDate: Date | null = rawEnd ? new Date(rawEnd) : null
  if (endDate && isNaN(endDate.getTime())) endDate = null

  // Venue / address
  const venue =
    eventData['location'] ||
    meta['event:location'] ||
    item.displayLink.replace(/^www\./, '')

  const address =
    meta['og:street-address'] ||
    meta['og:locality'] ||
    eventData['location'] ||
    'Florida'

  // Price
  const { price, priceRange } = parsePrice(fullText)

  // Category + Region
  const categorySlug = detectCategory(fullText)
  const regionSlug = detectRegion(fullText)

  // Slug — title + short hash of URL for uniqueness
  const slug = slugify(title, shortHash(item.link))

  return {
    title,
    description: description.slice(0, 500),
    longDescription: description.length > 200 ? description : null,
    venue,
    address,
    startDate,
    endDate,
    price,
    priceRange,
    imageUrl,
    website: item.link,
    categorySlug,
    regionSlug,
    slug,
    source: item.displayLink,
  }
}

// ── Google CSE fetch ───────────────────────────────────────────────────────

export async function searchGoogleCSE(
  query: string,
  start = 1
): Promise<CSEItem[]> {
  const cseId = process.env.GOOGLE_CSE_ID
  const apiKey = process.env.GOOGLE_API_KEY

  if (!cseId || !apiKey || apiKey === 'YOUR_GOOGLE_API_KEY_HERE') {
    throw new Error('GOOGLE_CSE_ID and GOOGLE_API_KEY must be set in .env.local')
  }

  const params = new URLSearchParams({
    key: apiKey,
    cx: cseId,
    q: query,
    start: String(start),
    num: '10',
  })

  const res = await fetch(
    `https://www.googleapis.com/customsearch/v1?${params.toString()}`,
    { next: { revalidate: 3600 } } // cache 1 hour
  )

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(
      `Google CSE error ${res.status}: ${(err as { error?: { message?: string } }).error?.message ?? res.statusText}`
    )
  }

  const data = await res.json() as { items?: CSEItem[]; error?: { message: string } }
  if (data.error) throw new Error(data.error.message)
  return data.items ?? []
}

// ── Convenience: search all configured sites ──────────────────────────────

export const EVENT_SOURCES = [
  'eventbrite.com',
  'facebook.com',
  'meetup.com',
  'visitflorida.com',
  'miamiandbeaches.com',
  'ticketmaster.com',
]

/**
 * Run multiple queries across the CSE (which already has those sites
 * configured) and return deduplicated parsed events.
 */
export async function fetchFloridaEvents(
  extraQuery = ''
): Promise<ParsedEvent[]> {
  const queries = [
    `Florida events ${extraQuery}`.trim(),
    `Miami events ${extraQuery}`.trim(),
    `Orlando events ${extraQuery}`.trim(),
    `Tampa events ${extraQuery}`.trim(),
  ]

  const seen = new Set<string>()
  const results: ParsedEvent[] = []

  for (const q of queries) {
    try {
      const items = await searchGoogleCSE(q)
      for (const item of items) {
        if (seen.has(item.link)) continue
        seen.add(item.link)
        results.push(parseCSEItem(item))
      }
    } catch (err) {
      console.error(`CSE query failed for "${q}":`, err)
    }
  }

  return results
}
