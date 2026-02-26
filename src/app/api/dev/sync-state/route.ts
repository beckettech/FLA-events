import { NextResponse } from 'next/server'
import { getSyncState } from '@/lib/syncManager'

function checkAuth(request: Request): boolean {
  return request.headers.get('Authorization')?.replace('Bearer ', '') === process.env.DEV_PASSWORD
}

// GET /api/dev/sync-state
export async function GET(request: Request) {
  if (!checkAuth(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json(getSyncState())
}
