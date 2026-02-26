/**
 * syncManager.ts
 * Tracks live-sync state for Ticketmaster + Eventbrite.
 * On each /api/events request the app checks if data is stale and
 * triggers a background refresh — users always get fast DB results.
 */

import fs from 'fs'
import path from 'path'

const SYNC_FILE = path.join(process.cwd(), 'db', 'sync-state.json')
const SYNC_INTERVAL_MS = 60 * 60 * 1000 // 1 hour

interface SyncState {
  lastSync: number       // epoch ms
  syncing: boolean
  lastCount: number
}

function readState(): SyncState {
  try {
    return JSON.parse(fs.readFileSync(SYNC_FILE, 'utf8'))
  } catch {
    return { lastSync: 0, syncing: false, lastCount: 0 }
  }
}

function writeState(state: SyncState) {
  try {
    fs.mkdirSync(path.dirname(SYNC_FILE), { recursive: true })
    fs.writeFileSync(SYNC_FILE, JSON.stringify(state))
  } catch { /* non-fatal */ }
}

export function isStale(): boolean {
  const { lastSync, syncing } = readState()
  if (syncing) return false // already running
  return Date.now() - lastSync > SYNC_INTERVAL_MS
}

export function getSyncState(): SyncState {
  return readState()
}

export function markSyncStart() {
  writeState({ ...readState(), syncing: true })
}

export function markSyncDone(count: number) {
  writeState({ lastSync: Date.now(), syncing: false, lastCount: count })
}

export function markSyncFailed() {
  writeState({ ...readState(), syncing: false })
}

/** Build the next 4-month date window from today */
export function getDateWindow(): { start: string; end: string } {
  const now = new Date()
  const start = now.toISOString().slice(0, 10)
  const end = new Date(now.getTime() + 120 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  return { start, end }
}
