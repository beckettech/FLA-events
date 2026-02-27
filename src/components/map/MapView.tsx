'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Locate, Loader2, RefreshCw } from 'lucide-react'

// Fix for default marker icons in Leaflet with Next.js
const createIcon = (color: string, size: 'large' | 'normal' | 'small' = 'normal') => {
  const dimensions = size === 'large' ? { w: 40, h: 40, icon: 20 } : size === 'normal' ? { w: 32, h: 32, icon: 16 } : { w: 24, h: 24, icon: 12 }
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: ${color};
        width: ${dimensions.w}px;
        height: ${dimensions.h}px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 10px rgba(0,0,0,0.35);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
      ">
        <svg width="${dimensions.icon}" height="${dimensions.icon}" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
      </div>
    `,
    iconSize: [dimensions.w, dimensions.h],
    iconAnchor: [dimensions.w / 2, dimensions.h],
    popupAnchor: [0, -dimensions.h],
  })
}

const userLocationIcon = L.divIcon({
  className: 'user-location-marker',
  html: `
    <div style="
      background-color: #3B82F6;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      border: 4px solid white;
      box-shadow: 0 0 0 12px rgba(59, 130, 246, 0.25);
    "></div>
  `,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
})

interface Event {
  id: string
  title: string
  slug: string
  description: string
  venue: string
  address: string
  latitude: number
  longitude: number
  price: number | null
  priceRange: string | null
  rating: number
  reviewCount: number
  isFeatured: boolean
  category: {
    id: string
    name: string
    slug: string
    icon: string
    color: string
  }
  region: {
    id: string
    name: string
    slug: string
  }
}

interface MapEventsProps {
  events: Event[]
  onEventClick: (slug: string) => void
  center?: [number, number] | null
  zoom?: number | null
  onMapMove?: (center: [number, number], bounds: { north: number; south: number; east: number; west: number }) => void
}

// Calculate distance between two coordinates in meters
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000 // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// Component to handle map center changes
function MapController({ center, zoom }: { center?: [number, number] | null; zoom?: number | null }) {
  const map = useMap()

  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom || 10, { duration: 0.5 })
    }
  }, [center, zoom, map])

  return null
}

// Component to handle map movement detection
function MapMoveDetector({ onMapMove, threshold = 100 }: { 
  onMapMove: (center: [number, number], bounds: { north: number; south: number; east: number; west: number }) => void
  threshold: number 
}) {
  const map = useMap()
  const lastCenterRef = useRef<{ lat: number; lng: number } | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const checkMovement = useCallback(() => {
    const center = map.getCenter()
    const bounds = map.getBounds()
    
    if (lastCenterRef.current) {
      const distance = calculateDistance(
        lastCenterRef.current.lat, 
        lastCenterRef.current.lng,
        center.lat, 
        center.lng
      )
      
      if (distance >= threshold) {
        lastCenterRef.current = { lat: center.lat, lng: center.lng }
        onMapMove(
          [center.lat, center.lng],
          {
            north: bounds.getNorth(),
            south: bounds.getSouth(),
            east: bounds.getEast(),
            west: bounds.getWest()
          }
        )
      }
    } else {
      lastCenterRef.current = { lat: center.lat, lng: center.lng }
    }
  }, [map, onMapMove, threshold])

  useMapEvents({
    moveend: () => {
      // Debounce the movement check
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      timeoutRef.current = setTimeout(checkMovement, 300)
    },
  })

  // Initialize on mount
  useEffect(() => {
    const center = map.getCenter()
    lastCenterRef.current = { lat: center.lat, lng: center.lng }
  }, [map])

  return null
}

// Component to handle map events
function MapMarkers({ events, onEventClick }: { events: Event[]; onEventClick: (slug: string) => void }) {
  // Filter out events with invalid coordinates
  const validEvents = events.filter(e => 
    typeof e.latitude === 'number' && 
    typeof e.longitude === 'number' &&
    !isNaN(e.latitude) && 
    !isNaN(e.longitude)
  )

  return (
    <>
      {validEvents.map((event) => {
        const color = event.category?.color || '#3B82F6'
        return (
          <Marker
            key={event.id}
            position={[event.latitude, event.longitude]}
            icon={createIcon(color, 'large')}
          >
            <Popup className="event-popup" maxWidth={250}>
              <div className="min-w-[200px] p-2">
                <h3 className="font-semibold text-base mb-1.5 text-gray-900 dark:text-white">{event.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{event.venue}</p>
                <div className="flex items-center gap-2 mb-3">
                  <Badge
                    style={{
                      backgroundColor: color + '20',
                      color: color,
                      border: 'none'
                    }}
                    className="text-xs px-2 py-1"
                  >
                    {event.category?.name}
                  </Badge>
                  {(event.priceRange || event.price === 0) && (
                    <span className="text-xs text-gray-500">{event.priceRange ?? 'Free'}</span>
                  )}
                </div>
                <Button
                  size="sm"
                  className="w-full h-10 text-sm bg-blue-600 hover:bg-blue-700"
                  onClick={() => onEventClick(event.slug)}
                >
                  View Details
                </Button>
              </div>
            </Popup>
          </Marker>
        )
      })}
    </>
  )
}

// Location finder component
function LocationFinder({ 
  onLocationFound, 
  onError 
}: { 
  onLocationFound: (lat: number, lng: number) => void
  onError: (error: string) => void 
}) {
  const map = useMap()
  const [locating, setLocating] = useState(false)

  const locateUser = useCallback(() => {
    setLocating(true)
    map.locate({ setView: true, maxZoom: 10, timeout: 10000 })
  }, [map])

  useMapEvents({
    locationfound(e) {
      setLocating(false)
      onLocationFound(e.latlng.lat, e.latlng.lng)
    },
    locationerror() {
      setLocating(false)
      onError('Unable to get location')
    },
  })

  return (
    <button
      onClick={locateUser}
      className="absolute bottom-24 right-4 z-[1000] w-14 h-14 bg-white dark:bg-gray-800 rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors active:scale-95"
      disabled={locating}
      aria-label="Find my location"
    >
      {locating ? (
        <Loader2 className="w-6 h-6 text-blue-600 dark:text-blue-400 animate-spin" />
      ) : (
        <Locate className="w-6 h-6 text-blue-600 dark:text-blue-400" />
      )}
    </button>
  )
}

// Zoom controls - Touch friendly with larger buttons
function ZoomControls() {
  const map = useMap()

  return (
    <div className="absolute bottom-4 left-4 z-[1000] flex flex-col gap-2">
      <button
        onClick={() => map.zoomIn()}
        className="w-12 h-12 bg-white dark:bg-gray-800 rounded-xl shadow-lg flex items-center justify-center text-xl font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 active:scale-95 transition-all"
        aria-label="Zoom in"
      >
        +
      </button>
      <button
        onClick={() => map.zoomOut()}
        className="w-12 h-12 bg-white dark:bg-gray-800 rounded-xl shadow-lg flex items-center justify-center text-xl font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 active:scale-95 transition-all"
        aria-label="Zoom out"
      >
        −
      </button>
    </div>
  )
}

interface MapViewProps {
  events: Event[]
  onEventClick: (slug: string) => void
  center?: [number, number] | null
  zoom?: number | null
  onMapMove?: (center: [number, number], bounds: { north: number; south: number; east: number; west: number }) => void
}

export default function MapView({ events, onEventClick, center, zoom, onMapMove }: MapViewProps) {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [showPermissionRequest, setShowPermissionRequest] = useState(false)
  const [isReloading, setIsReloading] = useState(false)
  
  // Florida center coordinates
  const mapCenter: [number, number] = [27.7663, -81.6868]
  const mapZoom = 7

  // Check for geolocation on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.permissions?.query({ name: 'geolocation' }).then((result) => {
        if (result.state === 'granted') {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const { latitude, longitude } = position.coords
              setUserLocation({ lat: latitude, lng: longitude })
            },
            () => {
              setShowPermissionRequest(true)
            }
          )
        } else if (result.state === 'prompt') {
          setShowPermissionRequest(true)
        } else {
          setShowPermissionRequest(true)
        }
      })
    }
  }, [])

  const handleLocationFound = (lat: number, lng: number) => {
    setUserLocation({ lat, lng })
    setShowPermissionRequest(false)
  }

  const handleLocationError = () => {
    // Keep Florida center on error
  }

  const requestLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          setUserLocation({ lat: latitude, lng: longitude })
          setShowPermissionRequest(false)
        },
        () => {
          setShowPermissionRequest(false)
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      )
    }
  }

  const handleMapMove = useCallback((center: [number, number], bounds: { north: number; south: number; east: number; west: number }) => {
    if (onMapMove) {
      setIsReloading(true)
      onMapMove(center, bounds)
      // Simulate reload completion
      setTimeout(() => setIsReloading(false), 500)
    }
  }, [onMapMove])

  // Filter valid events
  const validEvents = events.filter(e => 
    typeof e.latitude === 'number' && 
    typeof e.longitude === 'number' &&
    !isNaN(e.latitude) && 
    !isNaN(e.longitude)
  )

  return (
    <div className="h-full relative touch-manipulation">
      {/* Permission Request Banner */}
      {showPermissionRequest && (
        <div className="absolute top-0 left-0 right-0 z-[1000] bg-white dark:bg-gray-800 border-b dark:border-gray-700 shadow-md p-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center shrink-0">
              <Locate className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900 dark:text-white">Enable location</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Show events near you</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPermissionRequest(false)}
                className="text-gray-500 dark:text-gray-400 h-9"
              >
                Skip
              </Button>
              <Button
                size="sm"
                onClick={requestLocation}
                className="bg-blue-600 hover:bg-blue-700 h-9"
              >
                Enable
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Map Container */}
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        className="h-full w-full"
        zoomControl={false}
        tap={true}
        bounceAtZoomLimits={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          className="dark:map-tiles-dark"
        />
        
        <MapController center={center} zoom={zoom} />
        <MapMarkers events={validEvents} onEventClick={onEventClick} />
        
        {onMapMove && (
          <MapMoveDetector onMapMove={handleMapMove} threshold={100} />
        )}
        
        {userLocation && (
          <Marker
            position={[userLocation.lat, userLocation.lng]}
            icon={userLocationIcon}
          />
        )}

        <LocationFinder 
          onLocationFound={handleLocationFound}
          onError={handleLocationError}
        />
        
        <ZoomControls />
      </MapContainer>

      {/* Events Count Badge */}
      <div className="absolute top-4 left-4 z-[1000] bg-white dark:bg-gray-800 rounded-full shadow-lg px-4 py-2">
        <p className="text-sm font-semibold text-gray-900 dark:text-white">{validEvents.length} events</p>
      </div>

      {/* Reloading indicator */}
      {isReloading && (
        <div className="absolute top-4 right-4 z-[1000] bg-white dark:bg-gray-800 rounded-full shadow-lg px-3 py-2 flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
          <span className="text-sm text-gray-600 dark:text-gray-300">Updating...</span>
        </div>
      )}

      {/* Dark mode map styles */}
      <style jsx global>{`
        .dark .leaflet-tile-pane {
          filter: brightness(0.7) contrast(1.1) saturate(0.8);
        }
        .dark .leaflet-popup-content-wrapper {
          background-color: #1f2937;
          color: white;
        }
        .dark .leaflet-popup-tip {
          background-color: #1f2937;
        }
        .leaflet-popup-content {
          margin: 12px 16px;
          margin-top: 50px;
        }
        .leaflet-container {
          font-family: inherit;
        }
        .leaflet-popup-close-button {
          font-size: 24px !important;
          width: 36px !important;
          height: 36px !important;
          display: flex !important;
          align-items: center;
          justify-content: center;
          color: #3B82F6 !important;
          font-weight: bold !important;
          background: rgba(255,255,255,0.9) !important;
          border-radius: 50% !important;
          top: 8px !important;
          right: 8px !important;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15) !important;
        }
        .leaflet-popup-close-button:hover {
          color: #2563EB !important;
          background: white !important;
        }
        .leaflet-popup-content-wrapper {
          padding-top: 8px !important;
        }
        .custom-marker {
          cursor: pointer !important;
        }
        .custom-marker:hover {
          transform: scale(1.1);
          transition: transform 0.2s ease;
        }
        @media (hover: none) {
          .custom-marker:hover {
            transform: none;
          }
        }
      `}</style>
    </div>
  )
}
