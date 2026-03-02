'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from '@/hooks/use-toast'
import {
  Twitter,
  Facebook,
  Linkedin,
  Mail,
  MessageSquare,
  Copy,
  Check,
} from 'lucide-react'

interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
  eventId: string
  eventTitle: string
  eventSlug: string
  eventDescription?: string
}

export default function ShareModal({
  isOpen,
  onClose,
  eventId,
  eventTitle,
  eventSlug,
  eventDescription,
}: ShareModalProps) {
  const { data: session } = useSession()
  const [copied, setCopied] = useState(false)
  const [shareUrl, setShareUrl] = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Generate shareable URL with ref parameter if user is logged in
      const baseUrl = `${window.location.origin}/events/${eventSlug}`
      const url = session?.user?.id
        ? `${baseUrl}?ref=${session.user.id}`
        : baseUrl
      setShareUrl(url)
    }
  }, [eventSlug, session])

  const trackShare = async (platform: string, successful: boolean = true) => {
    try {
      await fetch('/api/analytics/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          platform,
          successful,
        }),
      })
    } catch (error) {
      console.error('Failed to track share:', error)
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      trackShare('copy')
      toast({
        title: 'Link copied!',
        description: 'Share link copied to clipboard',
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast({
        title: 'Failed to copy',
        description: 'Please try again',
        variant: 'destructive',
      })
    }
  }

  const shareToTwitter = () => {
    const text = `Check out ${eventTitle}! 🎉`
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`
    window.open(url, '_blank', 'width=550,height=420')
    trackShare('twitter')
  }

  const shareToFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
    window.open(url, '_blank', 'width=550,height=420')
    trackShare('facebook')
  }

  const shareToLinkedIn = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`
    window.open(url, '_blank', 'width=550,height=420')
    trackShare('linkedin')
  }

  const shareToWhatsApp = () => {
    const text = `Check out ${eventTitle}! ${shareUrl}`
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`
    window.open(url, '_blank')
    trackShare('whatsapp')
  }

  const shareViaSMS = () => {
    const text = `Check out ${eventTitle}! ${shareUrl}`
    const url = `sms:?body=${encodeURIComponent(text)}`
    window.location.href = url
    trackShare('sms')
  }

  const shareViaEmail = () => {
    const subject = `Check out ${eventTitle}`
    const body = `I thought you might be interested in this event:\n\n${eventTitle}\n\n${eventDescription || ''}\n\n${shareUrl}`
    const url = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    window.location.href = url
    trackShare('email')
  }

  const shareButtons = [
    {
      name: 'Twitter',
      icon: Twitter,
      onClick: shareToTwitter,
      color: 'hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950',
    },
    {
      name: 'Facebook',
      icon: Facebook,
      onClick: shareToFacebook,
      color: 'hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-950',
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      onClick: shareToLinkedIn,
      color: 'hover:bg-blue-50 hover:text-blue-800 dark:hover:bg-blue-950',
    },
    {
      name: 'WhatsApp',
      icon: MessageSquare,
      onClick: shareToWhatsApp,
      color: 'hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-950',
    },
    {
      name: 'SMS',
      icon: MessageSquare,
      onClick: shareViaSMS,
      color: 'hover:bg-purple-50 hover:text-purple-600 dark:hover:bg-purple-950',
    },
    {
      name: 'Email',
      icon: Mail,
      onClick: shareViaEmail,
      color: 'hover:bg-gray-50 hover:text-gray-600 dark:hover:bg-gray-800',
    },
  ]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Event</DialogTitle>
          <DialogDescription>
            Share this event with your friends and earn referral credit!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Copy Link Section */}
          <div className="flex items-center space-x-2">
            <Input
              readOnly
              value={shareUrl}
              className="flex-1"
            />
            <Button
              type="button"
              size="icon"
              variant="outline"
              onClick={copyToClipboard}
              className="shrink-0"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>

          {/* Share Buttons Grid */}
          <div className="grid grid-cols-3 gap-2">
            {shareButtons.map((button) => {
              const Icon = button.icon
              return (
                <Button
                  key={button.name}
                  variant="outline"
                  onClick={button.onClick}
                  className={`flex flex-col items-center justify-center h-20 ${button.color}`}
                >
                  <Icon className="h-5 w-5 mb-1" />
                  <span className="text-xs">{button.name}</span>
                </Button>
              )
            })}
          </div>

          {/* Referral Info */}
          {session?.user && (
            <div className="text-xs text-muted-foreground text-center p-3 bg-muted rounded-lg">
              💡 Your referral link tracks sign-ups and saved events. Check your stats in your profile!
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
