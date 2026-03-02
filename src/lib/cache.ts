/**
 * Simple in-memory cache for API responses
 * Helps reduce database load for frequently accessed data
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>()
  
  /**
   * Get cached data if it exists and hasn't expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) return null
    
    const now = Date.now()
    const age = now - entry.timestamp
    
    if (age > entry.ttl) {
      this.cache.delete(key)
      return null
    }
    
    return entry.data as T
  }
  
  /**
   * Set cache data with TTL in milliseconds
   */
  set<T>(key: string, data: T, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    })
  }
  
  /**
   * Delete a specific cache entry
   */
  delete(key: string): void {
    this.cache.delete(key)
  }
  
  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear()
  }
  
  /**
   * Get cache statistics
   */
  stats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    }
  }
  
  /**
   * Clean up expired entries
   */
  cleanup(): number {
    const now = Date.now()
    let removed = 0
    
    for (const [key, entry] of this.cache.entries()) {
      const age = now - entry.timestamp
      if (age > entry.ttl) {
        this.cache.delete(key)
        removed++
      }
    }
    
    return removed
  }
}

// Export singleton instance
export const cache = new MemoryCache()

// Run cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const removed = cache.cleanup()
    if (removed > 0) {
      console.log(`[cache] Cleaned up ${removed} expired entries`)
    }
  }, 5 * 60 * 1000)
}

// Helper function to create cache key from request parameters
export function createCacheKey(prefix: string, params: Record<string, any>): string {
  const sortedKeys = Object.keys(params).sort()
  const keyParts = sortedKeys.map(key => `${key}=${params[key]}`)
  return `${prefix}:${keyParts.join('&')}`
}

// Common TTL values (in milliseconds)
export const TTL = {
  ONE_MINUTE: 60 * 1000,
  FIVE_MINUTES: 5 * 60 * 1000,
  TEN_MINUTES: 10 * 60 * 1000,
  THIRTY_MINUTES: 30 * 60 * 1000,
  ONE_HOUR: 60 * 60 * 1000,
}
