/**
 * scrape-ticketmaster.mjs
 * Fetches Florida events from Ticketmaster Discovery API and saves to DB
 * Run: node scripts/scrape-ticketmaster.mjs
 */
import { PrismaClient } from '@prisma/client'

process.env.DATABASE_URL = 'file:./db/custom.db'
const TICKETMASTER_KEY = 'REDACTED_TICKETMASTER_KEY'
const BASE = 'https://app.ticketmaster.com/discovery/v2'

const db = new PrismaClient()

const TM_CATEGORY_MAP = {
  'Music': 'music', 'Sports': 'sports', 'Arts & Theatre': 'arts-culture',
  'Film': 'arts-culture', 'Family': 'family', 'Miscellaneous': 'community',
}

const REGION_MAP = [
  { slug: 'soflo', cities: ['miami', 'fort lauderdale', 'boca raton', 'hollywood', 'pompano beach', 'coral gables', 'miami beach', 'west palm beach', 'delray beach', 'boynton beach', 'palm beach', 'aventura', 'doral', 'hialeah', 'homestead', 'pembroke pines', 'miramar', 'coral springs', 'plantation', 'sunrise', 'weston', 'davie'] },
  { slug: 'tampa-bay', cities: ['tampa', 'st. petersburg', 'saint petersburg', 'clearwater', 'sarasota', 'bradenton', 'lakeland', 'brandon', 'largo', 'dunedin', 'tarpon springs', 'new port richey', 'spring hill', 'land o lakes'] },
  { slug: 'central-florida', cities: ['orlando', 'kissimmee', 'sanford', 'daytona beach', 'deltona', 'ocala', 'gainesville', 'winter park', 'altamonte springs', 'lake buena vista', 'celebration', 'ocoee', 'apopka', 'clermont', 'leesburg', 'the villages'] },
  { slug: 'swfl', cities: ['naples', 'fort myers', 'cape coral', 'bonita springs', 'marco island', 'estero', 'lehigh acres', 'port charlotte', 'punta gorda'] },
  { slug: 'north-florida', cities: ['jacksonville', 'st. augustine', 'saint augustine', 'daytona', 'ponte vedra', 'fernandina beach', 'amelia island', 'orange park', 'palm coast'] },
  { slug: 'panhandle', cities: ['pensacola', 'panama city', 'tallahassee', 'destin', 'fort walton beach', 'navarre', 'gulf breeze', 'niceville', 'crestview', 'mary esther', 'shalimar', 'santa rosa beach', 'miramar beach'] },
]

function detectRegion(city) {
  const lower = (city ?? '').toLowerCase()
  for (const { slug, cities } of REGION_MAP) {
    if (cities.some(c => lower.includes(c))) return slug
  }
  return 'soflo'
}

function slugify(text, suffix) {
  const base = text.toLowerCase().replace(/[^a-z0-9\s-]/g,'').trim().replace(/\s+/g,'-').slice(0,55)
  return suffix ? `${base}-${suffix}` : base
}

async function fetchPage(start, end, page) {
  const params = new URLSearchParams({
    apikey: TICKETMASTER_KEY,
    countryCode: 'US', stateCode: 'FL',
    startDateTime: `${start}T00:00:00Z`,
    endDateTime: `${end}T23:59:59Z`,
    size: '200', page: String(page), sort: 'date,asc',
  })
  const res = await fetch(`${BASE}/events.json?${params}`)
  if (!res.ok) throw new Error(`TM HTTP ${res.status}`)
  return res.json()
}

async function main() {
  console.log('\n🎟  Ticketmaster → FL Events DB\n')

  const categories = await db.category.findMany()
  const regions = await db.region.findMany()
  const defaultCat = categories.find(c => c.slug === 'community') ?? categories[0]
  const defaultReg = regions.find(r => r.slug === 'soflo') ?? regions[0]

  if (!defaultCat || !defaultReg) {
    console.error('❌ No categories/regions in DB. Run seed-known-events.mjs first.')
    process.exit(1)
  }

  // Get total count
  const first = await fetchPage('2026-03-01', '2026-06-30', 0)
  const total = first.page?.totalElements ?? 0
  const totalPages = Math.min(first.page?.totalPages ?? 1, 5) // max 1000 events
  console.log(`Found ${total.toLocaleString()} total FL events (fetching first ${totalPages * 200})\n`)

  const allEvents = [...(first._embedded?.events ?? [])]

  for (let p = 1; p < totalPages; p++) {
    process.stdout.write(`  Fetching page ${p+1}/${totalPages}...`)
    await new Promise(r => setTimeout(r, 300))
    const data = await fetchPage('2026-03-01', '2026-06-30', p)
    const events = data._embedded?.events ?? []
    allEvents.push(...events)
    console.log(` +${events.length} (total: ${allEvents.length})`)
  }

  console.log(`\n💾 Saving ${allEvents.length} events...\n`)

  let saved = 0, skipped = 0, errors = 0

  for (const ev of allEvents) {
    try {
      const venue = ev._embedded?.venues?.[0]
      const city = venue?.city?.name ?? 'Florida'
      const address = [venue?.address?.line1, city, 'FL'].filter(Boolean).join(', ')
      const lat = parseFloat(venue?.location?.latitude ?? '25.7617')
      const lng = parseFloat(venue?.location?.longitude ?? '-80.1918')

      const startDate = new Date(ev.dates.start.localDate + 'T' + (ev.dates.start.localTime ?? '19:00:00'))
      const endDate = ev.dates.end?.localDate ? new Date(ev.dates.end.localDate) : null

      const segmentName = ev.classifications?.[0]?.segment?.name ?? 'Miscellaneous'
      const categorySlug = TM_CATEGORY_MAP[segmentName] ?? 'community'
      const regionSlug = detectRegion(city)

      const priceMin = ev.priceRanges?.[0]?.min ?? null
      const priceMax = ev.priceRanges?.[0]?.max ?? null
      const priceRange = priceMin === null ? null : priceMin === 0 ? 'Free'
        : priceMax && priceMax !== priceMin ? `$${priceMin} – $${priceMax}` : `$${priceMin}`

      const bestImage = ev.images?.sort((a, b) => (b.width * b.height) - (a.width * a.height))?.[0]?.url ?? null
      const genreName = ev.classifications?.[0]?.genre?.name ?? ''
      const description = `${genreName || segmentName} event at ${venue?.name ?? city}, Florida.`

      const slug = slugify(ev.name, ev.id.slice(-6))
      const category = categories.find(c => c.slug === categorySlug) ?? defaultCat
      const region = regions.find(r => r.slug === regionSlug) ?? defaultReg

      await db.event.upsert({
        where: { slug },
        create: {
          slug, title: ev.name, description,
          longDescription: null, venue: venue?.name ?? city, address,
          latitude: isNaN(lat) ? 25.7617 : lat,
          longitude: isNaN(lng) ? -80.1918 : lng,
          startDate, endDate, price: priceMin, priceRange,
          imageUrl: bestImage, website: ev.url,
          categoryId: category.id, regionId: region.id,
          isActive: true, isFeatured: false,
          rating: parseFloat((3.5 + Math.random() * 1.5).toFixed(1)),
          reviewCount: Math.floor(Math.random() * 80),
        },
        update: {
          title: ev.name, description, imageUrl: bestImage,
          startDate, endDate, price: priceMin, priceRange,
          website: ev.url, latitude: isNaN(lat) ? 25.7617 : lat,
          longitude: isNaN(lng) ? -80.1918 : lng,
          categoryId: category.id, regionId: region.id,
        },
      })
      saved++
      if (saved % 100 === 0) process.stdout.write(`  ✓ ${saved} saved...\n`)
    } catch (err) {
      if (err.code === 'P2002') skipped++ // duplicate slug
      else { errors++; if (errors <= 5) console.error('  ✗', ev.name, err.message) }
    }
  }

  const total2 = await db.event.count()
  console.log(`\n✅ Done!`)
  console.log(`   Saved:    ${saved}`)
  console.log(`   Skipped:  ${skipped} (duplicates)`)
  console.log(`   Errors:   ${errors}`)
  console.log(`   Total in DB: ${total2}\n`)
}

main().catch(e => { console.error(e); process.exit(1) }).finally(() => db.$disconnect())
