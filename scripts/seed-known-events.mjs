/**
 * seed-known-events.mjs
 * Seeds well-known / real Florida events (March – June 2026)
 * Run with:  node scripts/seed-known-events.mjs
 */

import { PrismaClient } from '@prisma/client'
process.env.DATABASE_URL = 'file:./db/custom.db'
const db = new PrismaClient()

// ── Helpers ────────────────────────────────────────────────────────────────
function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9\s-]/g,'').trim().replace(/\s+/g,'-').slice(0,60)
}
function d(str) { return new Date(str) }
function rand(min,max) { return parseFloat((min + Math.random()*(max-min)).toFixed(1)) }
function randInt(min,max) { return Math.floor(min + Math.random()*(max-min+1)) }

// ── Event data ─────────────────────────────────────────────────────────────
// Fields: title, description, longDescription, venue, address, startDate, endDate,
//         price, priceRange, website, categorySlug, regionSlug, isFeatured,
//         tags (array of tag slugs)

const EVENTS = [
  // ══ MARCH 2026 ═══════════════════════════════════════════════════════════
  {
    title: 'Calle Ocho Music Festival',
    description: 'The world\'s largest Hispanic street party covering 23 blocks of Little Havana. Live salsa, reggaeton, cumbia, and Latin rock with over 30 stages.',
    longDescription: 'Calle Ocho Music Festival is the crown jewel of Miami\'s Carnaval Miami, an 8-day celebration of Hispanic heritage. The street festival transforms SW 8th Street (Calle Ocho) into a massive open-air concert stretching 23 blocks. Enjoy authentic Cuban food, mojitos, live Latin music across 30+ stages, and vibrant cultural performances. One of the top 10 street parties in the world.',
    venue: 'SW 8th Street, Little Havana', address: 'SW 8th Street, Miami, FL 33135',
    startDate: d('2026-03-08'), endDate: d('2026-03-08'),
    price: 0, priceRange: 'Free', website: 'https://www.carnavalmiami.com',
    categorySlug: 'music', regionSlug: 'soflo', isFeatured: true,
    tags: ['free', 'outdoor-tag', 'live-music', 'festival'],
  },
  {
    title: 'Ultra Music Festival',
    description: 'World-renowned electronic music festival on the shores of Biscayne Bay featuring top global DJs across multiple stages over three days.',
    longDescription: 'Ultra Music Festival is one of the most prestigious electronic music festivals in the world, held annually in Miami during Miami Music Week. Featuring three massive stages including the iconic ULTRA Main Stage, Resistance underground stage, and Live Stage, Ultra brings together the biggest names in EDM, techno, and house music. Located in Bayfront Park with stunning views of Biscayne Bay.',
    venue: 'Bayfront Park', address: '301 Biscayne Blvd, Miami, FL 33132',
    startDate: d('2026-03-27'), endDate: d('2026-03-29'),
    price: 349, priceRange: '$349 – $999', website: 'https://ultramusicfestival.com',
    categorySlug: 'music', regionSlug: 'soflo', isFeatured: true,
    tags: ['live-music', 'festival', 'nightlife-tag'],
  },
  {
    title: 'Miami Open Tennis Tournament',
    description: 'One of tennis\'s most prestigious Masters 1000 events featuring the world\'s top ATP and WTA players competing at Hard Rock Stadium.',
    longDescription: 'The Miami Open is one of the most prestigious tennis tournaments in the world, part of the ATP Masters 1000 and WTA 1000 series. Held at the stunning Hard Rock Stadium complex, the tournament features all top-100 ATP and WTA players competing over two weeks. Enjoy world-class tennis, celebrity sightings, and an incredible festival atmosphere with food, entertainment, and interactive experiences.',
    venue: 'Hard Rock Stadium', address: '347 Don Shula Dr, Miami Gardens, FL 33056',
    startDate: d('2026-03-18'), endDate: d('2026-03-30'),
    price: 45, priceRange: '$45 – $350', website: 'https://www.miamiopen.com',
    categorySlug: 'sports', regionSlug: 'soflo', isFeatured: true,
    tags: ['sports-tag', 'outdoor-tag'],
  },
  {
    title: 'Florida Renaissance Festival',
    description: 'Step back to 16th century England at this beloved annual faire featuring jousting, crafts, costumes, and over 100 artisan vendors.',
    longDescription: 'The Florida Renaissance Festival is the state\'s premier Renaissance faire, transforming Quiet Waters Park into a living, breathing re-creation of 16th century England. Watch thrilling jousting tournaments, interact with costumed performers, shop from 100+ artisan vendors, and feast on traditional foods and drinks. The festival runs every weekend through spring with special themed weekends.',
    venue: 'Quiet Waters Park', address: '401 S Powerline Rd, Deerfield Beach, FL 33442',
    startDate: d('2026-02-14'), endDate: d('2026-04-05'),
    price: 22, priceRange: '$22 – $28', website: 'https://www.ren-fest.com',
    categorySlug: 'arts-culture', regionSlug: 'soflo', isFeatured: false,
    tags: ['outdoor-tag', 'family-friendly', 'festival'],
  },
  {
    title: 'Tampa Bay Beer Week',
    description: 'Ten days of craft beer events, tap takeovers, beer dinners, and brewery tours celebrating the thriving Tampa Bay craft beer scene.',
    longDescription: 'Tampa Bay Beer Week is a 10-day celebration of craft beer culture in the Tampa Bay area. The event features hundreds of individual events including tap takeovers, beer dinners, brewery tours, homebrewing competitions, and educational seminars at bars, restaurants, and breweries throughout Hillsborough and Pinellas counties. Capped off with the signature TBBW Festival at a major venue.',
    venue: 'Various venues, Tampa Bay area', address: 'Tampa, FL 33602',
    startDate: d('2026-03-14'), endDate: d('2026-03-22'),
    price: 0, priceRange: 'Free – $45', website: 'https://www.tampabaydrinks.com',
    categorySlug: 'food-drink', regionSlug: 'tampa-bay', isFeatured: false,
    tags: ['food-drinks-tag', 'outdoor-tag'],
  },
  {
    title: 'Epcot International Flower & Garden Festival',
    description: 'Walt Disney World\'s stunning spring celebration featuring 100+ topiaries, outdoor kitchens, live concerts, and breathtaking garden displays.',
    longDescription: 'The Epcot International Flower & Garden Festival transforms the park each spring into a blooming paradise. Marvel at over 100 character topiaries, tour themed gardens from around the world, enjoy the Garden Rocks Concert Series with top acts performing nightly, and sample dozens of seasonal dishes from outdoor kitchen booths. One of Florida\'s most beloved annual events for families and adults alike.',
    venue: 'Epcot, Walt Disney World', address: '200 Epcot Center Dr, Orlando, FL 32821',
    startDate: d('2026-03-05'), endDate: d('2026-06-02'),
    price: 109, priceRange: '$109 – $189 (park admission)', website: 'https://disneyworld.disney.go.com',
    categorySlug: 'family', regionSlug: 'central-florida', isFeatured: true,
    tags: ['family-friendly', 'outdoor-tag', 'festival', 'live-music'],
  },
  {
    title: 'Universal Mardi Gras Orlando',
    description: 'Universal Orlando\'s massive Mardi Gras celebration with world-class concerts, authentic Cajun cuisine, parade floats, and mountains of beads.',
    longDescription: 'Universal\'s Mardi Gras at Universal Orlando is the Southeast\'s biggest Fat Tuesday celebration. Enjoy a massive parade featuring incredible floats and bead tosses, savor authentic Cajun and Creole foods, and catch free headline concerts included with park admission. Past performers have included major artists across all genres. Runs weekends through spring.',
    venue: 'Universal Studios Florida', address: '6000 Universal Blvd, Orlando, FL 32819',
    startDate: d('2026-02-06'), endDate: d('2026-04-19'),
    price: 109, priceRange: '$109 – $169 (park admission)', website: 'https://www.universalorlando.com',
    categorySlug: 'family', regionSlug: 'central-florida', isFeatured: false,
    tags: ['family-friendly', 'live-music', 'festival'],
  },
  {
    title: 'Sarasota Film Festival',
    description: 'Premier film festival showcasing independent, documentary, and international films with screenings, filmmaker Q&As, and special events across Sarasota.',
    longDescription: 'The Sarasota Film Festival is one of the most respected regional film festivals in the United States, presenting over 200 films across 10 days at multiple Sarasota venues. The festival features world premieres, Q&A sessions with filmmakers and actors, tribute events honoring legendary figures in cinema, and an immersive industry conference. Attracts major talent from Hollywood and international cinema.',
    venue: 'Various venues, Sarasota', address: 'Sarasota, FL 34236',
    startDate: d('2026-03-27'), endDate: d('2026-04-05'),
    price: 15, priceRange: '$15 – $100', website: 'https://www.sarasotafilmfestival.com',
    categorySlug: 'arts-culture', regionSlug: 'tampa-bay', isFeatured: false,
    tags: ['art-tag', 'festival'],
  },
  {
    title: 'Pensacola Crawfish Festival',
    description: 'Annual beloved seafood festival celebrating Cajun culture with all-you-can-eat crawfish, live zydeco and blues music, and arts & crafts.',
    longDescription: 'The Pensacola Crawfish Festival is one of the Gulf Coast\'s most anticipated food festivals, held in the charming Seville Square Historic District. Feast on mountains of boiled crawfish and enjoy authentic Cajun dishes while listening to live zydeco, blues, and Cajun music. Browse local arts and crafts, join the crawfish eating contest, and soak in the festive atmosphere.',
    venue: 'Seville Square', address: 'Seville Square, Pensacola, FL 32502',
    startDate: d('2026-04-24'), endDate: d('2026-04-26'),
    price: 5, priceRange: '$5 – $30', website: 'https://www.pensacolacrawfishfestival.com',
    categorySlug: 'food-drink', regionSlug: 'panhandle', isFeatured: false,
    tags: ['food-drinks-tag', 'outdoor-tag', 'live-music', 'festival'],
  },

  // ══ APRIL 2026 ════════════════════════════════════════════════════════════
  {
    title: 'Tortuga Music Festival',
    description: 'The world\'s largest country music beach festival on Fort Lauderdale Beach, featuring three days of country\'s biggest stars with ocean views.',
    longDescription: 'Tortuga Music Festival is the world\'s largest country music beach festival, taking over Fort Lauderdale Beach Park for three incredible days. Featuring three stages with the biggest names in country music against the backdrop of the Atlantic Ocean. Beyond the music, Tortuga is deeply committed to ocean conservation, partnering with top environmental organizations. Thousands of fans descend on the beach for sun, sand, and country.',
    venue: 'Fort Lauderdale Beach Park', address: '1100 Seabreeze Blvd, Fort Lauderdale, FL 33316',
    startDate: d('2026-04-10'), endDate: d('2026-04-12'),
    price: 189, priceRange: '$189 – $399', website: 'https://www.tortugamusicfestival.com',
    categorySlug: 'music', regionSlug: 'soflo', isFeatured: true,
    tags: ['live-music', 'festival', 'outdoor-tag', 'beach'],
  },
  {
    title: 'Florida Film Festival',
    description: 'Orlando\'s acclaimed independent film festival presenting world premieres, award-winning shorts, and special events at the Enzian Theater.',
    longDescription: 'The Florida Film Festival at the legendary Enzian Theater is one of the most respected independent film festivals in the Southeast. Over 10 days, the festival screens more than 150 films including world premieres, American premieres, and Oscar-qualifying short films. Enjoy filmmaker discussions, special events, the iconic Eden Bar, and a vibrant celebration of cinema in the heart of Maitland.',
    venue: 'Enzian Theater', address: '1300 S Orlando Ave, Maitland, FL 32751',
    startDate: d('2026-04-10'), endDate: d('2026-04-19'),
    price: 13, priceRange: '$13 – $50', website: 'https://enzian.org/florida-film-festival',
    categorySlug: 'arts-culture', regionSlug: 'central-florida', isFeatured: false,
    tags: ['art-tag', 'festival'],
  },
  {
    title: 'Jazz in the Gardens',
    description: 'South Florida\'s premier outdoor jazz and R&B festival at Hard Rock Stadium featuring legendary headliners and world-class jazz artists over two days.',
    longDescription: 'Jazz in the Gardens is South Florida\'s most prestigious outdoor music festival, celebrating the rich traditions of jazz, R&B, soul, and gospel music. Held at the Hard Rock Stadium complex, the two-day event features multiple stages with Grammy Award-winning headliners, emerging jazz stars, and classic R&B acts. Enjoy great food, vendor village, and an unbeatable atmosphere.',
    venue: 'Hard Rock Stadium', address: '347 Don Shula Dr, Miami Gardens, FL 33056',
    startDate: d('2026-04-18'), endDate: d('2026-04-19'),
    price: 95, priceRange: '$95 – $350', website: 'https://www.jazzinthegardens.com',
    categorySlug: 'music', regionSlug: 'soflo', isFeatured: true,
    tags: ['live-music', 'festival', 'outdoor-tag'],
  },
  {
    title: 'eMerge Americas',
    description: 'Latin America\'s premier technology and innovation conference connecting 15,000+ global tech leaders, startups, and investors in Miami.',
    longDescription: 'eMerge Americas is the most significant technology and innovation conference in the Americas, transforming Miami into the epicenter of the global tech ecosystem for two days. Connecting over 15,000 entrepreneurs, investors, executives, and policy makers from 70+ countries. Features keynote speeches, panels, startup pitch competitions, investor meetings, and a massive exhibition floor.',
    venue: 'Miami Beach Convention Center', address: '1901 Convention Center Dr, Miami Beach, FL 33139',
    startDate: d('2026-04-13'), endDate: d('2026-04-14'),
    price: 299, priceRange: '$299 – $999', website: 'https://emergeamericas.com',
    categorySlug: 'community', regionSlug: 'soflo', isFeatured: false,
    tags: ['festival'],
  },
  {
    title: 'Coconut Grove Arts Festival',
    description: 'One of the nation\'s top-ranked outdoor art festivals featuring 360 juried artists from around the world along the scenic Coconut Grove waterfront.',
    longDescription: 'The Coconut Grove Arts Festival is consistently ranked among the top fine art festivals in the United States, presenting over 360 internationally acclaimed juried artists. Set against the breathtaking backdrop of Biscayne Bay in Miami\'s historic Coconut Grove neighborhood, the festival features fine art across all media including painting, sculpture, photography, digital art, and mixed media.',
    venue: 'Peacock Park, Coconut Grove', address: '2820 McFarlane Rd, Miami, FL 33133',
    startDate: d('2026-04-17'), endDate: d('2026-04-19'),
    price: 15, priceRange: '$15', website: 'https://www.coconutgroveartsfest.com',
    categorySlug: 'arts-culture', regionSlug: 'soflo', isFeatured: false,
    tags: ['art-tag', 'outdoor-tag', 'festival'],
  },
  {
    title: 'Clearwater Jazz Holiday',
    description: 'Free outdoor jazz festival at Coachman Park featuring four days of world-class jazz performances on the shores of Clearwater Bay.',
    longDescription: 'The Clearwater Jazz Holiday is one of the nation\'s most beloved free jazz festivals, bringing the world\'s greatest jazz artists to beautiful Coachman Park on the shores of Clearwater Bay. For four nights, enjoy Grammy-winning headliners and contemporary jazz stars in a gorgeous waterfront setting. Bring blankets, chairs, and picnics — this beloved community tradition is completely free.',
    venue: 'Coachman Park', address: '300 Drew St, Clearwater, FL 33755',
    startDate: d('2026-04-16'), endDate: d('2026-04-19'),
    price: 0, priceRange: 'Free', website: 'https://www.clearwaterjazz.com',
    categorySlug: 'music', regionSlug: 'tampa-bay', isFeatured: false,
    tags: ['free', 'outdoor-tag', 'live-music', 'festival', 'beach'],
  },
  {
    title: 'Fort Lauderdale Air Show',
    description: 'Spectacular beachfront air show over Fort Lauderdale Beach featuring the U.S. Navy Blue Angels and top civilian aerobatic performers.',
    longDescription: 'The Fort Lauderdale Air Show is one of the most popular spectator events in South Florida, drawing hundreds of thousands of spectators to Fort Lauderdale Beach. Watch breathtaking aerial displays over the Atlantic Ocean including the world-famous Blue Angels, military flyovers, vintage warbirds, and top civilian aerobatic performers. The show is free to watch from the beach.',
    venue: 'Fort Lauderdale Beach', address: 'Fort Lauderdale Beach Blvd, Fort Lauderdale, FL 33316',
    startDate: d('2026-04-25'), endDate: d('2026-04-26'),
    price: 0, priceRange: 'Free (beach viewing)', website: 'https://fortlauderdaleairshow.com',
    categorySlug: 'outdoor', regionSlug: 'soflo', isFeatured: false,
    tags: ['free', 'outdoor-tag', 'family-friendly', 'beach'],
  },
  {
    title: 'Springtime Tallahassee',
    description: 'Tallahassee\'s beloved spring celebration with a grand parade, arts & crafts festival, and family activities downtown.',
    longDescription: 'Springtime Tallahassee is the capital city\'s premier spring celebration, featuring one of Florida\'s largest parades winding through historic downtown Tallahassee. The multi-day event includes a juried arts and crafts festival, live entertainment, food vendors, and family activities celebrating the beauty and culture of Florida\'s capital. One of the Southeast\'s most beloved community festivals.',
    venue: 'Downtown Tallahassee', address: 'Downtown Tallahassee, FL 32301',
    startDate: d('2026-04-04'), endDate: d('2026-04-05'),
    price: 0, priceRange: 'Free', website: 'https://www.springtimetallahassee.com',
    categorySlug: 'community', regionSlug: 'panhandle', isFeatured: false,
    tags: ['free', 'outdoor-tag', 'family-friendly', 'festival'],
  },
  {
    title: 'Miami International Boat Show',
    description: 'The world\'s largest boat show featuring thousands of boats, yachts, and marine products across multiple Miami venues.',
    longDescription: 'The Miami International Boat Show is the world\'s premier marine event, attracting the global boating industry to Miami every year. Featuring thousands of vessels from small runabouts to mega-yachts, the show spans multiple venues including the Miami Beach Convention Center and the docks at the Sea Isle Marina. Shop from 1,000+ exhibitors, experience on-water demonstrations, and enjoy special events.',
    venue: 'Miami Beach Convention Center', address: '1901 Convention Center Dr, Miami Beach, FL 33139',
    startDate: d('2026-04-09'), endDate: d('2026-04-13'),
    price: 35, priceRange: '$35 – $65', website: 'https://www.miamiboatshow.com',
    categorySlug: 'outdoor', regionSlug: 'soflo', isFeatured: false,
    tags: ['outdoor-tag', 'sports-tag', 'festival'],
  },

  // ══ MAY 2026 ══════════════════════════════════════════════════════════════
  {
    title: 'SunFest Music & Arts Festival',
    description: 'Florida\'s largest waterfront music and arts festival on the Intracoastal Waterway in West Palm Beach featuring top national acts over 5 days.',
    longDescription: 'SunFest is Florida\'s largest ticketed outdoor waterfront music and arts festival, transforming downtown West Palm Beach\'s beautiful Intracoastal Waterway park into a massive entertainment campus. For five days, SunFest features multiple music stages with national headliners spanning rock, pop, R&B, and electronic, plus a major arts exhibition, food village, and boating events.',
    venue: 'Flagler Drive Waterfront', address: 'Flagler Dr, West Palm Beach, FL 33401',
    startDate: d('2026-05-01'), endDate: d('2026-05-04'),
    price: 45, priceRange: '$45 – $125', website: 'https://www.sunfest.com',
    categorySlug: 'music', regionSlug: 'soflo', isFeatured: true,
    tags: ['live-music', 'festival', 'outdoor-tag', 'art-tag'],
  },
  {
    title: 'Jacksonville Jazz Festival',
    description: 'One of the largest free jazz festivals in the nation, transforming downtown Jacksonville with world-class jazz performances over Memorial Day weekend.',
    longDescription: 'The Jacksonville Jazz Festival is consistently ranked among the largest and best free jazz festivals in the United States. Held over Memorial Day weekend in the heart of downtown Jacksonville, the festival draws hundreds of thousands of jazz fans for performances by legendary jazz artists and emerging talents. Multiple outdoor stages along the St. Johns River create an unbeatable waterfront atmosphere.',
    venue: 'Downtown Jacksonville Waterfront', address: 'Metropolitan Park, Jacksonville, FL 32202',
    startDate: d('2026-05-22'), endDate: d('2026-05-25'),
    price: 0, priceRange: 'Free', website: 'https://www.jacksonvillejazzfestival.com',
    categorySlug: 'music', regionSlug: 'north-florida', isFeatured: true,
    tags: ['free', 'live-music', 'festival', 'outdoor-tag'],
  },
  {
    title: 'Swamp Stomp Music Festival',
    description: 'Celebrating authentic Florida music culture with country, Americana, and Southern rock bands performing at a scenic outdoor amphitheater.',
    longDescription: 'Swamp Stomp brings the authentic sounds of Florida to a spectacular outdoor venue, celebrating the state\'s rich musical heritage with country, Americana, Southern rock, and swamp rock music. Set in a beautiful natural Florida setting, the festival features regional and national acts, local food vendors, craft beer gardens, and a genuine celebration of the Sunshine State\'s unique musical culture.',
    venue: 'Suwannee Music Park', address: 'Live Oak, FL 32060',
    startDate: d('2026-05-08'), endDate: d('2026-05-10'),
    price: 75, priceRange: '$75 – $180', website: 'https://suwanneemusic.com',
    categorySlug: 'music', regionSlug: 'north-florida', isFeatured: false,
    tags: ['live-music', 'festival', 'outdoor-tag', 'camping'],
  },
  {
    title: 'Miami Art Week & Design District Festival',
    description: 'A week-long celebration of contemporary art, design, and culture with gallery openings, pop-up exhibitions, and parties throughout Miami.',
    longDescription: 'Miami Art Week transforms the city into a global art capital, with galleries, museums, and cultural institutions hosting special openings, exhibitions, and events throughout Miami and Miami Beach. The Miami Design District becomes a pedestrian art experience with outdoor installations, performances, and activations. Coincides with major art fair programming and international collectors and art world celebrities.',
    venue: 'Miami Design District & throughout Miami', address: '140 NE 39th St, Miami, FL 33137',
    startDate: d('2026-05-14'), endDate: d('2026-05-17'),
    price: 0, priceRange: 'Free – varies by event', website: 'https://www.miamidesigndistrict.net',
    categorySlug: 'arts-culture', regionSlug: 'soflo', isFeatured: false,
    tags: ['art-tag', 'outdoor-tag', 'festival'],
  },
  {
    title: 'Florida Brewers Guild Festival',
    description: 'The official craft beer festival of Florida featuring 100+ Florida breweries, live music, and food pairings celebrating the state\'s thriving craft beer scene.',
    longDescription: 'The Florida Brewers Guild Festival is the official celebration of Florida\'s booming craft beer industry. Featuring over 100 Florida breweries pouring hundreds of craft beers, the festival is a must for any beer enthusiast. Enjoy curated food pairings, brewing demonstrations, awards presentations, and live music while sampling the incredible diversity of craft beer made right here in Florida.',
    venue: 'Curtis Hixon Waterfront Park', address: '600 N Ashley Dr, Tampa, FL 33602',
    startDate: d('2026-05-02'), endDate: d('2026-05-03'),
    price: 55, priceRange: '$55 – $85', website: 'https://floridabrewersguild.org',
    categorySlug: 'food-drink', regionSlug: 'tampa-bay', isFeatured: false,
    tags: ['food-drinks-tag', 'outdoor-tag', 'festival', 'live-music'],
  },
  {
    title: 'Pensacola Beach Songwriters Festival',
    description: 'Five days of intimate songwriter shows on Pensacola Beach\'s most beautiful outdoor stages, celebrating the craft of American songwriting.',
    longDescription: 'The Pensacola Beach Songwriters Festival is one of the Gulf Coast\'s most beloved music events, celebrating the art of songwriting in an intimate and beautiful setting. Over five days, hundreds of professional songwriters perform at multiple outdoor venues on Pensacola Beach, sharing the stories behind their songs in the unique in-the-round format. Many performers have written hits for major artists.',
    venue: 'Pensacola Beach', address: 'Pensacola Beach, FL 32561',
    startDate: d('2026-05-13'), endDate: d('2026-05-17'),
    price: 0, priceRange: 'Free – $40', website: 'https://www.pensacolabeachsongwritersfestival.com',
    categorySlug: 'music', regionSlug: 'panhandle', isFeatured: false,
    tags: ['live-music', 'outdoor-tag', 'beach', 'festival'],
  },
  {
    title: 'Orlando International Fringe Theatre Festival',
    description: 'The longest-running fringe festival in the US featuring 500+ uncensored performances across 25 venues in the heart of the Loch Haven Cultural Campus.',
    longDescription: 'The Orlando Fringe is the longest-running and one of the most celebrated fringe theatre festivals in the United States. For two weeks, the Loch Haven Cultural Campus transforms into a city-within-a-city featuring over 500 performances from local, national, and international artists. The uncensored format means no gatekeepers — any artist can participate — resulting in the most eclectic and surprising lineup of theatre, comedy, dance, and performance art imaginable.',
    venue: 'Loch Haven Park', address: '777 E Princeton St, Orlando, FL 32803',
    startDate: d('2026-05-14'), endDate: d('2026-05-24'),
    price: 12, priceRange: '$12 – $20 per show', website: 'https://orlandofringe.org',
    categorySlug: 'arts-culture', regionSlug: 'central-florida', isFeatured: false,
    tags: ['art-tag', 'festival', 'outdoor-tag'],
  },
  {
    title: 'Coconut Grove Food & Wine Festival',
    description: 'Elegant outdoor food and wine experience in Miami\'s most charming waterfront neighborhood with top chefs, premium wines, and live jazz.',
    longDescription: 'Set among the lush canopy of Coconut Grove\'s historic streets, the Coconut Grove Food & Wine Festival brings together Miami\'s finest chefs, sommeliers, and food artisans for a celebration of culinary excellence. Sip premium wines from around the world, taste signature dishes from celebrated local restaurants, enjoy live jazz and bossa nova, and explore artisan food vendors along the picturesque waterfront.',
    venue: 'CocoWalk & Coconut Grove Waterfront', address: '3015 Grand Ave, Coconut Grove, FL 33133',
    startDate: d('2026-05-09'), endDate: d('2026-05-10'),
    price: 55, priceRange: '$55 – $150', website: 'https://www.cgfw.com',
    categorySlug: 'food-drink', regionSlug: 'soflo', isFeatured: false,
    tags: ['food-drinks-tag', 'outdoor-tag', 'live-music'],
  },
  {
    title: 'Tampa Bay Margarita Festival',
    description: 'Tropical outdoor festival celebrating the perfect margarita with 50+ varieties, live Latin music, food trucks, and cocktail competitions.',
    longDescription: 'The Tampa Bay Margarita Festival is a tropical celebration of everyone\'s favorite cocktail, bringing together the best margaritas in the region for a festive outdoor event. Sample 50+ unique margarita varieties from local bars and restaurants, enjoy live Latin music and DJs, chow down from a lineup of food trucks, and watch mixology competitions determine the ultimate margarita champion.',
    venue: 'Tropicana Field Lot', address: '1 Tropicana Dr, St. Petersburg, FL 33705',
    startDate: d('2026-05-16'), endDate: d('2026-05-17'),
    price: 35, priceRange: '$35 – $60', website: 'https://tampabaymargaritafestival.com',
    categorySlug: 'food-drink', regionSlug: 'tampa-bay', isFeatured: false,
    tags: ['food-drinks-tag', 'outdoor-tag', 'live-music', 'festival'],
  },

  // ══ JUNE 2026 ═════════════════════════════════════════════════════════════
  {
    title: 'Miami Pride Festival',
    description: 'One of the Southeast\'s largest Pride celebrations with a beach party, parade, multi-stage festival, and week of LGBTQ+ events across Miami Beach.',
    longDescription: 'Miami Beach Pride is one of the most spectacular LGBTQ+ celebrations in the country, transforming Miami Beach into a rainbow of inclusion and joy. The multi-day celebration includes a grand parade along Ocean Drive, a massive beach party on Lummus Park, the Pride Festival with multiple stages featuring top LGBTQ+ headliners and allies, drag performances, and a week of parties and events throughout Miami Beach.',
    venue: 'Lummus Park / Ocean Drive, Miami Beach', address: 'Lummus Park, Miami Beach, FL 33139',
    startDate: d('2026-06-05'), endDate: d('2026-06-07'),
    price: 0, priceRange: 'Free – $40', website: 'https://miamibeachpride.com',
    categorySlug: 'community', regionSlug: 'soflo', isFeatured: true,
    tags: ['free', 'outdoor-tag', 'live-music', 'festival', 'beach'],
  },
  {
    title: 'Juneteenth Music & Heritage Festival',
    description: 'Celebrating freedom and Black culture across Florida with live music, art, food, and family programming at multiple venues.',
    longDescription: 'The Juneteenth Music & Heritage Festival honors the historic significance of June 19 with a powerful celebration of Black history, culture, and creativity. Featuring live performances across multiple stages including hip hop, R&B, gospel, and jazz, the festival also presents visual art exhibitions, spoken word performances, historical programming, and a diverse food village celebrating African American culinary traditions.',
    venue: 'Bayfront Park', address: '301 Biscayne Blvd, Miami, FL 33132',
    startDate: d('2026-06-19'), endDate: d('2026-06-21'),
    price: 0, priceRange: 'Free', website: 'https://www.juneteenth.com',
    categorySlug: 'community', regionSlug: 'soflo', isFeatured: false,
    tags: ['free', 'live-music', 'outdoor-tag', 'family-friendly', 'festival'],
  },
  {
    title: 'Clearwater Beach Summer Splash',
    description: 'Kick off summer on one of Florida\'s most beautiful beaches with live music, water sports competitions, food festival, and fireworks.',
    longDescription: 'Clearwater Beach Summer Splash is the ultimate beach party to kick off Florida\'s summer season on one of the most beautiful beaches in America. Enjoy three days of live music from local and regional bands across beach stages, beach volleyball tournaments, paddleboard races, a sand sculpture competition, waterfront food vendors, and a spectacular fireworks show over the Gulf of Mexico to cap each night.',
    venue: 'Clearwater Beach', address: 'Clearwater Beach, FL 33767',
    startDate: d('2026-06-06'), endDate: d('2026-06-08'),
    price: 0, priceRange: 'Free', website: 'https://www.myclearwater.com',
    categorySlug: 'outdoor', regionSlug: 'tampa-bay', isFeatured: false,
    tags: ['free', 'beach', 'outdoor-tag', 'live-music', 'family-friendly', 'festival'],
  },
  {
    title: 'Bonnaroo South — Suwannee Hulaween',
    description: 'Multi-day camping music festival in a stunning natural setting on the banks of the Suwannee River with psychedelic art and cutting-edge music.',
    longDescription: 'Suwannee Hulaween is Florida\'s most beloved multi-day camping music festival, set on the mystical banks of the Suwannee River at the legendary Spirit of the Suwannee Music Park. The festival celebrates Halloween in the summer with elaborate art installations, costumed revelers, and mind-expanding music spanning jam, electronic, indie, and funk. Camping, glamping, and VIP options available.',
    venue: 'Spirit of the Suwannee Music Park', address: '3076 95th Dr, Live Oak, FL 32060',
    startDate: d('2026-06-12'), endDate: d('2026-06-15'),
    price: 189, priceRange: '$189 – $450', website: 'https://hulaween.suwanneemusic.com',
    categorySlug: 'music', regionSlug: 'north-florida', isFeatured: false,
    tags: ['live-music', 'festival', 'outdoor-tag'],
  },
  {
    title: 'Naples Mango Festival',
    description: 'Celebrating Florida\'s beloved tropical fruit with mango varieties from around the world, tastings, competitions, exotic food, and live music.',
    longDescription: 'The Naples Mango Festival celebrates the king of tropical fruits with a delicious weekend event at the beautiful Naples Botanical Garden. Explore hundreds of mango varieties from collectors and growers worldwide, participate in mango tasting sessions and identification workshops, enjoy mango-inspired cuisines from local restaurants, enter the mango eating contest, and groove to live reggae and Caribbean music.',
    venue: 'Naples Botanical Garden', address: '4820 Bayshore Dr, Naples, FL 34112',
    startDate: d('2026-06-20'), endDate: d('2026-06-21'),
    price: 20, priceRange: '$20 – $30', website: 'https://www.naplesgarden.org',
    categorySlug: 'food-drink', regionSlug: 'swfl', isFeatured: false,
    tags: ['food-drinks-tag', 'outdoor-tag', 'family-friendly', 'festival'],
  },
  {
    title: 'Miami Carnival – Caribbean Music Festival',
    description: 'A massive celebration of Caribbean culture with soca, calypso, and dancehall music, colorful masquerade costumes, and authentic Caribbean cuisine.',
    longDescription: 'Miami Carnival is one of the largest Caribbean carnivals in North America, celebrating the rich cultures of the Caribbean islands with a spectacular masquerade parade, J\'ouvert dawn celebration, and soca fete concerts. Tens of thousands of revelers in elaborate feathered costumes parade through the streets while DJs and live performers pump out soca, calypso, chutney, and dancehall music. The week-long celebration culminates in an unforgettable road march.',
    venue: 'Miami-Dade County Fair & Expo', address: '10901 SW 24th St, Miami, FL 33165',
    startDate: d('2026-06-27'), endDate: d('2026-06-28'),
    price: 45, priceRange: '$45 – $200', website: 'https://miamibrowardcarnival.com',
    categorySlug: 'music', regionSlug: 'soflo', isFeatured: true,
    tags: ['live-music', 'festival', 'outdoor-tag', 'food-drinks-tag'],
  },
  {
    title: 'St. Pete Pride Festival',
    description: 'Vibrant downtown street festival celebrating LGBTQ+ pride with one of Florida\'s largest Pride parades, multiple stages, and inclusive community events.',
    longDescription: 'St. Pete Pride is one of the largest Pride celebrations in the Southeast, drawing hundreds of thousands of participants to downtown St. Petersburg each June. The festival features one of the largest Pride parades in Florida winding through downtown\'s vibrant streets, followed by a massive festival in Straub Park and Central Arts District with multiple music stages, art exhibitions, food vendors, and community organizations.',
    venue: 'Downtown St. Petersburg', address: 'Straub Park, St. Petersburg, FL 33701',
    startDate: d('2026-06-26'), endDate: d('2026-06-28'),
    price: 0, priceRange: 'Free', website: 'https://www.stpetepride.com',
    categorySlug: 'community', regionSlug: 'tampa-bay', isFeatured: false,
    tags: ['free', 'outdoor-tag', 'live-music', 'festival'],
  },
  {
    title: 'Jacksonville Jazz & Blues Festival',
    description: 'Free outdoor festival on the banks of the St. Johns River celebrating jazz and blues with headline artists and emerging Florida talent.',
    longDescription: 'The Jacksonville Jazz & Blues Festival brings world-class jazz and blues performances to the beautiful waterfront setting of Downtown Jacksonville. Completely free and open to the public, the festival features multiple stages along the St. Johns River with Grammy-winning headliners, celebrated regional artists, and emerging Florida talent. Bring lawn chairs, enjoy food from local vendors, and experience the magic of live jazz under the Florida stars.',
    venue: 'Metropolitan Park', address: '1410 Gator Bowl Blvd, Jacksonville, FL 32202',
    startDate: d('2026-06-06'), endDate: d('2026-06-07'),
    price: 0, priceRange: 'Free', website: 'https://www.jacksonvilledowntown.com',
    categorySlug: 'music', regionSlug: 'north-florida', isFeatured: false,
    tags: ['free', 'live-music', 'outdoor-tag', 'festival'],
  },
  {
    title: 'Destin Fishing Rodeo',
    description: 'The World\'s Luckiest Fishing Village hosts its famous annual fishing tournament with weigh-ins, seafood celebrations, and family activities all month.',
    longDescription: 'The Destin Fishing Rodeo is one of the most prestigious fishing tournaments in the Gulf of Mexico, running the entire month with daily weigh-ins at the Destin Harbor. Anglers compete for prizes in dozens of categories, and spectators can watch the excitement at the dockside weigh station. Alongside the tournament, enjoy fresh gulf seafood at the famous harbor restaurants, boat tours, snorkeling, and family-friendly harbor activities.',
    venue: 'Destin Harbor Boardwalk', address: '116 Harbor Blvd, Destin, FL 32541',
    startDate: d('2026-06-01'), endDate: d('2026-06-30'),
    price: 0, priceRange: 'Free to watch', website: 'https://www.destinfishingrodeo.org',
    categorySlug: 'sports', regionSlug: 'panhandle', isFeatured: false,
    tags: ['sports-tag', 'outdoor-tag', 'family-friendly', 'beach'],
  },
  {
    title: 'Fort Myers Food Truck Rally',
    description: 'Monthly gathering of 40+ award-winning food trucks, live music, craft vendors, and family-friendly activities at Centennial Park.',
    longDescription: 'The Fort Myers Food Truck Rally is Southwest Florida\'s premier monthly food event, packing beautiful Centennial Park with 40+ of the region\'s best and most creative food trucks. From gourmet burgers and artisan tacos to inventive desserts and global cuisine, there\'s something for every palate. Enjoy live music, browse craft and artisan vendors, and relax in the park atmosphere.',
    venue: 'Centennial Park', address: '2000 W First St, Fort Myers, FL 33901',
    startDate: d('2026-06-13'), endDate: d('2026-06-13'),
    price: 0, priceRange: 'Free entry (pay for food)', website: 'https://www.ftmyers.com',
    categorySlug: 'food-drink', regionSlug: 'swfl', isFeatured: false,
    tags: ['free', 'food-drinks-tag', 'outdoor-tag', 'family-friendly', 'live-music'],
  },
  {
    title: 'Wynwood Walls Art Walk',
    description: 'Monthly art walk through Miami\'s world-famous Wynwood Arts District featuring gallery openings, street art, pop-up installations, and live performances.',
    longDescription: 'The Wynwood Walls Art Walk takes place on the second Saturday of every month in Miami\'s globally renowned Wynwood Arts District. Dozens of galleries, studios, and pop-up spaces open their doors for a festive evening of contemporary art, street art, live music performances, food pop-ups, and community gatherings. The Wynwood Walls outdoor museum provides a stunning backdrop of the world\'s largest collection of outdoor murals.',
    venue: 'Wynwood Arts District', address: '2520 NW 2nd Ave, Miami, FL 33127',
    startDate: d('2026-06-13'), endDate: d('2026-06-13'),
    price: 0, priceRange: 'Free', website: 'https://www.wynwoodmiami.com',
    categorySlug: 'arts-culture', regionSlug: 'soflo', isFeatured: false,
    tags: ['free', 'art-tag', 'outdoor-tag', 'live-music'],
  },
  // Bonus recurring monthly events
  {
    title: 'Miami Design District Art Walk',
    description: 'Stroll through luxury boutiques and world-class galleries at monthly art walk events in Miami\'s Design District.',
    longDescription: 'The Miami Design District hosts regular Art Walk events, inviting art lovers to explore the district\'s world-class galleries, design showrooms, and public art installations. Enjoy complimentary refreshments at participating galleries, meet artists and designers, and discover the latest in contemporary art, fashion, and interior design in one of the world\'s most creative neighborhoods.',
    venue: 'Miami Design District', address: '140 NE 39th St, Miami, FL 33137',
    startDate: d('2026-03-14'), endDate: d('2026-03-14'),
    price: 0, priceRange: 'Free', website: 'https://www.miamidesigndistrict.net',
    categorySlug: 'arts-culture', regionSlug: 'soflo', isFeatured: false,
    tags: ['free', 'art-tag', 'outdoor-tag'],
  },
  {
    title: 'Tampa Riverwalk Festival of the Arts',
    description: 'Juried fine art festival along Tampa\'s beautiful Riverwalk featuring 200+ artists, live entertainment, and culinary showcases.',
    longDescription: 'The Tampa Riverwalk Festival of the Arts is one of the most beautiful art festivals in the Southeast, lining Tampa\'s gorgeous Riverwalk greenway with 200+ juried artists from across the country. Browse and purchase original paintings, sculpture, photography, jewelry, ceramics, and glass art while enjoying live musical performances, chef demonstrations from Tampa\'s best restaurants, and the stunning riverfront backdrop.',
    venue: 'Tampa Riverwalk', address: 'Riverwalk, Tampa, FL 33602',
    startDate: d('2026-03-21'), endDate: d('2026-03-22'),
    price: 0, priceRange: 'Free', website: 'https://www.tampariverwalk.com',
    categorySlug: 'arts-culture', regionSlug: 'tampa-bay', isFeatured: false,
    tags: ['free', 'art-tag', 'outdoor-tag', 'family-friendly', 'live-music'],
  },
  {
    title: 'Key West Fantasy Fest Preview Party',
    description: 'Early taste of Key West\'s famous Fantasy Fest with themed costume parties, parades, and street celebrations along Duval Street.',
    longDescription: 'Key West\'s legendary Fantasy Fest energy never really stops, with preview parties and themed events throughout the year. This spring celebration brings the fantasy to life early with elaborate costume contests, themed street parties along Duval Street, drag performances, body painting exhibitions, and the iconic Key West spirit of uninhibited celebration and artistic self-expression.',
    venue: 'Duval Street, Key West', address: 'Duval St, Key West, FL 33040',
    startDate: d('2026-04-03'), endDate: d('2026-04-05'),
    price: 0, priceRange: 'Free', website: 'https://fantasyfest.com',
    categorySlug: 'nightlife', regionSlug: 'soflo', isFeatured: false,
    tags: ['outdoor-tag', 'nightlife-tag', 'festival'],
  },
  {
    title: 'Gainesville Artown Festival',
    description: 'Week-long arts celebration in downtown Gainesville with over 100 events including live music, theater, dance, visual art, and interactive workshops.',
    longDescription: 'Gainesville Artown is the city\'s most comprehensive celebration of the arts, transforming downtown Gainesville for one week with over 100 events spanning all artistic disciplines. From symphony performances and contemporary dance to street art activations and interactive workshops for all ages, Artown showcases the incredible creative talent of North Central Florida\'s arts community.',
    venue: 'Downtown Gainesville', address: 'Downtown Gainesville, FL 32601',
    startDate: d('2026-04-06'), endDate: d('2026-04-12'),
    price: 0, priceRange: 'Free – $25', website: 'https://www.gainesvillecreativealliance.com',
    categorySlug: 'arts-culture', regionSlug: 'central-florida', isFeatured: false,
    tags: ['free', 'art-tag', 'live-music', 'family-friendly', 'festival'],
  },
  {
    title: 'Miami Dolphins OTA Open Practice',
    description: 'Watch the Miami Dolphins prepare for the season at open Organized Team Activities at Baptist Health Training Complex.',
    longDescription: 'Get an exclusive behind-the-scenes look at the Miami Dolphins as they open their training facility to fans during select Organized Team Activities. Watch your favorite players work out, catch autographs, enjoy interactive fan zones, and get pumped for the upcoming season. Limited tickets available — this is a rare chance to see the team up close in an intimate setting.',
    venue: 'Baptist Health Training Complex', address: '347 Don Shula Dr, Miami Gardens, FL 33056',
    startDate: d('2026-05-27'), endDate: d('2026-05-27'),
    price: 0, priceRange: 'Free', website: 'https://www.miamidolphins.com',
    categorySlug: 'sports', regionSlug: 'soflo', isFeatured: false,
    tags: ['free', 'sports-tag', 'family-friendly'],
  },
  {
    title: 'Amelia Island Concours d\'Elegance',
    description: 'World-class classic car competition on the green of The Golf Club of Amelia Island featuring the rarest and most beautiful automobiles ever created.',
    longDescription: 'The Amelia Island Concours d\'Elegance is consistently ranked among the top three automotive events in the world, celebrating the artistry and history of the finest automobiles ever built. Held on the verdant 18th fairway of The Golf Club of Amelia Island, the concours features over 300 of the most rare, valuable, and significant vehicles in existence, from pre-war classics to race cars and coachbuilt masterpieces.',
    venue: 'The Golf Club of Amelia Island', address: '4700 Amelia Island Pkwy, Fernandina Beach, FL 32034',
    startDate: d('2026-03-06'), endDate: d('2026-03-08'),
    price: 60, priceRange: '$60 – $200', website: 'https://ameliaconcours.com',
    categorySlug: 'community', regionSlug: 'north-florida', isFeatured: false,
    tags: ['outdoor-tag', 'family-friendly', 'sports-tag'],
  },
  {
    title: 'South Beach Wine & Food Festival',
    description: 'World-renowned culinary event uniting the nation\'s top chefs, winemakers, and spirits producers for beachside tastings, dinners, and seminars.',
    longDescription: 'The South Beach Wine & Food Festival is one of the most acclaimed food and wine events in the world, benefiting the Chaplin School of Hospitality & Tourism Management at Florida International University. For four days, South Florida becomes a playground for food lovers, with celebrity chef demonstrations, wine tastings, spirits seminars, farm-to-table dinners, and spectacular beachfront events featuring the biggest names in the culinary world.',
    venue: 'Various venues, Miami Beach', address: 'Miami Beach, FL 33139',
    startDate: d('2026-03-12'), endDate: d('2026-03-15'),
    price: 75, priceRange: '$75 – $400', website: 'https://sobewff.org',
    categorySlug: 'food-drink', regionSlug: 'soflo', isFeatured: true,
    tags: ['food-drinks-tag', 'outdoor-tag', 'beach', 'festival'],
  },
  {
    title: 'Gasparilla Distance Classic',
    description: 'Tampa\'s iconic road race weekend featuring the nation\'s largest 15K race plus 5K and Half Marathon along Tampa\'s scenic Bayshore Boulevard.',
    longDescription: 'The Gasparilla Distance Classic is Tampa Bay\'s premier road racing event, drawing elite runners and recreational participants for a thrilling race along the world\'s longest continuous sidewalk — the iconic Bayshore Boulevard. The race weekend features a 15K, Half Marathon, 5K, and youth races, with stunning views of Hillsborough Bay and Tampa\'s skyline as your backdrop. One of the Southeast\'s most beloved running events.',
    venue: 'Bayshore Boulevard', address: 'Bayshore Blvd, Tampa, FL 33629',
    startDate: d('2026-03-08'), endDate: d('2026-03-08'),
    price: 45, priceRange: '$45 – $100', website: 'https://www.gasparilladistanceclassic.com',
    categorySlug: 'sports', regionSlug: 'tampa-bay', isFeatured: false,
    tags: ['sports-tag', 'outdoor-tag'],
  },
]

// ── Main ───────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n🌴 Seeding known Florida events...\n')

  const categories = await db.category.findMany()
  const regions = await db.region.findMany()
  const tags = await db.tag.findMany()

  const defaultCat = categories.find(c => c.slug === 'community') ?? categories[0]
  const defaultReg = regions.find(r => r.slug === 'soflo') ?? regions[0]

  if (!defaultCat || !defaultReg) {
    console.error('❌ No categories/regions found. Run seed-and-scrape.mjs first.')
    process.exit(1)
  }

  let saved = 0, featured = 0

  for (const ev of EVENTS) {
    const category = categories.find(c => c.slug === ev.categorySlug) ?? defaultCat
    const region = regions.find(r => r.slug === ev.regionSlug) ?? defaultReg
    const slug = slugify(ev.title)

    // Resolve tag IDs
    const tagConnects = (ev.tags ?? [])
      .map(tSlug => tags.find(t => t.slug === tSlug))
      .filter(Boolean)
      .map(t => ({ tagId: t.id }))

    try {
      await db.event.upsert({
        where: { slug },
        create: {
          slug,
          title: ev.title,
          description: ev.description,
          longDescription: ev.longDescription ?? null,
          venue: ev.venue,
          address: ev.address,
          startDate: ev.startDate,
          endDate: ev.endDate ?? null,
          price: ev.price ?? null,
          priceRange: ev.priceRange ?? null,
          imageUrl: null,
          website: ev.website,
          categoryId: category.id,
          regionId: region.id,
          isActive: true,
          isFeatured: ev.isFeatured ?? false,
          rating: rand(3.8, 5.0),
          reviewCount: randInt(15, 800),
          viewCount: randInt(100, 5000),
          tags: tagConnects.length > 0 ? { create: tagConnects } : undefined,
        },
        update: {
          title: ev.title,
          description: ev.description,
          longDescription: ev.longDescription ?? null,
          venue: ev.venue,
          address: ev.address,
          startDate: ev.startDate,
          endDate: ev.endDate ?? null,
          price: ev.price ?? null,
          priceRange: ev.priceRange ?? null,
          website: ev.website,
          categoryId: category.id,
          regionId: region.id,
          isFeatured: ev.isFeatured ?? false,
        },
      })
      saved++
      if (ev.isFeatured) featured++
      console.log(`   ✓ ${ev.title}`)
    } catch (err) {
      console.log(`   ✗ ${ev.title}: ${err.message}`)
    }
  }

  const total = await db.event.count()
  console.log(`\n✅ Done! Saved ${saved} events (${featured} featured). Total in DB: ${total}\n`)
}

main()
  .catch(e => { console.error('Fatal:', e); process.exit(1) })
  .finally(() => db.$disconnect())
