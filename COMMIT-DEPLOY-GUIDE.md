# 🚀 GUIA RÁPIDO: Commit e Deploy

## ✅ O QUE SERÁ COMMITADO

### Arquivos de Produção (Core)
```
lib/openrouter/client.ts          (177 linhas) - Cliente OpenRouter
lib/agents/enrichment-agent.ts    (378 linhas) - Agente de enriquecimento
app/api/process-ia/route.ts       (97 linhas)  - API batch processing
app/api/test-ia/route.ts          (75 linhas)  - API teste unitário
app/api/health/route.ts           (5 linhas)   - Health check
.github/workflows/enrich-daily.yml (60 linhas) - GitHub Action
```

### Scripts e Testes (Dev)
```
test-enrich.ts                    - Teste unitário
test-batch.ts                     - Teste batch
test-setup.mjs                    - Validação setup
check-github-action-ready.ts      - Verificação pré-deploy
add-municipio-column.ts           - Script DB (já executado)
drop-view.ts                      - Script DB (já executado)
```

### Documentação
```
FASE-2-IA-GUIDE.md                - Guia de uso da IA
FASE-2-COMPLETA-SUCESSO.md        - Resumo da implementação
GITHUB-ACTION-SETUP.md            - Setup da GitHub Action
COMMIT-DEPLOY-GUIDE.md            - Este arquivo
```

### ⚠️ NÃO COMMITADOS (Segurança)
```
.env.local                        - Secrets (já no .gitignore)
node_modules/                     - Dependências
.next/                            - Build
```

---

## 📝 PASSO 1: Verificar Status

```powershell
# Ver arquivos modificados/novos
git status

# Ver diferenças
git diff

# Ver arquivos staged
git diff --staged
```

**Resultado esperado**: ~15 arquivos novos/modificados

---

## 📦 PASSO 2: Adicionar Arquivos

```powershell
# Adicionar TODOS os arquivos da Fase 2
git add .

# OU adicionar seletivamente:
git add lib/openrouter/
git add lib/agents/
git add app/api/process-ia/
git add app/api/test-ia/
git add .github/workflows/enrich-daily.yml
git add *.md
git add test-*.ts
git add check-github-action-ready.ts
```

---

## 💾 PASSO 3: Commit

```powershell
git commit -m "feat: Fase 2 - Sistema de Enriquecimento com IA

✨ Implementações:
- Cliente OpenRouter/Grok para processamento com IA
- Agente de enriquecimento com prompt engineering avançado
- Endpoints de API para batch processing e testes
- GitHub Action para automação diária (7:30 AM BRT)
- Scripts de teste e validação
- Documentação completa

📊 Resultados dos Testes:
- Taxa de sucesso: 100% (10/10 licitações)
- Tempo médio: 26.6s por licitação
- Custo: ~$0.006 por licitação ($18/mês para 100/dia)
- Campos extraídos: escola, categoria, score, itens, palavras-chave

🔧 Correções de Banco:
- Adicionada coluna 'municipio'
- Schema sincronizado com Prisma
- Views removidas que bloqueavam migration

📁 Arquivos Criados:
- lib/openrouter/client.ts (177 linhas)
- lib/agents/enrichment-agent.ts (378 linhas)
- app/api/process-ia/route.ts (97 linhas)
- app/api/test-ia/route.ts (75 linhas)
- .github/workflows/enrich-daily.yml
- Documentação: 3 guias completos

✅ Pronto para: Deploy Vercel + Configuração GitHub Secrets
"
```

---

## 🚀 PASSO 4: Push para GitHub

```powershell
# Push para branch main
git push origin main

# OU se for primeira vez:
git push -u origin main
```

**Tempo estimado**: 10-30 segundos (dependendo da conexão)

---

## 🔍 PASSO 5: Verificar no GitHub

1. Abra: https://github.com/trcarneiro1/Importadordelicitacoes
2. Verifique se os arquivos apareceram
3. Vá em **Actions** → Deve aparecer "Daily IA Enrichment"
4. ⚠️ **NÃO execute ainda** - precisa configurar secrets primeiro

---

## 🌐 PASSO 6: Deploy no Vercel

### Opção A: Integração Automática (Recomendado)

1. Acesse: https://vercel.com/new
2. Clique em **Add New Project**
3. Importe: `trcarneiro1/Importadordelicitacoes`
4. Configurações:
   ```
   Framework Preset: Next.js
   Root Directory: ./
   Build Command: npm run build (padrão)
   Output Directory: .next (padrão)
   Install Command: npm ci (padrão)
   ```
5. Clique em **Deploy**
6. Aguarde 2-5 minutos

### Opção B: Vercel CLI

```powershell
# Instalar CLI (se não tiver)
npm i -g vercel

# Login
vercel login

# Deploy para produção
vercel --prod

# Seguir prompts:
# ? Set up and deploy? Yes
# ? Which scope? [Sua conta]
# ? Link to existing project? No
# ? What's your project's name? importadordelicitacoes
# ? In which directory is your code located? ./
```

**Copie a URL de produção**: Ex: `https://importadordelicitacoes.vercel.app`

---

## 🔐 PASSO 7: Configurar Environment Variables no Vercel

1. Vá para: **Vercel Dashboard** → Seu projeto
2. Clique em: **Settings** → **Environment Variables**
3. Adicione 5 variáveis (para Production, Preview e Development):

```
DATABASE_URL
postgresql://postgres:vVXc3lnDsmy7QgMK@db.inyrnjdefirzgamnmufi.supabase.co:5432/postgres

OPENROUTER_API_KEY
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

NEXT_PUBLIC_SUPABASE_URL
https://inyrnjdefirzgamnmufi.supabase.co

NEXT_PUBLIC_SUPABASE_ANON_KEY
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlueXJuamRlZmlyemdhbW5tdWZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzMjU4OTEsImV4cCI6MjA3NDkwMTg5MX0.klhSqRhy4B5NrAASqUvaY_0hzfY_ZFBJSFMJaKxvkTw

SUPABASE_SERVICE_ROLE_KEY
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlueXJuamRlZmlyemdhbW5tdWZpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTMyNTg5MSwiZXhwIjoyMDc0OTAxODkxfQ.eWkILN_eRRumxMTovPVGvLvJi1zGQneG7LGZVB1C7Mc
```

4. Clique em **Save**
5. **Re-deploy**: Deployments → Latest → ⋯ → Redeploy

---

## 🔑 PASSO 8: Configurar GitHub Secrets

1. Vá para: https://github.com/trcarneiro1/Importadordelicitacoes/settings/secrets/actions
2. Clique em: **New repository secret**
3. Adicione 3 secrets:

### Secret 1: DATABASE_URL
```
Name: DATABASE_URL
Secret: postgresql://postgres:vVXc3lnDsmy7QgMK@db.inyrnjdefirzgamnmufi.supabase.co:5432/postgres
```

### Secret 2: OPENROUTER_API_KEY
```
Name: OPENROUTER_API_KEY
Secret: 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
```

### Secret 3: VERCEL_URL
```
Name: VERCEL_URL
Secret: https://importadordelicitacoes.vercel.app
```

⚠️ **IMPORTANTE**: Use a URL do Vercel SEM barra final (/)

---

## 🧪 PASSO 9: Testar API no Vercel

```powershell
# Teste 1: Health Check
curl https://importadordelicitacoes.vercel.app/api/health

# Teste 2: Listar pendentes
curl https://importadordelicitacoes.vercel.app/api/process-ia

# Teste 3: Estatísticas
curl "https://importadordelicitacoes.vercel.app/api/process-ia?action=stats"

# Teste 4: Processar 5 licitações (cuidado: vai gastar créditos!)
curl -X POST https://importadordelicitacoes.vercel.app/api/process-ia `
  -H "Content-Type: application/json" `
  -d '{"limit": 5}'
```

**Resultado esperado**: JSON com dados das licitações

---

## ⚡ PASSO 10: Testar GitHub Action

1. Vá para: https://github.com/trcarneiro1/Importadordelicitacoes/actions
2. Clique em: **Daily IA Enrichment** (menu lateral)
3. Clique em: **Run workflow** (botão à direita)
4. Preencha:
   - Branch: `main`
   - Number of licitacoes: `10` (para teste)
5. Clique em: **Run workflow** (verde)
6. Aguarde: ~5 minutos
7. Verifique: Status deve ser ✅ verde

### Ver Logs
- Clique na execução
- Expanda cada step para ver logs detalhados
- Procure por: "Processed 10 licitacoes"

---

## ✅ CHECKLIST FINAL

- [ ] ✅ Código commitado e pushed para GitHub
- [ ] ✅ App deployado no Vercel
- [ ] ✅ 5 variáveis de ambiente configuradas no Vercel
- [ ] ✅ 3 secrets configurados no GitHub
- [ ] ✅ API testada e funcionando no Vercel
- [ ] ✅ GitHub Action executada manualmente com sucesso
- [ ] ✅ 10 licitações processadas no teste
- [ ] ✅ Logs da action verificados (sem erros)
- [ ] ✅ Estatísticas mostrando progresso

---

## 📊 RESULTADO ESPERADO

Após todos os passos:

```
✅ Código no GitHub: github.com/trcarneiro1/Importadordelicitacoes
✅ App no Vercel: importadordelicitacoes.vercel.app
✅ API funcionando: /api/process-ia e /api/test-ia
✅ GitHub Action: Executando diariamente às 7:30 AM
✅ Custo mensal: ~$18 OpenRouter + $0 Vercel (free tier)
✅ Licitações processadas: 100/dia automaticamente
```

---

## 🐛 TROUBLESHOOTING COMUM

### Erro: "This repository requires password authentication"
```powershell
# Usar Personal Access Token
git remote set-url origin https://TOKEN@github.com/trcarneiro1/Importadordelicitacoes.git
```

### Erro: "Vercel deploy failed - Module not found"
```powershell
# Re-deploy após adicionar env vars
Vercel Dashboard → Deployments → Latest → Redeploy
```

### Erro: "GitHub Action failed - 401 Unauthorized"
```
Causa: OPENROUTER_API_KEY incorreta ou não configurada
Solução: Verificar secret no GitHub e env var no Vercel
```

### Erro: "Connection refused" na GitHub Action
```
Causa: VERCEL_URL incorreta ou app não deployado
Solução: 
1. Verificar se app está no ar
2. Verificar se URL está sem barra final
3. Aguardar deploy finalizar antes de testar action
```

---

## 📞 COMANDOS ÚTEIS

```powershell
# Ver último commit
git log -1

# Ver remote URL
git remote -v

# Ver branches
git branch -a

# Ver status do deploy (Vercel CLI)
vercel ls

# Ver logs do Vercel
vercel logs [deployment-url]

# Re-deploy
vercel --prod --force
```

---

**Próxima fase**: Fase 3 - Frontend B2B (Dashboard, Filtros, Detalhes, Alertas)

**Tempo estimado**: 30-45 minutos para todos os passos
