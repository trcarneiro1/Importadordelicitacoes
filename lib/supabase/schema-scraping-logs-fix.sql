-- =====================================================
-- SCHEMA: Fix scraping_logs
-- Data: 06/10/2025
-- Descrição: Adiciona coluna faltante e metadados
-- =====================================================

-- Adicionar coluna licitacoes_coletadas (compatibilidade com orchestrator)
ALTER TABLE scraping_logs ADD COLUMN IF NOT EXISTS licitacoes_coletadas INTEGER DEFAULT 0;

-- Adicionar coluna metadata para informações adicionais
ALTER TABLE scraping_logs ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_scraping_logs_sre_source ON scraping_logs(sre_source);
CREATE INDEX IF NOT EXISTS idx_scraping_logs_status ON scraping_logs(status);
CREATE INDEX IF NOT EXISTS idx_scraping_logs_started_at ON scraping_logs(started_at DESC);

COMMENT ON COLUMN scraping_logs.licitacoes_coletadas IS 'Número de licitações coletadas nesta execução';
COMMENT ON COLUMN scraping_logs.metadata IS 'Metadados adicionais (sre_code, timestamp, etc)';

-- Query útil: Ver últimos 20 logs
-- SELECT 
--   sre_source,
--   status,
--   licitacoes_coletadas,
--   records_found,
--   error_message,
--   started_at
-- FROM scraping_logs
-- ORDER BY started_at DESC
-- LIMIT 20;
