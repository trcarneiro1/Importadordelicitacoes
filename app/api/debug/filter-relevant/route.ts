import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma/client';
import { filterRelevantLicitacoes } from '@/lib/scrapers/data-validator';

/**
 * GET: Retorna apenas licitações relevantes (com informações completas)
 * Usado pelo dashboard para filtrar dados inúteis
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sre = searchParams.get('sre');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Buscar licitações
    let query: any = {};
    if (sre) {
      query.sre_source = sre;
    }

    const licitacoes = await prisma.licitacoes.findMany({
      where: query,
      select: {
        id: true,
        numero_edital: true,
        objeto: true,
        data_publicacao: true,
        data_abertura: true,
        valor_estimado: true,
        documentos: true,
        categoria_ia: true,
        sre_source: true,
      },
      orderBy: {
        data_publicacao: 'desc',
      },
      take: limit,
    });

    // Filtrar apenas relevantes
    const relevant = filterRelevantLicitacoes(licitacoes);

    // Contar estatísticas
    const stats = {
      total: licitacoes.length,
      relevant: relevant.length,
      filtered_out: licitacoes.length - relevant.length,
      quality_ratio: Math.round((relevant.length / licitacoes.length) * 100),
    };

    return NextResponse.json({
      success: true,
      licitacoes: relevant,
      stats,
      message: `${relevant.length} de ${licitacoes.length} licitações têm informações relevantes`,
    });
  } catch (error) {
    console.error('Erro ao filtrar licitações relevantes:', error);
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
 * POST: Validar quais licitações são relevantes
 * Útil para auditoria e limpeza de dados
 */
export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();

    if (action === 'count') {
      // Contar licitações irrelevantes
      const all = await prisma.licitacoes.findMany({
        select: {
          numero_edital: true,
          objeto: true,
          data_publicacao: true,
        },
      });

      const relevant = filterRelevantLicitacoes(all);

      const irrelevant = all.filter(
        lic =>
          !relevant.some(
            r =>
              r.numero_edital === lic.numero_edital &&
              r.objeto === lic.objeto &&
              r.data_publicacao?.getTime() === lic.data_publicacao?.getTime()
          )
      );

      return NextResponse.json({
        success: true,
        stats: {
          total: all.length,
          relevant: relevant.length,
          irrelevant: irrelevant.length,
          quality_ratio: Math.round((relevant.length / all.length) * 100),
        },
        irrelevant_samples: irrelevant.slice(0, 5),
      });
    }

    if (action === 'cleanup') {
      // Deletar licitações irrelevantes (admin only!)
      // TODO: Adicionar autenticação

      const all = await prisma.licitacoes.findMany({
        select: {
          id: true,
          numero_edital: true,
          objeto: true,
          data_publicacao: true,
        },
      });

      const relevant = filterRelevantLicitacoes(all);
      const toDelete = all.filter(
        lic =>
          !relevant.some(
            r =>
              r.numero_edital === lic.numero_edital &&
              r.objeto === lic.objeto
          )
      );

      // Deletar
      const result = await prisma.licitacoes.deleteMany({
        where: {
          id: {
            in: toDelete.map(l => l.id),
          },
        },
      });

      return NextResponse.json({
        success: true,
        message: `${result.count} licitações inválidas deletadas`,
        deleted: result.count,
      });
    }

    return NextResponse.json(
      { success: false, error: 'Action não reconhecida' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Erro ao processar relevance:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}
