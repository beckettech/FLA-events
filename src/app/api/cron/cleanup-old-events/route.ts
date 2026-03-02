import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Daily cleanup: Delete events that have already passed
 * Runs via Vercel Cron
 */

function verifyAuth(req: NextRequest): boolean {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return false;
  }
  
  return true;
}

export async function GET(req: NextRequest) {
  console.log('🗑️  Cron job triggered: cleanup-old-events');
  
  if (!verifyAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();
    
    // Delete events where startDate is in the past
    const result = await prisma.event.deleteMany({
      where: {
        startDate: {
          lt: now,
        },
      },
    });

    console.log(`✅ Deleted ${result.count} past events`);

    return NextResponse.json({
      success: true,
      deleted: result.count,
      timestamp: now.toISOString(),
    });

  } catch (error: any) {
    console.error('❌ Cleanup failed:', error);
    return NextResponse.json({
      error: error.message,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
