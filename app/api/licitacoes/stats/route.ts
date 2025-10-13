import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma/client';

/**
 * API de Estatísticas de Licitações
 * GET /api/licitacoes/stats?days=7 - Retorna estatísticas agregadas
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7');

    // Data inicial para filtro
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Buscar licitações do período
    const licitacoes = await prisma.licitacoes.findMany({
      where: {
        data_abertura: { gte: startDate }
      },
      select: {
        id: true,
        numero_edital: true,
        categoria_principal: true,
        sre_source: true,
        regional: true,
        modalidade: true,
        valor_estimado: true,
        data_abertura: true,
        data_publicacao: true,
        objeto: true,
        escola: true,
        municipio_escola: true,
        score_relevancia: true
      }
    });

    // Estatísticas básicas
    const total_licitacoes = licitacoes.length;
    const valor_total = licitacoes.reduce((sum, l) => sum + Number(l.valor_estimado || 0), 0);
    const media_valor = total_licitacoes > 0 ? valor_total / total_licitacoes : 0;

    // Urgentes (< 7 dias para abertura)
    const agora = new Date();
    const urgentes = licitacoes.filter(l => {
      if (!l.data_abertura) return false;
      const diasRestantes = Math.ceil((new Date(l.data_abertura).getTime() - agora.getTime()) / (1000 * 60 * 60 * 24));
      return diasRestantes >= 0 && diasRestantes < 7;
    }).length;

    // Categorias ativas
    const categorias_set = new Set(licitacoes.map(l => l.categoria_principal).filter(Boolean));
    const categorias_ativas = categorias_set.size;

    // SREs ativas
    const sres_set = new Set(licitacoes.map(l => l.sre_source).filter(Boolean));
    const sres_ativas = sres_set.size;

    // Agrupamento por categoria
    const por_categoria = licitacoes.reduce((acc, l) => {
      const cat = l.categoria_principal || 'Sem Categoria';
      if (!acc[cat]) {
        acc[cat] = { categoria: cat, quantidade: 0, valor_total: 0 };
      }
      acc[cat].quantidade++;
      acc[cat].valor_total += Number(l.valor_estimado || 0);
      return acc;
    }, {} as Record<string, { categoria: string; quantidade: number; valor_total: number }>);

    const top_categorias = Object.values(por_categoria)
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 10);

    // Agrupamento por SRE
    const por_sre = licitacoes.reduce((acc, l) => {
      const sre = l.sre_source || l.regional || 'Desconhecida';
      if (!acc[sre]) {
        acc[sre] = { sre, quantidade: 0, valor_total: 0 };
      }
      acc[sre].quantidade++;
      acc[sre].valor_total += Number(l.valor_estimado || 0);
      return acc;
    }, {} as Record<string, { sre: string; quantidade: number; valor_total: number }>);

    const top_sres = Object.values(por_sre)
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 10);

    // Agrupamento por modalidade
    const por_modalidade = licitacoes.reduce((acc, l) => {
      const mod = l.modalidade || 'Não Especificado';
      if (!acc[mod]) {
        acc[mod] = { modalidade: mod, quantidade: 0 };
      }
      acc[mod].quantidade++;
      return acc;
    }, {} as Record<string, { modalidade: string; quantidade: number }>);

    // Tendência (comparar com período anterior)
    const periodoAnteriorStart = new Date(startDate);
    periodoAnteriorStart.setDate(periodoAnteriorStart.getDate() - days);

    const licitacoesPeriodoAnterior = await prisma.licitacoes.count({
      where: {
        data_abertura: {
          gte: periodoAnteriorStart,
          lt: startDate
        }
      }
    });

    const tendencia_percentual = licitacoesPeriodoAnterior > 0
      ? Math.round(((total_licitacoes - licitacoesPeriodoAnterior) / licitacoesPeriodoAnterior) * 100)
      : 100;

    const tendencia_7dias = {
      total_periodo_anterior: licitacoesPeriodoAnterior,
      total_periodo_atual: total_licitacoes,
      variacao_percentual: tendencia_percentual,
      tendencia: tendencia_percentual >= 0 ? 'alta' : 'baixa'
    };

    return NextResponse.json({
      success: true,
      periodo: {
        dias: days,
        data_inicio: startDate.toISOString(),
        data_fim: new Date().toISOString()
      },
      resumo: {
        total_licitacoes,
        valor_total,
        media_valor,
        urgentes,
        categorias_ativas,
        sres_ativas
      },
      por_categoria: top_categorias,
      por_sre: top_sres,
      por_modalidade: Object.values(por_modalidade),
      tendencia_7dias
    });

  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar estatísticas' },
      { status: 500 }
    );
  }
}
