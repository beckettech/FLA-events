/**
 * Seed script for sponsorship system
 * Creates test sponsors and assigns them to events
 */

import { PrismaClient, SponsorTier } from '@prisma/client'

const db = new PrismaClient()

async function main() {
  console.log('🎯 Seeding sponsorship data...')

  // Create test sponsors
  const bronzeSponsor = await db.sponsor.upsert({
    where: { email: 'bronze@example.com' },
    update: {},
    create: {
      name: 'Local Coffee Shop',
      email: 'bronze@example.com',
      tier: SponsorTier.BRONZE,
      contactName: 'Jane Smith',
      phone: '555-0100',
      website: 'https://example.com/coffee',
      description: 'Your neighborhood coffee destination',
      monthlyBudget: 50,
      isActive: true,
    },
  })

  const silverSponsor = await db.sponsor.upsert({
    where: { email: 'silver@example.com' },
    update: {},
    create: {
      name: 'Miami Beach Hotel',
      email: 'silver@example.com',
      tier: SponsorTier.SILVER,
      contactName: 'John Doe',
      phone: '555-0200',
      website: 'https://example.com/hotel',
      description: 'Premium beachfront accommodations',
      monthlyBudget: 150,
      isActive: true,
    },
  })

  const goldSponsor = await db.sponsor.upsert({
    where: { email: 'gold@example.com' },
    update: {},
    create: {
      name: 'Florida Tourism Board',
      email: 'gold@example.com',
      tier: SponsorTier.GOLD,
      contactName: 'Sarah Johnson',
      phone: '555-0300',
      website: 'https://visitflorida.com',
      description: 'Official Florida tourism partner',
      monthlyBudget: 500,
      isActive: true,
    },
  })

  console.log('✅ Created 3 sponsors:', {
    bronze: bronzeSponsor.name,
    silver: silverSponsor.name,
    gold: goldSponsor.name,
  })

  // Get some active events to sponsor
  const events = await db.event.findMany({
    where: { isActive: true },
    take: 10,
    orderBy: { startDate: 'asc' },
  })

  if (events.length === 0) {
    console.log('⚠️  No events found to sponsor')
    return
  }

  console.log(`📍 Found ${events.length} events to sponsor`)

  // Assign Bronze sponsor to 2 events
  const bronzeEvents = events.slice(0, 2)
  for (const event of bronzeEvents) {
    try {
      await db.sponsoredEvent.create({
        data: {
          sponsorId: bronzeSponsor.id,
          eventId: event.id,
          placementType: 'featured',
          priority: 1,
          isActive: true,
        },
      })
      console.log(`  ✅ ${bronzeSponsor.name} → ${event.title}`)
    } catch (e: any) {
      if (e.code === 'P2002') {
        console.log(`  ⏭️  Already sponsored: ${event.title}`)
      } else {
        throw e
      }
    }
  }

  // Assign Silver sponsor to 4 events
  const silverEvents = events.slice(2, 6)
  for (const event of silverEvents) {
    try {
      await db.sponsoredEvent.create({
        data: {
          sponsorId: silverSponsor.id,
          eventId: event.id,
          placementType: 'featured',
          priority: 2,
          isActive: true,
        },
      })
      console.log(`  ✅ ${silverSponsor.name} → ${event.title}`)
    } catch (e: any) {
      if (e.code === 'P2002') {
        console.log(`  ⏭️  Already sponsored: ${event.title}`)
      } else {
        throw e
      }
    }
  }

  // Assign Gold sponsor to 4 events (higher priority)
  const goldEvents = events.slice(6, 10)
  for (const event of goldEvents) {
    try {
      await db.sponsoredEvent.create({
        data: {
          sponsorId: goldSponsor.id,
          eventId: event.id,
          placementType: 'featured',
          priority: 3,
          isActive: true,
        },
      })
      console.log(`  ✅ ${goldSponsor.name} → ${event.title}`)
    } catch (e: any) {
      if (e.code === 'P2002') {
        console.log(`  ⏭️  Already sponsored: ${event.title}`)
      } else {
        throw e
      }
    }
  }

  // Generate some sample analytics
  console.log('📊 Generating sample analytics...')
  const sponsoredEvents = await db.sponsoredEvent.findMany({
    where: { isActive: true },
    take: 5,
  })

  for (const se of sponsoredEvents) {
    // Create random impressions (50-200)
    const impressions = Math.floor(Math.random() * 150) + 50
    for (let i = 0; i < impressions; i++) {
      await db.sponsorAnalytic.create({
        data: {
          sponsorId: se.sponsorId,
          eventId: se.eventId,
          metric: 'impression',
        },
      })
    }

    // Create random clicks (5-20)
    const clicks = Math.floor(Math.random() * 15) + 5
    for (let i = 0; i < clicks; i++) {
      await db.sponsorAnalytic.create({
        data: {
          sponsorId: se.sponsorId,
          eventId: se.eventId,
          metric: 'click',
        },
      })
    }

    // Create random conversions (1-5)
    const conversions = Math.floor(Math.random() * 4) + 1
    for (let i = 0; i < conversions; i++) {
      await db.sponsorAnalytic.create({
        data: {
          sponsorId: se.sponsorId,
          eventId: se.eventId,
          metric: 'conversion',
        },
      })
    }
  }

  console.log('✅ Sample analytics generated')

  // Summary
  const sponsorCount = await db.sponsor.count()
  const sponsoredEventCount = await db.sponsoredEvent.count()
  const analyticCount = await db.sponsorAnalytic.count()

  console.log('\n🎉 Sponsorship system seeded successfully!')
  console.log(`   Sponsors: ${sponsorCount}`)
  console.log(`   Sponsored Events: ${sponsoredEventCount}`)
  console.log(`   Analytics Records: ${analyticCount}`)
}

main()
  .then(async () => {
    await db.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Error seeding sponsors:', e)
    await db.$disconnect()
    process.exit(1)
  })
