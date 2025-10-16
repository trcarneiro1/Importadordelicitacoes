import { NextRequest, NextResponse } from 'next/server';
import { scrapeAllSREsEnhanced } from '@/lib/scrapers/orchestrator-enhanced';

export async function POST(request: NextRequest) {
  try {
    const sessionId = `enhanced-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    console.log(`\n🚀 Iniciando scraping ENHANCED via API...`);
    console.log(`Session ID: ${sessionId}`);

    // Iniciar o scraping em background
    // Não usar await para que retorne imediatamente
    const scraperPromise = scrapeAllSREsEnhanced(sessionId);

    // Retornar imediatamente com session ID
    return NextResponse.json(
      {
        success: true,
        message: 'Scraping ENHANCED iniciado em background',
        session_id: sessionId,
        timestamp: new Date().toISOString(),
      },
      { status: 202 }
    );

    // Continuar processando sem esperar (fire-and-forget)
    scraperPromise.catch(error => {
      console.error('❌ Erro no scraping background:', error);
    });

  } catch (error) {
    console.error('❌ Erro ao iniciar scraper:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Use POST para iniciar novo scraping ENHANCED',
    endpoint: '/api/scrape-enhanced',
    method: 'POST',
  });
}
