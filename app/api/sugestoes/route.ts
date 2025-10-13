import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma/client';
import { getUserId } from '@/lib/tracking/user-activity';

/**
 * API de SugestÃµes Inteligentes
 * GET /api/sugestoes - Retorna sugestÃµes personalizadas baseadas no perfil do usuÃ¡rio
 */
export async function GET(request: NextRequest) {
  try {
    const userId = getUserId(request);
    
    // Buscar licitaÃ§Ãµes processadas pela IA
    const licitacoes = await prisma.licitacoes.findMany({
      where: {
        categoria_principal: { not: null },
        data_abertura: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Ãšltimos 30 dias
      },
      select: {
        id: true,
        numero_edital: true,
        objeto: true,
        categoria_principal: true,
        sre_source: true,
        valor_estimado: true,
        data_abertura: true,
        score_relevancia: true,
        modalidade: true
      },
      orderBy: { created_at: 'desc' },
      take: 500
    });

    const sugestoes = [];

    // 1. OPORTUNIDADES: LicitaÃ§Ãµes com alta relevÃ¢ncia
    const oportunidades = licitacoes
      .filter(l => l.score_relevancia && l.score_relevancia > 80)
      .slice(0, 5);

    if (oportunidades.length > 0) {
      sugestoes.push({
        id: `oportunidade_${Date.now()}`,
        tipo: 'oportunidade',
        titulo: `${oportunidades.length} Oportunidades de Alta RelevÃ¢ncia`,
        descricao: `Identificamos licitaÃ§Ãµes com score de relevÃ¢ncia acima de 80%, indicando alto potencial de interesse.`,
        acao_recomendada: 'Revise essas licitaÃ§Ãµes prioritariamente e prepare sua documentaÃ§Ã£o com antecedÃªncia.',
        prioridade: 'alta',
        valor_estimado: oportunidades.reduce((sum, l) => sum + (parseFloat(l.valor_estimado?.toString() || '0')), 0),
        categoria: oportunidades[0].categoria_principal || 'Diversas',
        sre: oportunidades[0].sre_source,
        licitacoes_relacionadas: oportunidades.length,
        relevancia_score: Math.round(oportunidades.reduce((sum, l) => sum + (l.score_relevancia || 0), 0) / oportunidades.length),
        data_geracao: new Date().toISOString(),
        lido: false
      });
    }

    // 2. ALERTAS: LicitaÃ§Ãµes urgentes (abertura em < 7 dias)
    const agora = new Date();
    const seteDiasDepois = new Date(agora.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    const urgentes = licitacoes.filter(l => {
      if (!l.data_abertura) return false;
      const abertura = new Date(l.data_abertura);
      return abertura > agora && abertura <= seteDiasDepois;
    });

    if (urgentes.length > 0) {
      sugestoes.push({
        id: `alerta_${Date.now()}`,
        tipo: 'alerta',
        titulo: `âš ï¸ ${urgentes.length} LicitaÃ§Ãµes com Abertura Iminente`,
        descricao: `AtenÃ§Ã£o! Estas licitaÃ§Ãµes abrem nos prÃ³ximos 7 dias. NÃ£o perca o prazo!`,
        acao_recomendada: 'Organize sua documentaÃ§Ã£o imediatamente e prepare as propostas antes do prazo final.',
        prioridade: 'alta',
        valor_estimado: urgentes.reduce((sum, l) => sum + (parseFloat(l.valor_estimado?.toString() || '0')), 0),
        categoria: urgentes[0].categoria_principal || 'Diversas',
        sre: urgentes[0].sre_source,
        licitacoes_relacionadas: urgentes.length,
        relevancia_score: 95,
        data_geracao: new Date().toISOString(),
        lido: false
      });
    }

    // 3. ECONOMIA: LicitaÃ§Ãµes com valores abaixo da mÃ©dia
    const categorias = [...new Set(licitacoes.map(l => l.categoria_principal).filter(Boolean))];
    
    for (const categoria of categorias.slice(0, 3)) {
      const licsDaCategoria = licitacoes.filter(l => l.categoria_principal === categoria && l.valor_estimado);
      
      if (licsDaCategoria.length >= 3) {
        const valores = licsDaCategoria.map(l => parseFloat(l.valor_estimado?.toString() || '0'));
        const media = valores.reduce((a, b) => a + b, 0) / valores.length;
        const abaixoDaMedia = licsDaCategoria.filter(l => parseFloat(l.valor_estimado?.toString() || '0') < media * 0.7);
        
        if (abaixoDaMedia.length > 0) {
          const economiaTotal = abaixoDaMedia.reduce((sum, l) => {
            const valor = parseFloat(l.valor_estimado?.toString() || '0');
            return sum + (media - valor);
          }, 0);

          sugestoes.push({
            id: `economia_${categoria}_${Date.now()}`,
            tipo: 'economia',
            titulo: `Potencial de Economia em ${categoria}`,
            descricao: `${abaixoDaMedia.length} licitaÃ§Ãµes com valores 30% abaixo da mÃ©dia da categoria.`,
            acao_recomendada: 'Analise essas oportunidades - podem representar boas condiÃ§Ãµes de mercado ou lotes menores.',
            prioridade: 'media',
            valor_estimado: abaixoDaMedia.reduce((sum, l) => sum + (parseFloat(l.valor_estimado?.toString() || '0')), 0),
            economia_potencial: economiaTotal,
            categoria: categoria || 'Sem categoria',
            sre: abaixoDaMedia[0].sre_source,
            licitacoes_relacionadas: abaixoDaMedia.length,
            relevancia_score: 75,
            data_geracao: new Date().toISOString(),
            lido: false
          });
        }
      }
    }

    // 4. TENDÃŠNCIAS: Categorias em alta
    const categoriaCount = licitacoes.reduce((acc, l) => {
      const cat = l.categoria_principal || 'Sem categoria';
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topCategorias = Object.entries(categoriaCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);

    for (const [categoria, count] of topCategorias) {
      if (count >= 5) {
        const licsDaCategoria = licitacoes.filter(l => l.categoria_principal === categoria);
        
        sugestoes.push({
          id: `tendencia_${categoria}_${Date.now()}`,
          tipo: 'tendencia',
          titulo: `TendÃªncia: ${categoria} em Alta`,
          descricao: `${count} licitaÃ§Ãµes nesta categoria nos Ãºltimos 30 dias. Categoria com grande movimentaÃ§Ã£o.`,
          acao_recomendada: 'Considere especializar-se nesta categoria ou expandir sua atuaÃ§Ã£o neste segmento.',
          prioridade: 'media',
          valor_estimado: licsDaCategoria.reduce((sum, l) => sum + (parseFloat(l.valor_estimado?.toString() || '0')), 0),
          categoria: categoria,
          sre: licsDaCategoria[0].sre_source,
          licitacoes_relacionadas: count,
          relevancia_score: 70,
          data_geracao: new Date().toISOString(),
          lido: false
        });
      }
    }

    // 5. RECOMENDAÃ‡Ã•ES: Baseadas no perfil do usuÃ¡rio (se existir)
    const userActivity = await prisma.user_activity.findMany({
      where: { user_id: userId },
      orderBy: { accessed_at: 'desc' },
      take: 100
    });

    if (userActivity.length >= 3) {
      const categoriasAcessadas = userActivity
        .filter(a => a.categoria_acessada)
        .map(a => a.categoria_acessada!);
      
      const categoriasFavoritas = [...new Set(categoriasAcessadas)]
        .map(cat => ({ cat, count: categoriasAcessadas.filter(c => c === cat).length }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3)
        .map(x => x.cat);

      for (const categoria of categoriasFavoritas) {
        const novasLics = licitacoes.filter(l => 
          l.categoria_principal === categoria &&
          new Date(l.data_abertura || 0) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        );

        if (novasLics.length > 0) {
          sugestoes.push({
            id: `recomendacao_${categoria}_${Date.now()}`,
            tipo: 'recomendacao',
            titulo: `Novas LicitaÃ§Ãµes em ${categoria}`,
            descricao: `Baseado no seu histÃ³rico, encontramos ${novasLics.length} novas licitaÃ§Ãµes que podem te interessar.`,
            acao_recomendada: 'Revise estas licitaÃ§Ãµes - elas combinam com suas categorias favoritas.',
            prioridade: 'baixa',
            valor_estimado: novasLics.reduce((sum, l) => sum + (parseFloat(l.valor_estimado?.toString() || '0')), 0),
            categoria: categoria,
            sre: novasLics[0].sre_source,
            licitacoes_relacionadas: novasLics.length,
            relevancia_score: 85,
            data_geracao: new Date().toISOString(),
            lido: false
          });
        }
      }
    }

    // Ordenar por prioridade e relevÃ¢ncia
    const prioridadeOrder = { alta: 3, media: 2, baixa: 1 };
    sugestoes.sort((a, b) => {
      const prioA = prioridadeOrder[a.prioridade as keyof typeof prioridadeOrder];
      const prioB = prioridadeOrder[b.prioridade as keyof typeof prioridadeOrder];
      if (prioA !== prioB) return prioB - prioA;
      return b.relevancia_score - a.relevancia_score;
    });

    return NextResponse.json({
      success: true,
      sugestoes: sugestoes.slice(0, 10), // MÃ¡ximo 10 sugestÃµes
      total: sugestoes.length,
      user_id: userId
    });

  } catch (error) {
    console.error('Erro ao gerar sugestÃµes:', error);
    return NextResponse.json(
      { 
        error: 'Erro ao gerar sugestÃµes',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

