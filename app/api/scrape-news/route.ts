import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { parseNewsFromSRE } from '@/lib/scrapers/news-parser';
import { categorizarNoticiasComIA } from '@/lib/ai/categorizer-hybrid';
import { supabaseAdmin } from '@/lib/supabase/client';

export const maxDuration = 300; // 5 minutos
export const dynamic = 'force-dynamic';

/**
 * GET /api/scrape-news
 * 
 * Coleta notícias das SREs e categoriza automaticamente com IA (OpenRouter + fallback local)
 * 
 * Query params:
 * - count: número de SREs para processar (padrão: 5)
 * - sre: processar apenas uma SRE específica (ex: "barbacena")
 * - pages: número de páginas de notícias por SRE (padrão: 3)
 * - modelo: modelo LLM a usar (ex: "openai/gpt-4o-mini", padrão: config .env)
 * - forcar_local: usar apenas NLP local (true/false)
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    const { searchParams } = new URL(request.url);
    const count = parseInt(searchParams.get('count') || '5');
    const specificSRE = searchParams.get('sre');
    const pagesPerSRE = parseInt(searchParams.get('pages') || '3');
    const modelo = searchParams.get('modelo') || undefined;
    const forcarLocal = searchParams.get('forcar_local') === 'true';

    console.log('\n🚀 Iniciando coleta de notícias com categorização IA');
    console.log(`📊 Configuração: ${count} SREs, ${pagesPerSRE} páginas cada`);
    console.log(`🤖 Modo: ${forcarLocal ? 'NLP Local (forçado)' : 'OpenRouter + fallback'}`);
    if (modelo && !forcarLocal) {
      console.log(`🎯 Modelo: ${modelo}`);
    }

    // Ler lista de SREs
    const sresPath = path.join(process.cwd(), 'SREs.txt');
    const sresList = fs.readFileSync(sresPath, 'utf-8')
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.startsWith('http'));

    // Filtrar SRE específica se solicitado
    let targetSREs = sresList;
    if (specificSRE) {
      targetSREs = sresList.filter(url => 
        url.toLowerCase().includes(specificSRE.toLowerCase())
      );
      if (targetSREs.length === 0) {
        return NextResponse.json({
          success: false,
          error: `SRE '${specificSRE}' não encontrada`,
        }, { status: 404 });
      }
    } else {
      targetSREs = sresList.slice(0, count);
    }

    console.log(`\n📍 ${targetSREs.length} SREs selecionadas para coleta\n`);

    const results = [];
    let totalNoticias = 0;
    let totalCategorizadas = 0;
    let totalSalvas = 0;
    const errors: string[] = [];

    // Processar cada SRE
    for (let i = 0; i < targetSREs.length; i++) {
      const sreUrl = targetSREs[i];
      const sreName = new URL(sreUrl).hostname;

      console.log(`\n[${i + 1}/${targetSREs.length}] 📡 Coletando: ${sreName}`);

      try {
        // 1. SCRAPING - Coletar notícias
        const parseResult = await parseNewsFromSRE(sreUrl, pagesPerSRE);

        if (!parseResult.success || parseResult.noticias.length === 0) {
          console.log(`   ⚠️ Nenhuma notícia encontrada`);
          errors.push(`${sreName}: ${parseResult.error || 'Sem notícias'}`);
          continue;
        }

        console.log(`   ✅ ${parseResult.noticias.length} notícias coletadas`);
        totalNoticias += parseResult.noticias.length;

        // 2. CATEGORIZAÇÃO IA - Analisar e categorizar com OpenRouter/Local
        console.log(`   🤖 Categorizando com IA...`);
        
        // Mapear notícias adicionando sre_source e convertendo data
        const noticiasComSRE = parseResult.noticias.map(n => ({
          ...n,
          sre_source: sreName,
          data_publicacao: n.data_publicacao?.toISOString().split('T')[0],
        }));
        
        const categorizacaoResult = await categorizarNoticiasComIA(noticiasComSRE as any, {
          modelo,
          forcarNLPLocal: forcarLocal,
        });

        totalCategorizadas += categorizacaoResult.noticias.length;
        console.log(`   ✅ ${categorizacaoResult.noticias.length} notícias categorizadas`);
        console.log(`   📊 Métricas IA: ${categorizacaoResult.metricas.via_openrouter} OpenRouter, ${categorizacaoResult.metricas.via_cache} cache, ${categorizacaoResult.metricas.via_nlp_local} local`);
        
        if (categorizacaoResult.metricas.tokens_totais > 0) {
          console.log(`   💰 Custo: $${categorizacaoResult.metricas.custo_total_usd.toFixed(4)} (${categorizacaoResult.metricas.tokens_totais.toLocaleString()} tokens)`);
        }

        // 3. SALVAR NO BANCO - Inserir notícias categorizadas
        console.log(`   💾 Salvando no banco de dados...`);
        
        for (const noticia of categorizacaoResult.noticias) {
          try {
            const { data, error } = await supabaseAdmin
              .from('noticias')
              .upsert({
                sre_source: sreName,
                url: noticia.url,
                titulo: noticia.titulo,
                conteudo: noticia.conteudo,
                resumo: noticia.resumo,
                raw_html: noticia.raw_html,
                categoria_original: noticia.categoria_original,
                categoria_ia: noticia.categoria_ia,
                subcategoria_ia: noticia.subcategoria_ia,
                tags_ia: noticia.tags_ia,
                entidades_extraidas: noticia.entidades_extraidas,
                sentimento: noticia.sentimento,
                prioridade: noticia.prioridade,
                relevancia_score: noticia.relevancia_score,
                resumo_ia: noticia.resumo_ia,
                palavras_chave_ia: noticia.palavras_chave_ia,
                acoes_recomendadas: noticia.acoes_recomendadas,
                documentos: noticia.documentos,
                links_externos: noticia.links_externos,
                data_publicacao: noticia.data_publicacao,
                data_coleta: new Date(),
              }, {
                onConflict: 'sre_source,url', // Evitar duplicatas
                ignoreDuplicates: false, // Atualizar se já existir
              });

            if (error) {
              console.error(`   ❌ Erro ao salvar: ${noticia.titulo.substring(0, 50)}`);
              errors.push(`${sreName}: Erro ao salvar - ${error.message}`);
            } else {
              totalSalvas++;
            }
          } catch (saveError: any) {
            console.error(`   ❌ Exceção ao salvar: ${saveError.message}`);
            errors.push(`${sreName}: ${saveError.message}`);
          }
        }

        console.log(`   ✅ ${totalSalvas} notícias salvas no banco`);

        // Resultado desta SRE
        // Calcular estatísticas por categoria e prioridade
        const categorias: Record<string, number> = {};
        const prioridades: Record<string, number> = {};
        categorizacaoResult.noticias.forEach(n => {
          categorias[n.categoria_ia] = (categorias[n.categoria_ia] || 0) + 1;
          if (n.prioridade) {
            prioridades[n.prioridade] = (prioridades[n.prioridade] || 0) + 1;
          }
        });
        
        results.push({
          sre: sreName,
          success: true,
          noticias_coletadas: parseResult.noticias.length,
          noticias_categorizadas: categorizacaoResult.noticias.length,
          noticias_salvas: totalSalvas,
          categorias,
          prioridades,
          metricas_ia: {
            via_openrouter: categorizacaoResult.metricas.via_openrouter,
            via_cache: categorizacaoResult.metricas.via_cache,
            via_nlp_local: categorizacaoResult.metricas.via_nlp_local,
            tokens_totais: categorizacaoResult.metricas.tokens_totais,
            custo_total_usd: categorizacaoResult.metricas.custo_total_usd,
            modelo_usado: categorizacaoResult.metricas.modelo_usado,
            taxa_cache: categorizacaoResult.metricas.taxa_cache,
          },
          tempo_processamento_ms: categorizacaoResult.metricas.tempo_total_ms,
        });

      } catch (sreError: any) {
        console.error(`   ❌ Erro ao processar ${sreName}:`, sreError.message);
        errors.push(`${sreName}: ${sreError.message}`);
        
        results.push({
          sre: sreName,
          success: false,
          error: sreError.message,
        });
      }

      // Delay entre SREs
      if (i < targetSREs.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    // RESUMO FINAL
    const totalTime = Date.now() - startTime;

    console.log('\n📊 ===== RESUMO DA COLETA =====');
    console.log(`✅ SREs processadas: ${targetSREs.length}`);
    console.log(`📰 Notícias coletadas: ${totalNoticias}`);
    console.log(`🤖 Notícias categorizadas: ${totalCategorizadas}`);
    console.log(`💾 Notícias salvas no banco: ${totalSalvas}`);
    console.log(`⏱️  Tempo total: ${(totalTime / 1000).toFixed(1)}s`);
    console.log(`⚡ Média: ${(totalTime / targetSREs.length / 1000).toFixed(1)}s por SRE`);
    
    if (errors.length > 0) {
      console.log(`\n⚠️  ${errors.length} erros encontrados:`);
      errors.slice(0, 5).forEach(err => console.log(`   - ${err}`));
    }

    // Estatísticas por categoria (agregado)
    const categoriasCombinadas: Record<string, number> = {};
    const prioridadesCombinadas: Record<string, number> = {};

    results.forEach(result => {
      if (result.success && result.categorias) {
        Object.entries(result.categorias).forEach(([cat, count]) => {
          categoriasCombinadas[cat] = (categoriasCombinadas[cat] || 0) + (count as number);
        });
      }
      if (result.success && result.prioridades) {
        Object.entries(result.prioridades).forEach(([prior, count]) => {
          prioridadesCombinadas[prior] = (prioridadesCombinadas[prior] || 0) + (count as number);
        });
      }
    });

    return NextResponse.json({
      success: true,
      resumo: {
        sres_processadas: targetSREs.length,
        noticias_coletadas: totalNoticias,
        noticias_categorizadas: totalCategorizadas,
        noticias_salvas_banco: totalSalvas,
        tempo_total_ms: totalTime,
        media_por_sre_ms: Math.round(totalTime / targetSREs.length),
      },
      estatisticas: {
        por_categoria: categoriasCombinadas,
        por_prioridade: prioridadesCombinadas,
      },
      detalhes_por_sre: results,
      erros: errors.length > 0 ? errors : undefined,
    });

  } catch (error: any) {
    console.error('❌ Erro crítico:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    }, { status: 500 });
  }
}

/**
 * POST /api/scrape-news
 * 
 * Permite especificar exatamente quais SREs processar
 * 
 * Body:
 * {
 *   "sres": ["srebarbacena", "sreuba", "srejdefora"],
 *   "pages": 5
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sres, pages = 3 } = body;

    if (!sres || !Array.isArray(sres) || sres.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Forneça um array de SREs para processar',
      }, { status: 400 });
    }

    // Ler lista completa de SREs
    const sresPath = path.join(process.cwd(), 'SREs.txt');
    const allSREs = fs.readFileSync(sresPath, 'utf-8')
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.startsWith('http'));

    // Filtrar SREs solicitadas
    const targetSREs = allSREs.filter(url => 
      sres.some(sreName => url.toLowerCase().includes(sreName.toLowerCase()))
    );

    if (targetSREs.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Nenhuma SRE encontrada com os nomes fornecidos',
      }, { status: 404 });
    }

    // Construir query params para o GET
    const url = new URL(request.url);
    url.searchParams.set('count', targetSREs.length.toString());
    url.searchParams.set('pages', pages.toString());

    // Redirecionar para GET com params
    const getRequest = new NextRequest(url.toString(), {
      method: 'GET',
    });

    return GET(getRequest);

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}
