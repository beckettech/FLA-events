import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Ticketmaster API configuration
const TM_API_KEY = process.env.TICKETMASTER_API_KEY || '7elxdku9GGG5k8j0Xm8KWdANDgvqqne4';
const TM_API_URL = 'https://app.ticketmaster.com/discovery/v2/events.json';
const STATE_CODE = 'FL';

// Helper: Generate URL-safe slug
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .trim();
}

// Verify Vercel Cron secret (security)
function verifyAuth(req: NextRequest): boolean {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return false;
  }
  
  return true;
}

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

export async function GET(req: NextRequest) {
  console.log('🎫 Cron job triggered: scrape-events');
  
  // Verify authorization
  if (!verifyAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Setup
    await ensureCategories();
    await ensureRegions();
    
    const categories = await prisma.category.findMany();
    const regions = await prisma.region.findMany();

    // Fetch events from Ticketmaster
    // Add date range to get future events only
    const now = new Date();
    const sixMonthsLater = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000);

    const params = new URLSearchParams({
      apikey: TM_API_KEY,
      stateCode: STATE_CODE,
      size: '200',
      page: '0',
      sort: 'date,asc',
      startDateTime: now.toISOString().split('T')[0] + 'T00:00:00Z',
      endDateTime: sixMonthsLater.toISOString().split('T')[0] + 'T23:59:59Z',
    });

    const response = await fetch(`${TM_API_URL}?${params}`);
    if (!response.ok) {
      throw new Error(`Ticketmaster API error: ${response.status}`);
    }

    const data = await response.json();
    const events = data._embedded?.events || [];
    
    let saved = 0;

    for (const tmEvent of events) {
      try {
        const venue = tmEvent._embedded?.venues?.[0];
        const classification = tmEvent.classifications?.[0];
        const priceRange = tmEvent.priceRanges?.[0];
        const image = tmEvent.images?.sort((a: any, b: any) => b.width - a.width)[0];

        const dateStr = tmEvent.dates.start.localDate;
        const timeStr = tmEvent.dates.start.localTime || '19:00:00';
        // Parse date and time properly - Ticketmaster returns Eastern time
        // We need to parse it as local time, not UTC
        const [year, month, day] = dateStr.split('-').map(Number);
        const [hours, minutes, seconds] = timeStr.split(':').map(Number);
        const startDate = new Date(year, month - 1, day, hours, minutes, seconds);

        // Skip past events (compare with current time)
        const now = new Date();
        if (startDate < now) continue;

        const endDateStr = tmEvent.dates.end?.localDate;
        let endDate = null;
        if (endDateStr) {
          const [endYear, endMonth, endDay] = endDateStr.split('-').map(Number);
          endDate = new Date(endYear, endMonth - 1, endDay, 23, 59, 59);
        }

        const categoryName = classification?.segment?.name || 'Other';
        const categorySlug = slugify(categoryName);
        let category = categories.find(c => c.slug === categorySlug);
        if (!category) category = categories.find(c => c.name === 'Other');

        const cityName = venue?.city?.name || 'Florida';
        const regionId = findRegionId(cityName, regions);

        const baseSlug = slugify(tmEvent.name);
        const dateSlug = dateStr.replace(/\-/g, '');
        const slug = `${baseSlug}-${dateSlug}-${tmEvent.id.slice(0, 6)}`.slice(0, 100);

        await prisma.event.upsert({
          where: { slug },
          update: {
            title: tmEvent.name.slice(0, 200),
            description: tmEvent.info?.slice(0, 500) || `${categoryName} event in ${cityName}`,
            startDate,
            endDate,
            price: priceRange?.min || null,
            imageUrl: image?.url || null,
            isActive: true,
          },
          create: {
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
            categoryId: category!.id,
            regionId,
          },
        });

        saved++;
      } catch (err) {
        console.error('Error saving event:', err);
      }
    }

    console.log(`✅ Scraping complete: ${saved}/${events.length} events saved`);

    return NextResponse.json({
      success: true,
      fetched: events.length,
      saved,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('❌ Cron job failed:', error);
    return NextResponse.json({
      error: error.message,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
