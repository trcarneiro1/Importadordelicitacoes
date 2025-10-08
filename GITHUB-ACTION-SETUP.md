# 🤖 GitHub Action - Configuração Completa

**Objetivo**: Executar enriquecimento com IA automaticamente todos os dias às 7:30 AM.

---

## 📋 PRÉ-REQUISITOS

### 1. Repositório GitHub
- ✅ Código commitado no GitHub
- ✅ Repository: `trcarneiro1/Importadordelicitacoes`
- ✅ Branch: `main`

### 2. Vercel Deployment
- ✅ App deployado no Vercel
- ✅ URL de produção disponível
- ✅ Build funcionando corretamente

### 3. Secrets Configurados
Você precisará de 3 secrets no GitHub:
1. `DATABASE_URL` - String de conexão PostgreSQL
2. `OPENROUTER_API_KEY` - Chave da API OpenRouter
3. `VERCEL_URL` - URL do app no Vercel

---

## 🔐 PASSO 1: Configurar Secrets no GitHub

### Acessar Configurações
1. Vá para: https://github.com/trcarneiro1/Importadordelicitacoes
2. Clique em **Settings** (⚙️)
3. No menu lateral esquerdo, clique em **Secrets and variables** → **Actions**
4. Clique em **New repository secret**

### Secret 1: DATABASE_URL
```
Name: DATABASE_URL
Value: postgresql://postgres:vVXc3lnDsmy7QgMK@db.inyrnjdefirzgamnmufi.supabase.co:5432/postgres
```

**Como obter**: Já está no seu `.env.local` (não commit este arquivo!)

### Secret 2: OPENROUTER_API_KEY
```
Name: OPENROUTER_API_KEY
Value: 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
```

**Como obter**: 
- Dashboard: https://openrouter.ai/keys
- Ou use a chave do seu `.env.local`

### Secret 3: VERCEL_URL
```
Name: VERCEL_URL
Value: https://importadordelicitacoes.vercel.app
```

**Como obter**:
1. Faça deploy no Vercel primeiro (se ainda não fez)
2. Copie a URL de produção do dashboard Vercel
3. ⚠️ **NÃO inclua barra final** (/)

---

## 🚀 PASSO 2: Fazer Deploy no Vercel

### Opção A: Via GitHub (Recomendado)
1. Acesse: https://vercel.com/new
2. Clique em **Import Git Repository**
3. Selecione: `trcarneiro1/Importadordelicitacoes`
4. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

### Opção B: Via Vercel CLI
```bash
# Instalar CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

### Configurar Environment Variables no Vercel
Após deploy, adicione as variáveis:

1. Vá para: Project Settings → Environment Variables
2. Adicione:
   ```
   DATABASE_URL=postgresql://postgres:vVXc3lnDsmy7QgMK@...
   OPENROUTER_API_KEY=sk-or-v1-...
   NEXT_PUBLIC_SUPABASE_URL=https://inyrnjdefirzgamnmufi.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
   ```

3. **Re-deploy** após adicionar variáveis:
   ```bash
   vercel --prod
   ```

---

## ✅ PASSO 3: Verificar GitHub Action

### Arquivo da Action
**Localização**: `.github/workflows/enrich-daily.yml`

**Configuração Atual**:
```yaml
Schedule: 7:30 AM BRT (10:30 UTC) diariamente
Limit: 100 licitações por execução
Timeout: 10 minutos (600 segundos)
Retry: 3 tentativas com 5s de delay
```

### Testar Manualmente
1. Vá para: https://github.com/trcarneiro1/Importadordelicitacoes/actions
2. Clique em **Daily IA Enrichment** (no menu lateral)
3. Clique em **Run workflow** (botão à direita)
4. Escolha:
   - **Branch**: main
   - **Number of licitacoes**: 10 (para teste)
5. Clique em **Run workflow**

### Monitorar Execução
1. A action aparecerá na lista com status amarelo (⏳ running)
2. Clique na execução para ver logs em tempo real
3. Aguarde ~5-10 minutos (dependendo do limite)
4. Verifique se terminou com sucesso (✅ green)

---

## 📊 PASSO 4: Validar Resultados

### No Banco de Dados
```sql
-- Ver licitações processadas hoje
SELECT 
  COUNT(*) as total_processadas,
  COUNT(DISTINCT categoria_principal) as categorias,
  AVG(score_relevancia) as score_medio
FROM licitacoes
WHERE DATE(processado_ia_at) = CURRENT_DATE;

-- Ver últimas processadas
SELECT 
  id,
  numero_edital,
  escola,
  categoria_principal,
  score_relevancia,
  processado_ia_at
FROM licitacoes
WHERE processado_ia = true
ORDER BY processado_ia_at DESC
LIMIT 10;
```

### Via API (Local ou Vercel)
```bash
# Estatísticas
curl "https://importadordelicitacoes.vercel.app/api/process-ia?action=stats"

# Licitações pendentes
curl "https://importadordelicitacoes.vercel.app/api/process-ia"
```

### Verificar Logs da Action
```
✅ Steps esperados:
1. Checkout code - Baixar código do repo
2. Setup Node.js - Instalar Node 20
3. Install dependencies - npm ci
4. Generate Prisma Client - npx prisma generate
5. Process licitacoes - curl POST para API
6. Get statistics - curl GET para stats
```

---

## 🐛 TROUBLESHOOTING

### Erro: "DATABASE_URL not found"
**Causa**: Secret não configurado no GitHub  
**Solução**: Adicione o secret `DATABASE_URL` nas configurações

### Erro: "VERCEL_URL not found"
**Causa**: Secret não configurado  
**Solução**: Adicione o secret `VERCEL_URL` (sem barra final)

### Erro: "OPENROUTER_API_KEY not found"
**Causa**: Secret não configurado ou variável de ambiente do Vercel faltando  
**Solução**: 
1. Adicione secret no GitHub
2. Adicione variável no Vercel (Project Settings)
3. Re-deploy no Vercel

### Erro: "Connection refused"
**Causa**: URL do Vercel incorreta ou app não deployado  
**Solução**: 
1. Verifique se app está no ar: `curl https://seu-app.vercel.app`
2. Verifique se URL está correta (sem barra final)

### Erro: "Timeout after 600s"
**Causa**: Processamento demorou mais de 10 minutos  
**Solução**: 
1. Reduza o `limit` de 100 para 50
2. Aumente `max-time` de 600 para 900

### Erro: "prisma.licitacoes.update() - column does not exist"
**Causa**: Schema do Prisma desatualizado no Vercel  
**Solução**:
1. Execute `npx prisma db push` localmente
2. Commit e push para GitHub
3. Vercel fará novo deploy automaticamente

---

## 📅 CRONOGRAMA DE EXECUÇÃO

### Horário Configurado
```
Cron: '30 10 * * *'
Horário: 10:30 UTC = 7:30 AM BRT
Frequência: Diária
Dias: Segunda a Domingo
```

### Próximas Execuções (Exemplo)
```
09/10/2025 - 7:30 AM - 100 licitações
10/10/2025 - 7:30 AM - 100 licitações
11/10/2025 - 7:30 AM - 100 licitações
...
```

### Personalizar Horário
Para mudar o horário, edite o cron em `.github/workflows/enrich-daily.yml`:

```yaml
# Exemplos:
- cron: '0 9 * * *'   # 6:00 AM BRT (9:00 UTC)
- cron: '0 12 * * *'  # 9:00 AM BRT (12:00 UTC)
- cron: '0 15 * * *'  # 12:00 PM BRT (15:00 UTC)
```

**Ferramenta útil**: https://crontab.guru/

---

## 💰 CUSTOS ESTIMADOS

### Com 100 licitações/dia
```
Custo por licitação: $0.006
Custo diário: $0.60
Custo mensal: $18.00
Custo anual: $216.00
```

### Monitorar Uso OpenRouter
1. Dashboard: https://openrouter.ai/activity
2. Verifique:
   - Total de requests
   - Tokens usados
   - Custo acumulado
3. Configure alertas se ultrapassar $20/mês

### Vercel Limits (Free Tier)
```
✅ 100GB Bandwidth/mês - Suficiente
✅ 100h Serverless Function Execution - Suficiente
✅ Unlimited API Requests - OK
```

Se ultrapassar, considere upgrade para Pro ($20/mês).

---

## 🔔 NOTIFICAÇÕES (Opcional)

### Integrar com Discord
Adicione no final da action:

```yaml
- name: Notify Discord
  if: always()
  run: |
    STATUS="${{ job.status }}"
    curl -X POST "${{ secrets.DISCORD_WEBHOOK_URL }}" \
      -H "Content-Type: application/json" \
      -d "{
        \"content\": \"IA Enrichment ${STATUS}!\",
        \"embeds\": [{
          \"title\": \"Daily Enrichment\",
          \"description\": \"Processed licitacoes with status: ${STATUS}\",
          \"color\": 3447003
        }]
      }"
```

**Setup**:
1. Crie webhook no Discord: Server Settings → Integrations → Webhooks
2. Copie URL do webhook
3. Adicione secret `DISCORD_WEBHOOK_URL` no GitHub

### Integrar com Slack
```yaml
- name: Notify Slack
  if: failure()
  run: |
    curl -X POST "${{ secrets.SLACK_WEBHOOK_URL }}" \
      -H "Content-Type: application/json" \
      -d '{"text":"❌ IA Enrichment failed! Check logs."}'
```

---

## ✅ CHECKLIST FINAL

Antes de ativar a automação:

- [ ] Secrets configurados no GitHub (3 secrets)
- [ ] App deployado no Vercel
- [ ] Variáveis de ambiente configuradas no Vercel (5 vars)
- [ ] Teste manual da action executado com sucesso
- [ ] Pelo menos 10 licitações processadas no teste
- [ ] API `/api/process-ia` acessível publicamente
- [ ] Logs da action verificados (sem erros)
- [ ] Estatísticas retornando dados corretos
- [ ] Créditos OpenRouter suficientes ($10+ recomendado)
- [ ] Monitoramento configurado (opcional)

---

## 📞 SUPORTE

### Logs Úteis
```bash
# Logs da GitHub Action
GitHub → Actions → Daily IA Enrichment → Click na execução

# Logs do Vercel
Vercel Dashboard → Project → Logs → Real-time

# Logs do OpenRouter
https://openrouter.ai/activity

# Logs do Supabase
Supabase Dashboard → Logs → Postgres Logs
```

### Comandos de Debug
```bash
# Testar API localmente
npx tsx test-batch.ts

# Testar API no Vercel
curl -X POST "https://seu-app.vercel.app/api/process-ia" \
  -H "Content-Type: application/json" \
  -d '{"limit": 5}'

# Ver estatísticas
curl "https://seu-app.vercel.app/api/process-ia?action=stats"
```

---

## 🎯 RESULTADO ESPERADO

Após configuração completa:

✅ **Automação diária**: 100 licitações processadas às 7:30 AM  
✅ **Custo previsível**: ~$0.60/dia ($18/mês)  
✅ **Taxa de sucesso**: 95%+ (baseado em testes)  
✅ **Tempo de execução**: 40-50 minutos para 100 licitações  
✅ **Dados estruturados**: Escola, categoria, score, itens extraídos  
✅ **Notificações**: Alertas em caso de falha (se configurado)

---

**Criado em**: 08/10/2025  
**Última atualização**: 08/10/2025  
**Versão**: 1.0  
**Status**: ✅ Pronto para produção
