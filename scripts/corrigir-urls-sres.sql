-- ============================================
-- SCRIPT DE CORREÇÃO DE URLs DAS SREs
-- ============================================
-- Este script corrige URLs de licitações que estão apontando para lugares errados
-- Data: 13/10/2025
-- ============================================

-- 1️⃣ VERIFICAR SITUAÇÃO ATUAL
-- Execute primeiro para ver quantas SREs estão com URLs erradas

SELECT 
    codigo,
    nome,
    url_base,
    url_licitacoes,
    CASE 
        WHEN url_licitacoes LIKE '%/home/noticias%' THEN '❌ NOTÍCIAS (ERRADO)'
        WHEN url_licitacoes LIKE '%/noticias%' THEN '❌ NOTÍCIAS (ERRADO)'
        WHEN url_licitacoes = url_base THEN '⚠️ APENAS BASE (INCOMPLETO)'
        WHEN url_licitacoes IS NULL THEN '❌ NULL (FALTANDO)'
        WHEN url_licitacoes LIKE '%/licitacoes%' THEN '✅ LICITAÇÕES (CORRETO)'
        WHEN url_licitacoes LIKE '%/editais%' THEN '✅ EDITAIS (CORRETO)'
        ELSE '⚠️ OUTRO ENDPOINT'
    END AS status_url
FROM sres
ORDER BY codigo;

-- ============================================
-- 2️⃣ CONTAR ERROS
-- ============================================

SELECT 
    CASE 
        WHEN url_licitacoes LIKE '%/home/noticias%' THEN 'Apontando para /home/noticias'
        WHEN url_licitacoes LIKE '%/noticias%' THEN 'Apontando para /noticias'
        WHEN url_licitacoes = url_base THEN 'Apenas URL base'
        WHEN url_licitacoes IS NULL THEN 'URL NULL'
        ELSE 'Outras URLs'
    END AS tipo_problema,
    COUNT(*) AS quantidade
FROM sres
GROUP BY tipo_problema
ORDER BY quantidade DESC;

-- ============================================
-- 3️⃣ CORREÇÃO AUTOMÁTICA - PADRÃO /licitacoes
-- ============================================
-- Este comando corrige TODAS as URLs erradas para usar {url_base}/licitacoes

-- ATENÇÃO: Execute este comando para fazer a correção em massa!

UPDATE sres
SET url_licitacoes = CASE 
    WHEN url_base LIKE '%/' THEN url_base || 'licitacoes'
    ELSE url_base || '/licitacoes'
END,
updated_at = NOW()
WHERE 
    -- Corrigir URLs que apontam para notícias
    url_licitacoes LIKE '%/home/noticias%'
    OR url_licitacoes LIKE '%/noticias%'
    -- Corrigir URLs que são apenas a base
    OR url_licitacoes = url_base
    -- Corrigir URLs NULL
    OR url_licitacoes IS NULL
    -- Corrigir URLs vazias
    OR url_licitacoes = '';

-- ============================================
-- 4️⃣ CORREÇÕES INDIVIDUAIS ESPECÍFICAS
-- ============================================
-- Caso alguma SRE use endpoint diferente, corrija aqui:

-- Exemplo: Se uma SRE usa /editais em vez de /licitacoes
-- UPDATE sres 
-- SET url_licitacoes = url_base || 'editais'
-- WHERE codigo = X;

-- Exemplo: Se uma SRE usa /compras
-- UPDATE sres 
-- SET url_licitacoes = url_base || 'compras'
-- WHERE codigo = Y;

-- ============================================
-- 5️⃣ VERIFICAR RESULTADO DA CORREÇÃO
-- ============================================

SELECT 
    COUNT(*) AS total_sres,
    SUM(CASE WHEN url_licitacoes LIKE '%/licitacoes%' THEN 1 ELSE 0 END) AS com_licitacoes,
    SUM(CASE WHEN url_licitacoes LIKE '%/noticias%' THEN 1 ELSE 0 END) AS com_noticias_ainda,
    SUM(CASE WHEN url_licitacoes IS NULL THEN 1 ELSE 0 END) AS urls_null
FROM sres;

-- ============================================
-- 6️⃣ LISTAR SRES QUE AINDA PRECISAM DE AJUSTE
-- ============================================

SELECT 
    codigo,
    nome,
    url_licitacoes,
    '⚠️ Verificar manualmente' AS acao
FROM sres
WHERE 
    url_licitacoes NOT LIKE '%/licitacoes%'
    AND url_licitacoes NOT LIKE '%/editais%'
    AND url_licitacoes NOT LIKE '%/compras%'
    AND url_licitacoes NOT LIKE '%/pregoes%'
    AND url_licitacoes IS NOT NULL
ORDER BY codigo;

-- ============================================
-- 7️⃣ RESETAR ESTATÍSTICAS (OPCIONAL)
-- ============================================
-- Após corrigir as URLs, você pode querer resetar as estatísticas
-- para começar do zero com as URLs corretas

-- CUIDADO: Isso vai zerar todas as estatísticas de coleta!
-- Descomente apenas se quiser realmente resetar

-- UPDATE sres
-- SET 
--     total_coletas = 0,
--     taxa_sucesso = NULL,
--     ultima_coleta = NULL,
--     updated_at = NOW();

-- ============================================
-- 8️⃣ MARCAR TODAS COMO ATIVAS (OPCIONAL)
-- ============================================
-- Se você corrigiu as URLs e quer reativar todas as SREs

-- UPDATE sres
-- SET ativo = true
-- WHERE ativo = false;

-- ============================================
-- 9️⃣ BACKUP DAS URLs ANTIGAS (RECOMENDADO)
-- ============================================
-- Antes de executar a correção, faça um backup

-- CREATE TABLE sres_backup_urls AS
-- SELECT codigo, nome, url_base, url_licitacoes, updated_at
-- FROM sres;

-- Para restaurar:
-- UPDATE sres s
-- SET url_licitacoes = b.url_licitacoes
-- FROM sres_backup_urls b
-- WHERE s.codigo = b.codigo;

-- ============================================
-- 🎯 ORDEM DE EXECUÇÃO RECOMENDADA
-- ============================================

/*
1. Execute a query da seção 1️⃣ (VERIFICAR SITUAÇÃO ATUAL)
   - Anote quantas SREs estão com problemas

2. Execute a query da seção 2️⃣ (CONTAR ERROS)
   - Veja quais são os problemas mais comuns

3. [OPCIONAL] Execute a seção 9️⃣ (BACKUP)
   - Crie um backup antes de modificar

4. Execute o UPDATE da seção 3️⃣ (CORREÇÃO AUTOMÁTICA)
   - Isso vai corrigir a maioria das SREs

5. Execute a query da seção 5️⃣ (VERIFICAR RESULTADO)
   - Confirme que a correção funcionou

6. Execute a query da seção 6️⃣ (LISTAR PENDENTES)
   - Veja se ainda há SREs que precisam de ajuste manual

7. Ajuste manualmente as SREs restantes (se houver)
   - Use a interface web em /sres
   - Ou crie UPDATEs específicos na seção 4️⃣

8. Teste com scraping manual:
   - Acesse /sres
   - Clique no botão ▶️ de algumas SREs
   - Verifique se retorna licitações (>0)
*/

-- ============================================
-- ✅ FIM DO SCRIPT
-- ============================================
