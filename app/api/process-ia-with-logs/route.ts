import { NextRequest, NextResponse } from 'next/server';
import { createAISession } from '@/lib/ai-logs';
import { processAllLicitacoesWithLogs } from '@/lib/agents/orchestrator-ia-with-logs';
import { canProcessBatch, canProcessSingle, addWaitingJob } from '@/lib/openrouter/credit-checker';
import { prisma } from '@/lib/prisma/client';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const { sre_id, skipCreditCheck } = body;

  // ✅ PASSO 1: Verificar créditos (a menos que skip explícito)
  if (!skipCreditCheck) {
    const canProcess = sre_id 
      ? await canProcessSingle()
      : await canProcessBatch();

    if (!canProcess.can) {
      // Contar licitações pendentes
      const pendingCount = await prisma.licitacao.count({
        where: { categoria_ia: null }
      });

      // Adicionar job à fila de espera
      const waitingJobId = addWaitingJob({
        type: sre_id ? 'single' : 'batch',
        licitacaoCount: pendingCount,
        reason: canProcess.reason
      });

      return NextResponse.json(
        {
          success: false,
          error: 'insufficient_credits',
          reason: canProcess.reason,
          waiting_job_id: waitingJobId,
          pending_licitacoes: pendingCount,
          recommendation: sre_id 
            ? '💡 Use a API de créditos para monitorar saldo'
            : '💡 Seu job foi adicionado à fila. Cheque /api/openrouter/credits?action=waiting-jobs para status',
          credit_api: '/api/openrouter/credits?action=status'
        },
        { status: 402 } // 402 Payment Required
      );
    }
  }

  // ✅ PASSO 2: Se tiver créditos, processar normalmente
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
      credit_check: 'Créditos verificados ✅'
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
