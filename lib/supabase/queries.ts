import { supabaseAdmin } from './client';

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export interface LicitacaoContato {
  responsavel?: string;
  email?: string;
  telefone?: string;
}

export interface LicitacaoDocumento {
  nome: string;
  url: string;
  tipo?: string;
}

export type RawLicitacaoData = {
  html?: string;
  [key: string]: JsonValue | undefined;
};

export interface Licitacao {
  id?: string;
  sre_code?: number;
  sre_source: string;
  regional?: string;
  municipio?: string;
  numero_edital?: string;
  modalidade?: string;
  objeto?: string;
  valor_estimado?: number | null;
  data_publicacao?: Date | string | null;
  data_abertura?: Date | string | null;
  data_limite_impugnacao?: Date | string | null;
  prazo_entrega?: string | null;
  situacao?: string;
  documentos?: LicitacaoDocumento[];
  raw_html?: string | null;
  raw_data?: RawLicitacaoData | null;
  categoria?: string | null;
  categoria_principal?: string | null;
  categorias_secundarias?: string[];
  processo?: string | null;
  tipo_processo?: string | null;
  contato?: LicitacaoContato | null;
  contato_responsavel?: string | null;
  contato_email?: string | null;
  contato_telefone?: string | null;
  links_externos?: string[];
  palavras_chave?: string[];
  itens_principais?: string[];
  escola?: string | null;
  municipio_escola?: string | null;
  fornecedor_tipo?: string | null;
  score_relevancia?: number | null;
  resumo_executivo?: string | null;
  complexidade?: string | null;
  itens_detalhados?: JsonValue;
  scraped_at?: Date | string | null;
  created_at?: Date;
  updated_at?: Date;
}

function toDateString(value?: Date | string | null): string | null {
  if (!value) return null;
  if (typeof value === 'string') return value;
  return value.toISOString().split('T')[0];
}

function toTimestampString(value?: Date | string | null): string | null {
  if (!value) return null;
  if (typeof value === 'string') return value;
  return value.toISOString();
}

function normalizeValor(value?: number | null): number | null {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
}

function mapLicitacaoForInsert(licitacao: Licitacao): Record<string, unknown> {
  const {
    categoria,
    categoria_principal,
    categorias_secundarias,
    processo,
    tipo_processo,
    contato,
    contato_responsavel,
    contato_email,
    contato_telefone,
    documentos,
    valor_estimado,
    data_publicacao,
    data_abertura,
    data_limite_impugnacao,
    raw_data,
    raw_html,
    scraped_at,
    created_at: createdAtDiscard,
    updated_at: updatedAtDiscard,
    ...rest
  } = licitacao;

  void createdAtDiscard;
  void updatedAtDiscard;

  return {
    ...rest,
    valor_estimado: normalizeValor(valor_estimado),
    categoria_principal: categoria_principal ?? categoria ?? null,
    categorias_secundarias: categorias_secundarias ?? [],
    processo: processo ?? null,
    tipo_processo: tipo_processo ?? null,
    documentos: documentos?.length ? documentos : null,
    contato_responsavel: contato_responsavel ?? contato?.responsavel ?? null,
    contato_email: contato_email ?? contato?.email ?? null,
    contato_telefone: contato_telefone ?? contato?.telefone ?? null,
    data_publicacao: toDateString(data_publicacao),
    data_abertura: toTimestampString(data_abertura),
    data_limite_impugnacao: toDateString(data_limite_impugnacao),
    raw_html: raw_html ?? raw_data?.html ?? null,
    raw_data: raw_data ?? null,
    scraped_at: scraped_at ? toTimestampString(scraped_at) : null,
  };
}

export interface Noticia {
  id?: string;
  sre_source: string;
  url: string;
  titulo: string;
  conteudo: string;
  resumo?: string;
  raw_html?: string;
  categoria_original?: string;
  categoria_ia: string;
  subcategoria_ia?: string;
  tags_ia?: string[];
  entidades_extraidas?: JsonValue;
  sentimento?: 'positivo' | 'neutro' | 'negativo';
  prioridade?: 'alta' | 'media' | 'baixa';
  relevancia_score?: number;
  resumo_ia?: string;
  palavras_chave_ia?: string[];
  acoes_recomendadas?: string[];
  documentos?: Array<Record<string, JsonValue>>;
  links_externos?: string[];
  data_publicacao?: Date;
  data_coleta?: Date;
  created_at?: Date;
  updated_at?: Date;
}

export interface ScrapingLog {
  id?: string;
  sre_source: string;
  status: 'success' | 'error' | 'in_progress';
  records_found?: number;
  error_message?: string;
  started_at?: Date;
  completed_at?: Date;
}

// Insert licitações into database
// Usa UPSERT para evitar duplicatas baseado em: sre_source + numero_edital + data_publicacao
export async function insertLicitacoes(licitacoes: Licitacao[]) {
  const payload = licitacoes.map(mapLicitacaoForInsert);

  // Tentar inserir uma por uma para identificar quais são novas vs duplicadas
  const resultados = [];
  let novas = 0;
  let duplicadas = 0;

  for (const item of payload) {
    try {
      // Verificar se já existe
      const { data: existing } = await supabaseAdmin
        .from('licitacoes')
        .select('id')
        .eq('sre_source', item.sre_source)
        .eq('numero_edital', item.numero_edital)
        .eq('data_publicacao', item.data_publicacao)
        .maybeSingle();

      if (existing) {
        console.log(`   ⚠️ Duplicada: ${item.numero_edital}`);
        duplicadas++;
      } else {
        // Inserir nova
        const { data, error } = await supabaseAdmin
          .from('licitacoes')
          .insert([item])
          .select()
          .single();

        if (error) {
          console.error(`   ❌ Erro ao inserir ${item.numero_edital}:`, error.message);
        } else {
          console.log(`   ✅ Nova: ${item.numero_edital}`);
          resultados.push(data);
          novas++;
        }
      }
    } catch (err) {
      console.error(`   ❌ Erro processando ${item.numero_edital}:`, err);
    }
  }

  console.log(`   📊 Resumo: ${novas} novas, ${duplicadas} duplicadas de ${payload.length} total`);
  
  return resultados;
}

// Get all licitações
export async function getAllLicitacoes() {
  const { data, error } = await supabaseAdmin
    .from('licitacoes')
    .select('*')
    .order('data_publicacao', { ascending: false });

  if (error) throw error;
  return data;
}

// Get licitações by SRE
export async function getLicitacoesBySRE(sreSource: string) {
  const { data, error } = await supabaseAdmin
    .from('licitacoes')
    .select('*')
    .eq('sre_source', sreSource)
    .order('data_publicacao', { ascending: false });

  if (error) throw error;
  return data;
}

// Log scraping activity
export async function logScraping(log: ScrapingLog) {
  // Gerar UUID manualmente se não fornecido (fix para default UUID do Supabase)
  const logWithId = {
    ...log,
    id: log.id || crypto.randomUUID(), // Gera UUID se não existir
  };

  const { data, error } = await supabaseAdmin
    .from('scraping_logs')
    .insert(logWithId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Update scraping log
export async function updateScrapingLog(id: string, updates: Partial<ScrapingLog>) {
  const { data, error } = await supabaseAdmin
    .from('scraping_logs')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ===============================================
// QUERIES PARA NOTÍCIAS
// ===============================================

// Insert notícias into database
export async function insertNoticias(noticias: Noticia[]) {
  const { data, error } = await supabaseAdmin
    .from('noticias')
    .upsert(noticias, {
      onConflict: 'sre_source,url',
      ignoreDuplicates: false,
    })
    .select();

  if (error) throw error;
  return data;
}

// Get all notícias
export async function getAllNoticias(limit = 100) {
  const { data, error } = await supabaseAdmin
    .from('noticias')
    .select('*')
    .order('data_publicacao', { ascending: false, nullsFirst: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

// Get notícias by SRE
export async function getNoticiasBySRE(sreSource: string, limit = 50) {
  const { data, error } = await supabaseAdmin
    .from('noticias')
    .select('*')
    .eq('sre_source', sreSource)
    .order('data_publicacao', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

// Get notícias by categoria IA
export async function getNoticiasByCategoria(categoria: string, limit = 50) {
  const { data, error } = await supabaseAdmin
    .from('noticias')
    .select('*')
    .eq('categoria_ia', categoria)
    .order('relevancia_score', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

// Get notícias by prioridade
export async function getNoticiasByPrioridade(prioridade: 'alta' | 'media' | 'baixa', limit = 50) {
  const { data, error } = await supabaseAdmin
    .from('noticias')
    .select('*')
    .eq('prioridade', prioridade)
    .order('relevancia_score', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

// Busca full-text em notícias
export async function searchNoticias(query: string, limit = 50) {
  const { data, error } = await supabaseAdmin
    .rpc('buscar_noticias', {
      termo: query,
      limite: limit,
    });

  if (error) throw error;
  return data;
}

// Get notícias por tags
export async function getNoticiasByTags(tags: string[], limit = 50) {
  const { data, error } = await supabaseAdmin
    .from('noticias')
    .select('*')
    .contains('tags_ia', tags)
    .order('relevancia_score', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

// Get estatísticas de notícias
export async function getNoticiasStats() {
  const { data, error } = await supabaseAdmin
    .from('noticias_stats_por_sre')
    .select('*')
    .order('total_noticias', { ascending: false });

  if (error) throw error;
  return data;
}

// Get tags populares
export async function getTagsPopulares(limit = 30) {
  const { data, error } = await supabaseAdmin
    .from('noticias_tags_populares')
    .select('*')
    .limit(limit);

  if (error) throw error;
  return data;
}

// Get notícia by ID
export async function getNoticiaById(id: string) {
  const { data, error } = await supabaseAdmin
    .from('noticias')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

// ===============================================
// QUERIES PARA ANÁLISES IA (OpenRouter)
// ===============================================

interface AnaliseIAResposta {
  categoria: string;
  subcategoria?: string;
  tags: string[];
  entidades: Record<string, JsonValue> | JsonValue[];
  sentimento: string;
  prioridade: string;
  relevancia: number;
  resumo: string;
  palavras_chave: string[];
  acoes_recomendadas: string[];
  justificativa?: string;
}

export interface AnaliseIA {
  id?: string;
  noticia_id: string;
  modelo: string;
  provider?: string;
  versao_prompt?: string;
  resposta_completa: AnaliseIAResposta;
  tokens_prompt?: number;
  tokens_completion?: number;
  tokens_total?: number;
  custo_usd?: number;
  tempo_processamento_ms?: number;
  status?: 'sucesso' | 'erro' | 'timeout';
  erro_mensagem?: string;
  created_at?: Date;
}

export interface EstatisticasIA {
  total_analises: number;
  modelos_usados: string[];
  tokens_totais: number;
  custo_total_usd: number;
  custo_medio_usd: number;
  tempo_medio_ms: number;
  taxa_sucesso: number;
}

export interface CustoPorModelo {
  modelo: string;
  total_analises: number;
  tokens_totais: number;
  custo_total: number;
  custo_medio: number;
  tempo_medio_ms: number;
  taxa_sucesso_pct: number;
}

// Insert análise IA
export async function insertAnaliseIA(analise: AnaliseIA) {
  const { data, error } = await supabaseAdmin
    .from('noticias_analises_ia')
    .insert(analise)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Get análise IA por notícia e modelo
export async function getAnaliseIA(noticiaId: string, modelo?: string) {
  const { data, error } = await supabaseAdmin.rpc('obter_analise_ia', {
    p_noticia_id: noticiaId,
    p_modelo: modelo || null,
  });

  if (error) throw error;
  return data;
}

// Get estatísticas de uso IA
export async function getEstatisticasIA(dias: number = 30): Promise<EstatisticasIA | null> {
  const { data, error } = await supabaseAdmin.rpc('estatisticas_uso_ia', {
    p_dias: dias,
  });

  if (error) throw error;
  return data;
}

// Get custos por modelo
export async function getCustosPorModelo(): Promise<CustoPorModelo[]> {
  const { data, error } = await supabaseAdmin
    .from('custos_por_modelo')
    .select('*')
    .order('total_analises', { ascending: false });

  if (error) throw error;
  return data || [];
}

// Get notícias com análise IA
export async function getNoticiasComAnaliseIA(limit = 50) {
  const { data, error } = await supabaseAdmin
    .from('noticias_com_analise_ia')
    .select('*')
    .order('data_analise', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

// Get análises IA por status
export async function getAnalisesPorStatus(status: 'sucesso' | 'erro' | 'timeout', limit = 50) {
  const { data, error } = await supabaseAdmin
    .from('noticias_analises_ia')
    .select('*')
    .eq('status', status)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

// Get análises IA recentes
export async function getAnalisesRecentes(limit = 20) {
  const { data, error } = await supabaseAdmin
    .from('noticias_analises_ia')
    .select(`
      *,
      noticias:noticia_id (
        titulo,
        sre_source,
        data_publicacao
      )
    `)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

// ===============================================
// FIM QUERIES ANÁLISES IA
// ===============================================

// Get recent scraping logs
export async function getRecentScrapingLogs(limit: number = 10) {
  const { data, error } = await supabaseAdmin
    .from('scraping_logs')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}
