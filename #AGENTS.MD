# 🤖 AGENTS.MD - Guia para Agentes de IA

## 📋 ÍNDICE
1. [Visão Geral do Projeto](#visão-geral-do-projeto)
2. [Arquitetura e Estrutura](#arquitetura-e-estrutura)
3. [Fluxo de Desenvolvimento](#fluxo-de-desenvolvimento)
4. [Segurança e Boas Práticas](#segurança-e-boas-práticas)
5. [Sistema de IA Implementado](#sistema-de-ia-implementado)
6. [Automação e GitHub Actions](#automação-e-github-actions)
7. [Comandos Úteis](#comandos-úteis)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 VISÃO GERAL DO PROJETO

### Objetivo
Sistema de importação e enriquecimento de licitações públicas de instituições educacionais em Minas Gerais usando IA.

### Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Runtime**: Node.js
- **Database**: PostgreSQL (Supabase)
- **ORM**: Prisma
- **IA**: OpenRouter API (Grok-4-fast)
- **Deploy**: Vercel
- **CI/CD**: GitHub Actions
- **Language**: JavaScript/TypeScript

### Fontes de Dados
- **SREs.txt**: 47 URLs de portais regionais de educação
- Padrão: `https://sre{regiao}.educacao.mg.gov.br/`
- Cada portal tem estrutura HTML diferente (scraping adaptativo necessário)

---

## 🏗️ ARQUITETURA E ESTRUTURA

### Estrutura de Pastas
```
/
├── app/
│   ├── api/
│   │   ├── process-ia/          # Processamento batch de IA
│   │   ├── test-ia/             # Teste unitário de enriquecimento
│   │   ├── health/              # Health check
│   │   └── debug-html/          # Debug de parsing HTML
│   ├── dashboard/               # Interface administrativa
│   └── page.tsx                 # Landing page
├── lib/
│   ├── agents/
│   │   └── enrichment-agent.ts  # Agente de enriquecimento IA (378 linhas)
│   ├── openrouter/
│   │   └── client.ts            # Cliente OpenRouter com JSON mode (177 linhas)
│   ├── prisma/
│   │   ├── client.ts            # Prisma Client singleton
│   │   └── schema.prisma        # Schema do banco de dados
│   └── scrapers/
│       ├── orchestrator.ts      # Orquestrador de scraping
│       └── specific-parser.ts   # Parser específico por SRE
├── .github/
│   └── workflows/
│       └── enrich-daily.yml     # GitHub Action para automação diária
├── docs/                        # ⚠️ IGNORADO NO GIT (informações sensíveis)
│   ├── SECURITY-FIX-STEPS.md
│   ├── GITHUB-ACTION-SETUP.md
│   └── [outros 28 arquivos .md]
├── .env.local                   # ⚠️ IGNORADO NO GIT (variáveis sensíveis)
├── .gitignore
├── SREs.txt                     # Lista de 47 URLs fonte
└── #AGENTS.MD                   # 👈 VOCÊ ESTÁ AQUI
```

### Database Schema (Prisma)
```prisma
model licitacoes {
  id                    Int       @id @default(autoincrement())
  sre_source           String
  numero_edital        String?
  modalidade           String?
  objeto               String?
  valor_estimado       Decimal?
  data_publicacao      DateTime?
  data_abertura        DateTime?
  situacao             String?
  documentos           Json?
  raw_data             Json?
  raw_html             String?
  created_at           DateTime  @default(now())
  updated_at           DateTime  @updatedAt
  
  // Campos de enriquecimento IA (Fase 2)
  processado_ia        Boolean   @default(false)
  processado_ia_at     DateTime?
  escola               String?
  municipio_escola     String?
  categoria_principal  String?
  palavras_chave       Json?
  score_relevancia     Int?
  fornecedor_tipo      String?
  valor_estimado_ia    Decimal?
  observacoes_ia       String?
  raw_response_ia      Json?
  erro_ia              String?
}
```

### Fluxo de Dados
```
1. SCRAPING (Fase 1)
   SREs.txt → Orchestrator → Specific Parser → PostgreSQL (raw_data, raw_html)

2. ENRIQUECIMENTO IA (Fase 2)
   PostgreSQL → Enrichment Agent → OpenRouter (Grok-4-fast) → PostgreSQL (campos IA)

3. AUTOMAÇÃO (Fase 3)
   GitHub Actions (7:30 AM BRT) → API /process-ia → Processa 100 licitações → Email Report
```

---

## 🔄 FLUXO DE DESENVOLVIMENTO

### Fases Completas
✅ **Fase 1**: Sistema de scraping (47 SREs)
✅ **Fase 2**: Sistema de enriquecimento IA
⏳ **Fase 3**: Deploy e automação (em andamento)

### Ciclo de Feature Development
1. **Planejamento**: Criar TODO list com `manage_todo_list`
2. **Desenvolvimento**: Implementar código + testes
3. **Verificação**: Executar testes locais (`test-*.ts`)
4. **Documentação**: Criar guia em `/docs` (ignorado no git)
5. **Commit**: Usar conventional commits (`feat:`, `fix:`, `security:`)
6. **Push**: Sempre verificar `git status` antes
7. **Deploy**: Vercel (automático) ou manual

### Conventional Commits
```bash
feat: Nova funcionalidade
fix: Correção de bug
security: Correção de segurança
docs: Documentação
refactor: Refatoração
test: Testes
chore: Tarefas de manutenção
```

---

## 🔒 SEGURANÇA E BOAS PRÁTICAS

### ⚠️ REGRAS CRÍTICAS DE SEGURANÇA

#### 1. **NUNCA EXPOR API KEYS**
❌ **NUNCA FAÇA ISSO:**
```javascript
// ERRADO - Key hardcoded no código
const apiKey = "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";
```

✅ **SEMPRE FAÇA ISSO:**
```javascript
// CORRETO - Usar variável de ambiente
const apiKey = process.env.OPENROUTER_API_KEY;
```

#### 2. **ESTRUTURA DE VARIÁVEIS DE AMBIENTE**

**Arquivo: `.env.local`** (⚠️ NO `.gitignore`)
```bash
# Database
DATABASE_URL=postgresql://postgres:PASSWORD@db.inyrnjdefirzgamnmufi.supabase.co:5432/postgres

# OpenRouter API
OPENROUTER_API_KEY=sk-or-v1-NOVA_KEY_AQUI

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://inyrnjdefirzgamnmufi.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Vercel Environment Variables** (todas as 5 variáveis acima)
- Project Settings → Environment Variables
- Aplicar em: Production, Preview, Development

**GitHub Secrets** (apenas 3 variáveis)
- Settings → Secrets → Actions
- `DATABASE_URL`
- `OPENROUTER_API_KEY`
- `VERCEL_URL`

#### 3. **ARQUIVOS E PASTAS IGNORADOS**
```gitignore
# .gitignore
.env*
.env.local
/docs/              # ⚠️ Documentação com info sensível
node_modules/
.next/
.vercel/
```

#### 4. **DOCUMENTAÇÃO SENSÍVEL**
- ✅ Documentação técnica: `/docs` (ignorado no git)
- ✅ README público: `/README.md` (sem keys/passwords)
- ✅ Guia para agentes: `/#AGENTS.MD` (sem keys/passwords)

#### 5. **CHECKLIST PRÉ-COMMIT**
Antes de `git add .`:
```powershell
# 1. Verificar o que será commitado
git status

# 2. Verificar diff linha por linha
git diff

# 3. Procurar por possíveis exposições
git diff | Select-String -Pattern "sk-or-v1|password|secret|key"

# 4. Se encontrar algo sensível, adicione ao .gitignore ANTES do commit
```

#### 6. **RESPOSTA A INCIDENTES DE SEGURANÇA**

Se uma API key for exposta:
1. ⚡ **IMEDIATAMENTE**: Revogar/deletar a key exposta
2. 🔑 Gerar nova key
3. 📝 Atualizar `.env.local`, Vercel, GitHub Secrets
4. 🧹 Remover arquivos sensíveis do git:
   ```powershell
   git rm --cached arquivo-sensivel.md
   git commit -m "security: Remove exposed credentials"
   git push origin main
   ```
5. 📊 Verificar histórico do git: `git log -p | Select-String "sk-or-v1"`
6. 🔍 Buscar no GitHub: `https://github.com/USER/REPO/search?q=sk-or-v1`

### 🛡️ BOAS PRÁTICAS GERAIS

1. **Code Review Before Commit**
   - Use `git diff` sempre
   - Procure por hardcoded secrets
   - Verifique se `.env.local` não está sendo commitado

2. **Separation of Concerns**
   - Código de produção: `/app`, `/lib`
   - Testes: `test-*.ts` (raiz do projeto)
   - Documentação sensível: `/docs` (ignorado)
   - Documentação pública: `README.md`, `#AGENTS.MD`

3. **Environment-Specific Configuration**
   - Local: `.env.local`
   - Vercel: Dashboard → Environment Variables
   - GitHub Actions: Repository Secrets

4. **Logging and Monitoring**
   - Nunca logar API keys ou passwords
   - Use `console.log` com cuidado em produção
   - Sanitize outputs antes de logar

---

## 🤖 SISTEMA DE IA IMPLEMENTADO

### OpenRouter + Grok-4-fast

#### Configuração
```typescript
// lib/openrouter/client.ts
const client = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

// Modelo: x-ai/grok-2-1212 (Grok-4-fast)
// Custo: ~$0.006 por licitação
// Tempo médio: 2-3 segundos por licitação
```

#### Prompt Engineering
```typescript
// lib/agents/enrichment-agent.ts
const systemPrompt = `Você é um especialista em licitações públicas brasileiras...`;

// Extração de 16 campos:
// 1. escola (nome da instituição)
// 2. municipio_escola
// 3. categoria_principal (Alimentação, Material, etc.)
// 4. palavras_chave (array)
// 5. score_relevancia (0-100)
// 6. fornecedor_tipo (MEI, Empresa, Cooperativa)
// 7. valor_estimado_ia (normalizado)
// 8. observacoes_ia
```

#### JSON Mode (Structured Output)
```typescript
const response = await client.chat.completions.create({
  model: "x-ai/grok-2-1212",
  response_format: { type: "json_object" },
  messages: [
    { role: "system", content: systemPrompt },
    { role: "user", content: licitacaoData }
  ]
});

// Garante resposta JSON válida (não precisa parsing manual)
const enrichedData = JSON.parse(response.choices[0].message.content);
```

#### Error Handling
```typescript
try {
  const result = await enrichLicitacao(licitacao);
  await prisma.licitacoes.update({
    where: { id: licitacao.id },
    data: {
      processado_ia: true,
      processado_ia_at: new Date(),
      ...result
    }
  });
} catch (error) {
  await prisma.licitacoes.update({
    where: { id: licitacao.id },
    data: {
      erro_ia: error.message,
      processado_ia: false
    }
  });
}
```

### Performance e Custos

| Métrica | Valor |
|---------|-------|
| Tempo por licitação | 2.66s (média) |
| Custo por licitação | $0.006 |
| Taxa de sucesso | 100% (10/10 em testes) |
| Timeout configurado | 10 minutos (GitHub Action) |
| Retry logic | 3 tentativas com 5s delay |

**Custos Mensais** (assumindo 100 licitações/dia):
- Diário: $0.60
- Mensal: $18.00
- Anual: $216.00

---

## ⚙️ AUTOMAÇÃO E GITHUB ACTIONS

### Workflow: Daily IA Enrichment

**Arquivo**: `.github/workflows/enrich-daily.yml`

#### Configuração
```yaml
name: Daily IA Enrichment

on:
  schedule:
    - cron: '30 10 * * *'  # 7:30 AM BRT (10:30 UTC)
  workflow_dispatch:        # Manual trigger
    inputs:
      limit:
        description: 'Número de licitações'
        default: '100'

jobs:
  enrich:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Generate Prisma Client
        run: npx prisma generate
      
      - name: Process with IA
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          OPENROUTER_API_KEY: ${{ secrets.OPENROUTER_API_KEY }}
        run: |
          curl -X POST "${{ secrets.VERCEL_URL }}/api/process-ia" \
            -H "Content-Type: application/json" \
            -d '{"limit": ${{ github.event.inputs.limit || 100 }}}'
```

#### Secrets Necessários (GitHub)
1. `DATABASE_URL`: Connection string do PostgreSQL
2. `OPENROUTER_API_KEY`: Key da OpenRouter (⚠️ SEM expor)
3. `VERCEL_URL`: URL de produção (ex: `https://app.vercel.app`)

#### Triggers
- **Automático**: Diariamente às 7:30 AM (horário de Brasília)
- **Manual**: GitHub Actions → "Run workflow" → Definir limite

#### Monitoramento
```powershell
# Verificar execuções
https://github.com/USER/REPO/actions

# Verificar logs em tempo real
# Actions → Daily IA Enrichment → Latest run → View logs

# Verificar estatísticas após execução
curl "https://your-app.vercel.app/api/process-ia?action=stats"
```

---

## 🛠️ COMANDOS ÚTEIS

### Setup Inicial
```powershell
# Clone do projeto
git clone https://github.com/trcarneiro1/Importadordelicitacoes.git
cd Importadordelicitacoes

# Instalar dependências
npm install

# Configurar variáveis de ambiente
copy .env.example .env.local
# Editar .env.local com suas keys

# Gerar Prisma Client
npx prisma generate

# Rodar migrações (se necessário)
npx prisma db push
```

### Desenvolvimento Local
```powershell
# Iniciar servidor de desenvolvimento
npm run dev
# Abrir: http://localhost:3000

# Executar testes de enriquecimento IA
npx tsx test-enrich.ts          # 1 licitação
npx tsx test-batch.ts           # 10 licitações

# Verificar status do banco
npx prisma studio               # UI visual do banco
```

### Testes e Validação
```powershell
# Health check
curl http://localhost:3000/api/health

# Estatísticas
curl "http://localhost:3000/api/process-ia?action=stats"

# Listar pendentes
curl "http://localhost:3000/api/process-ia?action=pending&limit=5"

# Processar 5 licitações
curl -X POST http://localhost:3000/api/process-ia `
  -H "Content-Type: application/json" `
  -d '{"limit": 5}'
```

### Git Workflow
```powershell
# Verificar status (SEMPRE antes de add)
git status

# Ver mudanças linha por linha
git diff

# Adicionar arquivos específicos (mais seguro)
git add app/api/process-ia/route.ts
git add lib/agents/enrichment-agent.ts

# Ou adicionar tudo (verificar status antes!)
git add .

# Commit com mensagem descritiva
git commit -m "feat: Adicionar endpoint de processamento batch IA"

# Push para GitHub
git push origin main

# Verificar últimos commits
git log --oneline -5
```

### Deploy Vercel
```powershell
# Opção 1: Web UI
# https://vercel.com/new → Import Git Repository

# Opção 2: CLI
npm i -g vercel
vercel login
vercel --prod

# Verificar deployment
vercel ls

# Ver logs
vercel logs
```

### Prisma Commands
```powershell
# Gerar client após mudanças no schema
npx prisma generate

# Aplicar mudanças no schema ao banco
npx prisma db push

# Abrir Prisma Studio (UI visual)
npx prisma studio

# Ver schema atual
npx prisma db pull

# Reset database (CUIDADO!)
npx prisma db push --force-reset
```

---

## 🔧 TROUBLESHOOTING

### Problema: API Key Exposta no GitHub

**Sintomas:**
- Email do OpenRouter: "API key has been found exposed"
- Key desabilitada automaticamente

**Solução:**
```powershell
# 1. Gerar nova key
# https://openrouter.ai/keys → Create New Key

# 2. Atualizar .env.local
# OPENROUTER_API_KEY=sk-or-v1-NOVA_KEY

# 3. Remover arquivos sensíveis do git
git rm --cached docs/*.md
git commit -m "security: Remove exposed credentials"
git push origin main

# 4. Adicionar /docs ao .gitignore
echo "/docs/" >> .gitignore
git add .gitignore
git commit -m "security: Add /docs to gitignore"
git push origin main

# 5. Atualizar Vercel e GitHub Secrets com nova key
```

### Problema: Prisma Client não encontrado

**Sintomas:**
```
Error: Cannot find module '@prisma/client'
```

**Solução:**
```powershell
npx prisma generate
npm run dev
```

### Problema: GitHub Action falha

**Sintomas:**
- Workflow fica vermelho (❌)
- Logs mostram erro de autenticação ou timeout

**Soluções:**
```powershell
# 1. Verificar se secrets estão configurados
# GitHub → Settings → Secrets → Actions
# Devem existir: DATABASE_URL, OPENROUTER_API_KEY, VERCEL_URL

# 2. Verificar se Vercel está rodando
curl https://your-app.vercel.app/api/health

# 3. Aumentar timeout se necessário
# .github/workflows/enrich-daily.yml
# timeout-minutes: 15  (aumentar de 10 para 15)

# 4. Testar manualmente primeiro
# Actions → Daily IA Enrichment → Run workflow → limit: 10
```

### Problema: Erro de conexão com banco

**Sintomas:**
```
Error: P1001: Can't reach database server
```

**Soluções:**
```powershell
# 1. Verificar se DATABASE_URL está correto
echo $env:DATABASE_URL

# 2. Verificar se Supabase está acessível
# https://supabase.com/dashboard → Seu projeto → Settings

# 3. Testar conexão
npx prisma db pull

# 4. Verificar se porta 5432 está correta
# DATABASE_URL=postgresql://user:pass@host:5432/database
```

### Problema: OpenRouter timeout

**Sintomas:**
```
Error: Request timed out after 30s
```

**Solução:**
```typescript
// lib/openrouter/client.ts
const response = await client.chat.completions.create({
  model: "x-ai/grok-2-1212",
  timeout: 60000,  // Aumentar para 60s
  // ...
});
```

### Problema: Vercel build falha

**Sintomas:**
- Deploy falha com erro de build
- Erro: "Module not found"

**Solução:**
```powershell
# 1. Verificar se todas as env vars estão no Vercel
# Vercel → Project → Settings → Environment Variables
# Devem existir todas as 5 variáveis

# 2. Adicionar build command no Vercel
# Build Command: npm run build && npx prisma generate

# 3. Testar build localmente
npm run build

# 4. Se falhar, verificar erros no código
npm run build 2>&1 | Select-String "error"
```

---

## 📊 MÉTRICAS E MONITORAMENTO

### KPIs do Sistema

| Métrica | Target | Como Verificar |
|---------|--------|----------------|
| Taxa de sucesso IA | >95% | `curl .../api/process-ia?action=stats` |
| Tempo médio por licitação | <5s | Logs do GitHub Action |
| Custo diário | <$1 | OpenRouter Dashboard |
| Uptime Vercel | >99% | Vercel Dashboard |
| Licitações processadas/dia | 100 | Query SQL COUNT |

### Queries SQL Úteis
```sql
-- Total de licitações processadas hoje
SELECT COUNT(*) 
FROM licitacoes 
WHERE DATE(processado_ia_at) = CURRENT_DATE;

-- Score médio de relevância
SELECT AVG(score_relevancia) 
FROM licitacoes 
WHERE processado_ia = true;

-- Categorias mais comuns
SELECT categoria_principal, COUNT(*) as total
FROM licitacoes
WHERE processado_ia = true
GROUP BY categoria_principal
ORDER BY total DESC
LIMIT 10;

-- Licitações com erro
SELECT id, numero_edital, erro_ia
FROM licitacoes
WHERE erro_ia IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;
```

---

## 🎯 PRÓXIMOS PASSOS (ROADMAP)

### Fase 3: Automação (EM ANDAMENTO)
- [x] GitHub Action configurado
- [ ] Gerar nova OpenRouter API key
- [ ] Deploy no Vercel
- [ ] Configurar GitHub Secrets
- [ ] Testar execução manual
- [ ] Monitorar primeira execução automática

### Fase 4: Melhorias
- [ ] Dashboard com gráficos e estatísticas
- [ ] Sistema de notificações (Discord/Slack)
- [ ] API pública para consulta de licitações
- [ ] Sistema de cache para reduzir custos
- [ ] Otimização de prompts para menor token usage

### Fase 5: Escalabilidade
- [ ] Processamento paralelo (workers)
- [ ] Queue system (Bull/Redis)
- [ ] Rate limiting por SRE
- [ ] Backup automático do banco
- [ ] Monitoring com Datadog/Sentry

---

## 📞 CONTATOS E RECURSOS

### Documentação Oficial
- **Next.js**: https://nextjs.org/docs
- **Prisma**: https://www.prisma.io/docs
- **OpenRouter**: https://openrouter.ai/docs
- **Supabase**: https://supabase.com/docs
- **Vercel**: https://vercel.com/docs

### Suporte
- **OpenRouter**: support@openrouter.ai
- **Supabase**: support@supabase.com
- **Vercel**: support@vercel.com

### Repositório
- **GitHub**: https://github.com/trcarneiro1/Importadordelicitacoes
- **Issues**: https://github.com/trcarneiro1/Importadordelicitacoes/issues

---

## ⚡ QUICK REFERENCE

### Comandos Mais Usados
```powershell
npm run dev                      # Start dev server
npx tsx test-enrich.ts          # Test IA enrichment
git status                      # Check git status
git diff                        # Check changes
npx prisma studio              # Open database UI
vercel logs                    # View Vercel logs
```

### URLs Importantes
```
Local: http://localhost:3000
Vercel: https://importadordelicitacoes.vercel.app
GitHub Actions: https://github.com/trcarneiro1/Importadordelicitacoes/actions
OpenRouter Keys: https://openrouter.ai/keys
Supabase Dashboard: https://supabase.com/dashboard
```

### Variáveis de Ambiente (Checklist)
- [ ] `DATABASE_URL` - PostgreSQL connection
- [ ] `OPENROUTER_API_KEY` - OpenRouter API key
- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Supabase service key

---

**Última atualização**: 8 de outubro de 2025  
**Versão**: 2.0 (Fase 2 completa + Segurança reforçada)  
**Status**: ⚠️ Aguardando nova API key e deploy
