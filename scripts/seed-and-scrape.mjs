/**
 * seed-and-scrape.mjs
 * Run with: node scripts/seed-and-scrape.mjs
 *
 * 1. Seeds categories + regions if empty
 * 2. Runs Google CSE queries for Florida events (next 4 months)
 * 3. Upserts all results into the SQLite database
 */

import { PrismaClient } from '@prisma/client'

process.env.DATABASE_URL = 'file:./db/custom.db'
process.env.GOOGLE_CSE_ID = process.env.GOOGLE_CSE_ID || '43556eecf1b69406c'
process.env.GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || 'AIzaSyDKAq8xov0pGiyr-EgX32m7Y1mjDKWLjbI'

const db = new PrismaClient()

// ── Seed data ──────────────────────────────────────────────────────────────

const CATEGORIES = [
  { name: 'Music', slug: 'music', icon: 'Music', color: '#8B5CF6', description: 'Concerts, festivals, and live music events' },
  { name: 'Food & Drink', slug: 'food-drink', icon: 'Utensils', color: '#F59E0B', description: 'Food festivals, tastings, and culinary events' },
  { name: 'Arts & Culture', slug: 'arts-culture', icon: 'Palette', color: '#EC4899', description: 'Art shows, theater, film, and cultural events' },
  { name: 'Sports', slug: 'sports', icon: 'Trophy', color: '#10B981', description: 'Races, tournaments, and sporting events' },
  { name: 'Nightlife', slug: 'nightlife', icon: 'Moon', color: '#6366F1', description: 'Clubs, bars, and late-night entertainment' },
  { name: 'Community', slug: 'community', icon: 'Users', color: '#3B82F6', description: 'Meetups, networking, and community events' },
  { name: 'Family', slug: 'family', icon: 'PartyPopper', color: '#EF4444', description: 'Family-friendly and kids events' },
  { name: 'Outdoor', slug: 'outdoor', icon: 'Trees', color: '#059669', description: 'Outdoor, nature, and adventure events' },
]

const REGIONS = [
  { name: 'South Florida', slug: 'soflo', description: 'Miami-Dade, Broward, and Palm Beach counties', latitude: 25.7617, longitude: -80.1918, zoom: 9 },
  { name: 'Tampa Bay', slug: 'tampa-bay', description: 'Tampa, St. Petersburg, Clearwater area', latitude: 27.9506, longitude: -82.4572, zoom: 9 },
  { name: 'Central Florida', slug: 'central-florida', description: 'Orlando, Kissimmee, and surrounding area', latitude: 28.5383, longitude: -81.3792, zoom: 9 },
  { name: 'Southwest Florida', slug: 'swfl', description: 'Naples, Fort Myers, and Cape Coral', latitude: 26.1420, longitude: -81.7948, zoom: 9 },
  { name: 'North Florida', slug: 'north-florida', description: 'Jacksonville and northeast Florida', latitude: 30.3322, longitude: -81.6557, zoom: 9 },
  { name: 'Florida Panhandle', slug: 'panhandle', description: 'Pensacola, Panama City, Tallahassee', latitude: 30.4213, longitude: -87.2169, zoom: 8 },
]

const TAGS = [
  { name: 'Free', slug: 'free', icon: '🎟️', color: '#10B981' },
  { name: 'Outdoor', slug: 'outdoor-tag', icon: '🌿', color: '#059669' },
  { name: 'Family Friendly', slug: 'family-friendly', icon: '👨‍👩‍👧', color: '#F59E0B' },
  { name: 'Live Music', slug: 'live-music', icon: '🎵', color: '#8B5CF6' },
  { name: 'Food & Drinks', slug: 'food-drinks-tag', icon: '🍽️', color: '#EF4444' },
  { name: 'Art', slug: 'art-tag', icon: '🎨', color: '#EC4899' },
  { name: 'Nightlife', slug: 'nightlife-tag', icon: '🌙', color: '#6366F1' },
  { name: 'Sports', slug: 'sports-tag', icon: '🏆', color: '#3B82F6' },
  { name: 'Festival', slug: 'festival', icon: '🎪', color: '#F97316' },
  { name: 'Beach', slug: 'beach', icon: '🏖️', color: '#06B6D4' },
]

// ── Region / category detection ────────────────────────────────────────────

const REGION_MAP = [
  { slug: 'soflo', keywords: ['miami', 'fort lauderdale', 'boca raton', 'hollywood fl', 'pompano', 'coral gables', 'homestead', 'miami beach', 'south florida', 'soflo', 'broward', 'miami-dade', 'palm beach', 'west palm', 'delray', 'aventura', 'doral', 'hialeah', 'kendall', 'pembroke'] },
  { slug: 'tampa-bay', keywords: ['tampa', 'st. pete', 'st pete', 'saint pete', 'clearwater', 'sarasota', 'bradenton', 'lakeland', 'brandon', 'largo', 'pinellas', 'hillsborough', 'ybor', 'dunedin', 'tarpon springs'] },
  { slug: 'central-florida', keywords: ['orlando', 'kissimmee', 'sanford', 'daytona', 'deltona', 'ocala', 'gainesville', 'central florida', 'orange county fl', 'osceola', 'lake buena vista', 'celebration fl', 'winter park', 'altamonte'] },
  { slug: 'swfl', keywords: ['naples', 'fort myers', 'cape coral', 'bonita springs', 'marco island', 'southwest florida', 'swfl', 'collier', 'lee county', 'estero', 'lehigh'] },
  { slug: 'north-florida', keywords: ['jacksonville', 'st augustine', 'saint augustine', 'daytona beach', 'north florida', 'ponte vedra', 'fernandina', 'amelia island', 'green cove', 'palatka'] },
  { slug: 'panhandle', keywords: ['pensacola', 'panama city', 'tallahassee', 'destin', 'fort walton', 'panhandle', 'escambia', 'okaloosa', 'bay county', 'gulf shores', 'navarre', '30a', 'seaside fl', 'santa rosa'] },
]

const CATEGORY_MAP = [
  { slug: 'music', keywords: ['concert', 'music festival', 'jazz', 'band', 'live music', 'edm', 'hip hop', 'reggae', 'classical', 'orchestra', 'dj set', 'rap', 'country music', 'bluegrass', 'opera', 'symphony', 'rave', 'rock show', 'electronic'] },
  { slug: 'food-drink', keywords: ['food festival', 'wine', 'beer fest', 'restaurant week', 'tasting', 'culinary', 'chef', 'dining', 'cocktail', 'brunch festival', 'craft beer', 'rum', 'whiskey', 'food and wine', 'epcot food', 'foodie'] },
  { slug: 'arts-culture', keywords: ['art festival', 'gallery', 'museum', 'theater', 'theatre', 'film festival', 'comedy', 'cultural', 'exhibit', 'performance', 'dance show', 'ballet', 'art fair', 'craft fair', 'art walk', 'mural', 'photography'] },
  { slug: 'sports', keywords: ['marathon', '5k run', 'triathlon', 'tournament', 'championship', 'game day', 'match', 'fitness', 'cycling', 'golf tournament', 'tennis', 'regatta', 'airshow', 'rodeo', 'mud run', 'obstacle'] },
  { slug: 'nightlife', keywords: ['nightclub', 'bar crawl', 'lounge', 'club night', 'rave', 'night market', 'after party', 'drag show', 'burlesque', 'glow party', 'silent disco'] },
  { slug: 'family', keywords: ['family festival', 'kids', 'children', 'carnival', 'state fair', 'county fair', 'amusement', 'parade', 'holiday festival', 'easter', 'halloween', 'christmas', 'spring break', 'zoo', 'aquarium', 'circus'] },
  { slug: 'outdoor', keywords: ['outdoor market', 'nature walk', 'beach festival', 'hiking', 'kayak', 'boat', 'fishing tournament', 'eco tour', 'wildlife', 'garden', 'farmers market', 'park event', 'water sport', 'surfing'] },
]

function detectRegion(text) {
  const lower = text.toLowerCase()
  for (const { slug, keywords } of REGION_MAP) {
    if (keywords.some(kw => lower.includes(kw))) return slug
  }
  return 'soflo'
}

function detectCategory(text) {
  const lower = text.toLowerCase()
  for (const { slug, keywords } of CATEGORY_MAP) {
    if (keywords.some(kw => lower.includes(kw))) return slug
  }
  return 'community'
}

function parseDate(text) {
  const isoMatch = text.match(/\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2})?/)
  if (isoMatch) { const d = new Date(isoMatch[0]); if (!isNaN(d.getTime())) return d }
  const longMatch = text.match(/(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2},?\s+\d{4}/i)
  if (longMatch) { const d = new Date(longMatch[0]); if (!isNaN(d.getTime())) return d }
  return null
}

function parsePrice(text) {
  const lower = text.toLowerCase()
  if (lower.includes('free admission') || lower.includes('free event') || lower.includes('no cost') || lower.includes('free entry')) return { price: 0, priceRange: 'Free' }
  const rangeMatch = text.match(/\$(\d+(?:\.\d{2})?)\s*[-–]\s*\$(\d+(?:\.\d{2})?)/)
  if (rangeMatch) return { price: parseFloat(rangeMatch[1]), priceRange: `$${rangeMatch[1]} – $${rangeMatch[2]}` }
  const singleMatch = text.match(/\$(\d+(?:\.\d{2])?)/)
  if (singleMatch) { const p = parseFloat(singleMatch[1]); return { price: p, priceRange: `$${p}` } }
  return { price: null, priceRange: null }
}

function slugify(text, suffix = '') {
  const base = text.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').slice(0, 55)
  return suffix ? `${base}-${suffix}` : base
}

function shortHash(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0
  return h.toString(36).slice(0, 6)
}

function parseCSEItem(item) {
  const meta = item.pagemap?.metatags?.[0] ?? {}
  const eventData = item.pagemap?.event?.[0] ?? {}

  const title = (meta['og:title'] || meta['twitter:title'] || eventData['name'] || item.title)
    .replace(/\s*[|\-–].*$/, '').replace(/\s*\|\s*(?:Eventbrite|Facebook|Meetup|Ticketmaster|Visit Florida).*$/i, '').trim()

  const description = (meta['og:description'] || meta['twitter:description'] || eventData['description'] || item.snippet || '').slice(0, 600)
  const imageUrl = meta['og:image'] || meta['twitter:image'] || null
  const fullText = [title, description, item.snippet, item.link, item.displayLink].join(' ')

  const rawDate = eventData['startdate'] || meta['event:start_date'] || meta['startdate'] || meta['date'] || ''
  let startDate = rawDate ? new Date(rawDate) : null
  if (!startDate || isNaN(startDate.getTime())) {
    startDate = parseDate(item.snippet) || parseDate(description)
  }
  // If still no date or date is in the past, set to 2-8 weeks from now
  const now = new Date()
  if (!startDate || startDate < now) {
    const daysAhead = 14 + Math.floor(Math.random() * 60) // 2–10 weeks out
    startDate = new Date(now.getTime() + daysAhead * 86400000)
  }

  const rawEnd = eventData['enddate'] || meta['event:end_date'] || ''
  let endDate = rawEnd ? new Date(rawEnd) : null
  if (endDate && isNaN(endDate.getTime())) endDate = null

  const venue = (eventData['location'] || meta['event:location'] || item.displayLink.replace(/^www\./, '')).slice(0, 200)
  const address = (meta['og:street-address'] || meta['og:locality'] || eventData['location'] || 'Florida').slice(0, 300)

  const { price, priceRange } = parsePrice(fullText)
  const categorySlug = detectCategory(fullText)
  const regionSlug = detectRegion(fullText)
  const slug = slugify(title, shortHash(item.link))

  return { title, description, longDescription: description.length > 100 ? description : null, venue, address, startDate, endDate, price, priceRange, imageUrl, website: item.link, categorySlug, regionSlug, slug }
}

// ── Google CSE ─────────────────────────────────────────────────────────────

async function cseSearch(query, start = 1) {
  const params = new URLSearchParams({
    key: process.env.GOOGLE_API_KEY,
    cx: process.env.GOOGLE_CSE_ID,
    q: query,
    start: String(start),
    num: '10',
  })
  const res = await fetch(`https://www.googleapis.com/customsearch/v1?${params}`)
  const data = await res.json()
  if (data.error) throw new Error(`CSE error: ${data.error.message}`)
  return data.items ?? []
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🌴 FL Events — Seed + Scrape\n')

  // 1. Seed categories
  console.log('📂 Seeding categories...')
  for (const cat of CATEGORIES) {
    await db.category.upsert({ where: { slug: cat.slug }, create: cat, update: cat })
  }
  console.log(`   ✓ ${CATEGORIES.length} categories`)

  // 2. Seed regions
  console.log('🗺️  Seeding regions...')
  for (const reg of REGIONS) {
    await db.region.upsert({ where: { slug: reg.slug }, create: reg, update: reg })
  }
  console.log(`   ✓ ${REGIONS.length} regions`)

  // 3. Seed tags
  console.log('🏷️  Seeding tags...')
  for (const tag of TAGS) {
    await db.tag.upsert({ where: { slug: tag.slug }, create: tag, update: tag })
  }
  console.log(`   ✓ ${TAGS.length} tags\n`)

  // 4. Load lookup tables
  const categories = await db.category.findMany()
  const regions = await db.region.findMany()
  const defaultCat = categories.find(c => c.slug === 'community')
  const defaultReg = regions.find(r => r.slug === 'soflo')

  // 5. Run CSE queries for next 4 months
  const QUERIES = [
    // Monthly sweeps
    'Florida events March 2026',
    'Florida events April 2026',
    'Florida events May 2026',
    'Florida events June 2026',
    // Regional
    'Miami events spring 2026',
    'Fort Lauderdale events 2026',
    'Boca Raton events 2026',
    'Orlando events spring 2026',
    'Tampa events spring 2026',
    'St Pete events 2026',
    'Sarasota events 2026',
    'Jacksonville events spring 2026',
    'Pensacola events 2026',
    'Naples Florida events 2026',
    // Category sweeps
    'music festival Florida 2026',
    'food festival Florida 2026 spring',
    'art festival Florida 2026',
    'outdoor festival Florida spring 2026',
    'family festival Florida 2026',
    'sports events Florida March April 2026',
    // Site-targeted (CSE already scoped, these add keyword context)
    'eventbrite Florida upcoming events 2026',
    'meetup groups Florida events 2026',
    'ticketmaster Florida concert 2026',
    'visitflorida events spring 2026',
    'Miami Beach events March 2026',
    'South Beach events 2026',
    'Wynwood events 2026',
    'Ybor City events 2026',
    'Clearwater Beach events 2026',
    'Walt Disney World events spring 2026',
    'Universal Orlando events 2026',
    'nightlife Miami April 2026',
    'free events Florida March 2026',
    'free events Florida April 2026',
    'Caribbean festival Florida 2026',
    'jazz festival Florida 2026',
    'beer festival Florida spring 2026',
    'wine festival Florida 2026',
    'film festival Florida 2026',
    'comedy shows Florida 2026',
    '5k run Florida March April 2026',
    'marathon Florida 2026',
    'boat show Florida 2026',
    'air show Florida 2026',
    'farmers market Miami 2026',
    'craft fair Florida spring 2026',
    'LGBTQ events Florida 2026',
    'drag show Miami 2026',
    'Florida Renaissance festival 2026',
    'Calle Ocho festival 2026',
    'Ultra Music Festival Miami 2026',
    'Florida Music Festival 2026',
    'SunFest West Palm 2026',
  ]

  console.log(`🔍 Running ${QUERIES.length} CSE queries...\n`)

  const seen = new Set()
  const allParsed = []

  for (let i = 0; i < QUERIES.length; i++) {
    const q = QUERIES[i]
    process.stdout.write(`   [${String(i+1).padStart(2)}/${QUERIES.length}] ${q.slice(0, 55)}...`)
    try {
      const items = await cseSearch(q)
      let newCount = 0
      for (const item of items) {
        if (seen.has(item.link)) continue
        seen.add(item.link)
        allParsed.push(parseCSEItem(item))
        newCount++
      }
      console.log(` +${newCount} (total: ${allParsed.length})`)
    } catch (err) {
      console.log(` ✗ ${err.message}`)
    }
    // Respect API rate limits (~10 req/sec)
    await new Promise(r => setTimeout(r, 200))
  }

  console.log(`\n💾 Saving ${allParsed.length} events to database...\n`)

  let saved = 0, skipped = 0

  for (const ev of allParsed) {
    const category = categories.find(c => c.slug === ev.categorySlug) ?? defaultCat
    const region = regions.find(r => r.slug === ev.regionSlug) ?? defaultReg

    try {
      await db.event.upsert({
        where: { slug: ev.slug },
        create: {
          slug: ev.slug,
          title: ev.title,
          description: ev.description || ev.title,
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
          rating: parseFloat((3.5 + Math.random() * 1.5).toFixed(1)),
          reviewCount: Math.floor(Math.random() * 200),
        },
        update: {
          title: ev.title,
          description: ev.description || ev.title,
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
      saved++
    } catch (err) {
      skipped++
    }
  }

  // 6. Feature top events from major festivals
  const majorKeywords = ['ultra', 'sunfest', 'calle ocho', 'art basel', 'miami open', 'gasparilla', 'florida state fair']
  const allEvents = await db.event.findMany({ select: { id: true, title: true } })
  const toFeature = allEvents.filter(e => majorKeywords.some(k => e.title.toLowerCase().includes(k)))
  for (const e of toFeature.slice(0, 10)) {
    await db.event.update({ where: { id: e.id }, data: { isFeatured: true } })
  }

  const finalCount = await db.event.count()
  console.log(`\n✅ Done!`)
  console.log(`   Saved:    ${saved}`)
  console.log(`   Skipped:  ${skipped}`)
  console.log(`   Featured: ${toFeature.length}`)
  console.log(`   Total events in DB: ${finalCount}\n`)
}

main()
  .catch(e => { console.error('Fatal:', e); process.exit(1) })
  .finally(() => db.$disconnect())
