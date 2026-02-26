// Shared normalized event type used by all scrapers
export interface ParsedEvent {
  title: string
  description: string
  longDescription: string | null
  venue: string
  address: string
  latitude: number
  longitude: number
  startDate: Date
  endDate: Date | null
  price: number | null
  priceRange: string | null
  imageUrl: string | null
  website: string
  categorySlug: string
  regionSlug: string
  slug: string
  source: string
}
