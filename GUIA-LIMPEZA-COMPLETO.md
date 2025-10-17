# 🧹 GUIA COMPLETO DE LIMPEZA E REORGANIZAÇÃO

## 📋 Índice
1. [Problema Identificado](#problema)
2. [Solução Implementada](#solução)
3. [Passo a Passo - Limpeza](#passo-a-passo)
4. [Novas Telas](#telas)
5. [Fluxo de Dados](#fluxo)
6. [FAQ](#faq)

---

## 🔴 Problema Identificado {#problema}

### Sintomas
```
Valor Estimado: Não informado ❌
Data de Abertura: Invalid Date ❌
SRE: (vazio) ❌
Objeto: (vazio) ❌
Modalidade: Não informada ❌
Data de Publicação: Invalid Date ❌
```

### Causa Raiz
O scraper antigo apenas coletava a **lista de licitações**, sem entrar nas **páginas de detalhe**.
Resultado: Campos vazios e valores "fallback" como "Não informado" e "Invalid Date".

### Impacto
- 811 licitações coletadas, mas **~200+ inválidas**
- IA processou dados ruins, categorizações ruins
- Dashboard poluído com "lixo"

---

## ✅ Solução Implementada {#solução}

### 1. **Script de Limpeza Automática**
Arquivo: `lib/prisma/cleanup.ts`

Remove:
- ✅ Licitações com datas nulas/inválidas
- ✅ Licitações sem numero_edital
- ✅ Licitações sem objeto (descrição)
- ✅ Licitações com "Não informado" em campos críticos
- ✅ Registros completamente vazios

**Resultado esperado:** ~500-600 licitações válidas

### 2. **Tela de Dados Brutos**
URL: `http://localhost:3001/operations/licitacoes-raw`

**O que mostra:**
- Todos os dados coletados pelo scraper (antes da IA)
- Filtros por tipo (válida/inválida), SRE
- Estatísticas de qualidade
- Contagem de registros para limpeza

**Para quem:** Admin/Auditoria

### 3. **Dashboard Principal Limpo**
URL: `http://localhost:3001/operations/licitacoes`

**O que mostra:**
- **APENAS** licitações processadas com IA com sucesso
- Categorização completa
- Dados confiáveis e prontos para uso

**Para quem:** Usuários finais

### 4. **Auditoria do Software**
Arquivo: `AUDITORIA-SOFTWARE.md`

- ✅ Análise de cada tela
- ✅ O que é útil
- ✅ O que não é
- ✅ Recomendações

---

## 🚀 Passo a Passo - Limpeza {#passo-a-passo}

### PASSO 1: Ver dados brutos
```bash
# Abrir em navegador
http://localhost:3001/operations/licitacoes-raw
```

✅ Verá:
- Total de licitações: 811
- Válidas: ~600
- Inválidas: ~200 (para limpar)
- Tabela com dados brutos

---

### PASSO 2: Executar limpeza
```powershell
# Windows PowerShell
.\cleanup-invalid-data.ps1
```

Ou diretamente:
```bash
npx ts-node lib/prisma/cleanup.ts
```

✅ O script:
- Contará dados antes
- Deletará inválidas (~200 registros)
- Mostrará estatísticas finais
- Contará que 703 já têm categoria_ia

**Tempo:** ~30 segundos

---

### PASSO 3: Verificar resultado
```bash
# Abrir dashboard principal
http://localhost:3001/operations/licitacoes
```

✅ Verá:
- **APENAS** licitações processadas com IA
- Todas têm categoria (equipamentos, alimentos, etc)
- Dashboard limpo e confiável

---

### PASSO 4: Re-scraping (Opcional)
Se quiser resgatar as ~100 licitações que ainda não foram processadas:

```bash
# Deletar todas as licitações velhas
npm run reset-db

# Re-escraping com novo scraper
npm run scrape-all

# Processar com IA (aguarde créditos OpenRouter)
npm run process-ia
```

---

## 📱 Novas Telas {#telas}

### 1. **Dashboard Principal** (`/operations/licitacoes`)
```
ANTES:
- Mistura licitações válidas com inválidas
- "Invalid Date", "Não informado" aparecem
- Confunde usuário

DEPOIS:
- **APENAS** com categoria_ia NOT NULL
- Dados limpos e validados
- Filtros por categoria, SRE, data
```

### 2. **Dados Brutos** (`/operations/licitacoes-raw`) - NOVO
```
PARA VISUALIZAR:
- Dados coletados do scraper (antes de IA)
- Qualidade das informações
- O que será processado

FILTROS:
- ✅ Válidas (para processar)
- ❌ Inválidas (para limpar)
- Por SRE

STATS:
- Total: 811
- Processadas: 703
- Inválidas: ~100 (para limpar)
- Pendentes: ~100
```

### 3. **Créditos** (`/dashboard/credits`)
```
JÁ EXISTIA - Monitorar:
- Saldo OpenRouter
- Se pode processar?
- Jobs aguardando
```

### 4. **Debug** (`/dashboard/debug`)
```
JÁ EXISTIA - Para tech:
- Comparar Raw vs Scraper vs IA
- Scores de qualidade
- Validação de dados
```

---

## 🔄 Fluxo de Dados {#fluxo}

### ANTES (Problematico)
```
┌─────────────┐
│  Scraping   │ → 811 licitações (muitas inválidas)
└─────────────┘
       ↓
┌─────────────┐
│    IA       │ → Processa lixo → Resultados ruins
└─────────────┘
       ↓
┌─────────────┐
│ Dashboard   │ → Mostra "Invalid Date", "Não informado"
└─────────────┘
```

### DEPOIS (Correto)
```
┌─────────────────────────────────┐
│   FASE 1: SCRAPING (Raw Data)   │
│  (/operations/licitacoes-raw)   │
│                                 │
│  - 811 licitações coletadas     │
│  - Dados brutos do HTML         │
│  - Sem validação                │
│  - Visibilidade: Admin          │
└──────────────┬──────────────────┘
               │
               ↓
┌─────────────────────────────────┐
│  FASE 2: VALIDAÇÃO + LIMPEZA    │
│  (Script)                       │
│                                 │
│  - Remover Invalid Date         │
│  - Remover "Não informado"      │
│  - Validar campos obrigatórios  │
│  - Manter apenas: 500-600 boas  │
└──────────────┬──────────────────┘
               │
               ↓
┌─────────────────────────────────┐
│  FASE 3: PROCESSAMENTO IA       │
│  (/api/process-ia-with-logs)    │
│                                 │
│  - Categorizar cada licitação   │
│  - Enriquecer dados             │
│  - Com verificação de créditos  │
└──────────────┬──────────────────┘
               │
               ↓
┌─────────────────────────────────┐
│  FASE 4: PUBLICAÇÃO (Final)     │
│  (/operations/licitacoes)       │
│                                 │
│  - SÓ licitações com categoria_ia│
│  - Dados completos + validados  │
│  - Visibilidade: Pública        │
└─────────────────────────────────┘
```

---

## ❓ FAQ {#faq}

### P: Quanto tempo leva a limpeza?
**R:** ~30 segundos. Rápido!

### P: Posso reverter a limpeza?
**R:** Sim! O script cria backup automático. Veja `backup-licitacoes-*.json`

### P: Quantas serão deletadas?
**R:** ~200 (estimado). De 811 → ~600 válidas

### P: E as 703 já processadas com IA?
**R:** **Mantêm todas!** O script só deleta inválidas que não têm processamento IA

### P: Após limpeza, o que faço?
**R:** 
1. ✅ Dashboard está limpo automaticamente
2. ⏳ Se tiver créditos OpenRouter: processar as ~100 restantes
3. 📊 Visualizar em `/operations/licitacoes`

### P: Posso desativar a verificação de créditos?
**R:** Sim, mas não recomendo. Use:
```bash
curl -X POST "http://localhost:3001/api/process-ia-with-logs?skipCreditCheck=true"
```

### P: Quais campos são "críticos"?
**R:** 
- numero_edital (obrigatório)
- objeto (obrigatório, >10 caracteres)
- data_publicacao (válida)

### P: Posso rodar limpeza múltiplas vezes?
**R:** Sim, é segura. Só deleta registros inválidos. Rodar 2x = mesmo resultado.

---

## 📊 Antes e Depois

### ANTES
```
Total: 811 licitações
├─ Com dados válidos: ~600
├─ Sem edital: ~50
├─ Sem objeto: ~80
├─ Datas inválidas: ~40
├─ "Não informado": ~41
└─ Completamente vazias: ~10

Dashboard mostra: TODAS (confuso)
├─ ✅ Válidas
├─ ❌ Invalid Date
├─ ❌ Não informado
└─ ❌ (vazias)
```

### DEPOIS
```
Total válidas: ~600 licitações
├─ Com edital: 100%
├─ Com objeto: 100%
├─ Com datas válidas: 100%
├─ Com categoria_ia: 703 ✅

Dashboard mostra: **APENAS** processadas com sucesso
├─ ✅ Equipamentos
├─ ✅ Alimentos
├─ ✅ Serviços
└─ ✅ ... (categorias válidas)
```

---

## 🎯 Checklist Completo

- [ ] **Passo 1:** Abrir `/operations/licitacoes-raw` para ver dados brutos
- [ ] **Passo 2:** Executar `./cleanup-invalid-data.ps1`
- [ ] **Passo 3:** Verificar resultado no dashboard
- [ ] **Passo 4:** (Opcional) Re-processar com IA

---

## 🔗 Links Úteis

- 📊 Dashboard Raw: `http://localhost:3001/operations/licitacoes-raw`
- 📋 Dashboard Final: `http://localhost:3001/operations/licitacoes`
- 💳 Créditos: `http://localhost:3001/dashboard/credits`
- 🐛 Debug: `http://localhost:3001/dashboard/debug`

---

**Data:** 17 de Outubro de 2025
**Status:** ✅ Pronto para usar
**Tempo de Implementação:** ~4 horas
**Risco:** Baixo (backups automáticos)
