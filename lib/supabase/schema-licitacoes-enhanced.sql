-- =====================================================
-- SCHEMA: Licitações Enhanced (B2B)
-- Data: 06/10/2025
-- Descrição: Schema completo para licitações com dados enriquecidos por IA
-- =====================================================

-- Adicionar novos campos à tabela licitacoes existente
ALTER TABLE licitacoes ADD COLUMN IF NOT EXISTS sre_code INTEGER REFERENCES sres(codigo);
ALTER TABLE licitacoes ADD COLUMN IF NOT EXISTS regional VARCHAR(100); -- Nome completo da SRE
ALTER TABLE licitacoes ADD COLUMN IF NOT EXISTS escola VARCHAR(200); -- Extraído por IA
ALTER TABLE licitacoes ADD COLUMN IF NOT EXISTS municipio_escola VARCHAR(100); -- Pode ser diferente da SRE
ALTER TABLE licitacoes ADD COLUMN IF NOT EXISTS tipo_processo VARCHAR(50); -- "Aquisição Simplificada", "PDDE", etc
ALTER TABLE licitacoes ADD COLUMN IF NOT EXISTS prazo_entrega VARCHAR(100);
ALTER TABLE licitacoes ADD COLUMN IF NOT EXISTS categorias_secundarias TEXT[];
ALTER TABLE licitacoes ADD COLUMN IF NOT EXISTS itens_principais TEXT[]; -- ["cadeiras", "mesas"]
ALTER TABLE licitacoes ADD COLUMN IF NOT EXISTS palavras_chave TEXT[];
ALTER TABLE licitacoes ADD COLUMN IF NOT EXISTS fornecedor_tipo VARCHAR(50); -- 'pequeno', 'medio', 'grande'
ALTER TABLE licitacoes ADD COLUMN IF NOT EXISTS contato_responsavel VARCHAR(200);
ALTER TABLE licitacoes ADD COLUMN IF NOT EXISTS contato_email VARCHAR(200);
ALTER TABLE licitacoes ADD COLUMN IF NOT EXISTS contato_telefone VARCHAR(50);
ALTER TABLE licitacoes ADD COLUMN IF NOT EXISTS itens_detalhados JSONB; -- [{item, quantidade, valor_unit}]
ALTER TABLE licitacoes ADD COLUMN IF NOT EXISTS score_relevancia INTEGER DEFAULT 0; -- 0-100 (para ranking)
ALTER TABLE licitacoes ADD COLUMN IF NOT EXISTS resumo_executivo TEXT; -- Gerado por IA
ALTER TABLE licitacoes ADD COLUMN IF NOT EXISTS complexidade VARCHAR(20); -- baixa|media|alta
ALTER TABLE licitacoes ADD COLUMN IF NOT EXISTS processado_ia BOOLEAN DEFAULT false;
ALTER TABLE licitacoes ADD COLUMN IF NOT EXISTS processado_ia_at TIMESTAMP;

-- Índices adicionais para performance
CREATE INDEX IF NOT EXISTS idx_licitacoes_sre_code ON licitacoes(sre_code);
CREATE INDEX IF NOT EXISTS idx_licitacoes_regional ON licitacoes(regional);
CREATE INDEX IF NOT EXISTS idx_licitacoes_escola ON licitacoes(escola);
CREATE INDEX IF NOT EXISTS idx_licitacoes_municipio_escola ON licitacoes(municipio_escola);
CREATE INDEX IF NOT EXISTS idx_licitacoes_categorias_secundarias ON licitacoes USING gin(categorias_secundarias);
CREATE INDEX IF NOT EXISTS idx_licitacoes_itens_principais ON licitacoes USING gin(itens_principais);
CREATE INDEX IF NOT EXISTS idx_licitacoes_palavras_chave ON licitacoes USING gin(palavras_chave);
CREATE INDEX IF NOT EXISTS idx_licitacoes_fornecedor_tipo ON licitacoes(fornecedor_tipo);
CREATE INDEX IF NOT EXISTS idx_licitacoes_processado_ia ON licitacoes(processado_ia) WHERE processado_ia = false;
CREATE INDEX IF NOT EXISTS idx_licitacoes_score ON licitacoes(score_relevancia DESC);

-- Full-text search em escola
CREATE INDEX IF NOT EXISTS idx_licitacoes_escola_search 
ON licitacoes USING gin(to_tsvector('portuguese', COALESCE(escola, '')));

-- Comentários
COMMENT ON COLUMN licitacoes.sre_code IS 'Código da SRE (foreign key para tabela sres)';
COMMENT ON COLUMN licitacoes.regional IS 'Nome completo da SRE (ex: "SRE Barbacena")';
COMMENT ON COLUMN licitacoes.escola IS 'Nome da escola específica (extraído por IA do objeto)';
COMMENT ON COLUMN licitacoes.municipio_escola IS 'Município da escola (pode ser diferente da SRE)';
COMMENT ON COLUMN licitacoes.itens_principais IS 'Lista de itens principais extraídos do objeto';
COMMENT ON COLUMN licitacoes.fornecedor_tipo IS 'Porte do fornecedor ideal (pequeno, médio, grande)';
COMMENT ON COLUMN licitacoes.itens_detalhados IS 'JSON com detalhes: [{item: "...", quantidade: 50, valor_unitario: 10.50}]';
COMMENT ON COLUMN licitacoes.score_relevancia IS 'Score de 0-100 para ranking (calculado por IA)';
COMMENT ON COLUMN licitacoes.resumo_executivo IS 'Resumo gerado por IA (2-3 linhas)';
COMMENT ON COLUMN licitacoes.processado_ia IS 'Flag indicando se passou pelo enriquecimento de IA';

-- View: Licitações prontas para empresas (enriquecidas)
CREATE OR REPLACE VIEW licitacoes_enriquecidas AS
SELECT 
  l.id,
  l.numero_edital,
  l.sre_source,
  l.regional,
  l.escola,
  l.municipio_escola,
  l.modalidade,
  l.tipo_processo,
  l.objeto,
  l.valor_estimado,
  l.data_publicacao,
  l.data_abertura,
  l.categorias_secundarias,
  l.itens_principais,
  l.palavras_chave,
  l.fornecedor_tipo,
  l.contato_responsavel,
  l.contato_email,
  l.contato_telefone,
  l.prazo_entrega,
  l.resumo_executivo,
  l.score_relevancia,
  l.situacao,
  l.documentos,
  s.nome as sre_nome,
  s.municipio as sre_municipio,
  s.url_base as sre_url
FROM licitacoes l
LEFT JOIN sres s ON l.sre_code = s.codigo
WHERE l.processado_ia = true
  AND l.situacao = 'aberto'
ORDER BY l.data_abertura DESC NULLS LAST, l.score_relevancia DESC;

COMMENT ON VIEW licitacoes_enriquecidas IS 'Licitações processadas por IA, prontas para exibição B2B';

-- View: Licitações pendentes de processamento IA
CREATE OR REPLACE VIEW licitacoes_pendentes_ia AS
SELECT 
  l.id,
  l.numero_edital,
  l.sre_source,
  l.objeto,
  l.data_publicacao,
  l.created_at,
  EXTRACT(EPOCH FROM (NOW() - l.created_at)) / 3600 as horas_desde_criacao
FROM licitacoes l
WHERE l.processado_ia = false
  AND l.created_at > NOW() - INTERVAL '30 days' -- Apenas últimos 30 dias
ORDER BY l.created_at ASC
LIMIT 100;

COMMENT ON VIEW licitacoes_pendentes_ia IS 'Licitações que precisam ser processadas por IA';

-- Função: Marcar como processado por IA
CREATE OR REPLACE FUNCTION marcar_licitacao_processada(licitacao_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE licitacoes 
  SET 
    processado_ia = true,
    processado_ia_at = NOW(),
    updated_at = NOW()
  WHERE id = licitacao_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION marcar_licitacao_processada IS 'Marca licitação como processada após enriquecimento de IA';

-- =====================================================
-- QUERIES ÚTEIS PARA B2B
-- =====================================================

-- Licitações por SRE
-- SELECT 
--   regional,
--   COUNT(*) as total,
--   SUM(valor_estimado) as valor_total,
--   AVG(valor_estimado) as valor_medio
-- FROM licitacoes_enriquecidas
-- GROUP BY regional
-- ORDER BY total DESC;

-- Licitações de alto valor (>R$50k) ainda abertas
-- SELECT * FROM licitacoes_enriquecidas 
-- WHERE valor_estimado > 50000 
--   AND data_abertura > NOW()
-- ORDER BY valor_estimado DESC;

-- Escolas mais ativas em licitações
-- SELECT 
--   escola,
--   municipio_escola,
--   COUNT(*) as total_licitacoes,
--   SUM(valor_estimado) as valor_total
-- FROM licitacoes_enriquecidas
-- WHERE escola IS NOT NULL
-- GROUP BY escola, municipio_escola
-- HAVING COUNT(*) > 3
-- ORDER BY total_licitacoes DESC;

-- Estatísticas de processamento IA
-- SELECT 
--   COUNT(*) as total,
--   COUNT(*) FILTER (WHERE processado_ia = true) as processadas,
--   COUNT(*) FILTER (WHERE processado_ia = false) as pendentes,
--   ROUND(100.0 * COUNT(*) FILTER (WHERE processado_ia = true) / COUNT(*), 2) as percentual_processado
-- FROM licitacoes;
