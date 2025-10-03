import { supabaseAdmin } from './client';

export interface Licitacao {
  id?: string;
  sre_source: string;
  numero_edital?: string;
  modalidade?: string;
  objeto?: string;
  valor_estimado?: number;
  data_publicacao?: Date;
  data_abertura?: Date;
  situacao?: string;
  documentos?: any[];
  raw_data?: any;
  categoria?: string;
  processo?: string;
  contato?: any;
  created_at?: Date;
  updated_at?: Date;
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
  entidades_extraidas?: any;
  sentimento?: 'positivo' | 'neutro' | 'negativo';
  prioridade?: 'alta' | 'media' | 'baixa';
  relevancia_score?: number;
  resumo_ia?: string;
  palavras_chave_ia?: string[];
  acoes_recomendadas?: string[];
  documentos?: any[];
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
export async function insertLicitacoes(licitacoes: Licitacao[]) {
  const { data, error } = await supabaseAdmin
    .from('licitacoes')
    .insert(licitacoes)
    .select();

  if (error) throw error;
  return data;
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
  const { data, error } = await supabaseAdmin
    .from('scraping_logs')
    .insert(log)
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

export interface AnaliseIA {
  id?: string;
  noticia_id: string;
  modelo: string;
  provider?: string;
  versao_prompt?: string;
  resposta_completa: {
    categoria: string;
    subcategoria?: string;
    tags: string[];
    entidades: any;
    sentimento: string;
    prioridade: string;
    relevancia: number;
    resumo: string;
    palavras_chave: string[];
    acoes_recomendadas: string[];
    justificativa?: string;
  };
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
