#!/usr/bin/env bun
/**
 * Ticketmaster Event Scraper for FLA-events
 * Fetches upcoming events in Florida and populates the database
 * 
 * Usage:
 *   bun run scripts/scrape-events.ts
 *   bun run scripts/scrape-events.ts --limit=100
 *   DATABASE_URL="postgresql://..." bun run scripts/scrape-events.ts
 */

import { PrismaClient, SponsorTier } from '@prisma/client';

const prisma = new PrismaClient();

// Ticketmaster API configuration
const TM_API_KEY = process.env.TICKETMASTER_API_KEY || '7elxdku9GGG5k8j0Xm8KWdANDgvqqne4'; // Public demo key
const TM_API_URL = 'https://app.ticketmaster.com/discovery/v2/events.json';

// Florida state code
const STATE_CODE = 'FL';

interface TicketmasterEvent {
  id: string;
  name: string;
  dates: {
    start: {
      localDate: string;
      localTime?: string;
    };
    end?: {
      localDate: string;
    };
  };
  classifications?: Array<{
    segment?: { name: string };
    genre?: { name: string };
  }>;
  priceRanges?: Array<{
    min: number;
    max: number;
  }>;
  images?: Array<{
    url: string;
    width: number;
    height: number;
  }>;
  _embedded?: {
    venues?: Array<{
      name: string;
      address?: { line1?: string };
      city?: { name: string };
      state?: { stateCode: string };
      location?: {
        latitude: string;
        longitude: string;
      };
    }>;
  };
  url?: string;
  info?: string;
}

// Helper: Generate URL-safe slug
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .trim();
}

// Helper: Ensure categories exist
async function ensureCategories() {
  const categories = [
    { name: 'Music', icon: '🎵', color: '#8B5CF6' },
    { name: 'Sports', icon: '⚽', color: '#10B981' },
    { name: 'Arts & Theatre', icon: '🎭', color: '#F59E0B' },
    { name: 'Family', icon: '👨‍👩‍👧‍👦', color: '#3B82F6' },
    { name: 'Film', icon: '🎬', color: '#EF4444' },
    { name: 'Festivals', icon: '🎉', color: '#EC4899' },
    { name: 'Other', icon: '📅', color: '#6B7280' },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: slugify(cat.name) },
      update: {},
      create: {
        name: cat.name,
        slug: slugify(cat.name),
        icon: cat.icon,
        color: cat.color,
        description: `${cat.name} events in Florida`,
      },
    });
  }
}

// Helper: Ensure regions exist
async function ensureRegions() {
  const regions = [
    { name: 'Miami', latitude: 25.7617, longitude: -80.1918, zoom: 10 },
    { name: 'Tampa', latitude: 27.9506, longitude: -82.4572, zoom: 10 },
    { name: 'Orlando', latitude: 28.5383, longitude: -81.3792, zoom: 10 },
    { name: 'Jacksonville', latitude: 30.3322, longitude: -81.6557, zoom: 10 },
    { name: 'Fort Lauderdale', latitude: 26.1224, longitude: -80.1373, zoom: 10 },
    { name: 'St. Petersburg', latitude: 27.7676, longitude: -82.6403, zoom: 10 },
    { name: 'Other Florida', latitude: 27.6648, longitude: -81.5158, zoom: 6 },
  ];

  for (const region of regions) {
    await prisma.region.upsert({
      where: { slug: slugify(region.name) },
      update: {},
      create: {
        name: region.name,
        slug: slugify(region.name),
        latitude: region.latitude,
        longitude: region.longitude,
        zoom: region.zoom,
        description: `Events in ${region.name}, Florida`,
      },
    });
  }
}

async function fetchTicketmasterEvents(page = 0, size = 200): Promise<TicketmasterEvent[]> {
  const params = new URLSearchParams({
    apikey: TM_API_KEY,
    stateCode: STATE_CODE,
    size: size.toString(),
    page: page.toString(),
    sort: 'date,asc',
  });

  const url = `${TM_API_URL}?${params}`;
  console.log(`   Fetching page ${page} from Ticketmaster...`);

  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`   ❌ Ticketmaster API error: ${response.status}`);
      return [];
    }

    const data = await response.json();
    return data._embedded?.events || [];
  } catch (error) {
    console.error(`   ❌ Network error:`, error);
    return [];
  }
}

// Find closest region based on city name
function findRegionId(cityName: string, regions: any[]): string {
  const city = cityName?.toLowerCase() || '';
  
  if (city.includes('miami')) return regions.find(r => r.name === 'Miami')!.id;
  if (city.includes('tampa')) return regions.find(r => r.name === 'Tampa')!.id;
  if (city.includes('orlando')) return regions.find(r => r.name === 'Orlando')!.id;
  if (city.includes('jacksonville')) return regions.find(r => r.name === 'Jacksonville')!.id;
  if (city.includes('fort lauderdale') || city.includes('lauderdale')) return regions.find(r => r.name === 'Fort Lauderdale')!.id;
  if (city.includes('petersburg') || city.includes('st pete')) return regions.find(r => r.name === 'St. Petersburg')!.id;
  
  return regions.find(r => r.name === 'Other Florida')!.id;
}

async function transformAndSaveEvent(tmEvent: TicketmasterEvent, categories: any[], regions: any[]) {
  try {
    const venue = tmEvent._embedded?.venues?.[0];
    const classification = tmEvent.classifications?.[0];
    const priceRange = tmEvent.priceRanges?.[0];
    const image = tmEvent.images?.sort((a, b) => b.width - a.width)[0];

    // Parse date and time
    const dateStr = tmEvent.dates.start.localDate;
    const timeStr = tmEvent.dates.start.localTime || '19:00:00';
    const startDate = new Date(`${dateStr}T${timeStr}`);
    
    const endDateStr = tmEvent.dates.end?.localDate;
    const endDate = endDateStr ? new Date(`${endDateStr}T23:59:59`) : null;

    // Skip past events
    if (startDate < new Date()) {
      return null;
    }

    // Map category
    const categoryName = classification?.segment?.name || 'Other';
    const categorySlug = slugify(categoryName);
    let category = categories.find(c => c.slug === categorySlug);
    if (!category) {
      category = categories.find(c => c.name === 'Other');
    }

    // Map region
    const cityName = venue?.city?.name || 'Florida';
    const regionId = findRegionId(cityName, regions);

    // Generate unique slug
    const baseSlug = slugify(tmEvent.name);
    const dateSlug = dateStr.replace(/\-/g, '');
    const slug = `${baseSlug}-${dateSlug}-${tmEvent.id.slice(0, 6)}`.slice(0, 100);

    const eventData = {
      title: tmEvent.name.slice(0, 200),
      slug,
      description: tmEvent.info?.slice(0, 500) || `${categoryName} event in ${cityName}`,
      longDescription: tmEvent.info || null,
      venue: venue?.name || 'To Be Announced',
      address: venue?.address?.line1 || `${cityName}, FL`,
      latitude: venue?.location?.latitude ? parseFloat(venue.location.latitude) : 27.6648,
      longitude: venue?.location?.longitude ? parseFloat(venue.location.longitude) : -81.5158,
      startDate,
      endDate,
      price: priceRange?.min || null,
      priceRange: priceRange ? `$${priceRange.min} - $${priceRange.max}` : null,
      imageUrl: image?.url || null,
      website: tmEvent.url || null,
      phone: null,
      rating: 0,
      reviewCount: 0,
      viewCount: 0,
      isFeatured: false,
      isActive: true,
      categoryId: category!.id,
      regionId,
    };

    // Upsert event (avoid duplicates based on slug)
    const event = await prisma.event.upsert({
      where: { slug },
      update: eventData,
      create: eventData,
    });

    return event;
  } catch (error) {
    console.error(`   ⚠️  Error saving event "${tmEvent.name}":`, error);
    return null;
  }
}

async function main() {
  console.log('\n🎫 Ticketmaster Event Scraper for Florida\n');
  console.log('━'.repeat(60));

  const args = process.argv.slice(2);
  const limitArg = args.find(arg => arg.startsWith('--limit='));
  const maxEvents = limitArg ? parseInt(limitArg.split('=')[1]) : 1000;

  let totalSaved = 0;
  let totalFetched = 0;
  let page = 0;
  const pageSize = 200;

  try {
    // Step 1: Ensure categories and regions exist
    console.log('\n1️⃣  Setting up categories and regions...');
    await ensureCategories();
    await ensureRegions();
    console.log('   ✅ Database ready\n');

    // Step 2: Fetch all categories and regions
    const categories = await prisma.category.findMany();
    const regions = await prisma.region.findMany();

    // Step 3: Scrape events
    console.log('2️⃣  Fetching events from Ticketmaster...\n');
    
    while (totalFetched < maxEvents) {
      const events = await fetchTicketmasterEvents(page, pageSize);
      
      if (events.length === 0) {
        console.log('\n   ✅ No more events available.\n');
        break;
      }

      totalFetched += events.length;
      console.log(`   📦 Found ${events.length} events (page ${page})`);

      // Process events
      const savePromises = events.map(event => transformAndSaveEvent(event, categories, regions));
      const results = await Promise.all(savePromises);
      const savedCount = results.filter(r => r !== null).length;
      totalSaved += savedCount;

      console.log(`   💾 Saved ${savedCount} events\n`);

      // Check if we've reached the limit or last page
      if (events.length < pageSize || totalFetched >= maxEvents) {
        break;
      }

      page++;
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('━'.repeat(60));
    console.log('\n🎉 SCRAPING COMPLETE!\n');
    console.log(`   Total events fetched:  ${totalFetched}`);
    console.log(`   Total events saved:    ${totalSaved}`);
    console.log(`   Database:              ${process.env.DATABASE_URL?.split('@')[1]?.split('/')[0] || 'local'}`);
    console.log('\n━'.repeat(60) + '\n');

  } catch (error) {
    console.error('\n❌ SCRAPING FAILED:\n', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
