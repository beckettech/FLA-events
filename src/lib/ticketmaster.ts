import type { ParsedEvent } from './eventParser'

const BASE = 'https://app.ticketmaster.com/discovery/v2'

const TM_CATEGORY_MAP: Record<string, string> = {
  'Music': 'music',
  'Sports': 'sports',
  'Arts & Theatre': 'arts-culture',
  'Film': 'arts-culture',
  'Family': 'family',
  'Miscellaneous': 'festivals',
}

const REGION_MAP = [
  { slug: 'soflo', cities: ['miami', 'fort lauderdale', 'boca raton', 'hollywood', 'pompano beach', 'coral gables', 'miami beach', 'west palm beach', 'delray beach', 'boynton beach', 'palm beach', 'aventura', 'doral', 'hialeah', 'kendall', 'homestead', 'pembroke pines', 'miramar', 'coral springs', 'plantation'] },
  { slug: 'tampa-bay', cities: ['tampa', 'st. petersburg', 'saint petersburg', 'clearwater', 'sarasota', 'bradenton', 'lakeland', 'brandon', 'largo', 'dunedin', 'tarpon springs', 'new port richey'] },
  { slug: 'central-florida', cities: ['orlando', 'kissimmee', 'sanford', 'daytona beach', 'deltona', 'ocala', 'gainesville', 'winter park', 'altamonte springs', 'lake buena vista', 'celebration', 'ocoee', 'apopka'] },
  { slug: 'swfl', cities: ['naples', 'fort myers', 'cape coral', 'bonita springs', 'marco island', 'estero', 'lehigh acres', 'port charlotte'] },
  { slug: 'north-florida', cities: ['jacksonville', 'st. augustine', 'saint augustine', 'daytona', 'ponte vedra', 'fernandina beach', 'amelia island', 'green cove springs'] },
  { slug: 'panhandle', cities: ['pensacola', 'panama city', 'tallahassee', 'destin', 'fort walton beach', 'navarre', 'gulf breeze', 'niceville', 'crestview', 'mary esther'] },
]

export function detectRegionFromCity(city: string): string {
  const lower = city.toLowerCase()
  for (const { slug, cities } of REGION_MAP) {
    if (cities.some(c => lower.includes(c))) return slug
  }
  return 'soflo'
}

interface TMEvent {
  id: string
  name: string
  url: string
  dates: { start: { localDate: string; localTime?: string }; end?: { localDate?: string } }
  priceRanges?: Array<{ min: number; max: number; currency: string }>
  images?: Array<{ url: string; width: number; height: number }>
  classifications?: Array<{ segment?: { name: string }; genre?: { name: string } }>
  _embedded?: {
    venues?: Array<{
      name: string
      address?: { line1?: string }
      city?: { name: string }
      state?: { stateCode: string }
      location?: { latitude: string; longitude: string }
    }>
  }
}

interface TMResponse {
  _embedded?: { events?: TMEvent[] }
  page?: { totalElements: number; totalPages: number; number: number }
}

export async function fetchTicketmasterEvents(
  startDate: string,
  endDate: string,
  page = 0
): Promise<TMEvent[]> {
  const key = process.env.TICKETMASTER_API_KEY
  if (!key || key === 'YOUR_TICKETMASTER_KEY_HERE') {
    throw new Error('TICKETMASTER_API_KEY not set in .env.local')
  }

  const params = new URLSearchParams({
    apikey: key,
    countryCode: 'US',
    stateCode: 'FL',
    startDateTime: `${startDate}T00:00:00Z`,
    endDateTime: `${endDate}T23:59:59Z`,
    size: '200',
    page: String(page),
    sort: 'date,asc',
  })

  const res = await fetch(`${BASE}/events.json?${params}`)
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`Ticketmaster error ${res.status}: ${JSON.stringify(err)}`)
  }

  const data: TMResponse = await res.json()
  return data._embedded?.events ?? []
}

export async function fetchAllTicketmasterEvents(
  startDate: string,
  endDate: string
): Promise<ParsedEvent[]> {
  const key = process.env.TICKETMASTER_API_KEY
  if (!key || key === 'YOUR_TICKETMASTER_KEY_HERE') {
    throw new Error('TICKETMASTER_API_KEY not set in .env.local')
  }

  // First page to get total
  const params = new URLSearchParams({
    apikey: key,
    countryCode: 'US',
    stateCode: 'FL',
    startDateTime: `${startDate}T00:00:00Z`,
    endDateTime: `${endDate}T23:59:59Z`,
    size: '200',
    page: '0',
    sort: 'date,asc',
  })

  const firstRes = await fetch(`${BASE}/events.json?${params}`)
  if (!firstRes.ok) throw new Error(`Ticketmaster ${firstRes.status}`)
  const firstData: TMResponse = await firstRes.json()

  const allEvents: TMEvent[] = [...(firstData._embedded?.events ?? [])]
  const totalPages = Math.min(firstData.page?.totalPages ?? 1, 5) // cap at 5 pages = 1000 events

  for (let p = 1; p < totalPages; p++) {
    await new Promise(r => setTimeout(r, 200))
    const events = await fetchTicketmasterEvents(startDate, endDate, p)
    allEvents.push(...events)
  }

  return allEvents.map(normalizeTicketmasterEvent).filter(Boolean) as ParsedEvent[]
}

function normalizeTicketmasterEvent(ev: TMEvent): ParsedEvent | null {
  try {
    const venue = ev._embedded?.venues?.[0]
    const city = venue?.city?.name ?? 'Florida'
    const address = [venue?.address?.line1, city, 'FL'].filter(Boolean).join(', ')
    const lat = parseFloat(venue?.location?.latitude ?? '25.7617')
    const lng = parseFloat(venue?.location?.longitude ?? '-80.1918')

    const startDate = new Date(ev.dates.start.localDate + (ev.dates.start.localTime ? `T${ev.dates.start.localTime}` : 'T19:00:00'))
    const endDate = ev.dates.end?.localDate ? new Date(ev.dates.end.localDate) : null

    const segmentName = ev.classifications?.[0]?.segment?.name ?? 'Miscellaneous'
    const categorySlug = TM_CATEGORY_MAP[segmentName] ?? 'community'
    const regionSlug = detectRegionFromCity(city)

    const priceMin = ev.priceRanges?.[0]?.min ?? null
    const priceMax = ev.priceRanges?.[0]?.max ?? null
    const priceRange = priceMin !== null
      ? priceMin === 0 ? 'Free' : priceMax && priceMax !== priceMin
        ? `$${priceMin} – $${priceMax}`
        : `$${priceMin}`
      : null

    const bestImage = ev.images
      ?.sort((a, b) => (b.width * b.height) - (a.width * a.height))?.[0]?.url ?? null

    const slug = ev.name.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').slice(0, 55)
      + '-' + ev.id.slice(-6)

    return {
      title: ev.name,
      description: `${ev.classifications?.[0]?.genre?.name ?? segmentName} event at ${venue?.name ?? city}, Florida.`,
      longDescription: null,
      venue: venue?.name ?? city,
      address,
      latitude: isNaN(lat) ? 25.7617 : lat,
      longitude: isNaN(lng) ? -80.1918 : lng,
      startDate,
      endDate,
      price: priceMin,
      priceRange,
      imageUrl: bestImage,
      website: ev.url,
      categorySlug,
      regionSlug,
      slug,
      source: 'ticketmaster.com',
    }
  } catch {
    return null
  }
}
