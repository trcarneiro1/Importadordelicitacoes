import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';

export async function GET() {
  try {
    const supabase = supabaseAdmin;

    // Buscar licitações processadas por IA
    const { data: licitacoes } = await supabase
      .from('licitacoes')
      .select('*')
      .eq('processado_ia', true)
      .not('categoria_ia', 'is', null)
      .order('score_relevancia', { ascending: false })
      .limit(100);

    if (!licitacoes || licitacoes.length === 0) {
      return NextResponse.json({ insights: [] });
    }

    // Agrupar insights por categoria
    const insightsPorCategoria: Record<string, any> = {};

    licitacoes.forEach((lic: any) => {
      const categoria = lic.categoria_ia || 'Sem categoria';
      
      if (!insightsPorCategoria[categoria]) {
        insightsPorCategoria[categoria] = {
          tipo: categoria,
          titulo: `Licitações de ${categoria}`,
          descricao: `${categoria} identificadas pela IA`,
          valor_total: 0,
          quantidade: 0,
          prioridade: 'media',
          licitacoes: [],
          icon: 'FileText',
          cor: 'blue'
        };
      }

      insightsPorCategoria[categoria].quantidade++;
      insightsPorCategoria[categoria].valor_total += Number(lic.valor_estimado || 0);
      insightsPorCategoria[categoria].licitacoes.push({
        id: lic.id,
        numero_edital: lic.numero_edital,
        objeto: lic.objeto,
        categoria_ia: lic.categoria_ia,
        sre_source: lic.sre_source,
        valor_estimado: Number(lic.valor_estimado || 0),
        data_abertura: lic.data_abertura,
        score_relevancia: Number(lic.score_relevancia || 0),
        modalidade: lic.modalidade
      });
    });

    // Converter para array e definir prioridades
    const insights = Object.values(insightsPorCategoria).map((insight: any) => {
      // Definir prioridade baseada em valor e quantidade
      if (insight.valor_total > 1000000 || insight.quantidade > 10) {
        insight.prioridade = 'alta';
        insight.icon = 'AlertTriangle';
        insight.cor = 'red';
      } else if (insight.valor_total > 500000 || insight.quantidade > 5) {
        insight.prioridade = 'media';
        insight.icon = 'DollarSign';
        insight.cor = 'yellow';
      } else {
        insight.prioridade = 'baixa';
        insight.icon = 'FileText';
        insight.cor = 'blue';
      }

      // Ordenar licitações por score de relevância
      insight.licitacoes.sort((a: any, b: any) => b.score_relevancia - a.score_relevancia);

      return insight;
    });

    // Ordenar insights por prioridade e valor
    insights.sort((a, b) => {
      const prioridadeMap: Record<string, number> = { alta: 3, media: 2, baixa: 1 };
      const diffPrioridade = prioridadeMap[b.prioridade] - prioridadeMap[a.prioridade];
      if (diffPrioridade !== 0) return diffPrioridade;
      return b.valor_total - a.valor_total;
    });

    // Adicionar alguns insights especiais
    const hoje = new Date();
    const proximos7dias = new Date();
    proximos7dias.setDate(proximos7dias.getDate() + 7);

    const { data: urgentes } = await supabase
      .from('licitacoes')
      .select('*')
      .eq('situacao', 'aberto')
      .gte('data_abertura', hoje.toISOString())
      .lte('data_abertura', proximos7dias.toISOString())
      .order('data_abertura', { ascending: true });

    if (urgentes && urgentes.length > 0) {
      insights.unshift({
        tipo: 'urgente',
        titulo: 'Licitações Urgentes',
        descricao: `${urgentes.length} licitações com abertura nos próximos 7 dias`,
        valor_total: urgentes.reduce((sum: number, l: any) => sum + Number(l.valor_estimado || 0), 0),
        quantidade: urgentes.length,
        prioridade: 'alta',
        licitacoes: urgentes.map((l: any) => ({
          id: l.id,
          numero_edital: l.numero_edital,
          objeto: l.objeto,
          categoria_ia: l.categoria_ia,
          sre_source: l.sre_source,
          valor_estimado: Number(l.valor_estimado || 0),
          data_abertura: l.data_abertura,
          score_relevancia: Number(l.score_relevancia || 0),
          modalidade: l.modalidade
        })),
        icon: 'Clock',
        cor: 'red'
      });
    }

    return NextResponse.json({ insights: insights.slice(0, 10) });

  } catch (error) {
    console.error('Erro ao buscar insights:', error);
    return NextResponse.json(
      { insights: [] },
      { status: 200 } // Retornar 200 com array vazio para não quebrar a UI
    );
  }
}
