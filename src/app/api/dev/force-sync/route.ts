import { NextResponse } from 'next/server'
import { runBackgroundSync } from '@/lib/backgroundSync'
import { getSyncState } from '@/lib/syncManager'

function checkAuth(request: Request): boolean {
  return request.headers.get('Authorization')?.replace('Bearer ', '') === process.env.DEV_PASSWORD
}

// POST /api/dev/force-sync
export async function POST(request: Request) {
  if (!checkAuth(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const before = getSyncState()
  if (before.syncing) {
    return NextResponse.json({ error: 'Sync already in progress' }, { status: 409 })
  }

  try {
    await runBackgroundSync()
    const after = getSyncState()
    return NextResponse.json({
      message: `Sync complete — ${after.lastCount} events synced`,
      lastCount: after.lastCount,
      lastSync: after.lastSync,
    })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
