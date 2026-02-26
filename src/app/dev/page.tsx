'use client'

import { useState, useEffect, useCallback } from 'react'

interface DbStats {
  total: number
  byRegion: Record<string, number>
  byCategory: Record<string, number>
}

interface ScrapeResult {
  count?: number
  total?: number
  message?: string
  error?: string
  saved?: number
  skipped?: number
  results?: Array<{ site: string; count: number; error?: string }>
  events?: unknown[]
}

interface SyncState {
  lastSync: number
  syncing: boolean
  lastCount: number
}

const FL_SITES = [
  'https://www.visitflorida.com/events/',
  'https://www.miamiandbeaches.com/events',
  'https://www.visittampabay.com/events/',
  'https://www.visitorlando.com/events/',
  'https://www.visitjacksonville.com/events/',
  'https://www.visitpensacola.com/events/',
  'https://www.napleschamber.org/events',
  'https://www.flacarshows.com',
]

// ── Login ──────────────────────────────────────────────────────────────────

export default function DevPage() {
  const [password, setPassword] = useState('')
  const [authed, setAuthed] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const saved = sessionStorage.getItem('dev_pw')
    if (saved) { setPassword(saved); setAuthed(true) }
  }, [])

  function login(e: React.FormEvent) {
    e.preventDefault()
    if (!password) { setError('Enter password'); return }
    sessionStorage.setItem('dev_pw', password)
    setAuthed(true)
    setError('')
  }

  if (!authed) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🛠️</div>
          <h1 className="text-xl font-bold text-white">FLA Events Dev</h1>
          <p className="text-gray-400 text-sm mt-1">Backend admin dashboard</p>
        </div>
        <form onSubmit={login} className="space-y-3">
          <input type="password" placeholder="Password" value={password}
            onChange={e => setPassword(e.target.value)} autoFocus
            className="w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg">Enter</button>
        </form>
      </div>
    </div>
  )

  return <Dashboard password={password} onLogout={() => { sessionStorage.removeItem('dev_pw'); setAuthed(false) }} />
}

// ── Dashboard ──────────────────────────────────────────────────────────────

function Dashboard({ password, onLogout }: { password: string; onLogout: () => void }) {
  const [stats, setStats] = useState<DbStats | null>(null)
  const [syncState, setSyncState] = useState<SyncState | null>(null)

  const auth = { Authorization: `Bearer ${password}` }

  const refresh = useCallback(async () => {
    const [s, sync] = await Promise.all([
      fetch('/api/dev/stats', { headers: auth }).then(r => r.json()).catch(() => null),
      fetch('/api/dev/sync-state', { headers: auth }).then(r => r.json()).catch(() => null),
    ])
    setStats(s)
    setSyncState(sync)
  }, [password])

  useEffect(() => { refresh() }, [refresh])

  const lastSyncText = syncState
    ? syncState.syncing ? '⏳ Syncing now...'
      : syncState.lastSync === 0 ? 'Never synced'
      : `Last sync: ${new Date(syncState.lastSync).toLocaleTimeString()} · ${syncState.lastCount} events added`
    : '...'

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🛠️</span>
          <div>
            <h1 className="font-bold text-white">FLA Events — Dev Dashboard</h1>
            <p className="text-xs text-gray-400">{lastSyncText}</p>
          </div>
        </div>
        <div className="flex gap-3 items-center">
          <button onClick={refresh} className="text-xs text-blue-400 hover:text-blue-300">Refresh</button>
          <button onClick={onLogout} className="text-xs text-gray-400 hover:text-white">Logout</button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-6 space-y-6">
        {/* Stats */}
        <StatsGrid stats={stats} />

        {/* Live Sync Status */}
        <LiveSyncPanel password={password} onRefresh={refresh} />

        {/* AI Event Scraper */}
        <AIScrapePanel password={password} onRefresh={refresh} />

        {/* God Mode */}
        <GodModePanel />
      </div>
    </div>
  )
}

// ── Stats ──────────────────────────────────────────────────────────────────

function StatsGrid({ stats }: { stats: DbStats | null }) {
  if (!stats) return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-pulse">
      {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-gray-800 rounded-xl" />)}
    </div>
  )

  const topRegions = Object.entries(stats.byRegion).sort((a, b) => b[1] - a[1]).slice(0, 3)

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div className="col-span-2 sm:col-span-1 bg-blue-600/20 border border-blue-500/30 rounded-xl p-4">
        <div className="text-3xl font-bold text-blue-400">{stats.total.toLocaleString()}</div>
        <div className="text-xs text-blue-300 mt-1">Total Active Events</div>
      </div>
      {topRegions.map(([name, count]) => (
        <div key={name} className="bg-gray-800 border border-gray-700 rounded-xl p-4">
          <div className="text-2xl font-bold text-white">{count}</div>
          <div className="text-xs text-gray-400 mt-1 capitalize">{name}</div>
        </div>
      ))}
    </div>
  )
}

// ── Live Sync Panel ────────────────────────────────────────────────────────

function LiveSyncPanel({ password, onRefresh }: { password: string; onRefresh: () => void }) {
  const [status, setStatus] = useState<'idle' | 'running' | 'done' | 'error'>('idle')
  const [msg, setMsg] = useState('')

  async function forcSync() {
    setStatus('running')
    setMsg('Fetching from Ticketmaster + Eventbrite...')
    try {
      const res = await fetch('/api/dev/force-sync', {
        method: 'POST',
        headers: { Authorization: `Bearer ${password}` },
      })
      const data = await res.json()
      if (data.error) { setStatus('error'); setMsg(data.error); return }
      setStatus('done')
      setMsg(data.message ?? 'Sync complete')
      onRefresh()
    } catch (e) {
      setStatus('error')
      setMsg(String(e))
    }
  }

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h2 className="font-semibold text-white flex items-center gap-2">
            <span>⚡</span> Live Event Sync
          </h2>
          <p className="text-gray-400 text-sm mt-0.5">
            Ticketmaster + Eventbrite auto-sync every hour when users load the app.
            Force a manual sync anytime.
          </p>
        </div>
        <div className="flex gap-2 shrink-0 ml-4">
          <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
            🟢 Auto-sync active
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 mt-3">
        <div className="flex-1 bg-gray-800 rounded-lg p-3 text-sm">
          <div className="flex gap-4 flex-wrap">
            <span className="text-gray-300">🎟 <span className="text-white font-medium">Ticketmaster</span> — 5,204 FL events available</span>
            <span className="text-gray-300">🎪 <span className="text-white font-medium">Eventbrite</span> — org events</span>
          </div>
          <p className="text-gray-500 text-xs mt-1">Syncs next 4 months of events · Refreshes hourly · Expired events auto-deactivated</p>
        </div>
        <button
          onClick={forcSync}
          disabled={status === 'running'}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm rounded-lg font-medium transition-colors whitespace-nowrap"
        >
          {status === 'running' ? '⏳ Syncing...' : 'Force Sync Now'}
        </button>
      </div>

      {msg && (
        <p className={`mt-2 text-sm ${status === 'error' ? 'text-red-400' : status === 'done' ? 'text-green-400' : 'text-yellow-400'}`}>
          {msg}
        </p>
      )}
    </div>
  )
}

// ── God Mode Panel ─────────────────────────────────────────────────────────

function GodModePanel() {
  const [active, setActive] = useState(() => {
    try { return localStorage.getItem('god_mode') === '1' } catch { return false }
  })

  function toggle() {
    const next = !active
    try {
      if (next) localStorage.setItem('god_mode', '1')
      else localStorage.removeItem('god_mode')
    } catch { /* ignore */ }
    setActive(next)
  }

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl p-5">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-semibold text-white flex items-center gap-2">
            <span>⚡</span> God Mode
          </h2>
          <p className="text-gray-400 text-sm mt-0.5">
            Enables inline edit &amp; delete buttons on every event card in the main app.
            Open the app after toggling — no reload needed if already on the page.
          </p>
        </div>
        <button
          onClick={toggle}
          className={`ml-4 shrink-0 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            active
              ? 'bg-yellow-400 text-yellow-900 hover:bg-yellow-300'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          {active ? '⚡ ON' : 'OFF'}
        </button>
      </div>
      {active && (
        <p className="mt-3 text-xs text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 rounded-lg px-3 py-2">
          God Mode is active. Edit/delete controls are visible in the main app for anyone with this browser session.
        </p>
      )}
    </div>
  )
}

// ── AI Scraper Panel ───────────────────────────────────────────────────────

function AIScrapePanel({ password, onRefresh }: { password: string; onRefresh: () => void }) {
  const [mode, setMode] = useState<'all' | 'url'>('all')
  const [customUrl, setCustomUrl] = useState('')
  const [status, setStatus] = useState<'idle' | 'running' | 'done' | 'error'>('idle')
  const [result, setResult] = useState<ScrapeResult | null>(null)
  const [saving, setSaving] = useState(false)

  async function runScrape(save: boolean) {
    setStatus('running')
    setResult(null)

    const body = mode === 'all'
      ? { runAll: true, save }
      : { url: customUrl.trim(), save }

    try {
      const res = await fetch('/api/dev/ai-scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${password}` },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      setResult(data)
      setStatus(data.error ? 'error' : 'done')
      if (!data.error && save) onRefresh()
    } catch (e) {
      setResult({ error: String(e) })
      setStatus('error')
    }
  }

  async function saveResults() {
    setSaving(true)
    await runScrape(true)
    setSaving(false)
  }

  const totalFound = result?.total ?? result?.count ?? 0
  const hasResults = totalFound > 0 && !result?.message

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl p-5">
      <div className="flex items-start justify-between mb-1">
        <div>
          <h2 className="font-semibold text-white flex items-center gap-2">
            <span>🤖</span> AI Event Discovery
          </h2>
          <p className="text-gray-400 text-sm mt-0.5">
            AI reads Florida event websites and extracts structured event data automatically.
            Powered by free OpenRouter models.
          </p>
        </div>
      </div>

      {/* Mode tabs */}
      <div className="flex gap-1 mt-4 bg-gray-800 p-1 rounded-lg w-fit">
        <button onClick={() => setMode('all')}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${mode === 'all' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}>
          Scrape All FL Sites
        </button>
        <button onClick={() => setMode('url')}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${mode === 'url' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}>
          Custom URL
        </button>
      </div>

      {mode === 'all' && (
        <div className="mt-3 bg-gray-800 rounded-lg p-3">
          <p className="text-xs text-gray-400 mb-2 font-medium">Will scrape these sites:</p>
          <div className="flex flex-wrap gap-2">
            {FL_SITES.map(s => (
              <span key={s} className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded-full">
                {new URL(s).hostname.replace('www.', '')}
              </span>
            ))}
          </div>
        </div>
      )}

      {mode === 'url' && (
        <div className="mt-3">
          <input type="url" value={customUrl} onChange={e => setCustomUrl(e.target.value)}
            placeholder="https://any-florida-event-site.com/events"
            className="w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500" />
        </div>
      )}

      <div className="flex gap-2 mt-4">
        <button onClick={() => runScrape(false)} disabled={status === 'running' || (mode === 'url' && !customUrl)}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm rounded-lg font-medium transition-colors">
          {status === 'running' ? '🤖 AI Scanning...' : '🤖 Preview Events'}
        </button>
        {hasResults && (
          <button onClick={saveResults} disabled={saving}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm rounded-lg font-medium transition-colors">
            {saving ? 'Saving...' : `Save ${totalFound} Events`}
          </button>
        )}
      </div>

      {/* Results */}
      {result && (
        <div className="mt-4">
          {result.error && (
            <div className="bg-red-900/20 border border-red-700/30 rounded-lg p-3">
              <p className="text-red-400 text-sm">{result.error}</p>
              {result.error.includes('OPENROUTER_API_KEY') && (
                <a href="https://openrouter.ai" target="_blank" rel="noreferrer"
                  className="text-blue-400 text-xs mt-1 block hover:underline">
                  Get a free OpenRouter API key →
                </a>
              )}
            </div>
          )}

          {result.message && (
            <div className="bg-green-900/20 border border-green-700/30 rounded-lg p-3">
              <p className="text-green-400 text-sm font-medium">✓ {result.message}</p>
            </div>
          )}

          {result.results && (
            <div className="mt-3 space-y-2">
              <p className="text-sm text-gray-300">
                Scraped <span className="text-white font-semibold">{result.results.length}</span> sites ·
                Found <span className="text-white font-semibold">{totalFound}</span> events
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {result.results.map(r => (
                  <div key={r.site} className={`rounded-lg p-2.5 text-xs ${r.error ? 'bg-red-900/20 border border-red-700/20' : 'bg-gray-800'}`}>
                    <p className="text-white font-medium truncate">{new URL(r.site).hostname.replace('www.', '')}</p>
                    {r.error
                      ? <p className="text-red-400 mt-0.5 truncate">{r.error}</p>
                      : <p className="text-green-400 mt-0.5">{r.count} events found</p>
                    }
                  </div>
                ))}
              </div>
            </div>
          )}

          {!result.results && result.count !== undefined && !result.message && (
            <p className="text-sm text-gray-300 mt-2">
              Found <span className="text-white font-semibold">{result.count}</span> events from <span className="text-white">{customUrl}</span>
            </p>
          )}
        </div>
      )}
    </div>
  )
}
