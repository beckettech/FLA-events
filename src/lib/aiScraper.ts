/**
 * aiScraper.ts
 * Uses Claude to intelligently extract event data from any webpage.
 * Handles messy HTML, non-standard formats, and partial data gracefully.
 */

import type { ParsedEvent } from './eventParser'
import { detectRegionFromCity } from './ticketmaster'

const FL_EVENT_SITES = [
  'https://www.visitflorida.com/events/',
  'https://www.miamiandbeaches.com/events',
  'https://www.visittampabay.com/events/',
  'https://www.visitorlando.com/events/',
  'https://www.visitjacksonville.com/events/',
  'https://www.visitpensacola.com/events/',
  'https://www.napleschamber.org/events',
  'https://www.flacarshows.com',
]

interface AIEvent {
  title: string
  description: string
  venue: string
  address: string
  city: string
  startDate: string
  endDate?: string
  price?: number
  priceRange?: string
  imageUrl?: string
  website?: string
  category?: string
}

function slugify(text: string, suffix = ''): string {
  const base = text.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').slice(0, 55)
  return suffix ? `${base}-${suffix}` : base
}

function shortHash(str: string): string {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0
  return h.toString(36).slice(0, 6)
}

async function fetchPage(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
    },
    signal: AbortSignal.timeout(20000),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
  const html = await res.text()
  // Strip scripts, styles, nav to reduce token count
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s{3,}/g, '\n')
    .slice(0, 12000) // cap at ~12k chars for Claude
}

// Free models on OpenRouter — tried in order until one succeeds
const FREE_MODELS = [
  'deepseek/deepseek-r1-0528:free',
  'deepseek/deepseek-r1:free',
  'deepseek/deepseek-chat-v3-0324:free',
  'meta-llama/llama-4-maverick:free',
  'meta-llama/llama-4-scout:free',
  'meta-llama/llama-3.3-70b-instruct:free',
  'google/gemini-2.0-flash-exp:free',
  'qwen/qwen3-14b:free',
  'qwen/qwen3-8b:free',
  'moonshot/kimi-k2:free',
  'mistralai/devstral-small-2505:free',
  'mistralai/mistral-7b-instruct:free',
  'google/gemma-3-12b-it:free',
  'google/gemma-3-27b-it:free',
]

async function callAI(prompt: string, startIndex = 0): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey || apiKey === 'YOUR_OPENROUTER_KEY_HERE') {
    throw new Error('OPENROUTER_API_KEY not set in .env.local — get a free key at openrouter.ai')
  }

  // Rotate starting model so sequential calls spread load across all models
  const rotated = [
    ...FREE_MODELS.slice(startIndex),
    ...FREE_MODELS.slice(0, startIndex),
  ]

  for (const model of rotated) {
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://flaevents.app',
          'X-Title': 'FLA Events Scraper',
        },
        body: JSON.stringify({
          model,
          max_tokens: 4096,
          messages: [{ role: 'user', content: prompt }],
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        console.warn(`[AI] ${model} failed: ${res.status}`, err)
        continue
      }

      const data = await res.json()
      const text = data.choices?.[0]?.message?.content ?? ''
      if (text) return text
    } catch (err) {
      console.warn(`[AI] ${model} error:`, err)
    }
  }

  throw new Error('All AI models failed. Check your OPENROUTER_API_KEY.')
}

async function extractEventsFromPage(url: string, modelStartIndex = 0): Promise<AIEvent[]> {
  const pageText = await fetchPage(url)

  const prompt = `You are an event data extractor. Extract ALL upcoming events from the following webpage text.

URL: ${url}
Today's date: ${new Date().toISOString().slice(0, 10)}

Return ONLY a valid JSON array of events. Each event must have:
- title (string, required)
- description (string, max 300 chars)
- venue (string - the venue/location name)
- address (string - street address if available)
- city (string - city in Florida)
- startDate (string - ISO 8601 format YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS)
- endDate (string - ISO 8601, optional)
- price (number - base price in dollars, 0 if free, null if unknown)
- priceRange (string - e.g. "Free", "$25 – $75", null if unknown)
- imageUrl (string - full URL to event image, null if none)
- website (string - event URL, use the page URL if no specific event URL)
- category (string - one of: music, food-drink, arts-culture, sports, nightlife, family, festivals, car-show)

Only include events that are in Florida and in the future (after ${new Date().toISOString().slice(0, 10)}).
If you find no events, return an empty array [].
Return ONLY the JSON array, no explanation.

PAGE CONTENT:
${pageText}`

  const response = await callAI(prompt, modelStartIndex)

  // Extract JSON from response
  const jsonMatch = response.match(/\[[\s\S]*\]/)
  if (!jsonMatch) return []

  try {
    const parsed = JSON.parse(jsonMatch[0])
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export async function scrapeWithAI(url: string, modelStartIndex = 0): Promise<ParsedEvent[]> {
  const aiEvents = await extractEventsFromPage(url, modelStartIndex)

  return aiEvents.map(ev => {
    const slug = slugify(ev.title, shortHash(ev.website ?? url))
    return {
      title: ev.title,
      description: ev.description ?? ev.title,
      longDescription: null,
      venue: ev.venue ?? ev.city ?? 'Florida',
      address: ev.address ?? ev.city ?? 'Florida',
      latitude: 25.7617,
      longitude: -80.1918,
      startDate: new Date(ev.startDate) ?? new Date(Date.now() + 14 * 86400000),
      endDate: ev.endDate ? new Date(ev.endDate) : null,
      price: ev.price ?? null,
      priceRange: ev.priceRange ?? null,
      imageUrl: ev.imageUrl ?? null,
      website: ev.website ?? url,
      categorySlug: ev.category ?? 'festivals',
      regionSlug: detectRegionFromCity(ev.city ?? ''),
      slug,
      source: new URL(url).hostname.replace('www.', ''),
    }
  }).filter(ev => !isNaN(ev.startDate.getTime()))
}

/** Runs AI scraper across all known FL event sites */
export async function runAIScrapeAll(
  onProgress?: (site: string, count: number) => void
): Promise<{ site: string; events: ParsedEvent[]; error?: string }[]> {
  const results: { site: string; events: ParsedEvent[]; error?: string }[] = []

  for (let i = 0; i < FL_EVENT_SITES.length; i++) {
    const site = FL_EVENT_SITES[i]
    // Rotate starting model per site so each site hits a fresh model first
    const modelStartIndex = i % FREE_MODELS.length
    try {
      const events = await scrapeWithAI(site, modelStartIndex)
      onProgress?.(site, events.length)
      results.push({ site, events })
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err)
      onProgress?.(site, 0)
      results.push({ site, events: [], error })
    }
    // Give free-tier AI models time to recover between requests
    await new Promise(r => setTimeout(r, 3000))
  }

  return results
}

export { FL_EVENT_SITES }
