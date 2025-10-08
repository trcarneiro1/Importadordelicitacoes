# 🤖 GUIA: Enriquecimento com IA - FASE 2

## ✅ O QUE FOI IMPLEMENTADO

### 1. **Cliente OpenRouter** (`lib/openrouter/client.ts`)
- ✅ Integração completa com API do OpenRouter
- ✅ Suporte a JSON mode (garante resposta válida)
- ✅ Rate limiting e retry logic
- ✅ Logging de uso de tokens
- ✅ Modelo padrão: `x-ai/grok-2-1212` (Grok-4-fast)

### 2. **Agente de Enriquecimento** (`lib/agents/enrichment-agent.ts`)
- ✅ Prompt engineering otimizado para licitações brasileiras
- ✅ Extração de 15+ campos estruturados:
  - 🏫 Escola beneficiada
  - 📍 Município da escola
  - 📦 Categoria principal + secundárias
  - 📝 Itens principais (top 5)
  - 🔍 Palavras-chave para busca
  - 🏢 Tipo de fornecedor (MEI/ME/EPP/Grande)
  - ⭐ Score de relevância (0-100)
  - 📊 Complexidade (baixa/média/alta)
  - 📄 Resumo executivo
  - 📱 Contatos (responsável/email/telefone)

### 3. **Endpoints da API**
- ✅ `POST /api/process-ia` - Processar licitações em batch
- ✅ `GET /api/process-ia?action=stats` - Estatísticas de processamento
- ✅ `GET /api/process-ia` - Listar licitações pendentes
- ✅ `GET /api/test-ia?id=uuid` - Testar uma única licitação

### 4. **GitHub Action** (`.github/workflows/enrich-daily.yml`)
- ✅ Execução automática diária às 7:30 AM BRT
- ✅ Processamento de 100 licitações por dia
- ✅ Execução manual via workflow_dispatch
- ✅ Retry e timeout configurados

---

## 🚀 COMO TESTAR

### Passo 1: Verificar Licitações Pendentes ⏱️ 30 segundos

```powershell
# Listar licitações que precisam ser processadas
Start-Process "http://localhost:3001/api/process-ia"
```

**Resultado esperado:**
```json
{
  "success": true,
  "total": 48,
  "licitacoes": [
    {
      "id": "uuid-123",
      "numero_edital": "02/2025",
      "objeto": "Aquisição de gêneros alimentícios...",
      "sre_source": "Barbacena",
      "created_at": "2025-10-07"
    }
  ]
}
```

### Passo 2: Testar Uma Licitação Individual ⏱️ 5-10 segundos

```powershell
# Copie um ID da lista anterior e teste
Start-Process "http://localhost:3001/api/test-ia?id=SEU_ID_AQUI"
```

**Resultado esperado:**
```json
{
  "success": true,
  "duration_ms": 8500,
  "original": {
    "id": "uuid",
    "numero_edital": "02/2025",
    "objeto": "Aquisição de gêneros alimentícios..."
  },
  "enriched": {
    "escola": "E.E. Padre João Silva",
    "municipio_escola": "Barbacena",
    "categoria_principal": "alimentacao",
    "categorias_secundarias": ["merenda"],
    "itens_principais": [
      "Arroz tipo 1",
      "Feijão preto",
      "Óleo de soja",
      "Açúcar cristal",
      "Sal refinado"
    ],
    "palavras_chave": ["alimentos", "merenda", "escola", "gêneros"],
    "fornecedor_tipo": "ME",
    "score_relevancia": 85,
    "resumo_executivo": "Fornecimento de gêneros alimentícios não perecíveis...",
    "complexidade": "baixa"
  }
}
```

### Passo 3: Processar em Batch (10 licitações) ⏱️ 1-2 minutos

```powershell
# PowerShell
$body = @{ limit = 10 } | ConvertTo-Json
Invoke-WebRequest -Uri "http://localhost:3001/api/process-ia" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing | Select-Object -ExpandProperty Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
```

**OU via curl:**
```bash
curl -X POST http://localhost:3001/api/process-ia \
  -H "Content-Type: application/json" \
  -d '{"limit": 10}'
```

**Resultado esperado:**
```json
{
  "success": true,
  "message": "Processed 10 licitacoes",
  "stats": {
    "processed": 10,
    "success": 10,
    "failed": 0,
    "success_rate": 100
  },
  "results": [
    {
      "id": "uuid-1",
      "success": true,
      "escola": "E.E. João Silva",
      "categoria": "alimentacao"
    }
  ]
}
```

### Passo 4: Ver Estatísticas ⏱️ 5 segundos

```powershell
Start-Process "http://localhost:3001/api/process-ia?action=stats"
```

**Resultado esperado:**
```json
{
  "success": true,
  "stats": {
    "total": 48,
    "processadas": 10,
    "pendentes": 38,
    "taxa_processamento": 21,
    "por_categoria": [
      { "categoria": "alimentacao", "count": 5 },
      { "categoria": "limpeza", "count": 3 },
      { "categoria": "materiais_escolares", "count": 2 }
    ]
  }
}
```

### Passo 5: Verificar Dados no Prisma Studio ⏱️ 2 minutos

```powershell
npm run prisma:studio
```

1. Abra http://localhost:5555
2. Navegue para tabela `licitacoes`
3. Filtre por `processado_ia = true`
4. Verifique campos preenchidos:
   - ✅ escola
   - ✅ municipio_escola
   - ✅ categoria_principal
   - ✅ score_relevancia
   - ✅ resumo_executivo

---

## 📊 VALIDAÇÃO DOS DADOS

### Campos Obrigatórios Preenchidos:
- ✅ `escola` (ou null se não houver)
- ✅ `categoria_principal` (sempre preenchido)
- ✅ `score_relevancia` (0-100)
- ✅ `complexidade` (baixa/média/alta)
- ✅ `processado_ia` = true
- ✅ `processado_ia_at` (timestamp)

### Campos Arrays:
- ✅ `categorias_secundarias[]`
- ✅ `itens_principais[]` (máx 5)
- ✅ `palavras_chave[]`

### Campos Opcionais:
- 📧 `contato_email`
- 📱 `contato_telefone`
- 👤 `contato_responsavel`
- 📦 `itens_detalhados` (JSON)

---

## 💰 CUSTO ESTIMADO (OpenRouter)

### Modelo: x-ai/grok-2-1212
- **Input**: ~$2.00 / 1M tokens
- **Output**: ~$10.00 / 1M tokens

### Por Licitação:
- Prompt: ~800 tokens
- Resposta: ~400 tokens
- **Custo**: ~$0.006 por licitação (menos de 1 centavo!)

### Processamento Diário (100 licitações):
- **Custo**: ~$0.60/dia
- **Mensal**: ~$18.00/mês
- **Anual**: ~$216/ano

**Muito acessível para o valor agregado!** 🎯

---

## 🔧 TROUBLESHOOTING

### Erro: "OPENROUTER_API_KEY not found"
```powershell
# Verifique se está no .env.local
cat .env.local | Select-String "OPENROUTER"

# Se não estiver, adicione:
# OPENROUTER_API_KEY=sk-or-v1-...
```

### Erro: "Invalid JSON response"
- ✅ JSON mode está habilitado no cliente
- ✅ Modelo Grok-2-1212 suporta JSON nativo
- ✅ Fallback: tentar novamente com retry

### Erro: "Rate limit exceeded"
- ✅ Rate limiting de 500ms entre requests
- ✅ Reduzir limit no batch
- ✅ Verificar créditos na conta OpenRouter

### Licitações sem dados enriquecidos
- Verificar se `objeto` não está vazio
- Verificar qualidade do texto em `raw_data`
- Aumentar `max_tokens` se resposta for truncada

---

## 📅 PRÓXIMOS PASSOS

### ✅ HOJE - Validar Enriquecimento
1. Testar com 1 licitação (`/api/test-ia`)
2. Processar 10 licitações (`POST /api/process-ia`)
3. Validar dados no Prisma Studio
4. Verificar qualidade dos dados extraídos

### 🔜 AMANHÃ - Refinar Prompt
1. Analisar resultados
2. Ajustar categorias se necessário
3. Melhorar extração de contatos
4. Otimizar score de relevância

### 📅 SEMANA QUE VEM - Automação
1. Configurar GitHub Action
2. Adicionar secrets no repositório:
   - `DATABASE_URL`
   - `OPENROUTER_API_KEY`
   - `VERCEL_URL`
3. Testar execução manual
4. Habilitar cron diário

---

## 🎯 QUALIDADE ESPERADA

### Score de Relevância:
- **80-100**: Licitação clara, valor alto, fácil fornecimento
- **60-79**: Licitação média, alguns detalhes
- **40-59**: Licitação complexa ou pouco detalhada
- **0-39**: Licitação confusa ou incompleta

### Categorias Mais Comuns:
1. 🍽️ `alimentacao` (merenda escolar)
2. 🧹 `limpeza` (produtos de higiene)
3. 📚 `materiais_escolares` (cadernos, canetas)
4. 🏢 `materiais_escritorio` (papelaria)
5. 👕 `uniformes` (roupas escolares)

### Tipo de Fornecedor:
- **MEI**: Licitações simples, baixo valor
- **ME**: Maioria das licitações (ideal para pequenas empresas)
- **EPP**: Licitações médias/grandes
- **Grande**: Obras, serviços complexos

---

## 📞 SUPORTE

**Dúvidas sobre:**
- **OpenRouter**: https://openrouter.ai/docs
- **Prisma**: https://www.prisma.io/docs
- **Grok**: https://x.ai/

---

**Implementado em**: 08/10/2025  
**Status**: ✅ PRONTO PARA TESTAR  
**Tempo de implementação**: ~2 horas  
**Arquivos criados**: 5  
**Linhas de código**: ~600
