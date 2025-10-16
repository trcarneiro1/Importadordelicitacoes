import { NextRequest, NextResponse } from 'next/server';
import { createAISession } from '@/lib/ai-logs';
import { processAllLicitacoesWithLogs } from '@/lib/agents/orchestrator-ia-with-logs';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const { sre_id } = body;

  const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  createAISession(sessionId);

  // Iniciar processamento em background
  (async () => {
    try {
      if (sre_id) {
        const { processLicitacoesBySREWithLogs } = await import('@/lib/agents/orchestrator-ia-with-logs');
        await processLicitacoesBySREWithLogs(sessionId, sre_id);
      } else {
        await processAllLicitacoesWithLogs(sessionId);
      }
    } catch (error) {
      console.error('Erro ao processar licitações com IA:', error);
    }
  })();

  return NextResponse.json(
    {
      success: true,
      session_id: sessionId,
      message: sre_id
        ? `Processamento IA iniciado para SRE #${sre_id}`
        : 'Processamento IA iniciado para todas as licitações pendentes',
    },
    { status: 202 }
  );
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const sessionId = searchParams.get('session_id');

  if (!sessionId) {
    return NextResponse.redirect(new URL(`/api/ia-logs?session_id=${sessionId}`));
  }

  return NextResponse.redirect(new URL(`/api/ia-logs?session_id=${sessionId}`));
}
