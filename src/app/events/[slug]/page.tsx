import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import EventDetailClient from './EventDetailClient'

interface PageProps {
  params: { slug: string }
  searchParams: { ref?: string }
}

// Generate metadata for OG tags
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const event = await prisma.event.findUnique({
    where: { slug: params.slug },
    include: {
      category: true,
      region: true,
    },
  })

  if (!event) {
    return {
      title: 'Event Not Found',
    }
  }

  const title = `${event.title} | FLA Events`
  const description = event.description || `Join us for ${event.title} at ${event.venue}`
  const imageUrl = event.imageUrl || `${process.env.NEXT_PUBLIC_BASE_URL}/og-default.jpg`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: event.title,
        },
      ],
      type: 'website',
      locale: 'en_US',
      siteName: 'FLA Events',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  }
}

export default async function EventPage({ params, searchParams }: PageProps) {
  const event = await prisma.event.findUnique({
    where: { slug: params.slug },
    include: {
      category: true,
      region: true,
      tags: {
        include: {
          tag: true,
        },
      },
      sponsoredEvents: {
        where: { isActive: true },
        include: {
          sponsor: true,
        },
        orderBy: { priority: 'desc' },
        take: 1,
      },
    },
  })

  if (!event) {
    notFound()
  }

  // Increment view count
  await prisma.event.update({
    where: { id: event.id },
    data: { viewCount: { increment: 1 } },
  })

  return (
    <EventDetailClient
      event={event}
      referrerId={searchParams.ref}
    />
  )
}

// Generate static params for popular events (optional)
export async function generateStaticParams() {
  const events = await prisma.event.findMany({
    where: { isActive: true },
    select: { slug: true },
    take: 100, // Generate static pages for top 100 events
    orderBy: { viewCount: 'desc' },
  })

  return events.map((event) => ({
    slug: event.slug,
  }))
}
