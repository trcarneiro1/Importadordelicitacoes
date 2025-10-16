import { NextRequest, NextResponse } from 'next/server';
import { getRecentLogs } from '@/lib/scraping-logs';

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
    // Retornar logs recentes da sessão
    const logs = getRecentLogs(sessionId, limit);

    // Se houver logs, retornar com status 200
    // Se não houver, retornar array vazio
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

// WebSocket para logs em tempo real (experimental)
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { session_id, action } = body;

  if (action === 'clear') {
    // Limpar logs de uma sessão
    const { clearSessionLogs } = await import('@/lib/scraping-logs');
    clearSessionLogs(session_id);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
