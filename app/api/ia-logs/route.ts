import { NextRequest, NextResponse } from 'next/server';
import { getRecentAILogs } from '@/lib/ai-logs';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const sessionId = searchParams.get('session_id');
  const limit = parseInt(searchParams.get('limit') || '50', 10);

  if (!sessionId) {
    return NextResponse.json(
      { error: 'session_id is required' },
      { status: 400 }
    );
  }

  try {
    // Retornar logs recentes da sessão de IA
    const logs = getRecentAILogs(sessionId, limit);

    return NextResponse.json(
      {
        success: true,
        session_id: sessionId,
        logs: logs,
        count: logs.length,
        timestamp: new Date().toISOString(),
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { session_id, action } = body;

  if (action === 'clear') {
    const { clearAISessionLogs } = await import('@/lib/ai-logs');
    clearAISessionLogs(session_id);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
