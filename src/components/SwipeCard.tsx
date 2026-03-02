'use client'

import { useState, useCallback } from 'react'
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { X, Heart } from 'lucide-react'

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
  const [exitDirection, setExitDirection] = useState<'left' | 'right' | null>(null)
  
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-200, 200], [-25, 25])
  const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0.5, 1, 1, 1, 0.5])

  // Trigger haptic feedback if available
  const triggerHaptic = useCallback((type: 'light' | 'medium' | 'heavy' = 'light') => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      const patterns = { light: 10, medium: 20, heavy: 30 }
      navigator.vibrate(patterns[type])
    }
  }, [])

  const handleDragEnd = useCallback((event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 100
    const velocity = info.velocity.x

    // Fast swipe or drag past threshold
    if (Math.abs(velocity) > 500 || Math.abs(info.offset.x) > threshold) {
      triggerHaptic('medium')
      if (info.offset.x > 0) {
        setExitDirection('right')
        setTimeout(() => onSwipeRight(), 150)
      } else {
        setExitDirection('left')
        setTimeout(() => onSwipeLeft(), 150)
      }
    } else {
      // Snap back
      x.set(0)
    }
  }, [onSwipeLeft, onSwipeRight, triggerHaptic, x])

  const handleButtonSwipe = useCallback((direction: 'left' | 'right') => {
    triggerHaptic('medium')
    setExitDirection(direction)
    setTimeout(() => {
      if (direction === 'left') onSwipeLeft()
      else onSwipeRight()
    }, 150)
  }, [onSwipeLeft, onSwipeRight, triggerHaptic])

  // Format date
  const eventDate = new Date(event.startDate).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })

  // Determine overlay color based on drag
  const overlayOpacity = useTransform(
    x,
    [-200, -50, 0, 50, 200],
    [0.6, 0, 0, 0, 0.6]
  )

  return (
    <motion.div
      style={{ x, rotate, opacity }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={1}
      onDragEnd={handleDragEnd}
      animate={
        exitDirection
          ? { x: exitDirection === 'right' ? 500 : -500, opacity: 0 }
          : {}
      }
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="relative cursor-grab active:cursor-grabbing select-none touch-none"
    >
      <Card className="h-full overflow-hidden shadow-2xl">
        <CardContent className="p-0 h-full flex flex-col relative">
          {/* Image */}
          {event.imageUrl && (
            <div className="relative w-full h-80 overflow-hidden bg-gray-200 dark:bg-gray-700">
              <img loading="lazy" decoding="async"
                src={event.imageUrl}
                alt={event.title}
                className="w-full h-full object-cover"
                draggable={false}
              />
              
              {/* Left swipe overlay (red) */}
              <motion.div
                style={{
                  opacity: useTransform(x, [-200, -50, 0], [0.7, 0, 0]),
                }}
                className="absolute inset-0 bg-red-500/30 flex items-center justify-center pointer-events-none"
              >
                <motion.div
                  style={{
                    scale: useTransform(x, [-200, -50, 0], [1.2, 0.8, 0]),
                  }}
                  className="bg-red-500 text-white rounded-full p-6 shadow-2xl"
                >
                  <X className="w-12 h-12 stroke-[3]" />
                </motion.div>
              </motion.div>

              {/* Right swipe overlay (green) */}
              <motion.div
                style={{
                  opacity: useTransform(x, [0, 50, 200], [0, 0, 0.7]),
                }}
                className="absolute inset-0 bg-green-500/30 flex items-center justify-center pointer-events-none"
              >
                <motion.div
                  style={{
                    scale: useTransform(x, [0, 50, 200], [0, 0.8, 1.2]),
                  }}
                  className="bg-green-500 text-white rounded-full p-6 shadow-2xl"
                >
                  <Heart className="w-12 h-12 fill-white stroke-[3]" />
                </motion.div>
              </motion.div>
            </div>
          )}

          {/* Content */}
          <div className="flex-1 p-6 flex flex-col justify-between bg-white dark:bg-gray-900">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 line-clamp-2">
                {event.title}
              </h3>
              <p className="text-base text-gray-600 dark:text-gray-400 mb-2 font-medium">
                📍 {event.venue}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
                📅 {eventDate}
              </p>
              <p className="text-base text-gray-700 dark:text-gray-300 line-clamp-3">
                {event.description}
              </p>
            </div>

            {/* Price */}
            <div className="mt-4 pt-4 border-t dark:border-gray-700">
              {event.price || event.priceRange ? (
                <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {event.priceRange || `$${event.price}`}
                </span>
              ) : (
                <span className="text-lg font-bold text-green-600">Free</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons - Large touch targets */}
      <div className="absolute bottom-8 left-0 right-0 flex gap-4 px-6 z-10 pointer-events-auto">
        <Button
          variant="outline"
          size="lg"
          onClick={() => handleButtonSwipe('left')}
          className="flex-1 h-14 gap-2 text-base font-semibold border-2 border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-950 active:scale-95 transition-transform touch-manipulation"
          style={{ minHeight: '56px', minWidth: '44px' }}
        >
          <X className="w-6 h-6" /> Skip
        </Button>
        <Button
          variant="default"
          size="lg"
          onClick={() => handleButtonSwipe('right')}
          className="flex-1 h-14 gap-2 text-base font-semibold bg-green-600 hover:bg-green-700 active:scale-95 transition-transform touch-manipulation"
          style={{ minHeight: '56px', minWidth: '44px' }}
        >
          <Heart className="w-6 h-6" /> Save
        </Button>
      </div>
    </motion.div>
  )
}
