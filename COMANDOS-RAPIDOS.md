# ⚡ Comandos Rápidos - Cheat Sheet

## 🚀 Inicialização

```powershell
# Iniciar servidor de desenvolvimento
npm run dev

# Build de produção
npm run build

# Iniciar em produção
npm start

# Validar sistema completo
.\validar-sistema.ps1

# Testes automatizados
.\test-noticias.ps1
```

---

## 📊 Coleta de Dados

### Licitações:

```powershell
# Coletar 3 SREs aleatórias
curl "http://localhost:3001/api/scrape-specific?count=3"

# Coletar 5 SREs
curl "http://localhost:3001/api/scrape-specific?count=5"

# Coletar TODAS (47 SREs) - ~15 min
curl "http://localhost:3001/api/scrape-specific?count=47"
```

### Notícias:

```powershell
# Teste rápido - 1 SRE (30 seg)
curl "http://localhost:3001/api/scrape-news?sre=barbacena&pages=2"

# 3 SREs aleatórias (2 min)
curl "http://localhost:3001/api/scrape-news?count=3&pages=1"

# 5 SREs (3-4 min)
curl "http://localhost:3001/api/scrape-news?count=5&pages=2"

# TODAS as 47 SREs (15-20 min)
curl "http://localhost:3001/api/scrape-news?count=47&pages=2"

# SREs específicas (POST)
curl -X POST "http://localhost:3001/api/scrape-news" `
  -H "Content-Type: application/json" `
  -d '{\"sres\": [\"barbacena\", \"uba\", \"conselheirolafaiete\"], \"pages\": 2}'

# Com JSON formatado
curl -X POST "http://localhost:3001/api/scrape-news" `
  -H "Content-Type: application/json" `
  -d @- << 'EOF'
{
  "sres": ["barbacena", "uba", "conselheirolafaiete"],
  "pages": 2
}
EOF
```

---

## 🔍 Consultas API

### Licitações:

```powershell
# Listar todas
curl "http://localhost:3001/api/licitacoes"

# Buscar por ID
curl "http://localhost:3001/api/licitacoes/[uuid-aqui]"

# Com limit
curl "http://localhost:3001/api/licitacoes?limit=50"
```

### Notícias:

```powershell
# Listar todas
curl "http://localhost:3001/api/noticias"

# Com limit
curl "http://localhost:3001/api/noticias?limit=50"

# Buscar por ID
curl "http://localhost:3001/api/noticias/[uuid-aqui]"

# Salvar em arquivo JSON
curl "http://localhost:3001/api/noticias" > noticias.json
```

---

## 🗄️ Comandos SQL (Supabase)

### Setup:

```sql
-- Criar tabela de licitações
-- Cole conteúdo de: lib/supabase/schema-licitacoes.sql

-- Criar tabela de notícias
-- Cole conteúdo de: lib/supabase/schema-noticias.sql
```

### Consultas Rápidas:

```sql
-- ==================
-- LICITAÇÕES
-- ==================

-- Contar total
SELECT COUNT(*) FROM licitacoes;

-- Últimas 10
SELECT numero_edital, modalidade, objeto, valor_estimado, data_publicacao 
FROM licitacoes 
ORDER BY data_publicacao DESC 
LIMIT 10;

-- Por SRE
SELECT sre_source, COUNT(*) as total 
FROM licitacoes 
GROUP BY sre_source 
ORDER BY total DESC;

-- Por modalidade
SELECT modalidade, COUNT(*) as total, SUM(valor_estimado) as valor_total
FROM licitacoes 
GROUP BY modalidade 
ORDER BY total DESC;

-- Licitações abertas
SELECT * FROM licitacoes 
WHERE situacao IN ('Aberta', 'Em andamento') 
ORDER BY data_abertura ASC;

-- Top 10 por valor
SELECT numero_edital, objeto, valor_estimado, sre_source
FROM licitacoes 
WHERE valor_estimado IS NOT NULL
ORDER BY valor_estimado DESC 
LIMIT 10;

-- ==================
-- NOTÍCIAS
-- ==================

-- Contar total
SELECT COUNT(*) FROM noticias;

-- Últimas 10
SELECT titulo, categoria_ia, prioridade, data_publicacao 
FROM noticias 
ORDER BY data_publicacao DESC 
LIMIT 10;

-- Por categoria
SELECT categoria_ia, COUNT(*) as total 
FROM noticias 
GROUP BY categoria_ia 
ORDER BY total DESC;

-- Por prioridade
SELECT prioridade, COUNT(*) as total 
FROM noticias 
GROUP BY prioridade 
ORDER BY 
  CASE prioridade 
    WHEN 'alta' THEN 1 
    WHEN 'media' THEN 2 
    WHEN 'baixa' THEN 3 
  END;

-- Por SRE
SELECT sre_source, COUNT(*) as total 
FROM noticias 
GROUP BY sre_source 
ORDER BY total DESC 
LIMIT 10;

-- Alta prioridade (últimos 30 dias)
SELECT * FROM noticias_alta_prioridade;

-- Estatísticas por SRE (view)
SELECT * FROM noticias_stats_por_sre;

-- Tendências mensais (view)
SELECT * FROM noticias_tendencias;

-- Tags populares (view)
SELECT * FROM noticias_tags_populares LIMIT 20;

-- Busca full-text (function)
SELECT * FROM buscar_noticias('processo seletivo', 10);

-- Busca por múltiplas tags (function)
SELECT * FROM buscar_por_tags(ARRAY['edital', 'suspensão'], 20);

-- Top 10 por relevância
SELECT titulo, categoria_ia, relevancia_score, prioridade
FROM noticias 
WHERE relevancia_score IS NOT NULL
ORDER BY relevancia_score DESC 
LIMIT 10;

-- Notícias com valores financeiros
SELECT titulo, entidades_extraidas->'valores_financeiros' as valores
FROM noticias 
WHERE entidades_extraidas ? 'valores_financeiros' 
AND jsonb_array_length(entidades_extraidas->'valores_financeiros') > 0
LIMIT 20;

-- Notícias com datas importantes
SELECT titulo, entidades_extraidas->'datas_importantes' as datas
FROM noticias 
WHERE entidades_extraidas ? 'datas_importantes' 
AND jsonb_array_length(entidades_extraidas->'datas_importantes') > 0
LIMIT 20;

-- Notícias com processos
SELECT titulo, entidades_extraidas->'processos' as processos
FROM noticias 
WHERE entidades_extraidas ? 'processos' 
AND jsonb_array_length(entidades_extraidas->'processos') > 0
LIMIT 20;

-- Análise de sentimento
SELECT sentimento, COUNT(*) as total 
FROM noticias 
GROUP BY sentimento;

-- Estatísticas combinadas
SELECT 
  COUNT(*) as total_noticias,
  COUNT(*) FILTER (WHERE prioridade = 'alta') as alta_prioridade,
  COUNT(*) FILTER (WHERE prioridade = 'media') as media_prioridade,
  COUNT(*) FILTER (WHERE prioridade = 'baixa') as baixa_prioridade,
  AVG(relevancia_score) as relevancia_media
FROM noticias;

-- ==================
-- LIMPEZA
-- ==================

-- Deletar todas as licitações (CUIDADO!)
-- DELETE FROM licitacoes;

-- Deletar todas as notícias (CUIDADO!)
-- DELETE FROM noticias;

-- Deletar notícias antigas (> 6 meses)
-- DELETE FROM noticias WHERE data_publicacao < NOW() - INTERVAL '6 months';

-- Deletar logs de scraping (> 30 dias)
-- DELETE FROM scraping_logs WHERE created_at < NOW() - INTERVAL '30 days';
```

---

## 🌐 URLs Úteis

```
# Páginas
http://localhost:3001/                          # Home (redireciona)
http://localhost:3001/dashboard                 # Dashboard Licitações
http://localhost:3001/noticias                  # Dashboard Notícias

# APIs - Licitações
http://localhost:3001/api/licitacoes            # GET todas
http://localhost:3001/api/licitacoes/[id]       # GET por ID
http://localhost:3001/api/scrape-specific       # POST coletar

# APIs - Notícias
http://localhost:3001/api/noticias              # GET todas
http://localhost:3001/api/noticias/[id]         # GET por ID
http://localhost:3001/api/scrape-news           # GET/POST coletar

# Supabase Dashboard
https://supabase.com/dashboard/project/SEU_PROJETO/editor
https://supabase.com/dashboard/project/SEU_PROJETO/settings/api
```

---

## 📁 Arquivos Importantes

```
# Schemas SQL
lib/supabase/schema-noticias.sql                # Criar tabela notícias
lib/supabase/schema-licitacoes.sql              # Criar tabela licitações

# Configuração
.env.local                                       # Credenciais Supabase
.env.example                                     # Template de .env

# Queries
lib/supabase/queries.ts                          # Todas as queries

# Scrapers
lib/scrapers/news-parser.ts                      # Parser de notícias
lib/scrapers/specific-parser.ts                  # Parser de licitações

# IA
lib/ai/categorizer.ts                            # Categorizador NLP

# Scripts
validar-sistema.ps1                              # Validação completa
test-noticias.ps1                                # Testes automatizados

# Documentação
README.md                                        # Overview do projeto
RESUMO-EXECUTIVO.md                              # Resumo completo
INICIO-RAPIDO-NOTICIAS.md                        # Quick start
COMO-TESTAR-NOTICIAS.md                          # Guia de testes
SISTEMA-NOTICIAS-IA.md                           # Arquitetura técnica
GUIA-NAVEGACAO.md                                # Fluxo de páginas
```

---

## 🔧 Git Úteis

```bash
# Status
git status

# Adicionar todos os arquivos
git add .

# Commit
git commit -m "feat: adicionar sistema de notícias com IA"

# Push
git push origin main

# Ver histórico
git log --oneline

# Ver diferenças
git diff

# Ignorar arquivos
# Adicione em .gitignore:
.env.local
node_modules/
.next/
```

---

## 📦 NPM/Package.json

```bash
# Instalar todas as dependências
npm install

# Instalar dependência específica
npm install @supabase/supabase-js
npm install cheerio axios
npm install recharts lucide-react

# Remover dependência
npm uninstall nome-pacote

# Atualizar dependências
npm update

# Verificar vulnerabilidades
npm audit

# Corrigir vulnerabilidades
npm audit fix

# Limpar cache
npm cache clean --force
```

---

## 🐛 Debug

```bash
# Ver logs do servidor
npm run dev
# Logs aparecerão no terminal

# Verificar erros de build
npm run build
# Mostra erros de TypeScript

# Testar em modo produção
npm run build
npm start

# Verificar porta em uso (Windows)
netstat -ano | findstr :3001

# Matar processo na porta 3001 (Windows)
# Encontre o PID: netstat -ano | findstr :3001
# Mate o processo: taskkill /PID [PID] /F
```

---

## 📊 Performance

```powershell
# Medir tempo de coleta
Measure-Command { 
  curl "http://localhost:3001/api/scrape-news?sre=barbacena&pages=1" 
}

# Contar linhas de código
Get-ChildItem -Recurse -Include *.ts,*.tsx,*.sql | 
  Get-Content | 
  Measure-Object -Line
```

---

## 🔐 Segurança

```bash
# Nunca commite .env.local!
# Adicione ao .gitignore:
echo ".env.local" >> .gitignore

# Gere novas chaves no Supabase se expostas
# Settings > API > Reset keys

# Use variáveis de ambiente na Vercel
# Project Settings > Environment Variables
```

---

## 📱 Deploy (Vercel)

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Deploy em produção
vercel --prod

# Ver logs
vercel logs

# Configurar variáveis
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
```

---

## 🎯 Comandos Mais Usados (Top 10)

```powershell
# 1. Iniciar servidor
npm run dev

# 2. Validar sistema
.\validar-sistema.ps1

# 3. Coletar notícias (teste)
curl "http://localhost:3001/api/scrape-news?sre=barbacena&pages=2"

# 4. Listar notícias
curl "http://localhost:3001/api/noticias"

# 5. Coletar licitações
curl "http://localhost:3001/api/scrape-specific?count=3"

# 6. Abrir dashboard notícias
start http://localhost:3001/noticias

# 7. Abrir dashboard licitações
start http://localhost:3001/dashboard

# 8. Ver status git
git status

# 9. Build de produção
npm run build

# 10. Rodar testes
.\test-noticias.ps1
```

---

## 💾 Backup

```powershell
# Backup de notícias (JSON)
curl "http://localhost:3001/api/noticias?limit=10000" > backup-noticias-$(Get-Date -Format "yyyyMMdd-HHmmss").json

# Backup de licitações (JSON)
curl "http://localhost:3001/api/licitacoes" > backup-licitacoes-$(Get-Date -Format "yyyyMMdd-HHmmss").json
```

---

## 📚 Referências Rápidas

### Categorias IA (8):
1. Licitações e Compras
2. Processos Seletivos
3. Editais de RH
4. Avisos Administrativos
5. Programas Educacionais
6. Eventos
7. Resultados
8. Outros

### Prioridades (3):
- alta
- media
- baixa

### Sentimentos (3):
- positivo
- neutro
- negativo

### Entidades (6 tipos):
- datas_importantes
- valores_financeiros
- pessoas
- instituicoes
- locais
- processos

---

**⚡ Use Ctrl+F para buscar rapidamente nesta página!**
