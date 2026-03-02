'use client'

import { Star } from 'lucide-react'
import { useEffect } from 'react'

interface SponsoredBadgeProps {
  sponsor: {
    id: string
    name: string
    logoUrl?: string | null
    website?: string | null
    tier: string
  }
  eventId: string
  variant?: 'compact' | 'full'
  trackImpression?: boolean
}

export default function SponsoredBadge({
  sponsor,
  eventId,
  variant = 'compact',
  trackImpression = true,
}: SponsoredBadgeProps) {
  // Track impression on mount
  useEffect(() => {
    if (trackImpression) {
      fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          sponsorId: sponsor.id,
          metric: 'impression',
        }),
      }).catch(() => {
        // Silently fail
      })
    }
  }, [eventId, sponsor.id, trackImpression])

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    
    // Track click
    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventId,
        sponsorId: sponsor.id,
        metric: 'click',
      }),
    }).catch(() => {
      // Silently fail
    })

    // Open sponsor website if available
    if (sponsor.website) {
      window.open(sponsor.website, '_blank', 'noopener,noreferrer')
    }
  }

  if (variant === 'compact') {
    return (
      <div
        onClick={handleClick}
        className="inline-flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 rounded-full text-xs font-semibold cursor-pointer hover:from-yellow-500 hover:to-yellow-600 transition-all shadow-sm"
      >
        <Star className="w-3 h-3 fill-current" />
        <span>Sponsored</span>
      </div>
    )
  }

  return (
    <div
      onClick={handleClick}
      className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg cursor-pointer hover:shadow-md transition-all"
    >
      {sponsor.logoUrl ? (
        <img
          src={sponsor.logoUrl}
          alt={sponsor.name}
          className="w-8 h-8 rounded-full object-cover"
        />
      ) : (
        <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center">
          <Star className="w-4 h-4 text-gray-900 fill-current" />
        </div>
      )}
      <div className="flex-1">
        <div className="flex items-center gap-1">
          <Star className="w-3 h-3 text-yellow-600 dark:text-yellow-400 fill-current" />
          <span className="text-xs font-semibold text-yellow-900 dark:text-yellow-100">
            Sponsored by {sponsor.name}
          </span>
        </div>
        {sponsor.tier && (
          <span className="text-xs text-yellow-700 dark:text-yellow-300">
            {sponsor.tier} Partner
          </span>
        )}
      </div>
    </div>
  )
}
