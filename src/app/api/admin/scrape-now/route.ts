import { NextRequest, NextResponse } from 'next/server';

/**
 * Manual trigger for event scraping
 * GET /api/admin/scrape-now
 */
export async function GET(req: NextRequest) {
  // Simple admin check - in production, add proper auth
  const adminKey = process.env.ADMIN_KEY || 'dev-admin-key';
  const providedKey = req.nextUrl.searchParams.get('key');
  
  if (providedKey !== adminKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Forward to the cron endpoint
  const baseUrl = process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}` 
    : 'http://localhost:3000';
  
  const cronSecret = process.env.CRON_SECRET || '';
  
  const response = await fetch(`${baseUrl}/api/cron/scrape-events`, {
    headers: {
      'Authorization': `Bearer ${cronSecret}`,
    },
  });

  const data = await response.json();
  return NextResponse.json(data);
}
