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
  } catch (error: any) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch logs' },
      { status: 500 }
    );
  }
}
