// ===============================================
// Categorizador Híbrido: OpenRouter + NLP Local
// ===============================================
// Integração inteligente com cache e fallback
// ===============================================

import { openRouterClient } from './openrouter-client';
import { categorizarNoticias } from './categorizer';
import { supabase } from '../supabase/client';

interface NoticiaParaCategorizar {
  id?: string;
  titulo: string;
  conteudo: string;
  sre_source: string;
  data_publicacao?: string;
  link?: string;
}

interface NoticiaCategorizada {
  id?: string;
  titulo: string;
  conteudo: string;
  sre_source: string;
  data_publicacao?: string;
  link?: string;
  url?: string;
  resumo?: string;
  raw_html?: string;
  categoria_original?: string;
  documentos?: any[];
  links_externos?: string[];
  categoria_ia: string;
  subcategoria_ia?: string;
  tags_ia: string[];
  entidades_extraidas: {
    datas_importantes?: string[];
    valores_financeiros?: string[];
    pessoas?: string[];
    instituicoes?: string[];
    locais?: string[];
    processos?: string[];
  };
  sentimento?: string;
  prioridade?: string;
  relevancia_score?: number;
  resumo_ia?: string;
  palavras_chave_ia?: string[];
  acoes_recomendadas?: string[];
}

interface MetricasCategorizacao {
  total_noticias: number;
  via_openrouter: number;
  via_cache: number;
  via_nlp_local: number;
  erros: number;
  tokens_totais: number;
  custo_total_usd: number;
  modelo_usado: string;
  tempo_total_ms: number;
  taxa_cache: number;
}

export class CategorizadorHibrido {
  private metricas: MetricasCategorizacao = {
    total_noticias: 0,
    via_openrouter: 0,
    via_cache: 0,
    via_nlp_local: 0,
    erros: 0,
    tokens_totais: 0,
    custo_total_usd: 0,
    modelo_usado: '',
    tempo_total_ms: 0,
    taxa_cache: 0,
  };

  /**
   * Verificar se existe análise em cache
   */
  private async obterAnaliseCache(
    noticiaId: string,
    modelo?: string
  ): Promise<any | null> {
    try {
      const { data, error } = await supabase.rpc('obter_analise_ia', {
        p_noticia_id: noticiaId,
        p_modelo: modelo || null,
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao buscar cache:', error);
      return null;
    }
  }

  /**
   * Salvar análise no banco (dispara trigger automaticamente)
   */
  private async salvarAnalise(
    noticiaId: string,
    analise: any,
    status: 'sucesso' | 'erro' | 'timeout',
    erro?: string
  ): Promise<void> {
    try {
      const { error } = await supabase.from('noticias_analises_ia').insert({
        noticia_id: noticiaId,
        modelo: analise.modelo || 'nlp-local',
        provider: analise.modelo ? 'openrouter' : 'local',
        resposta_completa: {
          categoria: analise.categoria,
          subcategoria: analise.subcategoria,
          tags: analise.tags,
          entidades: analise.entidades,
          sentimento: analise.sentimento,
          prioridade: analise.prioridade,
          relevancia: analise.relevancia,
          resumo: analise.resumo,
          palavras_chave: analise.palavras_chave,
          acoes_recomendadas: analise.acoes_recomendadas,
          justificativa: analise.justificativa,
        },
        tokens_prompt: analise.tokens_prompt || 0,
        tokens_completion: analise.tokens_completion || 0,
        tokens_total: analise.tokens_total || 0,
        custo_usd: analise.custo_usd || 0,
        tempo_processamento_ms: analise.tempo_processamento_ms || 0,
        status,
        erro_mensagem: erro || null,
      });

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao salvar análise:', error);
    }
  }

  /**
   * Categorizar com NLP local (fallback)
   */
  private async categorizarComNLPLocal(
    noticias: NoticiaParaCategorizar[]
  ): Promise<NoticiaCategorizada[]> {
    console.log(`🔄 Fallback: usando NLP local para ${noticias.length} notícias`);
    const startTime = Date.now();

    const resultado = await categorizarNoticias(noticias as any[]);

    this.metricas.via_nlp_local += noticias.length;
    this.metricas.tempo_total_ms += Date.now() - startTime;

    // Mapear para nosso tipo
    return resultado.noticias_categorizadas.map((n: any) => ({
      ...n,
      sre_source: n.sre_source,
      entidades_extraidas: n.entidades || {},
    }));
  }

  /**
   * Categorizar notícia individual com OpenRouter
   */
  private async categorizarComOpenRouter(
    noticia: NoticiaParaCategorizar,
    modelo?: string
  ): Promise<NoticiaCategorizada> {
    const startTime = Date.now();

    try {
      // 1. Verificar cache
      if (noticia.id) {
        const cache = await this.obterAnaliseCache(noticia.id, modelo);
        if (cache) {
          console.log(`✅ Cache hit: notícia ${noticia.id.substring(0, 8)}`);
          this.metricas.via_cache++;

          return {
            ...noticia,
            categoria_ia: cache.analise.categoria,
            subcategoria_ia: cache.analise.subcategoria,
            tags_ia: cache.analise.tags,
            entidades_extraidas: cache.analise.entidades,
            sentimento: cache.analise.sentimento,
            prioridade: cache.analise.prioridade,
            relevancia_score: cache.analise.relevancia,
            resumo_ia: cache.analise.resumo,
            palavras_chave_ia: cache.analise.palavras_chave,
            acoes_recomendadas: cache.analise.acoes_recomendadas,
          };
        }
      }

      // 2. Analisar com OpenRouter
      console.log(`🤖 Analisando com IA: ${noticia.titulo.substring(0, 50)}...`);
      const analise = await openRouterClient.analisarNoticia(
        noticia.titulo,
        noticia.conteudo,
        noticia.sre_source,
        modelo
      );

      this.metricas.via_openrouter++;
      this.metricas.tokens_totais += analise.tokens_total;
      this.metricas.custo_total_usd += analise.custo_usd;
      this.metricas.modelo_usado = analise.modelo;
      this.metricas.tempo_total_ms += Date.now() - startTime;

      // 3. Salvar no banco (trigger atualiza tabela noticias)
      if (noticia.id) {
        await this.salvarAnalise(noticia.id, analise, 'sucesso');
      }

      return {
        ...noticia,
        categoria_ia: analise.categoria,
        subcategoria_ia: analise.subcategoria,
        tags_ia: analise.tags,
        entidades_extraidas: analise.entidades,
        sentimento: analise.sentimento,
        prioridade: analise.prioridade,
        relevancia_score: analise.relevancia,
        resumo_ia: analise.resumo,
        palavras_chave_ia: analise.palavras_chave,
        acoes_recomendadas: analise.acoes_recomendadas,
      };
    } catch (error) {
      console.error('Erro OpenRouter:', error);
      this.metricas.erros++;

      // Salvar erro no banco
      if (noticia.id) {
        await this.salvarAnalise(
          noticia.id,
          { modelo: modelo || 'desconhecido' },
          'erro',
          error instanceof Error ? error.message : 'Erro desconhecido'
        );
      }

      throw error;
    }
  }

  /**
   * Categorizar notícias com estratégia híbrida
   */
  async categorizarNoticias(
    noticias: NoticiaParaCategorizar[],
    opcoes?: {
      modelo?: string;
      forcarNLPLocal?: boolean;
      forcarOpenRouter?: boolean;
    }
  ): Promise<{ noticias: NoticiaCategorizada[]; metricas: MetricasCategorizacao }> {
    // Resetar métricas
    this.metricas = {
      total_noticias: noticias.length,
      via_openrouter: 0,
      via_cache: 0,
      via_nlp_local: 0,
      erros: 0,
      tokens_totais: 0,
      custo_total_usd: 0,
      modelo_usado: opcoes?.modelo || 'auto',
      tempo_total_ms: 0,
      taxa_cache: 0,
    };

    const startTime = Date.now();

    // Estratégia 1: Forçar NLP local
    if (opcoes?.forcarNLPLocal) {
      const resultado = await this.categorizarComNLPLocal(noticias);
      this.metricas.tempo_total_ms = Date.now() - startTime;
      return { noticias: resultado, metricas: this.metricas };
    }

    // Estratégia 2: Verificar se OpenRouter está configurado
    const openRouterDisponivel = openRouterClient.isConfigured();
    const usarOpenRouter = opcoes?.forcarOpenRouter || openRouterDisponivel;

    if (!usarOpenRouter) {
      console.log('⚠️  OpenRouter não configurado, usando NLP local');
      const resultado = await this.categorizarComNLPLocal(noticias);
      this.metricas.tempo_total_ms = Date.now() - startTime;
      return { noticias: resultado, metricas: this.metricas };
    }

    // Estratégia 3: OpenRouter com fallback
    console.log(`🚀 Categorizando ${noticias.length} notícias com OpenRouter`);
    const noticiasCategorizadas: NoticiaCategorizada[] = [];

    for (const noticia of noticias) {
      try {
        const categorizada = await this.categorizarComOpenRouter(noticia, opcoes?.modelo);
        noticiasCategorizadas.push(categorizada);

        // Rate limiting: aguardar 500ms entre requisições
        if (noticias.indexOf(noticia) < noticias.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      } catch (error) {
        console.error('Erro ao categorizar, tentando NLP local:', error);

        // Fallback para NLP local
        const fallback = await this.categorizarComNLPLocal([noticia]);
        noticiasCategorizadas.push(fallback[0]);

        // Salvar que usou fallback
        if (noticia.id) {
          await this.salvarAnalise(
            noticia.id,
            {
              modelo: 'nlp-local',
              categoria: fallback[0].categoria_ia,
              subcategoria: fallback[0].subcategoria_ia,
              tags: fallback[0].tags_ia,
              entidades: fallback[0].entidades_extraidas,
              sentimento: fallback[0].sentimento,
              prioridade: fallback[0].prioridade,
              relevancia: fallback[0].relevancia_score,
              resumo: fallback[0].resumo_ia,
              palavras_chave: fallback[0].palavras_chave_ia,
              acoes_recomendadas: fallback[0].acoes_recomendadas,
            },
            'sucesso'
          );
        }
      }
    }

    // Calcular métricas finais
    this.metricas.tempo_total_ms = Date.now() - startTime;
    this.metricas.taxa_cache =
      this.metricas.total_noticias > 0
        ? this.metricas.via_cache / this.metricas.total_noticias
        : 0;

    console.log('\n📊 Métricas de Categorização:');
    console.log(`   Total: ${this.metricas.total_noticias}`);
    console.log(`   OpenRouter: ${this.metricas.via_openrouter}`);
    console.log(`   Cache: ${this.metricas.via_cache} (${(this.metricas.taxa_cache * 100).toFixed(1)}%)`);
    console.log(`   NLP Local: ${this.metricas.via_nlp_local}`);
    console.log(`   Erros: ${this.metricas.erros}`);
    console.log(`   Tokens: ${this.metricas.tokens_totais.toLocaleString()}`);
    console.log(`   Custo: $${this.metricas.custo_total_usd.toFixed(4)}`);
    console.log(`   Tempo: ${(this.metricas.tempo_total_ms / 1000).toFixed(2)}s\n`);

    return { noticias: noticiasCategorizadas, metricas: this.metricas };
  }

  /**
   * Obter métricas da última execução
   */
  getMetricas(): MetricasCategorizacao {
    return this.metricas;
  }
}

// Exportar instância singleton
export const categorizadorHibrido = new CategorizadorHibrido();

// Função helper para manter compatibilidade
export async function categorizarNoticiasComIA(
  noticias: NoticiaParaCategorizar[],
  opcoes?: {
    modelo?: string;
    forcarNLPLocal?: boolean;
    forcarOpenRouter?: boolean;
  }
) {
  return categorizadorHibrido.categorizarNoticias(noticias, opcoes);
}
