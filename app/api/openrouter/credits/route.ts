import { NextRequest, NextResponse } from 'next/server';
import {
  checkCreditBalance,
  canProcessBatch,
  canProcessSingle,
  getCreditStatus,
  getWaitingJobs,
  processWaitingJobs,
  removeWaitingJob,
  clearWaitingJobs,
  addWaitingJob
} from '@/lib/openrouter/credit-checker';

/**
 * GET /api/openrouter/credits
 * Retorna status de créditos
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action');

  try {
    switch (action) {
      case 'status':
        // Status completo com recomendações
        const status = await getCreditStatus();
        return NextResponse.json(status);

      case 'balance':
        // Apenas saldo
        const balance = await checkCreditBalance();
        return NextResponse.json(balance);

      case 'can-batch':
        // Pode processar lote?
        const batch = await canProcessBatch();
        return NextResponse.json(batch);

      case 'can-single':
        // Pode processar um item?
        const single = await canProcessSingle();
        return NextResponse.json(single);

      case 'waiting-jobs':
        // Jobs em fila
        const jobs = getWaitingJobs();
        return NextResponse.json({
          count: jobs.length,
          jobs,
          message: jobs.length === 0 
            ? 'Nenhum job em fila' 
            : `${jobs.length} job(s) aguardando créditos`
        });

      case 'retry-waiting':
        // Tenta processar jobs em fila
        const retry = await processWaitingJobs();
        return NextResponse.json(retry);

      default:
        // Status padrão
        const defaultStatus = await getCreditStatus();
        return NextResponse.json(defaultStatus);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Credits API] Error:', message);
    return NextResponse.json(
      { error: message, success: false },
      { status: 500 }
    );
  }
}

/**
 * POST /api/openrouter/credits
 * Gerencia jobs em fila
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, jobId, type, licitacaoCount, reason } = body;

    switch (action) {
      case 'add-waiting-job':
        if (!type || !licitacaoCount) {
          return NextResponse.json(
            { error: 'type e licitacaoCount são obrigatórios' },
            { status: 400 }
          );
        }
        const jobId = addWaitingJob({
          type,
          licitacaoCount,
          reason: reason || 'Sem créditos disponíveis'
        });
        return NextResponse.json(
          {
            success: true,
            jobId,
            message: `Job #${jobId} adicionado à fila de espera`
          },
          { status: 201 }
        );

      case 'remove-waiting-job':
        if (!jobId) {
          return NextResponse.json(
            { error: 'jobId é obrigatório' },
            { status: 400 }
          );
        }
        const removed = removeWaitingJob(jobId);
        return NextResponse.json({
          success: removed,
          message: removed 
            ? `Job #${jobId} removido da fila`
            : `Job #${jobId} não encontrado`
        });

      case 'clear-waiting-jobs':
        // ⚠️ Apenas para admin/testes
        const cleared = clearWaitingJobs();
        return NextResponse.json({
          success: true,
          cleared,
          message: `${cleared} job(s) removido(s) da fila`
        });

      default:
        return NextResponse.json(
          { error: 'Ação não reconhecida' },
          { status: 400 }
        );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Credits API POST] Error:', message);
    return NextResponse.json(
      { error: message, success: false },
      { status: 500 }
    );
  }
}
