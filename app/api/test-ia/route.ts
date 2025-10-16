/**
 * API Route: Test IA
 * Endpoint para testar o enriquecimento de uma única licitação
 * 
 * GET /api/test-ia?id=uuid
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { enrichLicitacao, saveLicitacaoEnriquecida } from '@/lib/agents/enrichment-agent';

type EnrichmentInput = Parameters<typeof enrichLicitacao>[0];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing licitacao ID. Use ?id=uuid'
        },
        { status: 400 }
      );
    }

    // Buscar licitação
    const licitacao = await prisma.licitacoes.findUnique({
      where: { id }
    });

    if (!licitacao) {
      return NextResponse.json(
        {
          success: false,
          error: `Licitacao ${id} not found`
        },
        { status: 404 }
      );
    }

    console.log(`[API] Testing IA enrichment for licitacao ${id}...`);

    // Enriquecer
    const startTime = Date.now();
    const licitacaoForEnrichment: EnrichmentInput = {
      id: licitacao.id,
      objeto: licitacao.objeto,
      raw_data: licitacao.raw_data as Record<string, any> | null,
      numero_edital: licitacao.numero_edital,
      modalidade: licitacao.modalidade,
      regional: licitacao.regional,
      sre_source: licitacao.sre_source,
      created_at: licitacao.created_at ?? new Date(),
    };

    const enrichedData = await enrichLicitacao(licitacaoForEnrichment);
    const duration = Date.now() - startTime;

    // Salvar
    await saveLicitacaoEnriquecida(id, enrichedData);

    return NextResponse.json({
      success: true,
      message: 'Licitacao enriched successfully',
      duration_ms: duration,
      original: {
        id: licitacao.id,
        numero_edital: licitacao.numero_edital,
        objeto: licitacao.objeto
      },
      enriched: enrichedData
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const stack = error instanceof Error ? error.stack : undefined;
    console.error('[API] Error testing IA:', error);
    return NextResponse.json(
      {
        success: false,
        error: message,
        stack: process.env.NODE_ENV === 'development' ? stack : undefined
      },
      { status: 500 }
    );
  }
}
