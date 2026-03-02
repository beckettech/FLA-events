'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Share2 } from 'lucide-react'
import ShareModal from './ShareModal'

interface ShareButtonProps {
  eventId: string
  eventTitle: string
  eventSlug: string
  eventDescription?: string
  className?: string
  variant?: 'default' | 'outline' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  iconOnly?: boolean
}

export default function ShareButton({
  eventId,
  eventTitle,
  eventSlug,
  eventDescription,
  className = '',
  variant = 'outline',
  size = 'default',
  iconOnly = false,
}: ShareButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Check if native Web Share API is available
  const hasNativeShare = typeof navigator !== 'undefined' && 'share' in navigator

  const handleShare = async () => {
    // If native share is available and user is on mobile, use it
    if (hasNativeShare && window.innerWidth < 768) {
      try {
        const shareUrl = `${window.location.origin}/events/${eventSlug}`
        
        await navigator.share({
          title: eventTitle,
          text: eventDescription || `Check out ${eventTitle} on FLA Events`,
          url: shareUrl,
        })

        // Track native share
        await fetch('/api/analytics/share', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventId,
            platform: 'native',
            successful: true,
          }),
        })
      } catch (err) {
        // User cancelled or error occurred
        if ((err as Error).name !== 'AbortError') {
          // If share failed, fall back to modal
          setIsModalOpen(true)
        }
      }
    } else {
      // Desktop or native share not available - open modal
      setIsModalOpen(true)
    }
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleShare}
        className={className}
      >
        <Share2 className={iconOnly ? '' : 'mr-2'} size={16} />
        {!iconOnly && 'Share'}
      </Button>

      <ShareModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        eventId={eventId}
        eventTitle={eventTitle}
        eventSlug={eventSlug}
        eventDescription={eventDescription}
      />
    </>
  )
}
