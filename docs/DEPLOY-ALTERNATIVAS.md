# 🚀 Alternativas de Deploy - Comparação Completa

## Visão Geral

Todas as opções abaixo são **gratuitas ou muito baratas** e suportam **deploy automático**.

---

## 📊 Comparação Rápida

| Plataforma | Custo Grátis | Timeout | Bandwidth | Recomendado Para |
|------------|--------------|---------|-----------|------------------|
| **Vercel** ⭐ | 100 GB/mês | 10s (Hobby) | Ilimitado | **Next.js (MELHOR)** |
| **Railway** | $5 crédito | Ilimitado | 100 GB | **Scraping pesado** |
| **Render** | 750h/mês | Ilimitado | 100 GB | **Deploy simples** |
| **Fly.io** | 3 VMs grátis | Ilimitado | 160 GB | **Baixa latência BR** |
| **Netlify** | 100 GB/mês | 10s | Ilimitado | **Sites estáticos** |

---

## 1️⃣ Vercel ⭐ (RECOMENDADO)

### **Prós:**
- ✅ **Melhor para Next.js** (mesma empresa)
- ✅ Deploy automático instantâneo
- ✅ Edge Functions (performance global)
- ✅ Preview deployments automáticos
- ✅ 100% gratuito para POC
- ✅ Dashboard intuitivo

### **Contras:**
- ⚠️ Timeout 10s no plano grátis
- ⚠️ Scraping de muitas SREs pode dar timeout

### **Quando usar:**
- ✅ Apresentação de POC ao cliente
- ✅ Protótipos e demos
- ✅ Projetos Next.js
- ✅ Precisa de deploy rápido

### **Setup:**
Ver: `docs/DEPLOY-VERCEL.md`

---

## 2️⃣ Railway 🚂

### **Prós:**
- ✅ **Sem limite de timeout** (perfeito para scraping)
- ✅ $5 de crédito grátis (sem cartão)
- ✅ Suporta PostgreSQL integrado
- ✅ Deploy automático do GitHub
- ✅ Variáveis de ambiente fáceis
- ✅ Logs em tempo real

### **Contras:**
- ⚠️ Após $5, precisa adicionar cartão
- ⚠️ ~$5-10/mês em produção

### **Custo:**
- 🆓 **$5 crédito inicial** (trial)
- 💰 **$5/mês** (Hobby): 500 horas execução
- 💰 **$20/mês** (Pro): 2000 horas

### **Setup:**

```bash
# 1. Criar conta: https://railway.app/

# 2. Conectar GitHub
# Railway → New Project → Deploy from GitHub → Selecionar repo

# 3. Configurar variáveis
# Dashboard → Variables → Add:
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
OPENROUTER_API_KEY=...

# 4. Deploy automático
# Após commit, Railway rebuilda automaticamente

# 5. Obter URL
# Dashboard → Settings → Domain
# Exemplo: https://seu-projeto.up.railway.app
```

### **Quando usar:**
- ✅ Scraping de TODAS as 47 SREs de uma vez
- ✅ Requests longos (> 10s)
- ✅ Processamento pesado
- ✅ Precisa de banco PostgreSQL próprio

---

## 3️⃣ Render 🎨

### **Prós:**
- ✅ **750 horas grátis/mês** (suficiente para 1 app)
- ✅ Sem timeout no plano grátis
- ✅ Deploy automático
- ✅ PostgreSQL gratuito (90 dias)
- ✅ SSL automático
- ✅ Simples de usar

### **Contras:**
- ⚠️ Apps grátis "dormem" após 15min inatividade
- ⚠️ Primeiro request após sleep: ~30s (cold start)
- ⚠️ PostgreSQL grátis expira em 90 dias

### **Custo:**
- 🆓 **Free**: 750h/mês, cold starts
- 💰 **Starter ($7/mês)**: Sem cold starts
- 💰 **Standard ($25/mês)**: Mais recursos

### **Setup:**

```bash
# 1. Criar conta: https://render.com/

# 2. New Web Service
# Connect GitHub → Selecionar repo

# 3. Configurar build
# Name: importador-licitacoes
# Environment: Node
# Build Command: npm install && npm run build
# Start Command: npm start

# 4. Adicionar variáveis
# Environment → Add Environment Variable
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
OPENROUTER_API_KEY=...

# 5. Create Web Service
# URL: https://seu-projeto.onrender.com
```

### **Quando usar:**
- ✅ Orçamento muito limitado
- ✅ Não precisa de uptime 24/7
- ✅ Demos esporádicos
- ✅ Tráfego baixo

---

## 4️⃣ Fly.io 🪰

### **Prós:**
- ✅ **3 VMs grátis** (256 MB RAM cada)
- ✅ Deploy em múltiplas regiões (incluindo São Paulo!)
- ✅ Sem timeout
- ✅ PostgreSQL gratuito (3 GB)
- ✅ Baixa latência no Brasil

### **Contras:**
- ⚠️ Setup um pouco mais complexo
- ⚠️ CLI obrigatória (não tem dashboard visual como Vercel)
- ⚠️ RAM limitada (256 MB por VM grátis)

### **Custo:**
- 🆓 **Free**: 3 VMs compartilhadas, 3 GB PostgreSQL
- 💰 **Pay as you go**: ~$3-5/mês para upgrade RAM

### **Setup:**

```bash
# 1. Instalar CLI
# Windows PowerShell:
powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"

# 2. Criar conta e login
fly auth signup
fly auth login

# 3. Criar app
fly launch
# Responder:
# - App name: importador-licitacoes
# - Region: São Paulo (gru)
# - PostgreSQL: No (usar Supabase)
# - Deploy now: Yes

# 4. Configurar variáveis
fly secrets set NEXT_PUBLIC_SUPABASE_URL="..."
fly secrets set NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
fly secrets set SUPABASE_SERVICE_ROLE_KEY="..."
fly secrets set OPENROUTER_API_KEY="..."

# 5. Deploy
fly deploy

# 6. Abrir no browser
fly open
```

### **Quando usar:**
- ✅ Precisa de **baixa latência no Brasil**
- ✅ Quer múltiplas regiões
- ✅ Confortável com CLI
- ✅ Precisa de PostgreSQL próprio

---

## 5️⃣ Netlify 🌐

### **Prós:**
- ✅ 100 GB bandwidth grátis
- ✅ Deploy automático muito rápido
- ✅ CDN global
- ✅ Forms gratuitos
- ✅ Funções serverless

### **Contras:**
- ⚠️ **Não otimizado para Next.js** (Vercel é melhor)
- ⚠️ Timeout 10s (grátis) ou 26s (pago)
- ⚠️ Configuração mais complexa para Next.js

### **Custo:**
- 🆓 **Starter**: 100 GB, 300 build min/mês
- 💰 **Pro ($19/mês)**: 400 GB, timeout 26s

### **Setup:**
Não recomendado para Next.js. Use Vercel.

---

## 🎯 Decisão: Qual Escolher?

### **Para POC/Demo ao Cliente:**
```
Vercel ⭐
```
- Grátis
- Deploy em 5 minutos
- URL bonita (.vercel.app)
- Preview deployments
- Perfeito para Next.js

### **Para Produção com Scraping Pesado:**
```
Railway ou Fly.io
```
- Sem timeout
- Pode processar todas 47 SREs
- ~$5-10/mês

### **Para Orçamento Zero Absoluto:**
```
Render (Free)
```
- 750h grátis/mês
- Cold starts aceitáveis
- Sem cartão de crédito

---

## 💡 Estratégia Híbrida (RECOMENDADO)

Para maximizar economia:

1. **Deploy no Vercel** (grátis):
   - Frontend (dashboards)
   - APIs leves
   - Apresentação ao cliente

2. **Worker no Railway** ($5/mês):
   - Scraping pesado (47 SREs)
   - Cron jobs diários
   - Processamento em background

3. **Banco Supabase** (grátis):
   - PostgreSQL compartilhado
   - Já está configurado

**Custo total**: $0 (trial) ou $5/mês (produção)

---

## 📋 Checklist de Escolha

Marque o que você precisa:

- [ ] Deploy em < 10 minutos → **Vercel**
- [ ] Processar 47 SREs de uma vez → **Railway ou Fly.io**
- [ ] Orçamento zero → **Render Free**
- [ ] Baixa latência Brasil → **Fly.io (região São Paulo)**
- [ ] Precisa de banco próprio → **Railway ou Fly.io**
- [ ] Cron jobs diários → **Vercel (Pro) ou Railway**
- [ ] Só demo para cliente → **Vercel**

---

## 🚀 Recomendação Final

### **Fase 1: POC/Demo (AGORA)**
```bash
Deploy no Vercel (Gratuito)
```

**Passos:**
1. Push para GitHub
2. Conectar no Vercel
3. Deploy automático
4. Enviar URL ao cliente

**Tempo**: 10 minutos  
**Custo**: $0

### **Fase 2: Produção (Após Aprovação)**
```bash
Frontend: Vercel (Gratuito)
Backend/Scraping: Railway ($5/mês)
Banco: Supabase (Gratuito)
```

**Custo total**: $5/mês  
**Benefícios**:
- Sem timeouts
- Cron jobs
- Scraping completo

---

## 📚 Documentação Completa

- **Vercel**: `docs/DEPLOY-VERCEL.md`
- **Railway**: https://docs.railway.app/
- **Render**: https://render.com/docs
- **Fly.io**: https://fly.io/docs/

---

**Dúvidas?** Consulte a documentação ou pergunte! 🚀
