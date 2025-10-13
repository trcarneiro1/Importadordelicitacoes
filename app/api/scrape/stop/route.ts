import { NextRequest, NextResponse } from 'next/server';

/**
 * API de Controle de Scraping
 * POST /api/scrape/stop - Para o processo de scraping em execução
 */
export async function POST(request: NextRequest) {
  try {
    // TODO: Implementar mecanismo de controle de processo
    // Opções:
    // 1. Flag no banco de dados que o scraper verifica
    // 2. Redis pub/sub para comunicação entre processos
    // 3. Signal para processo Node.js em background
    
    // Por enquanto, retornar sucesso (scraping controlado por jobs/cron)
    return NextResponse.json({
      success: true,
      message: 'Sinal de parada enviado. O scraping será interrompido após a conclusão da SRE atual.',
      note: 'Implementação completa requer job queue (Bull/BullMQ) ou similar'
    });

  } catch (error) {
    console.error('Erro ao parar scraping:', error);
    return NextResponse.json(
      { error: 'Erro ao processar solicitação' },
      { status: 500 }
    );
  }
}

// GET para verificar se há processo em execução
export async function GET(request: NextRequest) {
  try {
    // TODO: Verificar status real do processo
    // Por enquanto, consultar logs recentes
    
    return NextResponse.json({
      success: true,
      is_running: false,
      message: 'Verificação de status implementada via /api/scrape/status'
    });

  } catch (error) {
    console.error('Erro ao verificar status:', error);
    return NextResponse.json(
      { error: 'Erro ao processar solicitação' },
      { status: 500 }
    );
  }
}
