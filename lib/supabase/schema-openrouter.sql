-- ===============================================
-- EXTENSÃO: Integração com OpenRouter AI
-- ===============================================
-- Adiciona suporte para análise avançada com LLMs
-- (GPT-4, Claude, Gemini, etc via OpenRouter)
-- ===============================================

-- Tabela de análises IA (OpenRouter)
CREATE TABLE IF NOT EXISTS noticias_analises_ia (
  -- Identificação
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  noticia_id UUID NOT NULL REFERENCES noticias(id) ON DELETE CASCADE,
  
  -- Configuração da análise
  modelo VARCHAR(100) NOT NULL, -- ex: "openai/gpt-4o", "anthropic/claude-3.5-sonnet"
  provider VARCHAR(50) NOT NULL DEFAULT 'openrouter', -- openrouter, local, etc
  versao_prompt VARCHAR(50) DEFAULT 'v1.0',
  
  -- Resposta da IA (JSON completo)
  resposta_completa JSONB NOT NULL,
  -- Estrutura:
  -- {
  --   "categoria": "Processos Seletivos",
  --   "subcategoria": "ATL - Professor",
  --   "tags": ["professor", "contratação", "temporário"],
  --   "entidades": {...},
  --   "sentimento": "neutro",
  --   "prioridade": "alta",
  --   "relevancia": 85,
  --   "resumo": "...",
  --   "palavras_chave": [...],
  --   "acoes_recomendadas": [...],
  --   "justificativa": "Processo seletivo com prazo curto..."
  -- }
  
  -- Métricas de uso
  tokens_prompt INTEGER,
  tokens_completion INTEGER,
  tokens_total INTEGER,
  custo_usd DECIMAL(10, 6), -- Custo em dólares
  tempo_processamento_ms INTEGER, -- Tempo em milissegundos
  
  -- Status
  status VARCHAR(20) DEFAULT 'sucesso', -- sucesso, erro, timeout
  erro_mensagem TEXT,
  
  -- Auditoria
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraint: uma análise por notícia por modelo
  UNIQUE(noticia_id, modelo)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_analises_noticia_id 
ON noticias_analises_ia(noticia_id);

CREATE INDEX IF NOT EXISTS idx_analises_modelo 
ON noticias_analises_ia(modelo);

CREATE INDEX IF NOT EXISTS idx_analises_status 
ON noticias_analises_ia(status);

CREATE INDEX IF NOT EXISTS idx_analises_created 
ON noticias_analises_ia(created_at DESC);

COMMENT ON TABLE noticias_analises_ia IS 'Armazena análises detalhadas feitas por LLMs via OpenRouter';
COMMENT ON COLUMN noticias_analises_ia.resposta_completa IS 'JSON com análise completa da IA';
COMMENT ON COLUMN noticias_analises_ia.custo_usd IS 'Custo da análise em dólares (para tracking)';

-- ===============================================
-- VIEW: Análises com detalhes da notícia
-- ===============================================

CREATE OR REPLACE VIEW noticias_com_analise_ia AS
SELECT 
  n.*,
  ai.id as analise_id,
  ai.modelo,
  ai.resposta_completa as analise_ia,
  ai.tokens_total,
  ai.custo_usd,
  ai.tempo_processamento_ms,
  ai.created_at as data_analise
FROM noticias n
LEFT JOIN noticias_analises_ia ai ON n.id = ai.noticia_id
WHERE ai.status = 'sucesso'
ORDER BY n.created_at DESC;

COMMENT ON VIEW noticias_com_analise_ia IS 'Notícias enriquecidas com análises de IA';

-- ===============================================
-- FUNCTION: Obter análise mais recente
-- ===============================================

CREATE OR REPLACE FUNCTION obter_analise_ia(
  p_noticia_id UUID,
  p_modelo VARCHAR DEFAULT NULL
)
RETURNS TABLE (
  modelo VARCHAR,
  analise JSONB,
  tokens INTEGER,
  custo DECIMAL,
  data TIMESTAMP
) AS $$
BEGIN
  IF p_modelo IS NOT NULL THEN
    -- Buscar análise de modelo específico
    RETURN QUERY
    SELECT 
      ai.modelo::VARCHAR,
      ai.resposta_completa,
      ai.tokens_total,
      ai.custo_usd,
      ai.created_at
    FROM noticias_analises_ia ai
    WHERE ai.noticia_id = p_noticia_id 
      AND ai.modelo = p_modelo
      AND ai.status = 'sucesso'
    ORDER BY ai.created_at DESC
    LIMIT 1;
  ELSE
    -- Buscar análise mais recente (qualquer modelo)
    RETURN QUERY
    SELECT 
      ai.modelo::VARCHAR,
      ai.resposta_completa,
      ai.tokens_total,
      ai.custo_usd,
      ai.created_at
    FROM noticias_analises_ia ai
    WHERE ai.noticia_id = p_noticia_id 
      AND ai.status = 'sucesso'
    ORDER BY ai.created_at DESC
    LIMIT 1;
  END IF;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION obter_analise_ia IS 'Retorna análise IA mais recente para uma notícia';

-- ===============================================
-- FUNCTION: Estatísticas de uso da IA
-- ===============================================

CREATE OR REPLACE FUNCTION estatisticas_uso_ia(
  p_dias INTEGER DEFAULT 30
)
RETURNS TABLE (
  total_analises BIGINT,
  modelos_usados BIGINT,
  tokens_totais BIGINT,
  custo_total_usd NUMERIC,
  custo_medio_usd NUMERIC,
  tempo_medio_ms NUMERIC,
  taxa_sucesso NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_analises,
    COUNT(DISTINCT modelo)::BIGINT as modelos_usados,
    SUM(tokens_total)::BIGINT as tokens_totais,
    SUM(custo_usd)::NUMERIC as custo_total_usd,
    AVG(custo_usd)::NUMERIC as custo_medio_usd,
    AVG(tempo_processamento_ms)::NUMERIC as tempo_medio_ms,
    (COUNT(*) FILTER (WHERE status = 'sucesso') * 100.0 / COUNT(*))::NUMERIC as taxa_sucesso
  FROM noticias_analises_ia
  WHERE created_at > NOW() - (p_dias || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION estatisticas_uso_ia IS 'Retorna estatísticas de uso e custo da IA nos últimos N dias';

-- ===============================================
-- VIEW: Custos por modelo
-- ===============================================

CREATE OR REPLACE VIEW custos_por_modelo AS
SELECT 
  modelo,
  COUNT(*) as total_analises,
  SUM(tokens_total) as tokens_totais,
  SUM(custo_usd) as custo_total_usd,
  AVG(custo_usd) as custo_medio_usd,
  AVG(tempo_processamento_ms) as tempo_medio_ms,
  COUNT(*) FILTER (WHERE status = 'sucesso') * 100.0 / COUNT(*) as taxa_sucesso_pct
FROM noticias_analises_ia
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY modelo
ORDER BY total_analises DESC;

COMMENT ON VIEW custos_por_modelo IS 'Custos e métricas por modelo de IA (últimos 30 dias)';

-- ===============================================
-- TRIGGER: Atualizar notícia com análise IA
-- ===============================================

CREATE OR REPLACE FUNCTION atualizar_noticia_com_ia()
RETURNS TRIGGER AS $$
BEGIN
  -- Quando uma nova análise é inserida com sucesso, atualiza a notícia
  IF NEW.status = 'sucesso' THEN
    UPDATE noticias SET
      categoria_ia = COALESCE((NEW.resposta_completa->>'categoria')::VARCHAR, categoria_ia),
      subcategoria_ia = (NEW.resposta_completa->>'subcategoria')::VARCHAR,
      tags_ia = CASE 
        WHEN NEW.resposta_completa ? 'tags' 
        THEN ARRAY(SELECT jsonb_array_elements_text(NEW.resposta_completa->'tags'))
        ELSE tags_ia 
      END,
      entidades_extraidas = COALESCE(NEW.resposta_completa->'entidades', entidades_extraidas),
      sentimento = COALESCE((NEW.resposta_completa->>'sentimento')::VARCHAR, sentimento),
      prioridade = COALESCE((NEW.resposta_completa->>'prioridade')::VARCHAR, prioridade),
      relevancia_score = COALESCE((NEW.resposta_completa->>'relevancia')::INTEGER, relevancia_score),
      resumo_ia = COALESCE(NEW.resposta_completa->>'resumo', resumo_ia),
      palavras_chave_ia = CASE 
        WHEN NEW.resposta_completa ? 'palavras_chave' 
        THEN ARRAY(SELECT jsonb_array_elements_text(NEW.resposta_completa->'palavras_chave'))
        ELSE palavras_chave_ia 
      END,
      acoes_recomendadas = CASE 
        WHEN NEW.resposta_completa ? 'acoes_recomendadas' 
        THEN ARRAY(SELECT jsonb_array_elements_text(NEW.resposta_completa->'acoes_recomendadas'))
        ELSE acoes_recomendadas 
      END,
      updated_at = NOW()
    WHERE id = NEW.noticia_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_atualizar_noticia_com_ia
  AFTER INSERT ON noticias_analises_ia
  FOR EACH ROW
  EXECUTE FUNCTION atualizar_noticia_com_ia();

COMMENT ON TRIGGER trigger_atualizar_noticia_com_ia ON noticias_analises_ia 
IS 'Atualiza automaticamente a tabela noticias com dados da análise IA';

-- ===============================================
-- Exemplos de consulta
-- ===============================================

-- Ver todas as notícias com análise IA
-- SELECT * FROM noticias_com_analise_ia LIMIT 10;

-- Obter análise específica
-- SELECT * FROM obter_analise_ia('uuid-da-noticia', 'openai/gpt-4o');

-- Ver estatísticas de uso
-- SELECT * FROM estatisticas_uso_ia(30);

-- Ver custos por modelo
-- SELECT * FROM custos_por_modelo;

-- Notícias ainda não analisadas por IA
-- SELECT id, titulo FROM noticias 
-- WHERE id NOT IN (SELECT noticia_id FROM noticias_analises_ia WHERE status = 'sucesso');
