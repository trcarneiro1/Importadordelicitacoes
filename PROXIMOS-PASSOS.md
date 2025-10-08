# 🎯 PRÓXIMOS PASSOS - Importador de Licitações

## 📊 SITUAÇÃO ATUAL

✅ **Concluído:**
- Prisma ORM instalado e configurado
- Schema com 5 tabelas (sres, licitacoes, scraping_logs, noticias, user_alerts)
- Database conectada ao Supabase PostgreSQL
- Setup executado: colunas adicionadas, índices criados
- Orchestrator refatorado com Prisma (type-safe)
- Servidor rodando em http://localhost:3001

⏳ **Pendente:**
- Validar scraping funcionando com Prisma
- Testar múltiplas SREs
- Verificar dados salvos no banco

---

## 🚀 FASE 1: VALIDAÇÃO DO SCRAPING (HOJE)

### Passo 1.1: Testar Scraping Individual ⏱️ 2 min
```powershell
# Teste simples - SRE 6 (Barbacena)
Start-Process "http://localhost:3001/api/test-scraper?sre=6"
```

**Resultado esperado:**
```json
{
  "success": true,
  "result": {
    "sre_code": 6,
    "sre_name": "Barbacena",
    "success": true,
    "licitacoes_found": 4,
    "duration_ms": 8000,
    "urls_scraped": 1
  }
}
```

**Se falhar:** Verificar logs do servidor no terminal

### Passo 1.2: Verificar Dados no Supabase ⏱️ 3 min
```sql
-- No Supabase SQL Editor
SELECT 
  numero_edital,
  objeto,
  sre_code,
  regional,
  data_publicacao,
  created_at
FROM licitacoes
WHERE sre_code = 6
ORDER BY created_at DESC
LIMIT 10;
```

**OU usar Prisma Studio:**
```powershell
npm run prisma:studio
```
Abre UI visual em http://localhost:5555

### Passo 1.3: Testar Múltiplas SREs ⏱️ 5 min
```powershell
# Teste com 3 SREs diferentes
Start-Process "http://localhost:3001/api/test-scraper?sre=6,13,25"
```

**Validar:**
- ✅ 3 SREs processadas
- ✅ Total de licitações > 0
- ✅ Logs criados em `scraping_logs`
- ✅ Status das SREs atualizado

### Passo 1.4: Verificar Logs de Scraping ⏱️ 2 min
```sql
-- Verificar últimos logs
SELECT 
  sre_code,
  sre_source,
  status,
  licitacoes_coletadas,
  execution_time_ms,
  started_at,
  error_message
FROM scraping_logs
ORDER BY started_at DESC
LIMIT 20;
```

---

## 🤖 FASE 2: AGENTE DE ENRIQUECIMENTO IA (1-2 DIAS)

### Objetivo
Processar licitações brutas e extrair dados estruturados usando **OpenRouter API** (Grok-4-fast).

### Passo 2.1: Criar Agente de Enriquecimento ⏱️ 3 horas
**Arquivo:** `lib/agents/enrichment-agent.ts`

**Funcionalidades:**
- Ler licitações com `processado_ia = false`
- Enviar `objeto` + `raw_data.text` para Grok-4-fast
- Extrair via prompt estruturado:
  - ✅ `escola` (nome da escola)
  - ✅ `municipio_escola`
  - ✅ `categoria_principal` (alimentação, limpeza, materiais, etc)
  - ✅ `categorias_secundarias[]`
  - ✅ `itens_principais[]` (lista de produtos/serviços)
  - ✅ `palavras_chave[]`
  - ✅ `fornecedor_tipo` (MEI, ME, EPP, grande empresa)
  - ✅ `score_relevancia` (0-100)
  - ✅ `resumo_executivo` (2-3 linhas)
  - ✅ `complexidade` (baixa, média, alta)
- Salvar dados enriquecidos usando `prisma.licitacoes.update()`
- Marcar `processado_ia = true`

**Estrutura do prompt:**
```typescript
const prompt = `
Analise esta licitação e extraia dados estruturados em JSON:

OBJETO: ${licitacao.objeto}
TEXTO COMPLETO: ${licitacao.raw_data?.text}

Retorne JSON no formato:
{
  "escola": "Nome da escola beneficiada",
  "municipio_escola": "Município da escola",
  "categoria_principal": "alimentacao|limpeza|materiais|servicos|obras|outros",
  "categorias_secundarias": ["categoria1", "categoria2"],
  "itens_principais": ["item1", "item2", "item3"],
  "palavras_chave": ["palavra1", "palavra2"],
  "fornecedor_tipo": "MEI|ME|EPP|grande",
  "score_relevancia": 75,
  "resumo_executivo": "Resumo em 2-3 linhas",
  "complexidade": "baixa|media|alta"
}
`;
```

### Passo 2.2: Criar Endpoint de Processamento ⏱️ 1 hora
**Arquivo:** `app/api/process-ia/route.ts`

```typescript
export async function POST(request: Request) {
  const { limit = 50 } = await request.json();
  
  // Buscar licitações pendentes
  const licitacoes = await prisma.licitacoes.findMany({
    where: { processado_ia: false, objeto: { not: null } },
    orderBy: { created_at: 'desc' },
    take: limit
  });
  
  // Processar cada uma
  const results = [];
  for (const lic of licitacoes) {
    const enriched = await enrichLicitacao(lic);
    results.push(enriched);
  }
  
  return Response.json({ processed: results.length, results });
}
```

### Passo 2.3: Testar Enriquecimento ⏱️ 30 min
```powershell
# Processar 10 licitações
curl.exe -X POST http://localhost:3001/api/process-ia -H "Content-Type: application/json" -d "{\"limit\": 10}"
```

### Passo 2.4: Criar GitHub Action para Processamento Diário ⏱️ 1 hora
**Arquivo:** `.github/workflows/enrich-daily.yml`

```yaml
name: Daily IA Enrichment
on:
  schedule:
    - cron: '30 7 * * *'  # 7:30 AM BRT (30 min após scraping)
  workflow_dispatch:

jobs:
  enrich:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm install
      - run: npx prisma generate
      - name: Process licitações
        run: |
          curl -X POST ${{ secrets.VERCEL_URL }}/api/process-ia \
            -H "Content-Type: application/json" \
            -d '{"limit": 100}'
        env:
          OPENROUTER_API_KEY: ${{ secrets.OPENROUTER_API_KEY }}
```

---

## 📱 FASE 3: FRONTEND B2B PARA EMPRESAS (2-3 DIAS)

### Objetivo
Interface para fornecedores buscarem e filtrarem licitações relevantes.

### Passo 3.1: Página de Dashboard ⏱️ 4 horas
**Arquivo:** `app/empresas/page.tsx`

**Componentes:**
- 📊 Cards de estatísticas (total licitações, valor médio, próximas a vencer)
- 📋 Lista de últimas 20 licitações enriquecidas
- 🔍 Barra de busca rápida
- 🗺️ Mapa com distribuição por SRE
- 📈 Gráfico de categorias mais frequentes

### Passo 3.2: Página de Licitações (Lista) ⏱️ 5 horas
**Arquivo:** `app/empresas/licitacoes/page.tsx`

**Filtros:**
- ☑️ Multi-select SREs (47 opções)
- ☑️ Multi-select categorias
- ☑️ Range de valor (R$ 0 - R$ 1.000.000+)
- ☑️ Multi-select municípios
- ☑️ Palavras-chave (busca full-text)
- ☑️ Data de abertura (próximos 7/15/30 dias)
- ☑️ Complexidade (baixa, média, alta)

**Lista:**
- 📄 50 itens por página (paginação)
- 🎯 Score de relevância visível
- 💰 Valor estimado destacado
- 📅 Dias restantes até abertura
- 🏫 Escola + município
- ⭐ Botão "Salvar" (favoritos em localStorage)
- 📥 Botão "Exportar CSV"

### Passo 3.3: Página de Detalhes da Licitação ⏱️ 3 horas
**Arquivo:** `app/empresas/licitacao/[id]/page.tsx`

**Seções:**
- 📋 Dados principais (número, modalidade, objeto)
- 🏫 Dados da escola (nome, município, endereço via IA)
- 📦 Itens principais (lista formatada)
- 💰 Valor estimado + complexidade
- 📅 Cronograma (publicação, abertura, prazo)
- 📎 Documentos para download
- 🏢 Informações para contato
- 🤖 Resumo executivo (gerado por IA)
- 🔗 Link para edital original

### Passo 3.4: Sistema de Alertas ⏱️ 4 horas
**Arquivo:** `app/empresas/alertas/page.tsx`

**Funcionalidade:**
- 📧 Cadastro de email + preferências
- 🎯 Definir filtros (mesmos da busca)
- 🔔 Frequência (diário, semanal)
- ✅ Ativar/desativar alertas
- 📊 Histórico de alertas enviados

**Backend:**
- Endpoint: `POST /api/alerts/create`
- Tabela: `user_alerts` (já existe no schema Prisma)
- Processamento: GitHub Action ou Vercel Cron

### Passo 3.5: Componentes Reutilizáveis ⏱️ 2 horas
- `<FiltrosEmpresa>` - Sidebar com todos os filtros
- `<LicitacaoCard>` - Card individual na lista
- `<PaginationBar>` - Controles de paginação
- `<ExportButton>` - Exportar resultados para CSV
- `<ScoreIndicator>` - Badge visual de relevância
- `<ComplexidadeBadge>` - Ícone de complexidade

---

## 🔄 FASE 4: AUTOMAÇÃO COMPLETA (1 DIA)

### Passo 4.1: GitHub Action de Scraping Diário ⏱️ 2 horas
**Arquivo:** `.github/workflows/scrape-daily.yml`

```yaml
name: Daily Scraping
on:
  schedule:
    - cron: '0 6 * * *'  # 6 AM BRT todos os dias
  workflow_dispatch:

jobs:
  scrape:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        batch: [1, 2, 3, 4, 5]  # 5 batches paralelos
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npx prisma generate
      - name: Scrape batch
        run: node scripts/scrape-batch.js ${{ matrix.batch }}
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

**Script:** `scripts/scrape-batch.js`
```javascript
const batch = process.argv[2];
const sresPerBatch = 10;
const start = (batch - 1) * sresPerBatch;
const end = start + sresPerBatch;

// Buscar SREs do batch
const sres = await prisma.sres.findMany({
  where: { ativo: true },
  orderBy: { codigo: 'asc' },
  skip: start,
  take: sresPerBatch
});

// Scrape
for (const sre of sres) {
  await scrapeSRE(sre);
}
```

### Passo 4.2: Monitoramento e Logs ⏱️ 2 horas
- Dashboard em `/admin/logs` mostrando:
  - ✅ Taxa de sucesso por SRE (últimos 7 dias)
  - ✅ Licitações coletadas (gráfico temporal)
  - ✅ Erros recentes
  - ✅ Tempo médio de scraping
  - ✅ SREs com problemas (taxa < 50%)

### Passo 4.3: Notificações de Erro ⏱️ 1 hora
- Integrar com Discord/Slack/Email
- Alertar quando:
  - Taxa de sucesso < 50% por 3 dias
  - Nenhuma licitação coletada em 24h
  - Erro crítico no scraping

---

## 📦 FASE 5: DEPLOY E PRODUÇÃO (1 DIA)

### Passo 5.1: Configurar Vercel ⏱️ 1 hora
```powershell
# Deploy via CLI
npm install -g vercel
vercel --prod
```

**Environment Variables:**
- `DATABASE_URL` (Connection Pooling)
- `OPENROUTER_API_KEY`
- `OPENROUTER_DEFAULT_MODEL=x-ai/grok-4-fast`

### Passo 5.2: Configurar Supabase Produção ⏱️ 1 hora
- Criar project produção (ou usar mesmo)
- Aplicar migrations: `npx prisma migrate deploy`
- Configurar Row Level Security (RLS)
- Backup automático habilitado

### Passo 5.3: Domínio Customizado ⏱️ 30 min
- Configurar DNS (licitacoes-mg.com.br ou similar)
- Certificado SSL automático via Vercel

### Passo 5.4: Testes de Carga ⏱️ 2 horas
- Simular 1000 requisições simultâneas
- Verificar connection pooling
- Otimizar queries lentas
- Adicionar caching (Vercel Edge)

---

## 🎯 PRIORIDADES IMEDIATAS (HOJE)

### ✅ PASSO 1: Validar Scraping (30 min)
```powershell
# 1. Abrir browser
Start-Process "http://localhost:3001/api/test-scraper?sre=6"

# 2. Ver dados
npm run prisma:studio

# 3. Testar múltiplas SREs
Start-Process "http://localhost:3001/api/test-scraper?sre=6,13,25"
```

### ✅ PASSO 2: Criar Agente IA (AMANHÃ - 3h)
- Implementar `lib/agents/enrichment-agent.ts`
- Testar com 10 licitações
- Validar dados enriquecidos

### ✅ PASSO 3: Frontend B2B (SEMANA QUE VEM - 2-3 dias)
- Dashboard empresas
- Lista com filtros
- Página de detalhes
- Sistema de alertas

---

## 📊 CRONOGRAMA COMPLETO

| Fase | Descrição | Tempo | Quando |
|------|-----------|-------|--------|
| ✅ 0 | Prisma ORM | 30 min | **HOJE** ✅ |
| ⏳ 1 | Validação | 30 min | **HOJE** |
| 🔜 2 | Agente IA | 1-2 dias | Amanhã/Sexta |
| 📅 3 | Frontend B2B | 2-3 dias | Semana que vem |
| 📅 4 | Automação | 1 dia | Semana que vem |
| 📅 5 | Deploy | 1 dia | Semana que vem |

**Total**: 5-7 dias úteis para MVP completo

---

## 🚨 AÇÃO IMEDIATA

**Execute AGORA para validar que tudo está funcionando:**

```powershell
# 1. Abrir teste no browser
Start-Process "http://localhost:3001/api/test-scraper?sre=6"

# 2. Ver dados no Prisma Studio
npm run prisma:studio
```

**Se funcionar →** Seguir para Fase 2 (Agente IA)  
**Se falhar →** Debugar logs do servidor e me avisar

---

**Desenvolvido em**: 08/10/2025  
**Status atual**: Prisma implementado ✅ - Aguardando validação
