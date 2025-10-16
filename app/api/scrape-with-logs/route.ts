import { NextRequest, NextResponse } from 'next/server';
import { scrapeAllSREsWithLogs } from '@/lib/scrapers/orchestrator-with-logs';
import { createScrapingSession } from '@/lib/scraping-logs';

/**
 * POST /api/scrape-with-logs
 * Inicia scraping de todas as SREs com logs em tempo real
 * Retorna session_id para polling dos logs
 */
export async function POST(request: NextRequest) {
  try {
    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Criar sessão de logs
    await createScrapingSession(sessionId, 47);

    // Iniciar scraping em background (sem aguardar)
    // Isso permite que o cliente receba o sessionId imediatamente
    scrapeAllSREsWithLogs(sessionId).catch((error) => {
      console.error('Erro no scraping com logs:', error);
    });

    return NextResponse.json(
      {
        success: true,
        session_id: sessionId,
        message: 'Scraping iniciado. Use o session_id para obter logs.',
      },
      { status: 202 } // Accepted - processo iniciado em background
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

/**
 * GET /api/scrape-with-logs?session_id=xxx
 * Obtém logs de uma sessão de scraping
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const sessionId = searchParams.get('session_id');

  if (!sessionId) {
    return NextResponse.json(
      { error: 'session_id is required' },
      { status: 400 }
    );
  }

  // Redirecionar para o endpoint de logs
  return NextResponse.redirect(
    new URL(`/api/scraping-logs?session_id=${sessionId}&limit=100`)
  );
}
