/**
 * API Route: Process IA
 * Endpoint para processar licitações com IA (enriquecimento)
 * 
 * POST /api/process-ia
 * Body: { limit?: number }
 * 
 * GET /api/process-ia/stats
 * Retorna estatísticas de processamento
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  processLicitacoesPendentes, 
  getLicitacoesPendentes,
  getEnrichmentStats
} from '@/lib/agents/enrichment-agent';

type ProcessIaBody = {
  limit?: number;
};

type PendingLicitacao = Awaited<ReturnType<typeof getLicitacoesPendentes>>[number];

type PendingLicitacaoSummary = {
  id: string;
  numero_edital: string | null;
  objeto: string | null;
  sre_source: string | null;
  created_at: Date;
};

// POST: Processar licitações pendentes
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as ProcessIaBody;
    const limit = typeof body.limit === 'number' && body.limit > 0 ? body.limit : 50;

    console.log(`[API] Processing ${limit} licitacoes with IA...`);

    const result = await processLicitacoesPendentes(limit);

    return NextResponse.json({
      success: true,
      message: `Processed ${result.processed} licitacoes`,
      stats: {
        processed: result.processed,
        success: result.success,
        failed: result.failed,
        success_rate: result.processed > 0 
          ? Math.round((result.success / result.processed) * 100)
          : 0
      },
      results: result.results
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[API] Error processing licitacoes:', error);
    return NextResponse.json(
      {
        success: false,
        error: message
      },
      { status: 500 }
    );
  }
}

// GET: Listar licitações pendentes ou estatísticas
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Estatísticas
    if (action === 'stats') {
      const stats = await getEnrichmentStats();
      return NextResponse.json({
        success: true,
        stats
      });
    }

    // Lista de pendentes
    const pendentes = await getLicitacoesPendentes(limit);

    return NextResponse.json({
      success: true,
      total: pendentes.length,
      licitacoes: pendentes.map((l: PendingLicitacao) => {
        const resumoObjeto = l.objeto || null;
        const objetoFormatado = resumoObjeto
          ? resumoObjeto.substring(0, 100) + (resumoObjeto.length > 100 ? '...' : '')
          : null;

        const base: PendingLicitacaoSummary = {
          id: l.id,
          numero_edital: l.numero_edital,
          objeto: objetoFormatado,
          sre_source: l.sre_source,
          created_at: l.created_at
        };

        return base;
      })
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[API] Error fetching data:', error);
    return NextResponse.json(
      {
        success: false,
        error: message
      },
      { status: 500 }
    );
  }
}
