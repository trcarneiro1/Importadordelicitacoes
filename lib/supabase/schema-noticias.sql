-- ===============================================
-- SCHEMA: Tabela de Notícias com Categorização IA
-- ===============================================
-- Sistema de coleta e análise inteligente de notícias
-- das SREs de Minas Gerais
-- ===============================================

-- Tabela principal: noticias
CREATE TABLE IF NOT EXISTS noticias (
  -- Identificação
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sre_source VARCHAR(100) NOT NULL,
  url TEXT NOT NULL,
  
  -- Conteúdo
  titulo TEXT NOT NULL,
  conteudo TEXT NOT NULL,
  resumo TEXT,
  raw_html TEXT,
  
  -- Categorização Original
  categoria_original VARCHAR(100),
  
  -- Categorização IA
  categoria_ia VARCHAR(100) NOT NULL,
  subcategoria_ia VARCHAR(150),
  tags_ia TEXT[], -- Array de tags
  
  -- Entidades Extraídas (JSON)
  entidades_extraidas JSONB DEFAULT '{}'::jsonb,
  -- Estrutura:
  -- {
  --   "datas_importantes": ["01/10/2025", "15/10/2025"],
  --   "valores_financeiros": ["R$ 10.000,00"],
  --   "pessoas": ["João Silva", "Maria Santos"],
  --   "instituicoes": ["E.E. João XXIII", "SRE Barbacena"],
  --   "locais": ["Barbacena", "Juiz de Fora"],
  --   "processos": ["Edital nº 01/2025", "Processo 12345"]
  -- }
  
  -- Análise IA
  sentimento VARCHAR(20) DEFAULT 'neutro', -- positivo, neutro, negativo
  prioridade VARCHAR(20) DEFAULT 'media', -- alta, media, baixa
  relevancia_score INTEGER DEFAULT 50 CHECK (relevancia_score >= 0 AND relevancia_score <= 100),
  
  -- Insights IA
  resumo_ia TEXT,
  palavras_chave_ia TEXT[], -- Array de palavras-chave
  acoes_recomendadas TEXT[], -- Array de ações sugeridas
  
  -- Documentos anexos (JSON)
  documentos JSONB DEFAULT '[]'::jsonb,
  -- Estrutura:
  -- [
  --   {"nome": "Edital 01-2025", "url": "https://...", "tipo": "PDF"},
  --   {"nome": "Anexo I", "url": "https://...", "tipo": "DOCX"}
  -- ]
  
  -- Links externos
  links_externos TEXT[],
  
  -- Datas
  data_publicacao DATE,
  data_coleta TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ===============================================
-- ÍNDICES para Performance
-- ===============================================

-- Busca por SRE
CREATE INDEX IF NOT EXISTS idx_noticias_sre_source 
ON noticias(sre_source);

-- Busca por categoria IA
CREATE INDEX IF NOT EXISTS idx_noticias_categoria_ia 
ON noticias(categoria_ia);

-- Busca por prioridade
CREATE INDEX IF NOT EXISTS idx_noticias_prioridade 
ON noticias(prioridade);

-- Busca por data de publicação (ordem cronológica reversa)
CREATE INDEX IF NOT EXISTS idx_noticias_data_publicacao 
ON noticias(data_publicacao DESC NULLS LAST);

-- Busca por relevância (notícias mais importantes primeiro)
CREATE INDEX IF NOT EXISTS idx_noticias_relevancia 
ON noticias(relevancia_score DESC);

-- Busca full-text no título e conteúdo (PostgreSQL FTS)
CREATE INDEX IF NOT EXISTS idx_noticias_fulltext 
ON noticias USING gin(to_tsvector('portuguese', titulo || ' ' || conteudo));

-- Busca por tags (GIN index para arrays)
CREATE INDEX IF NOT EXISTS idx_noticias_tags 
ON noticias USING gin(tags_ia);

-- Busca por entidades (GIN index para JSONB)
CREATE INDEX IF NOT EXISTS idx_noticias_entidades 
ON noticias USING gin(entidades_extraidas);

-- Combinado: SRE + Categoria + Prioridade (consultas mais comuns)
CREATE INDEX IF NOT EXISTS idx_noticias_sre_cat_prior 
ON noticias(sre_source, categoria_ia, prioridade);

-- ===============================================
-- CONSTRAINTS
-- ===============================================

-- URL única por SRE (evitar duplicatas)
CREATE UNIQUE INDEX IF NOT EXISTS idx_noticias_unique_url 
ON noticias(sre_source, url);

-- Categoria IA obrigatória
ALTER TABLE noticias 
ADD CONSTRAINT chk_categoria_ia_not_empty 
CHECK (categoria_ia IS NOT NULL AND length(categoria_ia) > 0);

-- ===============================================
-- VIEWS para Análises Rápidas
-- ===============================================

-- View: Notícias de Alta Prioridade
CREATE OR REPLACE VIEW noticias_alta_prioridade AS
SELECT 
  id,
  sre_source,
  titulo,
  categoria_ia,
  subcategoria_ia,
  prioridade,
  relevancia_score,
  data_publicacao,
  acoes_recomendadas
FROM noticias
WHERE prioridade = 'alta'
  AND data_publicacao >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY relevancia_score DESC, data_publicacao DESC;

-- View: Estatísticas por SRE
CREATE OR REPLACE VIEW noticias_stats_por_sre AS
SELECT 
  sre_source,
  COUNT(*) as total_noticias,
  COUNT(*) FILTER (WHERE categoria_ia = 'Licitações e Compras') as licitacoes,
  COUNT(*) FILTER (WHERE categoria_ia = 'Processos Seletivos') as processos_seletivos,
  COUNT(*) FILTER (WHERE categoria_ia = 'Editais de RH') as editais_rh,
  COUNT(*) FILTER (WHERE prioridade = 'alta') as alta_prioridade,
  AVG(relevancia_score)::INTEGER as relevancia_media,
  MAX(data_publicacao) as ultima_noticia
FROM noticias
GROUP BY sre_source
ORDER BY total_noticias DESC;

-- View: Tendências por Categoria
CREATE OR REPLACE VIEW noticias_tendencias AS
SELECT 
  categoria_ia,
  DATE_TRUNC('month', data_publicacao) as mes,
  COUNT(*) as total,
  AVG(relevancia_score)::INTEGER as relevancia_media,
  COUNT(*) FILTER (WHERE prioridade = 'alta') as urgentes
FROM noticias
WHERE data_publicacao >= CURRENT_DATE - INTERVAL '6 months'
GROUP BY categoria_ia, DATE_TRUNC('month', data_publicacao)
ORDER BY mes DESC, total DESC;

-- View: Tags mais populares
CREATE OR REPLACE VIEW noticias_tags_populares AS
SELECT 
  unnest(tags_ia) as tag,
  COUNT(*) as frequencia,
  array_agg(DISTINCT sre_source) as sres
FROM noticias
WHERE data_publicacao >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY tag
ORDER BY frequencia DESC
LIMIT 50;

-- ===============================================
-- FUNCTIONS para Busca Avançada
-- ===============================================

-- Busca full-text em português
CREATE OR REPLACE FUNCTION buscar_noticias(
  termo TEXT,
  limite INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  titulo TEXT,
  resumo_ia TEXT,
  categoria_ia VARCHAR,
  relevancia_score INTEGER,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    n.id,
    n.titulo,
    n.resumo_ia,
    n.categoria_ia,
    n.relevancia_score,
    ts_rank(
      to_tsvector('portuguese', n.titulo || ' ' || n.conteudo),
      plainto_tsquery('portuguese', termo)
    ) as rank
  FROM noticias n
  WHERE to_tsvector('portuguese', n.titulo || ' ' || n.conteudo) @@ plainto_tsquery('portuguese', termo)
  ORDER BY rank DESC, relevancia_score DESC
  LIMIT limite;
END;
$$ LANGUAGE plpgsql;

-- Busca por múltiplas tags (AND)
CREATE OR REPLACE FUNCTION buscar_por_tags(
  tags TEXT[],
  limite INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  titulo TEXT,
  tags_ia TEXT[],
  categoria_ia VARCHAR,
  relevancia_score INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    n.id,
    n.titulo,
    n.tags_ia,
    n.categoria_ia,
    n.relevancia_score
  FROM noticias n
  WHERE n.tags_ia @> tags -- Operador "contém array"
  ORDER BY relevancia_score DESC, data_publicacao DESC
  LIMIT limite;
END;
$$ LANGUAGE plpgsql;

-- ===============================================
-- TRIGGERS para Automação
-- ===============================================

-- Atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_noticias_updated_at
BEFORE UPDATE ON noticias
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ===============================================
-- POLICIES (Row Level Security - Opcional)
-- ===============================================

-- Habilitar RLS
-- ALTER TABLE noticias ENABLE ROW LEVEL SECURITY;

-- Policy: Leitura pública (todos podem ler)
-- CREATE POLICY "noticias_select_policy" ON noticias
--   FOR SELECT USING (true);

-- Policy: Apenas autenticados podem inserir/atualizar
-- CREATE POLICY "noticias_insert_policy" ON noticias
--   FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ===============================================
-- DADOS INICIAIS (Exemplo)
-- ===============================================

-- Exemplo de inserção
-- INSERT INTO noticias (
--   sre_source,
--   url,
--   titulo,
--   conteudo,
--   categoria_ia,
--   tags_ia,
--   prioridade,
--   relevancia_score
-- ) VALUES (
--   'srebarbacena.educacao.mg.gov.br',
--   'https://srebarbacena.educacao.mg.gov.br/noticias/123',
--   'Edital de Licitação nº 01/2025',
--   'Pregão Eletrônico para aquisição de materiais escolares...',
--   'Licitações e Compras',
--   ARRAY['licitação', 'pregão', 'material-escolar'],
--   'alta',
--   85
-- );

-- ===============================================
-- COMENTÁRIOS nas Colunas
-- ===============================================

COMMENT ON TABLE noticias IS 'Notícias coletadas das SREs com categorização inteligente por IA';
COMMENT ON COLUMN noticias.categoria_ia IS 'Categoria atribuída por IA/NLP';
COMMENT ON COLUMN noticias.relevancia_score IS 'Score de relevância (0-100) calculado por IA';
COMMENT ON COLUMN noticias.entidades_extraidas IS 'Entidades extraídas por NER (Named Entity Recognition)';
COMMENT ON COLUMN noticias.acoes_recomendadas IS 'Ações sugeridas pela IA baseadas no conteúdo';

-- ===============================================
-- FIM DO SCHEMA
-- ===============================================
