'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import ShareButton from '@/components/ShareButton'
import SponsoredBadge from '@/components/SponsoredBadge'
import { toast } from '@/hooks/use-toast'
import {
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  Phone,
  Globe,
  ArrowLeft,
  Heart,
  Bookmark,
  BookmarkCheck,
} from 'lucide-react'

interface EventDetailClientProps {
  event: any
  referrerId?: string
}

export default function EventDetailClient({ event, referrerId }: EventDetailClientProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [isSaved, setIsSaved] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Track referral on mount
  useEffect(() => {
    if (referrerId && referrerId !== session?.user?.id) {
      fetch('/api/referrals/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referrerId,
          eventId: event.id,
          metadata: {
            source: 'event_page',
            timestamp: new Date().toISOString(),
          },
        }),
      }).catch(err => console.error('Failed to track referral:', err))
    }
  }, [referrerId, event.id, session])

  // Check if event is saved
  useEffect(() => {
    if (session?.user) {
      checkSavedStatus()
    }
  }, [session])

  const checkSavedStatus = async () => {
    try {
      const res = await fetch('/api/saved-events')
      const data = await res.json()
      setIsSaved(data.savedEvents?.some((e: any) => e.eventId === event.id))
    } catch (error) {
      console.error('Failed to check saved status:', error)
    }
  }

  const toggleSaveEvent = async () => {
    if (!session) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to save events',
      })
      router.push('/auth/signin')
      return
    }

    setIsLoading(true)
    try {
      const method = isSaved ? 'DELETE' : 'POST'
      const res = await fetch('/api/saved-events', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: event.id }),
      })

      if (res.ok) {
        setIsSaved(!isSaved)
        toast({
          title: isSaved ? 'Event removed' : 'Event saved!',
          description: isSaved 
            ? 'Event removed from your saved list' 
            : 'Event added to your saved list',
        })

        // Track conversion if this was a referral
        if (!isSaved && referrerId) {
          await fetch('/api/referrals/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              referrerId,
              eventId: event.id,
              metadata: { conversion: 'save_event' },
            }),
          })
        }
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update saved status',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const sponsor = event.sponsoredEvents?.[0]?.sponsor

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white dark:bg-gray-800 border-b">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeft size={20} />
          </Button>
          <div className="flex items-center gap-2">
            <ShareButton
              eventId={event.id}
              eventTitle={event.title}
              eventSlug={event.slug}
              eventDescription={event.description}
              variant="ghost"
              size="icon"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSaveEvent}
              disabled={isLoading}
            >
              {isSaved ? (
                <BookmarkCheck size={20} className="text-blue-600" />
              ) : (
                <Bookmark size={20} />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Hero Image */}
        {event.imageUrl && (
          <div className="relative w-full h-64 sm:h-96 rounded-lg overflow-hidden">
            <Image
              src={event.imageUrl}
              alt={event.title}
              fill
              className="object-cover"
              priority
            />
            {sponsor && (
              <div className="absolute top-4 right-4">
                <SponsoredBadge sponsor={sponsor} />
              </div>
            )}
          </div>
        )}

        {/* Event Details Card */}
        <Card>
          <CardContent className="p-6 space-y-4">
            {/* Title and Category */}
            <div>
              <Badge className="mb-2" style={{ backgroundColor: event.category.color }}>
                {event.category.name}
              </Badge>
              <h1 className="text-3xl font-bold mb-2">{event.title}</h1>
              <p className="text-gray-600 dark:text-gray-400">
                {event.description}
              </p>
            </div>

            {/* Date and Time */}
            <div className="flex items-start gap-3">
              <Calendar className="text-blue-600 mt-1" size={20} />
              <div>
                <div className="font-semibold">{formatDate(event.startDate)}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {formatTime(event.startDate)}
                  {event.endDate && ` - ${formatTime(event.endDate)}`}
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="flex items-start gap-3">
              <MapPin className="text-red-600 mt-1" size={20} />
              <div>
                <div className="font-semibold">{event.venue}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {event.address}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-500">
                  {event.region.name}
                </div>
              </div>
            </div>

            {/* Price */}
            {(event.price || event.priceRange) && (
              <div className="flex items-center gap-3">
                <DollarSign className="text-green-600" size={20} />
                <div className="font-semibold">
                  {event.price ? `$${event.price}` : event.priceRange}
                </div>
              </div>
            )}

            {/* Tags */}
            {event.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {event.tags.map((tagRel: any) => (
                  <Badge
                    key={tagRel.tag.id}
                    variant="outline"
                    style={{ borderColor: tagRel.tag.color }}
                  >
                    {tagRel.tag.name}
                  </Badge>
                ))}
              </div>
            )}

            {/* Long Description */}
            {event.longDescription && (
              <div className="pt-4 border-t">
                <h2 className="font-semibold text-lg mb-2">About This Event</h2>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {event.longDescription}
                </p>
              </div>
            )}

            {/* Contact Info */}
            <div className="pt-4 border-t space-y-3">
              {event.website && (
                <a
                  href={event.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-blue-600 hover:underline"
                >
                  <Globe size={18} />
                  Visit Website
                </a>
              )}
              {event.phone && (
                <a
                  href={`tel:${event.phone}`}
                  className="flex items-center gap-2 text-blue-600 hover:underline"
                >
                  <Phone size={18} />
                  {event.phone}
                </a>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={toggleSaveEvent}
                disabled={isLoading}
                className="flex-1"
                variant={isSaved ? 'outline' : 'default'}
              >
                {isSaved ? (
                  <>
                    <BookmarkCheck className="mr-2" size={18} />
                    Saved
                  </>
                ) : (
                  <>
                    <Bookmark className="mr-2" size={18} />
                    Save Event
                  </>
                )}
              </Button>
              <ShareButton
                eventId={event.id}
                eventTitle={event.title}
                eventSlug={event.slug}
                eventDescription={event.description}
                className="flex-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Map Preview */}
        <Card>
          <CardContent className="p-0">
            <div className="h-64 bg-gray-200 dark:bg-gray-700 relative overflow-hidden rounded-b-lg">
              <iframe
                width="100%"
                height="100%"
                frameBorder="0"
                style={{ border: 0 }}
                src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}&q=${encodeURIComponent(event.address)}`}
                allowFullScreen
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
