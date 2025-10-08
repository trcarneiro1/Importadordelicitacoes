# 🚀 Orquestrador de Scraping - Guia de Uso

## ✅ O que foi criado

### 1. **Orquestrador** (`lib/scrapers/orchestrator.ts`)
Coordena o scraping de todas as 47 SREs com:
- ✅ Retry logic (2 tentativas)
- ✅ Rate limiting (2s entre requests)
- ✅ Logs automáticos no Supabase
- ✅ Atualização de status das SREs
- ✅ Suporte a múltiplas URLs por SRE
- ✅ Tratamento de casos especiais (Google Sites, etc)

### 2. **API de Teste** (`/api/test-scraper`)
Endpoint para testar scraping via HTTP

### 3. **Script CLI** (`scripts/test-scraper.js`)
Script para testes via terminal (requer compilação)

---

## 🧪 Como Testar

### Método 1: Via API (Recomendado)

**Servidor já está rodando em:** `http://localhost:3001`

#### Testar uma SRE:
```bash
# Windows PowerShell
Invoke-WebRequest "http://localhost:3001/api/test-scraper?sre=6"

# Ou abra no navegador:
http://localhost:3001/api/test-scraper?sre=6
```

#### Testar múltiplas SREs:
```bash
# Testar Barbacena, Curvelo e Juiz de Fora
http://localhost:3001/api/test-scraper?sre=6,13,22
```

#### SREs Recomendadas para Teste:
- **6** - Barbacena (Joomla padrão)
- **13** - Curvelo (6 URLs diferentes)
- **14** - Diamantina (4 URLs)
- **22** - Juiz de Fora (Google Sites - caso especial)
- **25** - Montes Claros (Joomla padrão)
- **41** - Teófilo Otoni (Joomla + Google Sheets)

---

## 📊 Resposta da API

### Sucesso (1 SRE):
```json
{
  "success": true,
  "result": {
    "sre_code": 6,
    "sre_name": "Barbacena",
    "success": true,
    "licitacoes_found": 15,
    "urls_scraped": 1,
    "duration_seconds": 8,
    "error": null
  }
}
```

### Sucesso (Múltiplas SREs):
```json
{
  "success": true,
  "sres_tested": 3,
  "results": [
    {
      "sre_code": 6,
      "sre_name": "Barbacena",
      "success": true,
      "licitacoes_found": 15,
      "urls_scraped": 1,
      "duration_seconds": 8
    },
    {
      "sre_code": 13,
      "sre_name": "Curvelo",
      "success": true,
      "licitacoes_found": 23,
      "urls_scraped": 6,
      "duration_seconds": 42
    }
  ]
}
```

### Erro:
```json
{
  "error": "Invalid SRE code. Must be between 1 and 47."
}
```

---

## 🔍 Verificar Dados Coletados

### Via Supabase SQL Editor:
```sql
-- Ver licitações coletadas recentemente
SELECT 
  sre_source,
  regional,
  COUNT(*) as total,
  MAX(created_at) as ultima_coleta
FROM licitacoes
GROUP BY sre_source, regional
ORDER BY ultima_coleta DESC;

-- Ver logs de scraping
SELECT 
  sre_source,
  status,
  licitacoes_coletadas,
  error_message,
  created_at
FROM scraping_logs
ORDER BY created_at DESC
LIMIT 20;

-- Ver status das SREs
SELECT 
  codigo,
  nome,
  ultima_coleta,
  taxa_sucesso,
  proxima_coleta
FROM sres
WHERE ultima_coleta IS NOT NULL
ORDER BY ultima_coleta DESC;
```

### Via API:
```bash
# Ver licitações coletadas
http://localhost:3001/api/licitacoes

# Ver logs de scraping
http://localhost:3001/api/scraping-logs
```

---

## 🚀 Próximos Passos

### 1. Testar 3 SREs Diversas
Execute agora:
```bash
# No navegador ou PowerShell:
http://localhost:3001/api/test-scraper?sre=6,13,22
```

### 2. Verificar Dados no Supabase
- Acesse Supabase → Table Editor → `licitacoes`
- Verifique se há novos registros com `sre_code = 6, 13, 22`

### 3. Criar GitHub Action
Após validar que funciona:
```yaml
# .github/workflows/scrape-daily.yml
name: Daily Scraping
on:
  schedule:
    - cron: '0 6 * * *'  # 6 AM BRT todos os dias
  workflow_dispatch:

jobs:
  scrape:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run scrape:all
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_KEY }}
```

### 4. Agente de Enriquecimento IA
Criar `lib/agents/enrichment-agent.ts` para:
- Extrair escola, município, itens
- Gerar score de relevância
- Criar resumo executivo
- Popular campos B2B

---

## 📝 Notas Técnicas

### Rate Limiting
- 2 segundos entre cada URL
- Para SREs com múltiplas URLs (Curvelo = 6 URLs), leva ~12s

### Retry Logic
- 2 tentativas automáticas
- Espera 5s antes de retry
- Salva erro no banco após falhas

### Casos Especiais
- **Google Sites** (Juiz de Fora): Retorna erro "not yet supported"
- **Google Sheets** (Teófilo Otoni): Scraping parcial (apenas site Joomla)
- **Múltiplas URLs** (Curvelo, Diamantina): Scraping sequencial de todas

### Performance
- **1 SRE**: ~8-10 segundos
- **10 SREs**: ~2-3 minutos
- **47 SREs**: ~10-15 minutos (com rate limiting)

---

## 🐛 Troubleshooting

### Erro: "Missing Supabase credentials"
Verifique `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
```

### Erro: "Failed to fetch SREs"
Execute primeiro:
```bash
npm run import:sres
```

### Nenhuma licitação encontrada
- Normal para sites vazios ou fora do ar
- Verifique logs: `SELECT * FROM scraping_logs ORDER BY created_at DESC;`

### Timeout
- Aumente timeout no `fetch()` (atualmente 30s padrão)
- Ou reduza número de SREs testadas

---

## ✅ Status Atual

- [x] Orquestrador criado
- [x] API de teste criada
- [x] Servidor dev rodando
- [ ] **AGORA:** Testar com 3 SREs (6, 13, 22)
- [ ] Validar dados no Supabase
- [ ] Criar GitHub Action
- [ ] Criar agente de enriquecimento IA

---

## 🎯 Teste Agora!

Abra no navegador:
```
http://localhost:3001/api/test-scraper?sre=6
```

Ou teste múltiplas:
```
http://localhost:3001/api/test-scraper?sre=6,25,40
```

Aguarde 10-30 segundos e verifique a resposta JSON! 🚀
