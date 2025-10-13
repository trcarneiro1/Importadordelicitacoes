import { NextResponse } from 'next/server';
import { getRecentScrapingLogs } from '@/lib/supabase/queries';

export async function GET() {
  try {
    const logs = await getRecentScrapingLogs(20);

    return NextResponse.json({
      success: true,
      count: logs.length,
      data: logs,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch logs';
    console.error('Database error:', error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
