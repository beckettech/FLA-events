'use client'

// Updated for regions and tags
import { useEffect, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { toast } from '@/hooks/use-toast'
import {
  Search,
  MapPin,
  Calendar,
  Music,
  UtensilsCrossed,
  Palette,
  Volleyball,
  Moon,
  Sun,
  Heart,
  PartyPopper,
  ChevronRight,
  DollarSign,
  X,
  Home as HomeIcon,
  Compass,
  Bell,
  User,
  Plus,
  Map,
  Settings,
  Pencil,
  Trash2,
  ChevronDown,
  ToggleLeft,
  ToggleRight,
  Save,
  Check,
  SlidersHorizontal,
  Zap,
  Star,
  Car,
  Globe,
  Ticket,
  Navigation2,
  Share2,
  Bookmark,
} from 'lucide-react'

// Dynamic imports
const MapView = dynamic(() => import('@/components/map/MapView'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-gray-500 dark:text-gray-400">Loading map...</p>
      </div>
    </div>
  ),
})

const SwipeCard = dynamic(() => import('@/components/SwipeCard'), {
  ssr: false,
  loading: () => (
    <div className="h-64 w-full bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
  ),
})

const SponsoredBadge = dynamic(() => import('@/components/SponsoredBadge'), {
  ssr: false,
})

// Types
interface Category {
  id: string
  name: string
  slug: string
  icon: string
  color: string
  description: string | null
  _count?: { events: number }
}

interface Region {
  id: string
  name: string
  slug: string
  description: string | null
  latitude: number
  longitude: number
  zoom: number
  _count?: { events: number }
}

interface Tag {
  id: string
  name: string
  slug: string
  icon: string | null
  color: string
  description: string | null
  _count?: { events: number }
}

interface Sponsor {
  id: string
  name: string
  logoUrl: string | null
  website: string | null
  tier: string
}

interface SponsoredEvent {
  id: string
  placementType: string
  priority: number
  sponsor: Sponsor
}

interface Event {
  id: string
  title: string
  slug: string
  description: string
  longDescription: string | null
  venue: string
  address: string
  latitude: number
  longitude: number
  startDate: string
  endDate: string | null
  price: number | null
  priceRange: string | null
  imageUrl: string | null
  website: string | null
  phone: string | null
  rating: number
  reviewCount: number
  viewCount: number
  isFeatured: boolean
  category: Category
  region: Region
  secondaryRegion: Region | null
  tags: Tag[]
  sponsoredEvents?: SponsoredEvent[]
}

// Category icons mapping
const categoryIcons: Record<string, React.ReactNode> = {
  'Music': <Music className="w-6 h-6" />,
  'Utensils': <UtensilsCrossed className="w-6 h-6" />,
  'Palette': <Palette className="w-6 h-6" />,
  'Trophy': <Volleyball className="w-6 h-6" />,
  'Moon': <Moon className="w-6 h-6" />,
  'Users': <Heart className="w-6 h-6" />,
  'PartyPopper': <PartyPopper className="w-6 h-6" />,
  'Car': <Car className="w-6 h-6" />,
}

// Region center coordinates for map zoom
const regionMapFocus: Record<string, { center: [number, number]; zoom: number }> = {
  'soflo': { center: [25.9, -80.3], zoom: 10 },
  'tampa-bay': { center: [27.9, -82.5], zoom: 10 },
  'central-florida': { center: [28.5, -81.4], zoom: 10 },
  'swfl': { center: [26.5, -81.8], zoom: 10 },
  'north-florida': { center: [30.3, -82.0], zoom: 9 },
  'panhandle': { center: [30.5, -86.5], zoom: 9 },
}

// Format date
function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

// Format time
function formatTime(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

// Extract city from a US address string, fall back to regionName
function cityFromAddress(address: string | undefined, regionName: string): string {
  if (!address) return regionName
  const parts = address.split(',').map(s => s.trim()).filter(Boolean)
  if (parts.length < 2) return regionName
  // Last segment is usually "FL 33101" or "FL" — second-to-last is the city
  const city = parts[parts.length - 2]
  if (city && city.length > 1 && !/^\d+$/.test(city)) return city
  return regionName
}

// Sponsored stories — temp ad placeholders
interface SponsoredStory {
  id: string
  title: string
  subtitle: string
  emoji: string
  ringGradient: string
  bgGradient: string
  date: string
  venue: string
  price: string
  description: string
  ctaText: string
}

const SPONSORED_STORIES: SponsoredStory[] = [
  {
    id: 'sp-heat',
    title: 'Heat vs Lakers',
    subtitle: 'NBA · Mar 15',
    emoji: '🏀',
    ringGradient: 'from-red-500 to-yellow-400',
    bgGradient: 'from-red-950 via-red-800 to-yellow-900',
    date: 'Mar 15, 2026',
    venue: 'Kaseya Center, Miami',
    price: 'From $89',
    description: 'Watch the Miami Heat take on the LA Lakers in a high-stakes regular season battle at Kaseya Center. South Beach basketball at its best.',
    ctaText: 'Get Tickets',
  },
  {
    id: 'sp-postmalone',
    title: 'Post Malone',
    subtitle: 'F-1 Trillion Tour',
    emoji: '🎤',
    ringGradient: 'from-purple-500 to-pink-500',
    bgGradient: 'from-purple-950 via-purple-800 to-pink-900',
    date: 'Apr 2, 2026',
    venue: 'Hard Rock Stadium, Miami',
    price: 'From $125',
    description: 'Post Malone brings his F-1 Trillion World Tour to South Florida for one of the biggest shows of the year at Hard Rock Stadium.',
    ctaText: 'Get Tickets',
  },
  {
    id: 'sp-rays',
    title: 'Rays vs Yankees',
    subtitle: 'MLB Opening Series',
    emoji: '⚾',
    ringGradient: 'from-blue-600 to-sky-400',
    bgGradient: 'from-blue-950 via-blue-800 to-sky-900',
    date: 'Mar 28, 2026',
    venue: 'Tropicana Field, St. Pete',
    price: 'From $35',
    description: 'Opening series matchup as the Tampa Bay Rays face off against the New York Yankees at Tropicana Field. Opening Day energy.',
    ctaText: 'Get Tickets',
  },
  {
    id: 'sp-zachbryan',
    title: 'Zach Bryan',
    subtitle: 'Quittin Time Tour',
    emoji: '🤠',
    ringGradient: 'from-amber-500 to-orange-400',
    bgGradient: 'from-amber-950 via-amber-800 to-orange-900',
    date: 'May 10, 2026',
    venue: 'Amalie Arena, Tampa',
    price: 'From $99',
    description: 'Country superstar Zach Bryan brings The Quittin Time Tour to Amalie Arena. An unforgettable night of live country music in Tampa.',
    ctaText: 'Get Tickets',
  },
  {
    id: 'sp-lightning',
    title: 'Lightning vs Bruins',
    subtitle: 'NHL · Mar 22',
    emoji: '🏒',
    ringGradient: 'from-blue-400 to-cyan-400',
    bgGradient: 'from-slate-950 via-blue-900 to-cyan-900',
    date: 'Mar 22, 2026',
    venue: 'Amalie Arena, Tampa',
    price: 'From $65',
    description: 'Tampa Bay Lightning host the Boston Bruins in a critical playoff-race game. Electric atmosphere guaranteed at Amalie Arena.',
    ctaText: 'Get Tickets',
  },
]

export default function FLEventsApp() {
  const { theme, setTheme } = useTheme()
  const [activeTab, setActiveTab] = useState<'home' | 'map' | 'explore' | 'saved' | 'profile'>('home')
  const [events, setEvents] = useState<Event[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [regions, setRegions] = useState<Region[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [featuredEvents, setFeaturedEvents] = useState<Event[]>([])
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedRegion, setSelectedRegion] = useState<string | null>(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('fl_region') || null
    return null
  })
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [showRegionSelect, setShowRegionSelect] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [loading, setLoading] = useState(true)
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null)
  const [mapZoom, setMapZoom] = useState<number | null>(null)
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null)
  const [storyDetailsOpen, setStoryDetailsOpen] = useState(false)
  const [storyTouchStartY, setStoryTouchStartY] = useState<number | null>(null)
  const [savedEventIds, setSavedEventIds] = useState<string[]>(() => {
    if (typeof window === 'undefined') return []
    try {
      const raw = localStorage.getItem('saved_events')
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  })

  // Swipe mode — show one event at a time for Tinder-style swiping
  const [swipeMode, setSwipeMode] = useState(false)
  const [swipeIndex, setSwipeIndex] = useState(0)
  const [swipedEventIds, setSwipedEventIds] = useState<Set<string>>(new Set())

  // God Mode — toggled from /dev, persisted in localStorage
  // Must initialize as false to match server render, then sync after mount
  const [godMode, setGodMode] = useState(false)
  useEffect(() => {
    try { setGodMode(localStorage.getItem('god_mode') === '1') } catch { /* ignore */ }
  }, [])
  const [godEditingEvent, setGodEditingEvent] = useState<Event | null>(null)
  const [godForm, setGodForm] = useState<Record<string, string | number | boolean | null>>({})
  const [godSaving, setGodSaving] = useState(false)
  const [godSaveMsg, setGodSaveMsg] = useState('')

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventsRes, categoriesRes, regionsRes, tagsRes] = await Promise.all([
          fetch('/api/events'),
          fetch('/api/categories'),
          fetch('/api/regions'),
          fetch('/api/tags'),
        ])

        if (!eventsRes.ok || !categoriesRes.ok || !regionsRes.ok || !tagsRes.ok) {
          throw new Error('Failed to load data')
        }

        const eventsData = await eventsRes.json()
        const categoriesData = await categoriesRes.json()
        const regionsData = await regionsRes.json()
        const tagsData = await tagsRes.json()
        
        const eventsArray = Array.isArray(eventsData) ? eventsData : []
        setEvents(eventsArray)
        setFeaturedEvents(eventsArray.filter((e: Event) => e.isFeatured))
        setCategories(Array.isArray(categoriesData) ? categoriesData : [])
        setRegions(Array.isArray(regionsData) ? regionsData : [])
        setTags(Array.isArray(tagsData) ? tagsData : [])
        setLoading(false)
      } catch (error) {
        console.error('Error fetching data:', error)
        toast({ title: 'Unable to load events', description: 'Please refresh and try again.' })
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Persist region selection
  useEffect(() => {
    if (selectedRegion) localStorage.setItem('fl_region', selectedRegion)
    else localStorage.removeItem('fl_region')
  }, [selectedRegion])

  useEffect(() => {
    if (typeof window === 'undefined') return
    localStorage.setItem('saved_events', JSON.stringify(savedEventIds))
  }, [savedEventIds])

  const getPriceLabel = useCallback((event: Event) => {
    if (event.priceRange) return event.priceRange
    if (event.price === 0) return 'Free'
    return null
  }, [])

  const getDirectionsUrl = useCallback((event: Event) => {
    if (Number.isFinite(event.latitude) && Number.isFinite(event.longitude)) {
      return `https://www.google.com/maps/dir/?api=1&destination=${event.latitude},${event.longitude}`
    }
    if (event.address) {
      return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(event.address)}`
    }
    return null
  }, [])

  const toggleSavedEvent = useCallback((event: Event) => {
    setSavedEventIds((prev) => {
      const isSaved = prev.includes(event.id)
      const next = isSaved ? prev.filter((id) => id !== event.id) : [...prev, event.id]
      toast({
        title: isSaved ? 'Removed from saved' : 'Saved event',
        description: isSaved ? 'This event was removed from your saved list.' : 'We saved this event for you.',
      })
      return next
    })
  }, [])

  const handleSwipeRight = useCallback((event: Event) => {
    // Save the event
    toggleSavedEvent(event)
    // Track interaction
    fetch('/api/interactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'guest', eventId: event.id, action: 'swipe_right' }),
    }).catch((err) => console.error('Failed to track interaction:', err))
    // Move to next event
    moveToNextSwipeCard()
  }, [toggleSavedEvent])

  const handleSwipeLeft = useCallback((event: Event) => {
    // Track interaction
    fetch('/api/interactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'guest', eventId: event.id, action: 'swipe_left' }),
    }).catch((err) => console.error('Failed to track interaction:', err))
    // Move to next event
    moveToNextSwipeCard()
  }, [])

  const moveToNextSwipeCard = useCallback(() => {
    setSwipedEventIds((prev) => {
      const event = events[swipeIndex]
      if (event) {
        const next = new Set(prev)
        next.add(event.id)
        return next
      }
      return prev
    })
    setSwipeIndex((prev) => Math.min(prev + 1, events.length - 1))
  }, [swipeIndex, events])

  const handleShare = useCallback(async (event: Event) => {
    const shareUrl = event.website || (typeof window !== 'undefined' ? window.location.href : '')
    if (!shareUrl) {
      toast({ title: 'No link available', description: 'This event does not have a shareable link yet.' })
      return
    }
    try {
      if (navigator.share) {
        await navigator.share({ title: event.title, text: event.description, url: shareUrl })
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl)
        toast({ title: 'Link copied', description: 'Event link copied to clipboard.' })
      } else {
        toast({ title: 'Unable to share', description: 'Your browser does not support sharing.' })
      }
    } catch (error) {
      console.error('Error sharing event:', error)
      toast({ title: 'Share failed', description: 'Please try again.' })
    }
  }, [])

  // Search events
  const searchEvents = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.append('search', searchQuery)
      if (selectedCategory) params.append('category', selectedCategory)
      if (selectedRegion) params.append('region', selectedRegion)
      if (selectedTag) params.append('tag', selectedTag)
      
      const res = await fetch(`/api/events?${params.toString()}`)
      if (!res.ok) throw new Error('Search failed')
      const data = await res.json()
      setEvents(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error searching events:', error)
      toast({ title: 'Search failed', description: 'Please try again in a moment.' })
    }
    setLoading(false)
  }, [searchQuery, selectedCategory, selectedRegion, selectedTag])

  useEffect(() => {
    const debounce = setTimeout(searchEvents, 300)
    return () => clearTimeout(debounce)
  }, [searchQuery, selectedCategory, selectedRegion, selectedTag, searchEvents])

  // Fetch event details
  const fetchEventDetails = async (slug: string) => {
    try {
      const res = await fetch(`/api/events/${slug}`)
      if (!res.ok) throw new Error('Failed to fetch event')
      const data = await res.json()
      setSelectedEvent(data)
    } catch (error) {
      console.error('Error fetching event details:', error)
      toast({ title: 'Unable to load event', description: 'Please try again.' })
    }
  }

  // God Mode helpers
  function openGodEdit(event: Event) {
    setGodEditingEvent(event)
    setGodForm({
      title: event.title, description: event.description,
      venue: event.venue, address: event.address,
      startDate: event.startDate.slice(0, 16),
      endDate: event.endDate ? event.endDate.slice(0, 16) : '',
      price: event.price ?? '', priceRange: event.priceRange ?? '',
      imageUrl: event.imageUrl ?? '', website: event.website ?? '',
      latitude: event.latitude, longitude: event.longitude,
      isFeatured: event.isFeatured,
      categoryId: event.category.id, regionId: event.region.id,
    })
    setGodSaveMsg('')
  }

  async function godSave() {
    if (!godEditingEvent) return
    setGodSaving(true)
    const pw = sessionStorage.getItem('dev_pw') || ''
    const res = await fetch(`/api/dev/events/${godEditingEvent.slug}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${pw}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: godForm.title, description: godForm.description,
        venue: godForm.venue, address: godForm.address,
        startDate: godForm.startDate, endDate: godForm.endDate || null,
        price: godForm.price !== '' ? Number(godForm.price) : null,
        priceRange: godForm.priceRange || null,
        imageUrl: godForm.imageUrl || null, website: godForm.website || null,
        latitude: Number(godForm.latitude), longitude: Number(godForm.longitude),
        isFeatured: godForm.isFeatured, categoryId: godForm.categoryId, regionId: godForm.regionId,
      }),
    })
    setGodSaving(false)
    if (res.ok) { setGodSaveMsg('Saved!'); setTimeout(() => { setGodEditingEvent(null); searchEvents() }, 600) }
    else setGodSaveMsg('Save failed')
  }

  async function godDeleteEvent(event: Event) {
    if (!confirm(`Delete "${event.title}"?`)) return
    const pw = sessionStorage.getItem('dev_pw') || ''
    await fetch(`/api/dev/events/${event.slug}`, { method: 'DELETE', headers: { Authorization: `Bearer ${pw}` } })
    searchEvents()
  }

  const selectedEventPriceLabel = selectedEvent ? getPriceLabel(selectedEvent) : null
  const selectedEventDirections = selectedEvent ? getDirectionsUrl(selectedEvent) : null
  const selectedEventSaved = selectedEvent ? savedEventIds.includes(selectedEvent.id) : false
  const selectedEventHasWebsite = !!selectedEvent?.website
  const selectedEventHasTickets = !!selectedEvent?.website && (
    (selectedEvent?.price !== null && selectedEvent?.price !== undefined && selectedEvent.price > 0) ||
    (selectedEvent?.priceRange ? selectedEvent.priceRange !== 'Free' : false)
  )
  const selectedEventShareLink = selectedEvent?.website || null
  const selectedEventVenue = selectedEvent?.venue || 'Location TBA'
  const selectedEventAddress = selectedEvent?.address || 'Location TBA'

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900 max-w-full overflow-x-hidden">
      {/* Top Blue Bar */}
      <div className="bg-blue-600 h-1" />

      {/* Main Content - Scrollable (flex-col on map tab so map fills remaining space) */}
      <main className={activeTab === 'map' ? 'flex-1 overflow-hidden flex flex-col min-h-0' : 'flex-1 overflow-y-auto pb-nav'}>
        {/* Shared Top Bar — all tabs except profile and dev */}
        {activeTab !== 'profile' && activeTab !== 'saved' && (
          <header className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b dark:border-gray-700">
              <div className="px-4 py-3">
                <div className="flex items-center justify-between gap-2">
                  {/* Logo */}
                  <div className="flex items-center gap-2 shrink-0">
                    <img src="/logo.png" alt="FL Events" className="w-9 h-9 rounded-full object-cover" loading="eager" />
                    <h1 className="text-xl font-bold text-blue-600 tracking-tight">FLA Events</h1>
                  </div>

                  {/* Region Selector */}
                  <div className="flex items-center gap-2 shrink-0">
                    {selectedRegion && (
                      <button
                        onClick={() => setSelectedRegion(null)}
                        className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center"
                        aria-label="Clear region"
                      >
                        <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      </button>
                    )}
                    <button
                      onClick={() => setShowRegionSelect(true)}
                      className="flex items-center gap-1.5 px-3 py-2.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 active:bg-blue-100 dark:active:bg-blue-900/50"
                    >
                      <MapPin className="w-4 h-4 shrink-0" />
                      <span className="text-sm font-bold truncate max-w-[100px]">
                        {selectedRegion ? regions.find(r => r.slug === selectedRegion)?.name : 'All of Florida'}
                      </span>
                      <ChevronDown className="w-3.5 h-3.5 opacity-60 shrink-0" />
                    </button>
                  </div>
                </div>

                {/* Search Bar */}
                <div className="mt-3 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search events, festivals, venues..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 h-12 bg-gray-100 dark:bg-gray-800 border-0 rounded-xl text-base focus:bg-white dark:focus:bg-gray-700 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Filters + Category chips — hidden on explore tab */}
                {activeTab !== 'explore' && (
                  <div className="mt-2 flex items-start gap-3 overflow-x-auto no-scrollbar pb-1">
                    <button
                      onClick={() => setShowFilters(true)}
                      className="shrink-0 flex flex-col items-center gap-1"
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all
                        ${selectedTag ? 'bg-blue-600 text-white ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-900' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>
                        <SlidersHorizontal className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-medium text-gray-600 dark:text-gray-400 leading-tight">Filters</span>
                    </button>
                    {categories
                      .sort((a, b) => (b._count?.events || 0) - (a._count?.events || 0))
                      .map(category => (
                      <button
                        key={category.slug}
                        onClick={() => setSelectedCategory(selectedCategory === category.slug ? null : category.slug)}
                        className="shrink-0 flex flex-col items-center gap-1"
                      >
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-white transition-all
                            ${selectedCategory === category.slug ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-900' : ''}`}
                          style={{ backgroundColor: category.color }}
                        >
                          {categoryIcons[category.icon] || <PartyPopper className="w-4 h-4" />}
                        </div>
                        <span className="text-[10px] font-medium text-gray-600 dark:text-gray-400 leading-tight">
                          {category.name.split(' ')[0]}
                        </span>
                      </button>
                    ))}
                    {(selectedCategory || selectedTag) && (
                      <button
                        onClick={() => { setSelectedCategory(null); setSelectedTag(null) }}
                        className="shrink-0 flex flex-col items-center gap-1"
                      >
                        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                          <X className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 leading-tight">Clear</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
          </header>
        )}

        {/* HOME TAB */}
        {activeTab === 'home' && (
          <div className="px-4 py-4">
              {/* Title */}
              <div className="mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {searchQuery
                    ? `Results for "${searchQuery}"`
                    : selectedCategory
                    ? `Top ${categories.find(c => c.slug === selectedCategory)?.name} Events Across ${selectedRegion ? regions.find(r => r.slug === selectedRegion)?.name : 'All of Florida'}`
                    : `Top Events Across ${selectedRegion ? regions.find(r => r.slug === selectedRegion)?.name : 'All of Florida'}`}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {events.length} event{events.length !== 1 ? 's' : ''} found
                </p>
              </div>

              {/* Clear Filters */}
              {(selectedCategory || selectedRegion || selectedTag || searchQuery) && (
                <button
                  onClick={() => {
                    setSelectedCategory(null)
                    setSelectedRegion(null)
                    setSelectedTag(null)
                    setSearchQuery('')
                  }}
                  className="flex items-center gap-1.5 px-4 h-10 mb-4 text-sm font-medium text-blue-600 bg-blue-50 dark:bg-blue-900/30 rounded-full active:bg-blue-100"
                >
                  <X className="w-4 h-4" />
                  Clear filters
                </button>
              )}

              {/* Events List */}
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <Card key={i} className="mb-3 overflow-hidden bg-white dark:bg-gray-800">
                    <CardContent className="p-4">
                      <div className="flex gap-3">
                        <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse shrink-0" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse" />
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : events.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <Search className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">No events found</h3>
                  <p className="text-gray-500 text-sm mt-1">Try adjusting your search</p>
                </div>
              ) : (
                events.map((event, index) => (
                  <Card
                    key={event.id}
                    className={`mb-3 overflow-hidden cursor-pointer active:scale-[0.98] transition-transform border-gray-200 dark:border-gray-700 ${event.tags?.some(t => t.slug === 'cancelled') ? 'bg-gray-50 dark:bg-gray-800/50 opacity-70' : 'bg-white dark:bg-gray-800'}`}
                    onClick={() => fetchEventDetails(event.slug)}
                  >
                    <CardContent className="p-4">
                      <div className="flex gap-3">
                        {/* Event Image */}
                        {event.imageUrl ? (
                          <img loading="lazy" decoding="async"
                            src={event.imageUrl}
                            alt={event.title}
                            className="w-20 h-20 rounded-lg shrink-0 object-cover"
                          />
                        ) : (
                          <div
                            className="w-20 h-20 rounded-lg shrink-0 flex items-center justify-center"
                            style={{ backgroundColor: event.category.color + '20' }}
                          >
                            <div style={{ color: event.category.color }} className="scale-75">
                              {categoryIcons[event.category.icon] || <PartyPopper className="w-6 h-6" />}
                            </div>
                          </div>
                        )}
                        
                        {/* Event Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-2">
                            <span className="text-gray-300 dark:text-gray-600 text-sm font-medium">{index + 1}.</span>
                            <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1 flex-1">
                              {event.title}
                            </h3>
                          </div>
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            <Badge
                              variant="outline"
                              className="text-[10px] px-2 py-0 h-5 border-gray-200 dark:border-gray-600"
                              style={{ 
                                borderColor: event.category.color + '50',
                                backgroundColor: event.category.color + '10',
                                color: event.category.color
                              }}
                            >
                              {event.category.name}
                            </Badge>
                            {/* Sponsored Badge */}
                            {event.sponsoredEvents && event.sponsoredEvents.length > 0 && event.sponsoredEvents[0].sponsor && (
                              <SponsoredBadge
                                sponsor={event.sponsoredEvents[0].sponsor}
                                eventId={event.id}
                                variant="compact"
                              />
                            )}
                            {/* Tags — cancelled overrides all others */}
                            {event.tags?.some(t => t.slug === 'cancelled') ? (
                              <Badge
                                variant="outline"
                                className="text-[9px] px-1.5 py-0 h-4"
                                style={{ borderColor: '#EF444480', backgroundColor: '#EF444415', color: '#EF4444' }}
                              >
                                🚫 Cancelled
                              </Badge>
                            ) : (
                              event.tags?.slice(0, 3).map((tag) => (
                                <Badge
                                  key={tag.id}
                                  variant="outline"
                                  className="text-[9px] px-1.5 py-0 h-4 border-gray-200 dark:border-gray-600"
                                  style={{
                                    borderColor: tag.color + '50',
                                    backgroundColor: tag.color + '15',
                                    color: tag.color
                                  }}
                                >
                                  {tag.icon && <span className="mr-0.5">{tag.icon}</span>}
                                  {tag.name}
                                </Badge>
                              ))
                            )}
                            {getPriceLabel(event) && (
                              <span className="text-xs text-gray-400">{getPriceLabel(event)}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                            <MapPin className="w-3 h-3" />
                            <span className="truncate">{cityFromAddress(event.address, event.region?.name || '')}</span>
                            <span className="text-gray-300 dark:text-gray-600">•</span>
                            <Calendar className="w-3 h-3" />
                            <span className="truncate">{formatDate(event.startDate)}</span>
                          </div>
                        </div>
                      </div>
                      {godMode && (
                        <div className="flex gap-2 mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                          <button onClick={(e) => { e.stopPropagation(); openGodEdit(event) }}
                            className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/20 font-medium">
                            <Pencil className="w-3 h-3" /> Edit
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); godDeleteEvent(event) }}
                            className="flex items-center gap-1 text-xs text-red-500 px-2 py-1 rounded-lg bg-red-50 dark:bg-red-900/20 font-medium">
                            <Trash2 className="w-3 h-3" /> Delete
                          </button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
          </div>
        )}

        {/* MAP TAB */}
        {activeTab === 'map' && (
          <div className="flex-1 min-h-0 relative overflow-hidden">
            <div className="absolute inset-0 bottom-0" style={{ bottom: '64px' }}>
            <MapView
              events={events}
              onEventClick={(slug) => fetchEventDetails(slug)}
              center={mapCenter}
              zoom={mapZoom}
              onMapMove={async (center, bounds) => {
                try {
                  const params = new URLSearchParams()
                  params.append('bounds', `${bounds.south},${bounds.west},${bounds.north},${bounds.east}`)
                  if (selectedCategory) params.append('category', selectedCategory)
                  if (selectedTag) params.append('tag', selectedTag)

                  const res = await fetch(`/api/events?${params.toString()}`)
                  if (!res.ok) throw new Error('Reload failed')
                  const data = await res.json()
                  setEvents(Array.isArray(data) ? data : [])
                } catch (error) {
                  console.error('Error reloading events:', error)
                  toast({ title: 'Map reload failed', description: 'Unable to refresh events for this area.' })
                }
              }}
            />
            </div>
          </div>
        )}

        {/* EXPLORE TAB */}
        {activeTab === 'explore' && (
          <div className="flex flex-col" style={{ minHeight: 'calc(100dvh - 120px)' }}>
            {/* Swipe Mode Toggle */}
            {!swipeMode && (
              <div className="px-4 py-3 border-b dark:border-gray-700 bg-white dark:bg-gray-900 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Try Swipe Mode</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSwipeMode(true)
                    setSwipeIndex(0)
                    setSwipedEventIds(new Set())
                  }}
                  className="gap-2"
                >
                  <Heart className="w-4 h-4" /> Swipe
                </Button>
              </div>
            )}

            {swipeMode && events.length > 0 && swipeIndex < events.length ? (
              // Swipe mode view
              <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
                <div className="w-full max-w-sm">
                  <SwipeCard
                    event={events[swipeIndex]}
                    onSwipeLeft={() => handleSwipeLeft(events[swipeIndex])}
                    onSwipeRight={() => handleSwipeRight(events[swipeIndex])}
                    onClose={() => setSwipeMode(false)}
                  />
                </div>
                {/* Exit button */}
                <button
                  onClick={() => setSwipeMode(false)}
                  className="absolute top-4 left-4 w-10 h-10 rounded-full bg-white dark:bg-gray-800 shadow-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
                {/* Progress indicator */}
                <div className="absolute bottom-20 left-0 right-0 px-4">
                  <div className="text-center text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {swipeIndex + 1} / {events.length}
                  </div>
                  <div className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 transition-all"
                      style={{ width: `${((swipeIndex + 1) / events.length) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ) : swipeMode && (events.length === 0 || swipeIndex >= events.length) ? (
              // No more events
              <div className="flex-1 flex flex-col items-center justify-center">
                <div className="text-center">
                  <Heart className="w-16 h-16 text-red-500 mx-auto mb-4 opacity-30" />
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                    {events.length === 0 ? 'No Events to Swipe' : 'All Caught Up!'}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                    {events.length === 0
                      ? 'Try adjusting your filters'
                      : `You've swiped through ${swipeIndex} events`}
                  </p>
                  <Button
                    onClick={() => setSwipeMode(false)}
                    className="gap-2"
                  >
                    Back to Feed
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {/* Sponsored story circles — right under search */}
                <div className="px-4 py-3 border-b dark:border-gray-700 bg-white dark:bg-gray-900">
                  <div
                    className="flex gap-4 overflow-x-auto scrollbar-hide -mx-4 px-4"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                  >
                {SPONSORED_STORIES.map((story, index) => (
                  <button
                    key={story.id}
                    onClick={() => { setActiveStoryIndex(index); setStoryDetailsOpen(false) }}
                    className="flex flex-col items-center gap-1.5 min-w-[64px] py-1"
                  >
                    {/* Ring */}
                    <div className={`w-[60px] h-[60px] rounded-full bg-gradient-to-br ${story.ringGradient} p-[2px] shrink-0`}>
                      <div className="w-full h-full rounded-full bg-white dark:bg-gray-900 flex items-center justify-center">
                        <span className="text-2xl">{story.emoji}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-medium text-gray-700 dark:text-gray-300 truncate w-full text-center leading-tight">
                      {story.title}
                    </span>
                    <span className="text-[9px] text-blue-500 font-semibold uppercase tracking-wide">AD</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Fullscreen snap-scroll event feed */}
            <div
              className="flex-1 overflow-y-auto"
              style={{ scrollSnapType: 'y mandatory', WebkitOverflowScrolling: 'touch' }}
            >
              {events.length === 0 && !loading ? (
                <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                  <Search className="w-10 h-10 mb-3 opacity-30" />
                  <p className="text-sm">No events to show</p>
                </div>
              ) : (
                events.map((event) => (
                  <div
                    key={event.id}
                    className="relative w-full overflow-hidden cursor-pointer"
                    style={{
                      scrollSnapAlign: 'start',
                      height: 'calc(100dvh - 184px)',
                      minHeight: 320,
                      background: event.imageUrl
                        ? `url(${event.imageUrl}) center/cover no-repeat`
                        : event.category.color,
                    }}
                    onClick={() => fetchEventDetails(event.slug)}
                  >
                    {/* Fallback icon when no image */}
                    {!event.imageUrl && (
                      <div className="absolute inset-0 flex items-center justify-center opacity-20">
                        <div style={{ transform: 'scale(4)', color: 'white' }}>
                          {categoryIcons[event.category.icon] || <PartyPopper className="w-8 h-8" />}
                        </div>
                      </div>
                    )}
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                    {godMode && (
                      <div className="absolute top-12 right-3 flex gap-2 z-30">
                        <button onClick={(e) => { e.stopPropagation(); openGodEdit(event) }}
                          className="w-9 h-9 bg-blue-600/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg">
                          <Pencil className="w-4 h-4 text-white" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); godDeleteEvent(event) }}
                          className="w-9 h-9 bg-red-500/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg">
                          <Trash2 className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    )}
                    {/* Info */}
                    <div className="absolute bottom-0 left-0 right-0 p-5 pb-6">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span
                          className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                          style={{ background: event.category.color, color: 'white' }}
                        >
                          {event.category.name}
                        </span>
                        {event.isFeatured && (
                          <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-yellow-400 text-yellow-900">
                            Featured
                          </span>
                        )}
                        {getPriceLabel(event) && (
                          <span className="text-xs text-white/70 ml-auto">{getPriceLabel(event)}</span>
                        )}
                      </div>
                      <h2 className="text-[22px] font-bold text-white leading-tight mb-2">{event.title}</h2>
                      <div className="flex items-center gap-1.5 text-sm text-white/80 mb-1">
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{event.venue}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-sm text-white/80">
                        <Calendar className="w-3.5 h-3.5 shrink-0" />
                        <span>{formatDate(event.startDate)} · {formatTime(event.startDate)}</span>
                      </div>
                      <div className="mt-4 flex items-center justify-center gap-1 text-white/50">
                        <span className="text-xs">Tap for details</span>
                        <ChevronDown className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            </>
            )}
          </div>
        )}


        {/* PROFILE TAB */}
        {activeTab === 'profile' && (
          <div className="px-4 py-6">
            <div className="flex flex-col items-center">
              <div className="w-24 h-24 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
                <User className="w-12 h-12 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Guest User</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Sign in to save events</p>
              <Button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 rounded-xl">
                Sign In
              </Button>
            </div>
            
            <div className="mt-8">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Quick Links</h3>
              <div className="space-y-1">
                {['Saved Events', 'Preferences', 'Settings', 'Help & Support', 'About FLA Events'].map((item) => (
                  <button key={item} className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <span className="text-gray-700 dark:text-gray-300">{item}</span>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </button>
                ))}
              </div>
              
              {/* Dark Mode Toggle */}
              <div className="mt-6 pt-6 border-t dark:border-gray-700">
                <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                  <div className="flex items-center gap-3">
                    {theme === 'dark' ? (
                      <Moon className="w-5 h-5 text-blue-400" />
                    ) : (
                      <Sun className="w-5 h-5 text-amber-500" />
                    )}
                    <span className="text-gray-700 dark:text-gray-300 font-medium">Dark Mode</span>
                  </div>
                  <button
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    className={`relative w-14 h-7 rounded-full transition-colors ${
                      theme === 'dark' ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                        theme === 'dark' ? 'translate-x-8' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
              
              {/* Business Owners Section */}
              <div className="mt-6 pt-6 border-t dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">For Business Owners</h3>
                <button className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Plus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <span className="text-blue-600 dark:text-blue-400 font-medium">Submit an Event</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-blue-400" />
                </button>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 px-4">Submit your event for review and approval</p>
              </div>
            </div>
          </div>
        )}

        {/* SAVED TAB */}
        {activeTab === 'saved' && (
          <div className="flex flex-col flex-1">
            {savedEventIds.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[70vh] px-6 text-center">
                <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
                  <Heart className="w-8 h-8 text-red-500" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Saved Events Yet</h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xs">
                  Save events from the Explore tab and they&apos;ll appear here.
                </p>
              </div>
            ) : (
              <div className="p-4 space-y-4 pb-nav">
                {events
                  .filter((e) => savedEventIds.includes(e.id))
                  .map((event) => (
                    <Card key={event.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => fetchEventDetails(event.slug)}>
                      <CardContent className="p-4">
                        <div className="flex gap-3">
                          {event.imageUrl && (
                            <img loading="lazy" decoding="async"
                              src={event.imageUrl}
                              alt={event.title}
                              className="w-20 h-20 object-cover rounded"
                            />
                          )}
                          <div className="flex-1">
                            <h3 className="font-bold text-gray-900 dark:text-white line-clamp-1">
                              {event.title}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {event.venue}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-500">
                              {new Date(event.startDate).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleSavedEvent(event)
                            }}
                            className="text-red-500 hover:text-red-600"
                          >
                            <Heart className="w-5 h-5 fill-red-500" />
                          </button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ── Story Viewer ── */}
      {activeStoryIndex !== null && (() => {
        const story = SPONSORED_STORIES[activeStoryIndex]
        const isLast = activeStoryIndex === SPONSORED_STORIES.length - 1
        const isFirst = activeStoryIndex === 0
        return (
          <div
            className="fixed inset-0"
            style={{ zIndex: 600 }}
            onTouchStart={(e) => setStoryTouchStartY(e.touches[0].clientY)}
            onTouchEnd={(e) => {
              if (storyTouchStartY !== null) {
                const dy = storyTouchStartY - e.changedTouches[0].clientY
                if (dy > 55) setStoryDetailsOpen(true)
                setStoryTouchStartY(null)
              }
            }}
          >
            {/* Background gradient */}
            <div className={`absolute inset-0 bg-gradient-to-b ${story.bgGradient}`} />

            {/* Decorative emoji glow */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span style={{ fontSize: 180, opacity: 0.08 }}>{story.emoji}</span>
            </div>

            {/* Progress bars */}
            <div className="absolute top-0 left-0 right-0 z-20 flex gap-1 px-3 pt-3 pb-2">
              {SPONSORED_STORIES.map((_, i) => (
                <div key={i} className="flex-1 h-[3px] rounded-full bg-white/30 overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full"
                    style={{ width: i <= activeStoryIndex ? '100%' : '0%' }}
                  />
                </div>
              ))}
            </div>

            {/* Top bar: label + close */}
            <div className="absolute top-7 left-0 right-0 z-20 flex items-center justify-between px-4">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${story.ringGradient} flex items-center justify-center text-base`}>
                  {story.emoji}
                </div>
                <div>
                  <p className="text-white font-bold text-sm leading-none">{story.title}</p>
                  <p className="text-white/60 text-[11px] mt-0.5">{story.subtitle}</p>
                </div>
                <span className="ml-1 text-[10px] font-bold text-white/50 uppercase tracking-wide border border-white/30 px-1.5 py-0.5 rounded">
                  AD
                </span>
              </div>
              <button
                onClick={() => { setActiveStoryIndex(null); setStoryDetailsOpen(false) }}
                className="w-9 h-9 rounded-full bg-black/30 flex items-center justify-center"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Main story content — z-20 so specific children can catch taps above the tap zones */}
            <div className="absolute inset-0 flex flex-col items-center justify-center px-8 pointer-events-none z-20">
              <span style={{ fontSize: 80 }}>{story.emoji}</span>
              <h1 className="text-white text-3xl font-extrabold text-center mt-4 leading-tight">{story.title}</h1>
              <p className="text-white/70 text-base text-center mt-1">{story.subtitle}</p>
              {/* Info card — tappable to open details */}
              <div
                className="mt-6 bg-white/10 backdrop-blur-sm rounded-2xl px-5 py-4 w-full max-w-xs pointer-events-auto cursor-pointer active:bg-white/20"
                onClick={() => setStoryDetailsOpen(true)}
              >
                <div className="flex items-center gap-2 text-white/80 text-sm mb-2">
                  <MapPin className="w-4 h-4 shrink-0 text-white/60" />
                  <span>{story.venue}</span>
                </div>
                <div className="flex items-center gap-2 text-white/80 text-sm mb-2">
                  <Calendar className="w-4 h-4 shrink-0 text-white/60" />
                  <span>{story.date}</span>
                </div>
                <div className="flex items-center gap-2 text-white font-semibold text-sm">
                  <DollarSign className="w-4 h-4 shrink-0 text-white/60" />
                  <span>{story.price}</span>
                </div>
                <p className="text-white/50 text-xs text-center mt-3">Tap for more details ↑</p>
              </div>
            </div>

            {/* Tap zones: left = prev, right = next */}
            <div className="absolute inset-0 grid grid-cols-2 z-10">
              <div
                className="h-full"
                onClick={() => {
                  if (!storyDetailsOpen) {
                    if (!isFirst) setActiveStoryIndex(activeStoryIndex - 1)
                    setStoryDetailsOpen(false)
                  }
                }}
              />
              <div
                className="h-full"
                onClick={() => {
                  if (!storyDetailsOpen) {
                    if (!isLast) { setActiveStoryIndex(activeStoryIndex + 1); setStoryDetailsOpen(false) }
                    else { setActiveStoryIndex(null); setStoryDetailsOpen(false) }
                  }
                }}
              />
            </div>

            {/* Swipe-up prompt — tappable */}
            {!storyDetailsOpen && (
              <div
                className="absolute bottom-24 left-0 right-0 z-20 flex flex-col items-center cursor-pointer py-3"
                onClick={() => setStoryDetailsOpen(true)}
              >
                <div className="w-8 h-1 bg-white/40 rounded-full mb-2" />
                <p className="text-white/70 text-sm font-medium">Swipe up for details</p>
              </div>
            )}

            {/* Details panel (slides up) */}
            {storyDetailsOpen && (
              <div
                className="absolute bottom-0 left-0 right-0 z-30 bg-white dark:bg-gray-900 rounded-t-2xl p-5"
                style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 24px)', maxHeight: '65vh', overflowY: 'auto' }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-center mb-4">
                  <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
                </div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-4xl">{story.emoji}</span>
                  <div>
                    <h2 className="font-bold text-gray-900 dark:text-white text-xl">{story.title}</h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">{story.subtitle}</p>
                  </div>
                </div>
                <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed mb-5">{story.description}</p>
                <div className="space-y-3 mb-5">
                  <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                    <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                    <span>{story.venue}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                    <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                    <span>{story.date}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm font-semibold text-gray-900 dark:text-white">
                    <DollarSign className="w-4 h-4 text-gray-400 shrink-0" />
                    <span>{story.price}</span>
                  </div>
                </div>
                <button className="w-full bg-blue-600 active:bg-blue-700 text-white font-bold py-4 rounded-2xl text-base">
                  {story.ctaText}
                </button>
                <button
                  onClick={() => setStoryDetailsOpen(false)}
                  className="w-full mt-2 py-3 text-sm text-gray-500 dark:text-gray-400"
                >
                  Back to story
                </button>
              </div>
            )}
          </div>
        )
      })()}

      {/* Region Bottom Sheet */}
      {showRegionSelect && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40"
            style={{ zIndex: 940 }}
            onClick={() => setShowRegionSelect(false)}
          />
          {/* Sheet */}
          <div
            className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 rounded-t-2xl"
            style={{ zIndex: 950 }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
            </div>
            {/* Title row */}
            <div className="flex items-center justify-between px-5 py-2 border-b dark:border-gray-700">
              <h3 className="font-bold text-gray-900 dark:text-white text-base">Select Region</h3>
              <button
                onClick={() => setShowRegionSelect(false)}
                className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center"
              >
                <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
            </div>
            {/* Options — no scroll, all visible */}
            <div style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 12px)' }}>
              {/* All of Florida */}
              <button
                onClick={() => { setSelectedRegion(null); setMapCenter(null); setMapZoom(null); setShowRegionSelect(false) }}
                className="w-full flex items-center gap-3 px-5 py-3 active:bg-gray-50 dark:active:bg-gray-800 transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">All of Florida</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Show all regions</p>
                </div>
                {!selectedRegion && (
                  <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </button>
              {/* Regions */}
              {regions.map((region) => (
                <button
                  key={region.id}
                  onClick={() => {
                    setSelectedRegion(region.slug)
                    setShowRegionSelect(false)
                    const focus = regionMapFocus[region.slug]
                    if (focus) { setMapCenter(focus.center); setMapZoom(focus.zoom) }
                  }}
                  className="w-full flex items-center gap-3 px-5 py-3 border-t border-gray-100 dark:border-gray-800 active:bg-gray-50 dark:active:bg-gray-800 transition-colors"
                >
                  <div className="w-9 h-9 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">{region.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{region._count?.events || 0} events</p>
                  </div>
                  {selectedRegion === region.slug && (
                    <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Filters Bottom Sheet */}
      {showFilters && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/40" style={{ zIndex: 1010 }} onClick={() => setShowFilters(false)} />
          {/* Sheet */}
          <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 rounded-t-2xl max-h-[80vh] flex flex-col" style={{ zIndex: 1020 }}>
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
            </div>
            {/* Title row */}
            <div className="flex items-center justify-between px-5 py-2 border-b dark:border-gray-700">
              <h3 className="font-bold text-gray-900 dark:text-white text-base">Filters</h3>
              <div className="flex items-center gap-3">
                {(selectedCategory || selectedTag) && (
                  <button
                    onClick={() => { setSelectedCategory(null); setSelectedTag(null) }}
                    className="text-sm text-blue-600 dark:text-blue-400 font-medium"
                  >
                    Clear all
                  </button>
                )}
                <button
                  onClick={() => setShowFilters(false)}
                  className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center"
                >
                  <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </button>
              </div>
            </div>
            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
              {/* Tags */}
              {tags.length > 0 && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {tags.filter(t => t.slug !== 'cancelled')
                      .sort((a, b) => (b._count?.events || 0) - (a._count?.events || 0))
                      .map((tag) => (
                      <button
                        key={tag.id}
                        onClick={() => setSelectedTag(selectedTag === tag.slug ? null : tag.slug)}
                        className={`flex items-center gap-1.5 px-4 h-9 rounded-full text-sm font-medium transition-all
                          ${selectedTag === tag.slug
                            ? 'ring-2 ring-offset-1 ring-blue-500 dark:ring-offset-gray-900'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}
                        style={selectedTag === tag.slug ? { backgroundColor: tag.color, color: 'white' } : {}}
                      >
                        {tag.icon && <span>{tag.icon}</span>}
                        <span>{tag.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {/* Show results footer */}
            <div className="px-5 py-4 border-t dark:border-gray-700" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 16px)' }}>
              <button
                onClick={() => setShowFilters(false)}
                className="w-full bg-blue-600 active:bg-blue-700 text-white font-bold py-4 rounded-2xl text-base"
              >
                Show {events.length} result{events.length !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </>
      )}

      {/* God Mode floating indicator */}
      {godMode && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 pointer-events-none" style={{ zIndex: 999 }}>
          <div className="flex items-center gap-1.5 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-xs font-bold shadow-lg">
            <Zap className="w-3 h-3" /> GOD MODE
          </div>
        </div>
      )}

      {/* God Edit full-screen drawer */}
      {godEditingEvent && (
        <div className="fixed inset-0 flex flex-col bg-white dark:bg-gray-900" style={{ zIndex: 1100, paddingBottom: 'env(safe-area-inset-bottom)' }}>
          <div className="flex items-center justify-between px-4 py-3 border-b dark:border-gray-700 shrink-0">
            <button onClick={() => setGodEditingEvent(null)} className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
            <h3 className="font-bold text-gray-900 dark:text-white text-sm truncate max-w-[180px]">{godEditingEvent.title}</h3>
            <button onClick={godSave} disabled={godSaving}
              className="bg-blue-600 active:bg-blue-700 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-xl font-semibold">
              {godSaving ? 'Saving…' : 'Save'}
            </button>
          </div>
          {godSaveMsg && (
            <p className={`text-center text-xs py-1.5 font-medium ${godSaveMsg === 'Saved!' ? 'bg-green-50 dark:bg-green-900/20 text-green-600' : 'bg-red-50 dark:bg-red-900/20 text-red-500'}`}>
              {godSaveMsg}
            </p>
          )}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <button onClick={() => setGodForm(f => ({ ...f, isFeatured: !f.isFeatured }))}
              className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                godForm.isFeatured ? 'bg-yellow-400 text-yellow-900' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
              }`}>
              <Star className="w-4 h-4" /> Featured: {godForm.isFeatured ? 'Yes' : 'No'}
            </button>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Category</label>
                <select value={String(godForm.categoryId || '')} onChange={e => setGodForm(f => ({ ...f, categoryId: e.target.value }))}
                  className="w-full bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Region</label>
                <select value={String(godForm.regionId || '')} onChange={e => setGodForm(f => ({ ...f, regionId: e.target.value }))}
                  className="w-full bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
            </div>
            {[
              { label: 'Title', key: 'title', type: 'text' },
              { label: 'Venue', key: 'venue', type: 'text' },
              { label: 'Address', key: 'address', type: 'text' },
              { label: 'Start Date', key: 'startDate', type: 'datetime-local' },
              { label: 'End Date', key: 'endDate', type: 'datetime-local' },
              { label: 'Price ($)', key: 'price', type: 'number' },
              { label: 'Price Range', key: 'priceRange', type: 'text' },
              { label: 'Image URL', key: 'imageUrl', type: 'url' },
              { label: 'Website', key: 'website', type: 'url' },
              { label: 'Latitude', key: 'latitude', type: 'number' },
              { label: 'Longitude', key: 'longitude', type: 'number' },
            ].map(({ label, key, type }) => (
              <div key={key}>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</label>
                <input type={type} value={String(godForm[key] ?? '')}
                  onChange={e => setGodForm(f => ({ ...f, [key]: e.target.value }))}
                  step={type === 'number' ? 'any' : undefined}
                  className="w-full bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            ))}
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Description</label>
              <textarea value={String(godForm.description || '')} rows={4}
                onChange={e => setGodForm(f => ({ ...f, description: e.target.value }))}
                className="w-full bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>
            <button onClick={() => { godDeleteEvent(godEditingEvent!); setGodEditingEvent(null) }}
              className="w-full flex items-center justify-center gap-2 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 text-red-500 rounded-xl text-sm font-medium">
              <Trash2 className="w-4 h-4" /> Delete Event
            </button>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <nav 
        className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t dark:border-gray-700" 
        style={{ 
          zIndex: 1000,
          paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 8px)'
        }}
      >
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
          {[
            { id: 'home', icon: HomeIcon, label: 'Home', isCenter: false },
            { id: 'map', icon: Map, label: 'Map', isCenter: false },
            { id: 'explore', icon: Compass, label: 'Explore', isCenter: true },
            { id: 'saved', icon: Heart, label: 'Saved', isCenter: false },
            { id: 'profile', icon: User, label: 'Profile', isCenter: false },
          ].map(({ id, icon: Icon, label, isCenter }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as typeof activeTab)}
              className={`flex flex-col items-center justify-center min-w-[60px] h-full transition-colors ${
                activeTab === id ? 'text-blue-600' : 'text-gray-400'
              }`}
            >
              {isCenter ? (
                <div className={`w-12 h-12 rounded-full flex items-center justify-center -mt-5 shadow-lg ${
                  activeTab === id ? 'bg-blue-600' : 'bg-blue-500'
                }`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              ) : (
                <Icon className={`w-6 h-6 ${activeTab === id ? 'fill-current' : ''}`} />
              )}
              <span className={`text-[10px] mt-0.5 font-medium ${isCenter ? 'mt-0.5' : ''}`}>
                {label}
              </span>
            </button>
          ))}
        </div>
      </nav>

      {/* Event Detail Modal */}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent showCloseButton={false} className="max-w-full w-full h-[100dvh] max-h-[100dvh] p-0 rounded-none bg-white dark:bg-gray-900">
          {selectedEvent && (
            <div className="h-full overflow-y-auto">
              {/* Header Image */}
              <div className="h-48 w-full relative overflow-hidden">
                {selectedEvent.imageUrl ? (
                  <img loading="lazy" decoding="async"
                    src={selectedEvent.imageUrl}
                    alt={selectedEvent.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center"
                    style={{ backgroundColor: selectedEvent.category.color }}
                  >
                    <div className="text-white/80 scale-150">
                      {categoryIcons[selectedEvent.category.icon] || <PartyPopper className="w-12 h-12" />}
                    </div>
                  </div>
                )}
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="absolute top-4 right-4 w-10 h-10 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              {/* Content */}
              <div className="p-4 -mt-6 bg-white dark:bg-gray-900 rounded-t-3xl relative">
                {/* Cancelled banner */}
                {selectedEvent.tags?.some(t => t.slug === 'cancelled') && (
                  <div className="flex items-center gap-3 bg-red-500 text-white px-4 py-3 rounded-xl mb-4">
                    <span className="text-2xl leading-none">🚫</span>
                    <div>
                      <p className="font-bold text-sm">This event has been cancelled</p>
                      <p className="text-xs text-red-100">It is no longer taking place as scheduled.</p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3 mb-4">
                  <div
                    className="w-14 h-14 rounded-xl shrink-0 flex items-center justify-center -mt-10 shadow-lg"
                    style={{ backgroundColor: selectedEvent.category.color }}
                  >
                    <div className="text-white">
                      {categoryIcons[selectedEvent.category.icon] || <PartyPopper className="w-7 h-7" />}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        style={{
                          backgroundColor: selectedEvent.category.color + '20',
                          color: selectedEvent.category.color,
                          border: 'none'
                        }}
                        className="text-xs"
                      >
                        {selectedEvent.region?.name}
                      </Badge>
                      {selectedEventPriceLabel && (
                        <span className="text-sm text-gray-500 dark:text-gray-400">{selectedEventPriceLabel}</span>
                      )}
                    </div>
                    <DialogHeader>
                      <DialogTitle className="text-xl text-gray-900 dark:text-white">{selectedEvent.title}</DialogTitle>
                    </DialogHeader>
                  </div>
                </div>

                {/* Quick Info */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedEventVenue}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{selectedEventAddress}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{formatDate(selectedEvent.startDate)}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {formatTime(selectedEvent.startDate)}
                        {selectedEvent.endDate && ` - ${formatTime(selectedEvent.endDate)}`}
                      </p>
                    </div>
                  </div>
                  {selectedEvent.price !== null && selectedEvent.price > 0 && (
                    <div className="flex items-center gap-3">
                      <DollarSign className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">${selectedEvent.price.toLocaleString()}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Starting price</p>
                      </div>
                    </div>
                  )}
                  {selectedEvent.price === 0 && (
                    <div className="flex items-center gap-3">
                      <DollarSign className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Free</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">No ticket required</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                {(selectedEventHasWebsite || selectedEventHasTickets || selectedEventDirections || selectedEventShareLink || selectedEvent) && (
                  <div className="mb-4">
                    <div className="grid grid-cols-2 gap-2">
                      {selectedEventHasWebsite && selectedEvent?.website && (
                        <Button asChild variant="outline" className="justify-start gap-2">
                          <a href={selectedEvent.website} target="_blank" rel="noreferrer">
                            <Globe className="w-4 h-4" /> Website
                          </a>
                        </Button>
                      )}
                      {selectedEventHasTickets && selectedEvent?.website && (
                        <Button asChild variant="outline" className="justify-start gap-2">
                          <a href={selectedEvent.website} target="_blank" rel="noreferrer">
                            <Ticket className="w-4 h-4" /> Tickets
                          </a>
                        </Button>
                      )}
                      {selectedEventDirections && (
                        <Button asChild variant="outline" className="justify-start gap-2">
                          <a href={selectedEventDirections} target="_blank" rel="noreferrer">
                            <Navigation2 className="w-4 h-4" /> Directions
                          </a>
                        </Button>
                      )}
                      {selectedEventShareLink && selectedEvent && (
                        <Button variant="outline" className="justify-start gap-2" onClick={() => handleShare(selectedEvent)}>
                          <Share2 className="w-4 h-4" /> Share
                        </Button>
                      )}
                      {selectedEvent && (
                        <Button
                          variant={selectedEventSaved ? 'default' : 'outline'}
                          className="justify-start gap-2"
                          onClick={() => toggleSavedEvent(selectedEvent)}
                        >
                          <Bookmark className="w-4 h-4" /> {selectedEventSaved ? 'Saved' : 'Save'}
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {/* Description */}
                <div className="mb-4">
                  <h4 className="font-bold text-gray-900 dark:text-white mb-2">About</h4>
                  <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                    {selectedEvent.longDescription || selectedEvent.description}
                  </p>
                </div>

                {/* Features (Tags) — cancelled overrides all others */}
                {selectedEvent.tags?.some(t => t.slug === 'cancelled') ? (
                  <div className="mb-4">
                    <h4 className="font-bold text-gray-900 dark:text-white mb-2">Status</h4>
                    <Badge
                      variant="outline"
                      className="text-xs px-3 py-1 h-6"
                      style={{ borderColor: '#EF444440', backgroundColor: '#EF444415', color: '#EF4444' }}
                    >
                      🚫 Cancelled
                    </Badge>
                  </div>
                ) : selectedEvent.tags && selectedEvent.tags.length > 0 ? (
                  <div className="mb-4">
                    <h4 className="font-bold text-gray-900 dark:text-white mb-2">Features</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedEvent.tags.map((tag) => (
                        <Badge
                          key={tag.id}
                          variant="outline"
                          className="text-xs px-3 py-1 h-6 border-gray-200 dark:border-gray-600"
                          style={{
                            borderColor: tag.color + '40',
                            backgroundColor: tag.color + '15',
                            color: tag.color
                          }}
                        >
                          {tag.icon && <span className="mr-1">{tag.icon}</span>}
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <style jsx global>{`
        .safe-area-pb {
          padding-bottom: env(safe-area-inset-bottom);
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  )
}

// ── Dev Tab ────────────────────────────────────────────────────────────────

interface DevEvent {
  id: string; slug: string; title: string; description: string
  venue: string; address: string; startDate: string; endDate: string | null
  price: number | null; priceRange: string | null; imageUrl: string | null
  website: string | null; latitude: number; longitude: number
  isActive: boolean; isFeatured: boolean
  category: { id: string; name: string; color: string }
  region: { id: string; name: string }
}

function DevTab({ categories, regions }: { password: string; categories: Category[]; regions: Region[] }) {
  const [authed, setAuthed] = useState(() => !!sessionStorage.getItem('dev_pw'))
  const [pw, setPw] = useState(() => sessionStorage.getItem('dev_pw') || '')
  const [pwError, setPwError] = useState('')
  const [events, setEvents] = useState<DevEvent[]>([])
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [showAll, setShowAll] = useState(true)
  const [editing, setEditing] = useState<DevEvent | null>(null)
  const [form, setForm] = useState<Partial<DevEvent>>({})
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [loading, setLoading] = useState(false)

  const authHeader = { Authorization: `Bearer ${pw}` }

  const load = useCallback(async (q = search, all = showAll) => {
    if (!authed) return
    setLoading(true)
    const params = new URLSearchParams({ search: q, all: String(all), take: '100' })
    const res = await fetch(`/api/dev/events?${params}`, { headers: authHeader }).catch(() => null)
    const data = res ? await res.json().catch(() => ({})) : {}
    setEvents(Array.isArray(data.events) ? data.events : [])
    setTotal(data.total ?? 0)
    setLoading(false)
  }, [authed, pw, search, showAll])

  useEffect(() => { if (authed) load() }, [authed])

  useEffect(() => {
    const t = setTimeout(() => load(search, showAll), 300)
    return () => clearTimeout(t)
  }, [search, showAll])

  function login(e: React.FormEvent) {
    e.preventDefault()
    if (!pw) { setPwError('Enter password'); return }
    sessionStorage.setItem('dev_pw', pw)
    setAuthed(true)
    setPwError('')
  }

  function startEdit(ev: DevEvent) {
    setEditing(ev)
    setForm({
      title: ev.title, description: ev.description, venue: ev.venue,
      address: ev.address, startDate: ev.startDate.slice(0, 16),
      endDate: ev.endDate ? ev.endDate.slice(0, 16) : '',
      price: ev.price ?? undefined, priceRange: ev.priceRange ?? '',
      imageUrl: ev.imageUrl ?? '', website: ev.website ?? '',
      latitude: ev.latitude, longitude: ev.longitude,
      isActive: ev.isActive, isFeatured: ev.isFeatured,
      category: ev.category, region: ev.region,
    })
    setSaveMsg('')
  }

  async function save() {
    if (!editing) return
    setSaving(true)
    setSaveMsg('')
    const payload: Record<string, unknown> = {
      title: form.title, description: form.description, venue: form.venue,
      address: form.address, startDate: form.startDate, endDate: form.endDate || null,
      price: form.price !== undefined ? Number(form.price) : null,
      priceRange: form.priceRange || null,
      imageUrl: form.imageUrl || null, website: form.website || null,
      latitude: Number(form.latitude), longitude: Number(form.longitude),
      isActive: form.isActive, isFeatured: form.isFeatured,
      categoryId: form.category?.id, regionId: form.region?.id,
    }
    const res = await fetch(`/api/dev/events/${editing.slug}`, {
      method: 'PATCH',
      headers: { ...authHeader, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    setSaving(false)
    if (res.ok) {
      setSaveMsg('Saved')
      load()
      setEditing(null)
    } else {
      setSaveMsg('Save failed')
    }
  }

  async function deleteEvent(ev: DevEvent) {
    if (!confirm(`Delete "${ev.title}"?`)) return
    await fetch(`/api/dev/events/${ev.slug}`, { method: 'DELETE', headers: authHeader })
    if (editing?.slug === ev.slug) setEditing(null)
    load()
  }

  if (!authed) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center pb-nav">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 w-full max-w-sm mx-4">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🛠️</div>
          <h2 className="text-xl font-bold text-white">Dev Access</h2>
          <p className="text-gray-400 text-sm mt-1">Enter dev password to continue</p>
        </div>
        <form onSubmit={login} className="space-y-3">
          <input type="password" placeholder="Password" value={pw}
            onChange={e => setPw(e.target.value)} autoFocus
            className="w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          {pwError && <p className="text-red-400 text-sm">{pwError}</p>}
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg">Enter</button>
        </form>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-nav">
      {/* Dev Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-3 sticky top-0 z-30">
        <div className="flex items-center justify-between gap-3 mb-2">
          <h2 className="font-bold text-white flex items-center gap-2">
            <Settings className="w-4 h-4 text-blue-400" />
            Event Manager
            <span className="text-xs text-gray-500 font-normal">({total} total)</span>
          </h2>
          <button
            onClick={() => setShowAll(!showAll)}
            className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full transition-colors ${showAll ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
          >
            {showAll ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
            {showAll ? 'All' : 'Active only'}
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search events..."
            className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-gray-500" />
        </div>
      </div>

      {/* Event List */}
      {loading ? (
        <div className="p-4 space-y-2">
          {[...Array(6)].map((_, i) => <div key={i} className="h-14 bg-gray-800 rounded-xl animate-pulse" />)}
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-16 text-gray-500">No events found</div>
      ) : (
        <div className="divide-y divide-gray-800">
          {events.map(ev => (
            <div key={ev.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-900 transition-colors">
              <div className="flex-1 min-w-0" onClick={() => startEdit(ev)} style={{ cursor: 'pointer' }}>
                <p className="text-sm font-medium text-white truncate">{ev.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[11px] px-1.5 py-0.5 rounded"
                    style={{ backgroundColor: ev.category.color + '30', color: ev.category.color }}>
                    {ev.category.name}
                  </span>
                  <span className="text-[11px] text-gray-500">{new Date(ev.startDate).toLocaleDateString()}</span>
                  {!ev.isActive && <span className="text-[11px] text-red-500">Inactive</span>}
                  {ev.isFeatured && <span className="text-[11px] text-yellow-500">Featured</span>}
                </div>
              </div>
              <button onClick={() => startEdit(ev)} className="text-gray-500 hover:text-blue-400 p-1.5">
                <Pencil className="w-4 h-4" />
              </button>
              <button onClick={() => deleteEvent(ev)} className="text-gray-500 hover:text-red-400 p-1.5">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Edit Drawer */}
      {editing && (
        <div className="fixed inset-0 z-50 flex flex-col bg-gray-950" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          {/* Edit Header */}
          <div className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between shrink-0">
            <button onClick={() => setEditing(null)} className="text-gray-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-semibold text-white text-sm truncate max-w-[200px]">{editing.title}</h3>
            <button onClick={save} disabled={saving}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm px-3 py-1.5 rounded-lg font-medium">
              <Save className="w-3.5 h-3.5" />
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
          {saveMsg && <p className={`text-center text-xs py-1 ${saveMsg === 'Saved' ? 'bg-green-900/40 text-green-400' : 'bg-red-900/40 text-red-400'}`}>{saveMsg}</p>}

          {/* Edit Form */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Toggles */}
            <div className="flex gap-3">
              <button onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${form.isActive ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400'}`}>
                {form.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />} Active
              </button>
              <button onClick={() => setForm(f => ({ ...f, isFeatured: !f.isFeatured }))}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${form.isFeatured ? 'bg-yellow-600 text-white' : 'bg-gray-800 text-gray-400'}`}>
                {form.isFeatured ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />} Featured
              </button>
            </div>

            {/* Category & Region */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Category</label>
                <div className="relative">
                  <select value={form.category?.id || ''}
                    onChange={e => { const c = categories.find(c => c.id === e.target.value); if (c) setForm(f => ({ ...f, category: c as unknown as DevEvent['category'] })) }}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none">
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Region</label>
                <div className="relative">
                  <select value={form.region?.id || ''}
                    onChange={e => { const r = regions.find(r => r.id === e.target.value); if (r) setForm(f => ({ ...f, region: r as unknown as DevEvent['region'] })) }}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none">
                    {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
                </div>
              </div>
            </div>

            {[
              { label: 'Title', key: 'title', type: 'text' },
              { label: 'Venue', key: 'venue', type: 'text' },
              { label: 'Address', key: 'address', type: 'text' },
              { label: 'Start Date', key: 'startDate', type: 'datetime-local' },
              { label: 'End Date', key: 'endDate', type: 'datetime-local' },
              { label: 'Price ($)', key: 'price', type: 'number' },
              { label: 'Price Range', key: 'priceRange', type: 'text' },
              { label: 'Image URL', key: 'imageUrl', type: 'url' },
              { label: 'Website', key: 'website', type: 'url' },
              { label: 'Latitude', key: 'latitude', type: 'number' },
              { label: 'Longitude', key: 'longitude', type: 'number' },
            ].map(({ label, key, type }) => (
              <div key={key}>
                <label className="block text-xs text-gray-400 mb-1">{label}</label>
                <input type={type} value={String(form[key as keyof typeof form] ?? '')}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-gray-600"
                  step={type === 'number' ? 'any' : undefined} />
              </div>
            ))}

            <div>
              <label className="block text-xs text-gray-400 mb-1">Description</label>
              <textarea value={form.description || ''} rows={4}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none" />
            </div>

            <button onClick={() => deleteEvent(editing)}
              className="w-full flex items-center justify-center gap-2 py-3 bg-red-900/30 hover:bg-red-900/50 border border-red-800/50 text-red-400 rounded-xl text-sm font-medium transition-colors">
              <Trash2 className="w-4 h-4" /> Delete Event
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
