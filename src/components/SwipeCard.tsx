'use client'

import { useRef, useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, X, Heart } from 'lucide-react'

interface SwipeCardProps {
  event: {
    id: string
    title: string
    description: string
    imageUrl?: string | null
    venue: string
    startDate: string
    price?: number | null
    priceRange?: string | null
  }
  onSwipeLeft: () => void
  onSwipeRight: () => void
  onClose?: () => void
}

export default function SwipeCard({
  event,
  onSwipeLeft,
  onSwipeRight,
  onClose,
}: SwipeCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [startX, setStartX] = useState<number | null>(null)
  const [currentX, setCurrentX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [dragDirection, setDragDirection] = useState<'left' | 'right' | null>(null)

  const SWIPE_THRESHOLD = 100 // pixels to trigger swipe

  const handleMouseDown = (e: React.MouseEvent) => {
    setStartX(e.clientX)
    setIsDragging(true)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX)
    setIsDragging(true)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (startX === null || !isDragging) return
    const diff = e.clientX - startX
    setCurrentX(diff)
    setDragDirection(diff > 0 ? 'right' : diff < 0 ? 'left' : null)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startX === null || !isDragging) return
    const diff = e.touches[0].clientX - startX
    setCurrentX(diff)
    setDragDirection(diff > 0 ? 'right' : diff < 0 ? 'left' : null)
  }

  const handleMouseUp = () => {
    if (!isDragging) return
    finalizeDrag()
  }

  const handleTouchEnd = () => {
    if (!isDragging) return
    finalizeDrag()
  }

  const finalizeDrag = () => {
    setIsDragging(false)

    if (Math.abs(currentX) >= SWIPE_THRESHOLD) {
      if (currentX > 0) {
        // Swipe right (save)
        onSwipeRight()
      } else {
        // Swipe left (skip)
        onSwipeLeft()
      }
    }

    // Reset
    setStartX(null)
    setCurrentX(0)
    setDragDirection(null)
  }

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMoveGlobal = (e: MouseEvent) => {
      handleMouseMove(e as unknown as React.MouseEvent)
    }

    const handleTouchMoveGlobal = (e: TouchEvent) => {
      handleTouchMove(e as unknown as React.TouchEvent)
    }

    document.addEventListener('mousemove', handleMouseMoveGlobal)
    document.addEventListener('touchmove', handleTouchMoveGlobal)
    document.addEventListener('mouseup', handleMouseUp)
    document.addEventListener('touchend', handleTouchEnd)

    return () => {
      document.removeEventListener('mousemove', handleMouseMoveGlobal)
      document.removeEventListener('touchmove', handleTouchMoveGlobal)
      document.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [isDragging, startX, currentX])

  // Format date
  const eventDate = new Date(event.startDate).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })

  return (
    <div
      ref={cardRef}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      className="relative cursor-grab active:cursor-grabbing select-none"
      style={{
        transform: `translateX(${currentX}px) rotate(${currentX * 0.1}deg)`,
        transition: isDragging ? 'none' : 'all 0.3s ease-out',
        opacity: Math.max(0.5, 1 - Math.abs(currentX) / 300),
      }}
    >
      <Card className="h-full overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
        <CardContent className="p-0 h-full flex flex-col">
          {/* Image */}
          {event.imageUrl && (
            <div className="relative w-full h-64 overflow-hidden bg-gray-200 dark:bg-gray-700">
              <img
                src={event.imageUrl}
                alt={event.title}
                className="w-full h-full object-cover"
              />
              {/* Swipe direction overlay */}
              {dragDirection === 'right' && (
                <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                  <div className="bg-green-500 text-white rounded-full p-4">
                    <Heart className="w-8 h-8 fill-white" />
                  </div>
                </div>
              )}
              {dragDirection === 'left' && (
                <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                  <div className="bg-red-500 text-white rounded-full p-4">
                    <X className="w-8 h-8" />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Content */}
          <div className="flex-1 p-4 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">
                {event.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                {event.venue}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mb-3">
                {eventDate}
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                {event.description}
              </p>
            </div>

            {/* Price / Button Row */}
            <div className="mt-4 pt-4 border-t dark:border-gray-700 flex items-center justify-between">
              {event.price || event.priceRange ? (
                <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                  {event.priceRange || `$${event.price}`}
                </span>
              ) : (
                <span className="text-sm text-gray-500">Free</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Button Hints (Mobile) */}
      <div className="absolute bottom-4 left-4 right-4 flex gap-2 z-10">
        <Button
          variant="outline"
          size="sm"
          onClick={onSwipeLeft}
          className="flex-1 gap-2"
        >
          <X className="w-4 h-4" /> Skip
        </Button>
        <Button
          variant="default"
          size="sm"
          onClick={onSwipeRight}
          className="flex-1 gap-2 bg-blue-600 hover:bg-blue-700"
        >
          <Heart className="w-4 h-4" /> Save
        </Button>
      </div>
    </div>
  )
}
