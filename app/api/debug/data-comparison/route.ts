import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma/client';
import {
  createValidationReport,
  filterRelevantLicitacoes,
} from '@/lib/scrapers/data-validator';

export async function GET(request: NextRequest) {
  try {
    // Buscar licitações com dados brutos
    const licitacoes = await prisma.licitacoes.findMany({
      select: {
        id: true,
        numero_edital: true,
        objeto: true,
        data_publicacao: true,
        data_abertura: true,
        valor_estimado: true,
        documentos: true,
        categoria_ia: true,
        raw_data: true,
        created_at: true,
      },
      orderBy: {
        created_at: 'desc',
      },
      take: 100, // Primeiras 100 para não sobrecarregar
    });

    // Processar cada licitação com validação
    const debugData = licitacoes.map(lic => {
      // Validar e criar relatório
      const validation = createValidationReport(lic.raw_data || {}, {
        numero_edital: lic.numero_edital || 'S/N',
        objeto: lic.objeto || 'Não informado',
        data_publicacao: lic.data_publicacao,
        data_abertura: lic.data_abertura || undefined,
        valor_estimado: lic.valor_estimado || undefined,
        documentos: lic.documentos as string[] | undefined,
      });

      return {
        id: lic.id,
        numero_edital: lic.numero_edital,
        objeto: lic.objeto,
        data_publicacao: lic.data_publicacao?.toISOString().split('T')[0] || 'Inválida',
        raw_data: {
          numero_edital_raw: (lic.raw_data as any)?.numero_edital_raw || '',
          objeto_raw: (lic.raw_data as any)?.objeto_raw || '',
          data_publicacao_raw: (lic.raw_data as any)?.data_publicacao_raw || '',
        },
        validation: {
          quality_score: validation.quality_score,
          relevance_score: validation.relevance_score,
          is_relevant: validation.is_relevant,
        },
        categoria_ia: lic.categoria_ia,
      };
    });

    // Calcular estatísticas
    const stats = {
      total: debugData.length,
      relevant: debugData.filter(d => d.validation.is_relevant).length,
      invalid: debugData.filter(d => !d.validation.is_relevant).length,
      avgQuality: Math.round(
        debugData.reduce((sum, d) => sum + d.validation.quality_score, 0) / debugData.length
      ),
      avgRelevance: Math.round(
        debugData.reduce((sum, d) => sum + d.validation.relevance_score, 0) / debugData.length
      ),
    };

    return NextResponse.json({
      success: true,
      licitacoes: debugData,
      stats,
    });
  } catch (error) {
    console.error('Erro ao comparar dados:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}

/**
 * POST: Validar e filtrar uma licitação específica
 */
export async function POST(request: NextRequest) {
  try {
    const { licitacao_id } = await request.json();

    if (!licitacao_id) {
      return NextResponse.json(
        { success: false, error: 'licitacao_id é obrigatório' },
        { status: 400 }
      );
    }

    const lic = await prisma.licitacoes.findUnique({
      where: { id: licitacao_id },
    });

    if (!lic) {
      return NextResponse.json(
        { success: false, error: 'Licitação não encontrada' },
        { status: 404 }
      );
    }

    // Validar
    const validation = createValidationReport(lic.raw_data || {}, {
      numero_edital: lic.numero_edital || 'S/N',
      objeto: lic.objeto || 'Não informado',
      data_publicacao: lic.data_publicacao,
      data_abertura: lic.data_abertura || undefined,
      valor_estimado: lic.valor_estimado || undefined,
      documentos: lic.documentos as string[] | undefined,
    });

    return NextResponse.json({
      success: true,
      licitacao: {
        id: lic.id,
        numero_edital: lic.numero_edital,
        objeto: lic.objeto,
        data_publicacao: lic.data_publicacao,
        data_abertura: lic.data_abertura,
        valor_estimado: lic.valor_estimado,
        categoria_ia: lic.categoria_ia,
      },
      validation,
    });
  } catch (error) {
    console.error('Erro ao validar licitação:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}
