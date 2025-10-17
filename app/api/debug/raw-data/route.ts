import { prisma } from '@/lib/prisma/client';
import { NextResponse, NextRequest } from 'next/server';

/**
 * GET /api/debug/raw-data
 * Retorna dados brutos para visualização
 * Query params:
 *   - limit: número de registros (padrão: 100)
 *   - sre: filtrar por SRE
 *   - offset: para paginação
 */

interface RawLicitacao {
  id: string;
  numero_edital: string | null;
  objeto: string | null;
  modalidade: string | null;
  data_abertura: Date | null;
  data_publicacao: Date | null;
  valor_estimado: string | null;
  sre_source: string | null;
  createdAt: Date;
}

function isValidLicitacao(lic: any): boolean {
  return (
    lic.numero_edital &&
    lic.numero_edital !== 'S/N' &&
    lic.numero_edital !== 's/n' &&
    lic.numero_edital !== 'Não informado' &&
    lic.objeto &&
    lic.objeto !== 'S/N' &&
    lic.objeto !== 's/n' &&
    lic.objeto !== 'Não informado' &&
    lic.objeto.length > 10
  );
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const sreFilter = searchParams.get('sre');

    // Buscar dados
    const where: any = {};
    if (sreFilter) {
      where.sre_source = sreFilter;
    }

    const licitacoes = await prisma.licitacoes.findMany({
      where,
      select: {
        id: true,
        numero_edital: true,
        objeto: true,
        modalidade: true,
        data_abertura: true,
        data_publicacao: true,
        valor_estimado: true,
        sre_source: true,
        createdAt: true,
      },
      skip: offset,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    // Calcular estatísticas
    const total = await prisma.licitacoes.count({ where });
    const withIA = await prisma.licitacoes.count({
      where: {
        ...where,
        // categoria_ia: { not: null }, // Se tiver campo categoria_ia
      },
    });
    const withoutIA = total - withIA;

    // Contar inválidas
    let invalid = 0;
    for (const lic of licitacoes) {
      if (!isValidLicitacao(lic)) {
        invalid++;
      }
    }

    const totalAll = await prisma.licitacoes.count();
    let invalidAll = 0;
    const allLics = await prisma.licitacoes.findMany({
      select: {
        numero_edital: true,
        objeto: true,
        sre_source: true,
      },
    });
    for (const lic of allLics) {
      if (!isValidLicitacao(lic)) {
        invalidAll++;
      }
    }

    return NextResponse.json({
      licitacoes: licitacoes.map((lic) => ({
        ...lic,
        createdAt: lic.createdAt.toISOString(),
        data_abertura: lic.data_abertura?.toISOString() || null,
        data_publicacao: lic.data_publicacao?.toISOString() || null,
      })),
      stats: {
        total: totalAll,
        withIA,
        withoutIA,
        percentProcessed: totalAll > 0 ? Math.round((withIA / totalAll) * 100) : 0,
        invalid: invalidAll,
        invalidPercent: totalAll > 0 ? Math.round((invalidAll / totalAll) * 100) : 0,
        pagination: {
          limit,
          offset,
          returned: licitacoes.length,
        },
      },
    });
  } catch (error) {
    console.error('Erro em /api/debug/raw-data:', error);
    return NextResponse.json({ error: 'Erro ao buscar dados' }, { status: 500 });
  }
}
