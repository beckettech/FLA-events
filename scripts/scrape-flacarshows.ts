#!/usr/bin/env bun
/**
 * FLACarShows.com Event Scraper
 * 
 * Scrapes car show events from flacarshows.com for the next 3 months
 * and populates the FLA-events database.
 * 
 * Usage:
 *   bun run scripts/scrape-flacarshows.ts
 *   DATABASE_URL="postgresql://..." bun run scripts/scrape-flacarshows.ts
 */

import { PrismaClient } from '@prisma/client';
import * as cheerio from 'cheerio';

const prisma = new PrismaClient();

interface ScrapedEvent {
  name: string;
  startDate: Date;
  location: string;
  url: string;
}

const BASE_URL = 'https://flacarshows.com';
const MONTHS_TO_SCRAPE = 3;

/**
 * Generate URLs for next N months
 */
function getMonthUrls(monthsAhead: number): string[] {
  const urls: string[] = [];
  const now = new Date();
  
  for (let i = 0; i < monthsAhead; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    urls.push(`${BASE_URL}/events/event/on/${year}/${month}/`);
  }
  
  return urls;
}

/**
 * Fetch and parse events from a single month page
 */
async function scrapeMonthPage(url: string): Promise<ScrapedEvent[]> {
  console.log(`\n📄 Scraping: ${url}`);
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  const html = await response.text();
  const $ = cheerio.load(html);
  const events: ScrapedEvent[] = [];
  
  // Each event is in an <article> tag
  $('article').each((_, el) => {
    const $article = $(el);
    
    // Extract event data
    const timeEl = $article.find('time').first();
    const nameEl = $article.find('h1 a').first();
    const locationEl = $article.find('h2').first();
    
    const dateStr = timeEl.text().trim();
    const name = nameEl.text().trim();
    const location = locationEl.text().trim();
    const eventUrl = nameEl.attr('href') || '';
    
    if (!name || !dateStr || !location) {
      return; // Skip incomplete events
    }
    
    // Parse date (format: "March 1 2026 8:00 am")
    const startDate = new Date(dateStr);
    if (isNaN(startDate.getTime())) {
      console.warn(`⚠️  Invalid date: "${dateStr}" for event: ${name}`);
      return;
    }
    
    // Skip past events
    if (startDate < new Date()) {
      return;
    }
    
    events.push({
      name,
      startDate,
      location,
      url: eventUrl.startsWith('http') ? eventUrl : `${BASE_URL}${eventUrl}`,
    });
  });
  
  console.log(`   ✅ Found ${events.length} upcoming events`);
  return events;
}

/**
 * Create or get category for "Car Shows"
 */
async function ensureCategory() {
  return prisma.category.upsert({
    where: { slug: 'car-shows' },
    update: {},
    create: {
      name: 'Car Shows',
      slug: 'car-shows',
      color: '#FF6B35',
      description: 'Classic cars, car shows, and automotive events',
    },
  });
}

/**
 * Create or get region for Florida
 */
async function ensureRegion(location: string) {
  const slug = location.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  
  return prisma.region.upsert({
    where: { slug },
    update: {},
    create: {
      name: location,
      slug,
      state: 'FL',
      description: `Events in ${location}, Florida`,
    },
  });
}

/**
 * Save events to database
 */
async function saveEvents(events: ScrapedEvent[], category: any) {
  let savedCount = 0;
  let skippedCount = 0;
  
  for (const event of events) {
    const region = await ensureRegion(event.location);
    const slug = `${event.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${event.startDate.getTime()}`;
    
    try {
      await prisma.event.upsert({
        where: { slug },
        update: {
          name: event.name,
          startDate: event.startDate,
          endDate: event.startDate, // Single-day events
          description: `Car show event in ${event.location}, Florida`,
          url: event.url,
          location: event.location,
          categoryId: category.id,
          regionId: region.id,
        },
        create: {
          name: event.name,
          slug,
          startDate: event.startDate,
          endDate: event.startDate,
          description: `Car show event in ${event.location}, Florida`,
          url: event.url,
          location: event.location,
          categoryId: category.id,
          regionId: region.id,
          imageUrl: null,
          featured: false,
        },
      });
      savedCount++;
    } catch (error) {
      console.error(`❌ Failed to save event: ${event.name}`, error);
      skippedCount++;
    }
  }
  
  return { savedCount, skippedCount };
}

/**
 * Main scraper
 */
async function main() {
  console.log('\n🏎️  FLACarShows.com Event Scraper');
  console.log('━'.repeat(50));
  
  try {
    // Step 1: Setup
    console.log('\n1️⃣  Setting up categories and regions...');
    const category = await ensureCategory();
    console.log('   ✅ Category ready');
    
    // Step 2: Scrape all month pages
    console.log(`\n2️⃣  Scraping next ${MONTHS_TO_SCRAPE} months...`);
    const urls = getMonthUrls(MONTHS_TO_SCRAPE);
    
    let allEvents: ScrapedEvent[] = [];
    for (const url of urls) {
      const events = await scrapeMonthPage(url);
      allEvents = allEvents.concat(events);
      
      // Be nice to their server
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log(`\n   📊 Total events found: ${allEvents.length}`);
    
    // Step 3: Save to database
    console.log(`\n3️⃣  Saving events to database...`);
    const { savedCount, skippedCount } = await saveEvents(allEvents, category);
    
    // Summary
    console.log('\n━'.repeat(50));
    console.log('\n🎉 SCRAPING COMPLETE!\n');
    console.log(`   Total events found:    ${allEvents.length}`);
    console.log(`   Events saved:          ${savedCount}`);
    console.log(`   Events skipped:        ${skippedCount}`);
    console.log(`   Database:              ${process.env.DATABASE_URL?.includes('neon') ? 'Neon (production)' : 'SQLite (local)'}`);
    console.log('\n━'.repeat(50));
    
  } catch (error) {
    console.error('\n❌ Scraping failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
