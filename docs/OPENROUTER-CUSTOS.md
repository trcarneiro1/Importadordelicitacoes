# 🤖 OpenRouter Integration - Custos e Modelos

## Visão Geral

O sistema agora usa **OpenRouter** para categorização avançada de notícias com LLMs reais (GPT-4, Claude, Gemini, etc), mantendo fallback para NLP local em caso de falha ou ausência de API key.

## 📊 Modelos Disponíveis e Custos

### Recomendados para Produção

| Modelo | ID | Custo (1M tokens) | Velocidade | Precisão | Use Quando |
|--------|----|--------------------|------------|----------|------------|
| **GPT-4o Mini** | `openai/gpt-4o-mini` | $0.15 input / $0.60 output | ⚡⚡⚡ | 🎯🎯🎯🎯 | **Melhor custo-benefício (recomendado)** |
| **Claude 3 Haiku** | `anthropic/claude-3-haiku` | $0.25 input / $1.25 output | ⚡⚡⚡ | 🎯🎯🎯🎯 | Textos longos, análises detalhadas |
| **Llama 3.1 70B** | `meta-llama/llama-3.1-70b-instruct` | $0.52 input / $0.75 output | ⚡⚡ | 🎯🎯🎯 | Open source, baixo custo |

### Alta Precisão (Uso Esporádico)

| Modelo | ID | Custo (1M tokens) | Velocidade | Precisão | Use Quando |
|--------|----|--------------------|------------|----------|------------|
| **GPT-4o** | `openai/gpt-4o` | $2.50 input / $10.00 output | ⚡⚡ | 🎯🎯🎯🎯🎯 | Análises críticas, alta precisão necessária |
| **Claude 3.5 Sonnet** | `anthropic/claude-3.5-sonnet` | $3.00 input / $15.00 output | ⚡⚡ | 🎯🎯🎯🎯🎯 | Textos complexos, análises profundas |
| **Gemini Pro 1.5** | `google/gemini-pro-1.5` | $1.25 input / $5.00 output | ⚡⚡⚡ | 🎯🎯🎯🎯 | Contextos muito longos |

---

## 💰 Estimativa de Custos

### Cenário Típico: Importação de Notícias

**Premissas:**
- 1 notícia = ~500 palavras = ~650 tokens input
- Resposta IA = ~300 tokens output
- Total por notícia: **~950 tokens**

### Custos por Volume (GPT-4o Mini - Recomendado)

| Volume | Tokens Totais | Custo Estimado |
|--------|---------------|----------------|
| **10 notícias** | 9.500 | **$0.004** (~R$ 0,02) |
| **100 notícias** | 95.000 | **$0.038** (~R$ 0,19) |
| **1.000 notícias** | 950.000 | **$0.38** (~R$ 1,90) |
| **10.000 notícias** | 9.500.000 | **$3.80** (~R$ 19,00) |

### Comparação de Custos entre Modelos (1.000 notícias)

| Modelo | Custo | vs GPT-4o Mini |
|--------|-------|----------------|
| GPT-4o Mini | $0.38 | - (baseline) |
| Claude 3 Haiku | $0.61 | +61% |
| Llama 3.1 70B | $0.57 | +50% |
| Gemini Pro 1.5 | $2.50 | +558% 🔴 |
| GPT-4o | $6.00 | +1.479% 🔴🔴 |
| Claude 3.5 Sonnet | $7.20 | +1.795% 🔴🔴🔴 |

---

## ⚙️ Configuração

### 1. Obter API Key

1. Acesse: https://openrouter.ai/
2. Crie conta e vá em **Keys**
3. Gere uma nova API key
4. Adicione créditos (mínimo $5)

### 2. Configurar Ambiente

Edite `.env.local`:

```env
# OpenRouter API (opcional - se ausente, usa NLP local)
OPENROUTER_API_KEY=sk-or-v1-sua-chave-aqui

# Modelo padrão (recomendado: gpt-4o-mini)
OPENROUTER_DEFAULT_MODEL=openai/gpt-4o-mini

# Fallback automático para NLP local em caso de erro
OPENROUTER_FALLBACK_TO_LOCAL=true
```

---

## 🚀 Uso da API

### Endpoint: `/api/scrape-news`

#### Parâmetros de Query

| Parâmetro | Tipo | Padrão | Descrição |
|-----------|------|--------|-----------|
| `count` | number | 5 | Número de SREs a processar |
| `sre` | string | - | Processar SRE específica (ex: "barbacena") |
| `pages` | number | 3 | Páginas de notícias por SRE |
| `modelo` | string | (env) | Modelo LLM a usar |
| `forcar_local` | boolean | false | Forçar uso de NLP local |

#### Exemplos de Uso

**1. Coleta padrão (OpenRouter + fallback):**
```bash
curl "http://localhost:3001/api/scrape-news?sre=barbacena&pages=2"
```

**2. Com modelo específico:**
```bash
curl "http://localhost:3001/api/scrape-news?sre=barbacena&modelo=anthropic/claude-3-haiku"
```

**3. Forçar NLP local (sem custo):**
```bash
curl "http://localhost:3001/api/scrape-news?sre=barbacena&forcar_local=true"
```

**4. Testar múltiplas SREs:**
```bash
curl "http://localhost:3001/api/scrape-news?count=10&pages=1&modelo=openai/gpt-4o-mini"
```

#### Response (Exemplo)

```json
{
  "success": true,
  "resumo": {
    "sres_processadas": 1,
    "noticias_coletadas": 15,
    "noticias_categorizadas": 15,
    "noticias_salvas_banco": 15,
    "tempo_total_ms": 12500
  },
  "metricas_ia": {
    "via_openrouter": 10,
    "via_cache": 3,
    "via_nlp_local": 2,
    "tokens_totais": 14250,
    "custo_total_usd": 0.0057,
    "modelo_usado": "openai/gpt-4o-mini",
    "taxa_cache": 0.20
  }
}
```

---

## 📈 Sistema de Cache

O sistema implementa cache automático via **UNIQUE constraint** no banco:

```sql
UNIQUE(noticia_id, modelo)
```

### Benefícios do Cache:

- ✅ **Não reprocessa** notícias já analisadas
- ✅ **Economia de custos** (taxa de cache típica: 30-50%)
- ✅ **Resposta instantânea** para análises cacheadas
- ✅ **Comparação de modelos** (mesma notícia, modelos diferentes)

### Exemplo de Economia:

**Sem cache:**
- 100 notícias x $0.0004 = **$0.04**

**Com cache (40% hit rate):**
- 60 notícias novas x $0.0004 = **$0.024**
- 40 notícias cacheadas = **$0.00**
- **Total: $0.024 (economia de 40%)**

---

## 🔍 Monitoramento de Custos

### 1. Estatísticas Gerais (últimos 30 dias)

```typescript
import { getEstatisticasIA } from '@/lib/supabase/queries';

const stats = await getEstatisticasIA(30);

console.log(`
Total de análises: ${stats.total_analises}
Modelos usados: ${stats.modelos_usados.join(', ')}
Tokens totais: ${stats.tokens_totais.toLocaleString()}
Custo total: $${stats.custo_total_usd.toFixed(4)}
Custo médio/análise: $${stats.custo_medio_usd.toFixed(6)}
Taxa de sucesso: ${(stats.taxa_sucesso * 100).toFixed(1)}%
`);
```

### 2. Custos por Modelo

```typescript
import { getCustosPorModelo } from '@/lib/supabase/queries';

const custos = await getCustosPorModelo();

custos.forEach(c => {
  console.log(`
${c.modelo}:
  Análises: ${c.total_analises}
  Tokens: ${c.tokens_totais.toLocaleString()}
  Custo total: $${c.custo_total.toFixed(4)}
  Custo médio: $${c.custo_medio.toFixed(6)}
  Taxa sucesso: ${c.taxa_sucesso_pct.toFixed(1)}%
  `);
});
```

### 3. Queries SQL Diretas

```sql
-- Custo total últimos 7 dias
SELECT 
  COUNT(*) as total_analises,
  SUM(tokens_total) as tokens_totais,
  SUM(custo_usd) as custo_total_usd,
  AVG(custo_usd) as custo_medio_usd,
  AVG(tempo_processamento_ms) as tempo_medio_ms
FROM noticias_analises_ia
WHERE created_at >= NOW() - INTERVAL '7 days'
  AND status = 'sucesso';

-- Top 10 notícias mais caras
SELECT 
  n.titulo,
  a.modelo,
  a.tokens_total,
  a.custo_usd,
  a.tempo_processamento_ms
FROM noticias_analises_ia a
JOIN noticias n ON a.noticia_id = n.id
WHERE a.status = 'sucesso'
ORDER BY a.custo_usd DESC
LIMIT 10;

-- Taxa de cache diária
SELECT 
  DATE(created_at) as dia,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE tempo_processamento_ms < 100) as provavel_cache,
  ROUND(
    COUNT(*) FILTER (WHERE tempo_processamento_ms < 100)::numeric / COUNT(*) * 100,
    1
  ) as taxa_cache_pct
FROM noticias_analises_ia
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY dia DESC;
```

---

## 🎯 Estratégias de Otimização

### 1. **Escolha do Modelo Correto**

```typescript
// Produção: custo-benefício
modelo: 'openai/gpt-4o-mini'

// Desenvolvimento/testes: grátis
forcar_local: true

// Análises críticas: alta precisão
modelo: 'anthropic/claude-3.5-sonnet'
```

### 2. **Limitar Conteúdo Enviado**

O sistema já limita conteúdo para 3000 caracteres (~750 tokens):

```typescript
Conteúdo: ${conteudo.substring(0, 3000)}
```

Para economizar mais, reduza para 2000:

```typescript
// Em lib/ai/openrouter-client.ts, linha ~70
conteudo.substring(0, 2000)
```

### 3. **Batch Processing Inteligente**

```typescript
// Processar em horários de baixa carga
// Rate limit: 500ms entre requests (2 req/s)

// Para grandes volumes, usar filas (ex: Bull/BullMQ)
```

### 4. **Reutilizar Cache ao Máximo**

```typescript
// Reprocessar SRE sem forçar: usa cache
curl "/api/scrape-news?sre=barbacena"

// Verificar análises existentes antes de reprocessar
const analise = await getAnaliseIA(noticiaId, modelo);
if (analise) {
  console.log('✅ Cache hit');
  return analise;
}
```

---

## 🚨 Limites e Avisos

### Rate Limits OpenRouter:

- **Free tier**: 10 req/min
- **Paid ($5+)**: 200 req/min
- **Sistema implementa**: 500ms entre requests (respeitando limites)

### Erros Comuns:

| Erro | Causa | Solução |
|------|-------|---------|
| `401 Unauthorized` | API key inválida | Verificar `.env.local` |
| `429 Too Many Requests` | Rate limit excedido | Aguardar 60s ou aumentar delay |
| `500 Internal Error` | Modelo indisponível | Trocar modelo ou usar fallback |
| `insufficient_quota` | Créditos esgotados | Adicionar créditos no OpenRouter |

---

## 📝 Fallback Strategy

O sistema possui **3 níveis de fallback**:

```
1. OpenRouter API (modelo especificado)
   ↓ (falha)
2. OpenRouter API (modelo padrão: gpt-4o-mini)
   ↓ (falha)
3. NLP Local (regex + heurísticas)
```

**Vantagens:**
- ✅ Sistema nunca para
- ✅ Degrada gracefully
- ✅ Logs completos de fallbacks
- ✅ Tracking de status ('sucesso', 'erro', 'timeout')

---

## 📊 Dashboards e Relatórios

### View Supabase: `noticias_com_analise_ia`

Todas as notícias com análise IA incluída:

```sql
SELECT * FROM noticias_com_analise_ia
WHERE modelo = 'openai/gpt-4o-mini'
ORDER BY data_analise DESC
LIMIT 50;
```

### View: `custos_por_modelo`

Análise financeira por modelo:

```sql
SELECT * FROM custos_por_modelo
ORDER BY custo_total DESC;
```

### Function: `estatisticas_uso_ia(dias)`

Métricas agregadas:

```sql
SELECT * FROM estatisticas_uso_ia(7); -- Últimos 7 dias
```

---

## 🔗 Recursos Úteis

- **OpenRouter Dashboard**: https://openrouter.ai/dashboard
- **OpenRouter Docs**: https://openrouter.ai/docs
- **Pricing Calculator**: https://openrouter.ai/models
- **Status Page**: https://status.openrouter.ai/

---

## ✅ Checklist de Deploy

- [ ] Configurar `OPENROUTER_API_KEY` em produção
- [ ] Executar `schema-openrouter.sql` no Supabase
- [ ] Adicionar créditos ($10-50 recomendado)
- [ ] Testar com 1 SRE primeiro
- [ ] Monitorar custos diariamente (primeiros 7 dias)
- [ ] Configurar alertas de custo (> $1/dia)
- [ ] Documentar modelo escolhido
- [ ] Setup backup de análises (exports mensais)

---

**Última atualização:** $(date +%Y-%m-%d)  
**Modelo recomendado:** `openai/gpt-4o-mini` ($0.15/1M tokens)  
**Custo estimado mensal:** $5-20 (depende do volume)
