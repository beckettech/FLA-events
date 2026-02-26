import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const categories = [
  { name: 'Music & Concerts', slug: 'music', icon: 'Music', color: '#E91E63', description: 'Live music, concerts, and festivals' },
  { name: 'Food & Drink', slug: 'food', icon: 'Utensils', color: '#FF5722', description: 'Food festivals, wine tastings, and culinary events' },
  { name: 'Arts & Culture', slug: 'arts', icon: 'Palette', color: '#9C27B0', description: 'Art galleries, theater, and cultural exhibitions' },
  { name: 'Sports & Fitness', slug: 'sports', icon: 'Trophy', color: '#4CAF50', description: 'Sports events, marathons, and fitness activities' },
  { name: 'Nightlife', slug: 'nightlife', icon: 'Moon', color: '#3F51B5', description: 'Clubs, bars, and evening entertainment' },
  { name: 'Family & Kids', slug: 'family', icon: 'Users', color: '#00BCD4', description: 'Family-friendly activities and kids events' },
  { name: 'Festivals', slug: 'festivals', icon: 'PartyPopper', color: '#FF9800', description: 'Seasonal festivals and celebrations' },
  { name: 'Car Shows', slug: 'car-show', icon: 'Car', color: '#E53935', description: 'Car shows, auto events, and vehicle exhibitions' },
]

// Florida Regions with coordinates and zoom levels
const regions = [
  { name: 'SoFlo', slug: 'soflo', description: 'South Florida - Miami, Fort Lauderdale, West Palm Beach', latitude: 25.7617, longitude: -80.1918, zoom: 9 },
  { name: 'Tampa Bay', slug: 'tampa-bay', description: 'Tampa Bay Area - Tampa, St. Petersburg, Clearwater, Sarasota', latitude: 27.9506, longitude: -82.4572, zoom: 9 },
  { name: 'Central Florida', slug: 'central-florida', description: 'Central Florida - Orlando, Daytona Beach, Space Coast', latitude: 28.5383, longitude: -81.3792, zoom: 8 },
  { name: 'SWFL', slug: 'swfl', description: 'Southwest Florida - Naples, Fort Myers, Cape Coral', latitude: 26.1420, longitude: -81.7940, zoom: 9 },
  { name: 'North Florida', slug: 'north-florida', description: 'North Florida - Jacksonville, Gainesville, St. Augustine', latitude: 30.3322, longitude: -81.6557, zoom: 8 },
  { name: 'Panhandle', slug: 'panhandle', description: 'Florida Panhandle - Pensacola, Tallahassee, Panama City', latitude: 30.4213, longitude: -86.6134, zoom: 8 },
]

// Tags for filtering events
const tags = [
  { name: 'Free Entry', slug: 'free', icon: '🆓', color: '#22C55E', description: 'No admission fee' },
  { name: 'Paid Entry', slug: 'paid', icon: '💰', color: '#F59E0B', description: 'Ticket required' },
  { name: 'Kid Friendly', slug: 'kid-friendly', icon: '👶', color: '#EC4899', description: 'Great for children' },
  { name: 'Dog Friendly', slug: 'dog-friendly', icon: '🐕', color: '#8B5CF6', description: 'Pets welcome' },
  { name: 'Outdoor', slug: 'outdoor', icon: '🌳', color: '#22C55E', description: 'Held outside' },
  { name: 'Indoor', slug: 'indoor', icon: '🏠', color: '#6366F1', description: 'Held inside' },
  { name: 'Restrooms', slug: 'restrooms', icon: '🚻', color: '#0EA5E9', description: 'Restrooms available' },
  { name: 'Food Available', slug: 'food-available', icon: '🍕', color: '#F97316', description: 'Food vendors on site' },
  { name: 'Parking', slug: 'parking', icon: '🅿️', color: '#64748B', description: 'Parking available' },
  { name: 'Wheelchair Access', slug: 'wheelchair-access', icon: '♿', color: '#3B82F6', description: 'Accessible venue' },
  { name: '21+', slug: '21-plus', icon: '🍺', color: '#DC2626', description: 'Adults only' },
  { name: 'Family Friendly', slug: 'family-friendly', icon: '👨‍👩‍👧‍👦', color: '#14B8A6', description: 'All ages welcome' },
  { name: 'Beach', slug: 'beach', icon: '🏖️', color: '#0EA5E9', description: 'Beach location' },
  { name: 'Water Activities', slug: 'water-activities', icon: '🏄', color: '#06B6D4', description: 'Water sports/activities' },
  { name: 'Live Music', slug: 'live-music', icon: '🎵', color: '#E91E63', description: 'Live performances' },
  { name: 'VIP Available', slug: 'vip', icon: '⭐', color: '#FBBF24', description: 'VIP packages' },
  { name: 'Overnight', slug: 'overnight', icon: '🌙', color: '#7C3AED', description: 'Multi-day or camping' },
  { name: 'Rain or Shine', slug: 'rain-or-shine', icon: '🌦️', color: '#6B7280', description: 'Weather proof event' },
]

// Events with coordinates, regions, and tags
const events = [
  // SoFlo Events
  {
    title: 'Miami Beach Jazz Festival',
    description: 'Annual jazz festival featuring world-renowned artists',
    longDescription: 'Experience the best of jazz music at the beautiful Miami Beach. This annual festival brings together legendary jazz artists and emerging talents.',
    venue: 'Miami Beach Bandshell',
    address: '7275 Collins Ave, Miami Beach, FL 33141',
    latitude: 25.8385,
    longitude: -80.1215,
    startDate: new Date('2025-02-14T18:00:00'),
    endDate: new Date('2025-02-16T23:00:00'),
    price: 85,
    priceRange: '$$',
    categorySlug: 'music',
    regionSlug: 'soflo',
    isFeatured: true,
    rating: 4.8,
    reviewCount: 234,
    tags: ['paid', 'outdoor', 'restrooms', 'food-available', 'parking', 'live-music'],
  },
  {
    title: 'Art Basel Miami Beach',
    description: 'Premier international art fair showcasing modern and contemporary art',
    longDescription: 'Art Basel Miami Beach is the premier international art show for modern and contemporary works.',
    venue: 'Miami Beach Convention Center',
    address: '1901 Convention Center Dr, Miami Beach, FL 33139',
    latitude: 25.7948,
    longitude: -80.1300,
    startDate: new Date('2025-12-05T12:00:00'),
    endDate: new Date('2025-12-08T20:00:00'),
    price: 65,
    priceRange: '$$',
    categorySlug: 'arts',
    regionSlug: 'soflo',
    isFeatured: true,
    rating: 4.9,
    reviewCount: 1892,
    tags: ['paid', 'indoor', 'restrooms', 'food-available', 'parking', 'wheelchair-access', 'vip'],
  },
  {
    title: 'South Beach Wine & Food Festival',
    description: 'Four-day culinary extravaganza with celebrity chefs',
    longDescription: 'The Food Network South Beach Wine & Food Festival is a national, star-studded, four-day destination event.',
    venue: 'Various Locations, South Beach',
    address: 'South Beach, Miami Beach, FL',
    latitude: 25.7825,
    longitude: -80.1340,
    startDate: new Date('2025-02-20T11:00:00'),
    endDate: new Date('2025-02-23T22:00:00'),
    price: 150,
    priceRange: '$$$',
    categorySlug: 'food',
    regionSlug: 'soflo',
    isFeatured: true,
    rating: 4.7,
    reviewCount: 876,
    tags: ['paid', 'outdoor', 'restrooms', 'food-available', '21-plus', 'vip'],
  },
  {
    title: 'Miami Ultra Music Festival',
    description: 'World\'s premier electronic music festival',
    longDescription: 'Ultra Music Festival is the world\'s premier electronic music festival held annually in downtown Miami.',
    venue: 'Bayfront Park',
    address: '301 Biscayne Blvd, Miami, FL 33132',
    latitude: 25.7751,
    longitude: -80.1853,
    startDate: new Date('2025-03-28T16:00:00'),
    endDate: new Date('2025-03-30T00:00:00'),
    price: 450,
    priceRange: '$$$',
    categorySlug: 'music',
    regionSlug: 'soflo',
    isFeatured: true,
    rating: 4.6,
    reviewCount: 5432,
    tags: ['paid', 'outdoor', 'restrooms', 'food-available', 'live-music', 'vip'],
  },
  {
    title: 'Calle Ocho Festival',
    description: 'World\'s largest Latin music festival',
    longDescription: 'Calle Ocho is the world\'s largest Latin music festival, taking over 23 blocks of Little Havana.',
    venue: 'Calle Ocho, Little Havana',
    address: 'SW 8th St, Miami, FL 33135',
    latitude: 25.7617,
    longitude: -80.2197,
    startDate: new Date('2025-03-09T11:00:00'),
    endDate: new Date('2025-03-16T21:00:00'),
    price: 0,
    priceRange: 'Free',
    categorySlug: 'festivals',
    regionSlug: 'soflo',
    rating: 4.6,
    reviewCount: 4231,
    tags: ['free', 'outdoor', 'restrooms', 'food-available', 'family-friendly', 'kid-friendly', 'live-music'],
  },
  {
    title: 'Fort Lauderdale International Boat Show',
    description: 'World\'s largest in-water boat show',
    longDescription: 'The Fort Lauderdale International Boat Show is the world\'s largest in-water boat show.',
    venue: 'Bahia Mar',
    address: '801 Seabreeze Blvd, Fort Lauderdale, FL 33316',
    latitude: 26.1150,
    longitude: -80.1036,
    startDate: new Date('2025-10-29T10:00:00'),
    endDate: new Date('2025-11-02T19:00:00'),
    price: 35,
    priceRange: '$',
    categorySlug: 'outdoor',
    regionSlug: 'soflo',
    rating: 4.5,
    reviewCount: 1234,
    tags: ['paid', 'outdoor', 'restrooms', 'food-available', 'parking', 'water-activities'],
  },
  {
    title: 'SunFest Music & Art Festival',
    description: 'Florida\'s largest waterfront music festival',
    longDescription: 'SunFest is Florida\'s largest waterfront music and art festival.',
    venue: 'Flagler Drive Waterfront',
    address: 'Flagler Dr, West Palm Beach, FL 33401',
    latitude: 26.7153,
    longitude: -80.0534,
    startDate: new Date('2025-04-30T17:00:00'),
    endDate: new Date('2025-05-04T23:00:00'),
    price: 55,
    priceRange: '$$',
    categorySlug: 'music',
    regionSlug: 'soflo',
    rating: 4.6,
    reviewCount: 2134,
    tags: ['paid', 'outdoor', 'restrooms', 'food-available', 'live-music', 'rain-or-shine'],
  },

  // Central Florida Events
  {
    title: 'Universal Orlando Mardi Gras',
    description: 'New Orleans-style celebration with parade and concerts',
    longDescription: 'Experience the biggest Mardi Gras celebration outside of New Orleans at Universal Studios Florida.',
    venue: 'Universal Studios Florida',
    address: '6000 Universal Blvd, Orlando, FL 32819',
    latitude: 28.4744,
    longitude: -81.4689,
    startDate: new Date('2025-02-01T17:00:00'),
    endDate: new Date('2025-04-20T22:00:00'),
    price: 119,
    priceRange: '$$',
    categorySlug: 'festivals',
    regionSlug: 'central-florida',
    isFeatured: true,
    rating: 4.6,
    reviewCount: 1543,
    tags: ['paid', 'indoor', 'outdoor', 'restrooms', 'food-available', 'family-friendly', 'kid-friendly', 'live-music'],
  },
  {
    title: 'Epcot International Food & Wine Festival',
    description: 'Global cuisine and entertainment at Epcot',
    longDescription: 'Savor the flavors of the world at the Epcot International Food & Wine Festival.',
    venue: 'Epcot World Showcase',
    address: '200 Epcot Center Dr, Orlando, FL 32821',
    latitude: 28.3762,
    longitude: -81.5494,
    startDate: new Date('2025-08-29T11:00:00'),
    endDate: new Date('2025-11-23T21:00:00'),
    price: 109,
    priceRange: '$$',
    categorySlug: 'food',
    regionSlug: 'central-florida',
    rating: 4.7,
    reviewCount: 4521,
    tags: ['paid', 'outdoor', 'restrooms', 'food-available', 'parking', 'wheelchair-access', 'family-friendly'],
  },
  {
    title: 'Disney World Mickey\'s Not-So-Scary Halloween Party',
    description: 'Family-friendly Halloween celebration at Magic Kingdom',
    longDescription: 'Dress up in your favorite costume and join Mickey and friends for a spooktacular celebration!',
    venue: 'Magic Kingdom Park',
    address: '1180 Seven Seas Dr, Orlando, FL 32830',
    latitude: 28.4177,
    longitude: -81.5812,
    startDate: new Date('2025-08-09T19:00:00'),
    endDate: new Date('2025-10-31T24:00:00'),
    price: 79,
    priceRange: '$$',
    categorySlug: 'family',
    regionSlug: 'central-florida',
    rating: 4.8,
    reviewCount: 3214,
    tags: ['paid', 'indoor', 'outdoor', 'restrooms', 'food-available', 'kid-friendly', 'family-friendly', 'parking'],
  },
  {
    title: 'Daytona 500 NASCAR Race',
    description: 'The Great American Race at Daytona International Speedway',
    longDescription: 'The Daytona 500 is a 500-mile NASCAR Cup Series motor race held annually at Daytona International Speedway.',
    venue: 'Daytona International Speedway',
    address: '1801 W International Speedway Blvd, Daytona Beach, FL 32114',
    latitude: 29.1852,
    longitude: -81.0707,
    startDate: new Date('2025-02-16T14:30:00'),
    price: 95,
    priceRange: '$$',
    categorySlug: 'sports',
    regionSlug: 'central-florida',
    isFeatured: true,
    rating: 4.8,
    reviewCount: 2156,
    tags: ['paid', 'outdoor', 'restrooms', 'food-available', 'parking', 'vip', 'rain-or-shine'],
  },

  // Tampa Bay Events
  {
    title: 'Clearwater Jazz Holiday',
    description: 'Four-day jazz festival at Coachman Park',
    longDescription: 'The Clearwater Jazz Holiday is a four-day music festival featuring jazz artists.',
    venue: 'Coachman Park',
    address: '301 Drew St, Clearwater, FL 33755',
    latitude: 27.9659,
    longitude: -82.8002,
    startDate: new Date('2025-10-16T16:00:00'),
    endDate: new Date('2025-10-19T22:00:00'),
    price: 0,
    priceRange: 'Free',
    categorySlug: 'music',
    regionSlug: 'tampa-bay',
    rating: 4.5,
    reviewCount: 654,
    tags: ['free', 'outdoor', 'restrooms', 'food-available', 'family-friendly', 'live-music'],
  },
  {
    title: 'Gasparilla Pirate Festival',
    description: 'Tampa\'s legendary pirate invasion celebration',
    longDescription: 'Join the pirate invasion at the Gasparilla Pirate Festival!',
    venue: 'Bayshore Boulevard & Downtown Tampa',
    address: 'Bayshore Blvd, Tampa, FL 33606',
    latitude: 27.9291,
    longitude: -82.4655,
    startDate: new Date('2025-01-25T11:00:00'),
    endDate: new Date('2025-01-25T22:00:00'),
    price: 0,
    priceRange: 'Free',
    categorySlug: 'festivals',
    regionSlug: 'tampa-bay',
    rating: 4.7,
    reviewCount: 2876,
    tags: ['free', 'outdoor', 'restrooms', 'food-available', 'family-friendly', 'kid-friendly'],
  },
  {
    title: 'Sarasota Film Festival',
    description: 'Premier independent film festival on Florida\'s Gulf Coast',
    longDescription: 'The Sarasota Film Festival is one of the leading independent film festivals.',
    venue: 'Regal Cinemas Hollywood 11',
    address: '1993 Main St, Sarasota, FL 34236',
    latitude: 27.3364,
    longitude: -82.5307,
    startDate: new Date('2025-04-04T10:00:00'),
    endDate: new Date('2025-04-13T23:00:00'),
    price: 15,
    priceRange: '$',
    categorySlug: 'arts',
    regionSlug: 'tampa-bay',
    rating: 4.4,
    reviewCount: 312,
    tags: ['paid', 'indoor', 'restrooms', 'parking', 'wheelchair-access'],
  },

  // SWFL Events
  {
    title: 'Naples Winter Wine Festival',
    description: 'One of the world\'s most prestigious wine auctions',
    longDescription: 'The Naples Winter Wine Festival is consistently ranked among the top 10 arts and entertainment events.',
    venue: 'The Ritz-Carlton Golf Resort',
    address: '2600 Tiburon Dr, Naples, FL 34109',
    latitude: 26.2550,
    longitude: -81.8030,
    startDate: new Date('2025-01-24T10:00:00'),
    endDate: new Date('2025-01-26T18:00:00'),
    price: 10000,
    priceRange: '$$$',
    categorySlug: 'food',
    regionSlug: 'swfl',
    rating: 4.9,
    reviewCount: 127,
    tags: ['paid', 'indoor', 'outdoor', 'restrooms', 'food-available', '21-plus', 'vip'],
  },
  {
    title: 'Naples Craft Beer Festival',
    description: 'Craft beer tasting in beautiful Naples',
    longDescription: 'Sample over 200 craft beers from local and national breweries.',
    venue: 'Sugden Regional Park',
    address: '4284 Avalon Dr, Naples, FL 34112',
    latitude: 26.1420,
    longitude: -81.7840,
    startDate: new Date('2025-03-08T13:00:00'),
    endDate: new Date('2025-03-08T18:00:00'),
    price: 45,
    priceRange: '$$',
    categorySlug: 'food',
    regionSlug: 'swfl',
    rating: 4.5,
    reviewCount: 345,
    tags: ['paid', 'outdoor', 'restrooms', 'food-available', '21-plus', 'parking'],
  },

  // North Florida Events
  {
    title: 'Jacksonville Jazz Festival',
    description: 'One of the largest jazz festivals in the Southeast',
    longDescription: 'The Jacksonville Jazz Festival is one of the largest jazz festivals in the Southeast.',
    venue: 'Downtown Jacksonville',
    address: 'Downtown Jacksonville, Jacksonville, FL',
    latitude: 30.3322,
    longitude: -81.6557,
    startDate: new Date('2025-05-23T17:00:00'),
    endDate: new Date('2025-05-25T22:00:00'),
    price: 0,
    priceRange: 'Free',
    categorySlug: 'music',
    regionSlug: 'north-florida',
    rating: 4.4,
    reviewCount: 567,
    tags: ['free', 'outdoor', 'restrooms', 'food-available', 'family-friendly', 'live-music'],
  },

  // Key West
  {
    title: 'Key West Fantasy Fest',
    description: '10-day costume celebration in paradise',
    longDescription: 'Fantasy Fest is a 10-day costume celebration held annually in Key West.',
    venue: 'Duval Street & Various Locations',
    address: 'Duval St, Key West, FL 33040',
    latitude: 24.5557,
    longitude: -81.7782,
    startDate: new Date('2025-10-17T12:00:00'),
    endDate: new Date('2025-10-26T23:59:00'),
    price: 0,
    priceRange: 'Free',
    categorySlug: 'festivals',
    regionSlug: 'soflo',
    isFeatured: true,
    rating: 4.9,
    reviewCount: 3241,
    tags: ['free', 'outdoor', 'restrooms', 'food-available', 'beach', 'live-music'],
  },
]

async function main() {
  console.log('Seeding database...')

  // Create categories
  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: category,
      create: category,
    })
  }
  console.log('Created categories')

  // Create regions
  for (const region of regions) {
    await prisma.region.upsert({
      where: { slug: region.slug },
      update: region,
      create: region,
    })
  }
  console.log('Created regions')

  // Create tags
  for (const tag of tags) {
    await prisma.tag.upsert({
      where: { slug: tag.slug },
      update: tag,
      create: tag,
    })
  }
  console.log('Created tags')

  // Create events
  for (const event of events) {
    const category = await prisma.category.findUnique({
      where: { slug: event.categorySlug },
    })
    const region = await prisma.region.findUnique({
      where: { slug: event.regionSlug },
    })

    if (!category || !region) continue

    const slug = event.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

    const eventData = {
      title: event.title,
      slug,
      description: event.description,
      longDescription: event.longDescription,
      venue: event.venue,
      address: event.address,
      latitude: event.latitude,
      longitude: event.longitude,
      startDate: event.startDate,
      endDate: event.endDate,
      price: event.price,
      priceRange: event.priceRange,
      isFeatured: event.isFeatured || false,
      rating: event.rating,
      reviewCount: event.reviewCount,
      categoryId: category.id,
      regionId: region.id,
    }

    const createdEvent = await prisma.event.upsert({
      where: { slug },
      update: eventData,
      create: eventData,
    })

    // Create event tags
    if (event.tags && event.tags.length > 0) {
      for (const tagSlug of event.tags) {
        const tag = await prisma.tag.findUnique({
          where: { slug: tagSlug },
        })
        if (tag) {
          await prisma.eventTag.upsert({
            where: {
              eventId_tagId: {
                eventId: createdEvent.id,
                tagId: tag.id,
              }
            },
            update: {},
            create: {
              eventId: createdEvent.id,
              tagId: tag.id,
            },
          })
        }
      }
    }
  }
  console.log('Created events with tags')

  console.log('Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
