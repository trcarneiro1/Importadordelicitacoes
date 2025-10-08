-- =====================================================
-- SCHEMA: Fix SREs URLs
-- Data: 06/10/2025
-- Descrição: Corrige URLs de licitacoes para padrão correto
-- =====================================================

-- A maioria das SREs usa /index.php/licitacoes (não /licitacoes-e-compras)
-- Baseado no teste: https://srebarbacena.educacao.mg.gov.br/index.php/licitacoes funciona

UPDATE sres 
SET url_licitacoes = REPLACE(url_licitacoes, '/index.php/licitacoes-e-compras', '/index.php/licitacoes')
WHERE url_licitacoes LIKE '%/index.php/licitacoes-e-compras';

-- Verificar quantas foram atualizadas
SELECT 
  COUNT(*) as total_atualizadas,
  COUNT(CASE WHEN url_licitacoes LIKE '%/index.php/licitacoes' THEN 1 END) as com_novo_padrao
FROM sres;

-- Ver amostra
SELECT codigo, nome, url_licitacoes 
FROM sres 
WHERE url_licitacoes LIKE '%/licitacoes'
ORDER BY codigo
LIMIT 10;
