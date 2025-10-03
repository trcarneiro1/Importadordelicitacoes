# 🚀 Deploy no Vercel - Guia Completo

## Por que Vercel?

- ✅ **Gratuito** para projetos Next.js (Hobby plan)
- ✅ **Deploy automático** após cada commit
- ✅ **Domínio grátis**: `seu-projeto.vercel.app`
- ✅ **Preview deployments** para cada branch
- ✅ **Edge Functions** (performance global)
- ✅ **Variáveis de ambiente** via dashboard
- ✅ **SSL automático** (HTTPS)
- ✅ **Analytics integrado**

---

## 📋 Pré-requisitos

- [ ] Conta GitHub (gratuita)
- [ ] Projeto commitado no GitHub
- [ ] Conta Vercel (gratuita - pode usar login GitHub)
- [ ] Supabase configurado

---

## 🎯 Deploy em 5 Minutos

### **Passo 1: Preparar Repositório GitHub**

```bash
# Se ainda não tem repositório:
cd H:\projetos\Importadordelicitacoes

# Inicializar Git (se não foi feito)
git init

# Adicionar .gitignore
echo "node_modules/
.next/
.env.local
.DS_Store
*.log" > .gitignore

# Commit inicial
git add .
git commit -m "feat: POC Importador SREs com IA (OpenRouter)"

# Criar repositório no GitHub
# 1. Vá em: https://github.com/new
# 2. Nome: importador-licitacoes-sres-mg
# 3. Descrição: Sistema de coleta e análise de licitações e notícias das SREs-MG
# 4. Público ou Privado (sua escolha)
# 5. Criar

# Conectar ao repositório remoto
git remote add origin https://github.com/SEU_USUARIO/importador-licitacoes-sres-mg.git
git branch -M main
git push -u origin main
```

---

### **Passo 2: Deploy no Vercel**

#### **Opção A: Via Dashboard (Recomendado para primeira vez)**

1. **Acessar Vercel**:
   - Vá em: https://vercel.com/
   - Clique em **"Sign Up"** ou **"Login"**
   - Use **"Continue with GitHub"** (mais fácil)

2. **Importar Projeto**:
   - No dashboard, clique em **"Add New..."** → **"Project"**
   - Clique em **"Import Git Repository"**
   - Selecione seu repositório: `importador-licitacoes-sres-mg`

3. **Configurar Projeto**:
   - **Framework Preset**: Next.js (detectado automaticamente)
   - **Root Directory**: `./` (manter)
   - **Build Command**: `npm run build` (padrão)
   - **Output Directory**: `.next` (padrão)
   - **Install Command**: `npm install` (padrão)

4. **Adicionar Variáveis de Ambiente**:
   
   Clique em **"Environment Variables"** e adicione:

   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=https://inyrnjdefirzgamnmufi.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

   # OpenRouter (opcional)
   OPENROUTER_API_KEY=sk-or-v1-sua-chave-aqui
   OPENROUTER_DEFAULT_MODEL=openai/gpt-4o-mini
   OPENROUTER_FALLBACK_TO_LOCAL=true
   ```

   **Dica**: Copie do seu `.env.local`

5. **Deploy**:
   - Clique em **"Deploy"**
   - Aguarde 2-3 minutos
   - ✅ Pronto! URL: `https://seu-projeto.vercel.app`

#### **Opção B: Via CLI (Para desenvolvedores)**

```bash
# 1. Instalar Vercel CLI
npm install -g vercel

# 2. Login
vercel login

# 3. Deploy (primeira vez)
vercel

# Responda as perguntas:
# - Set up and deploy? Yes
# - Which scope? (seu usuário)
# - Link to existing project? No
# - Project name? importador-licitacoes-sres-mg
# - Directory? ./
# - Override settings? No

# 4. Adicionar variáveis de ambiente
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add OPENROUTER_API_KEY

# 5. Deploy para produção
vercel --prod
```

---

### **Passo 3: Configurar Deploy Automático**

Após primeiro deploy, **deploy automático já está configurado**! 🎉

Toda vez que você fizer:
```bash
git add .
git commit -m "feat: nova funcionalidade"
git push origin main
```

Vercel automaticamente:
1. Detecta o push
2. Roda build
3. Deploya nova versão
4. Gera preview URL

**Preview Deployments:**
- Cada branch/PR gera uma URL única
- Exemplo: `https://seu-projeto-git-feature-abc123.vercel.app`
- Perfeito para testes antes do merge

---

## 🔧 Configurações Avançadas

### **Domínio Customizado** (Opcional)

Se você tiver domínio próprio (ex: `licitacoes.seudominio.com.br`):

1. Vá em **Project Settings** → **Domains**
2. Adicione seu domínio
3. Configure DNS conforme instruções
4. Vercel provisiona SSL automaticamente

**Custo**: Gratuito no Vercel (paga só o domínio ~R$40/ano)

---

### **Configurar Cron Jobs** (Coleta Automática)

Para coletar notícias automaticamente todos os dias:

1. **Instalar Vercel Cron**:

Crie `vercel.json` na raiz:

```json
{
  "crons": [
    {
      "path": "/api/scrape-news?count=10&pages=2",
      "schedule": "0 8 * * *"
    }
  ]
}
```

**Explicação**:
- `0 8 * * *`: Todo dia às 8h (horário UTC)
- `count=10`: Processa 10 SREs
- `pages=2`: 2 páginas por SRE

2. **Commit e push**:
```bash
git add vercel.json
git commit -m "feat: adicionar cron job para coleta diária"
git push origin main
```

**Custo**: Gratuito no plano Hobby (100 execuções/dia)

---

### **Configurar Timeouts**

Next.js no Vercel tem limite de **10s por request** (Hobby plan).

Para scraping de múltiplas SREs, adicione em `vercel.json`:

```json
{
  "functions": {
    "app/api/scrape-news/route.ts": {
      "maxDuration": 300
    }
  }
}
```

**Atenção**: `maxDuration > 10s` requer plano **Pro ($20/mês)**

**Alternativa gratuita**: Processar SREs em lote menor:
```bash
# Em vez de:
curl "/api/scrape-news?count=47&pages=3"

# Fazer:
curl "/api/scrape-news?count=5&pages=2"  # 5 SREs por vez
```

---

## 📊 Monitoramento

### **Analytics do Vercel** (Gratuito)

1. Vá em **Analytics** no dashboard
2. Veja:
   - Requests por hora/dia
   - Tempo de resposta
   - Top páginas acessadas
   - Erros (4xx, 5xx)

### **Logs em Tempo Real**

```bash
# Ver logs em tempo real
vercel logs

# Logs de produção
vercel logs --prod

# Seguir logs (como tail -f)
vercel logs --follow
```

---

## 🚨 Troubleshooting

### **Erro: Build falhou**

```bash
# Testar build localmente primeiro
npm run build

# Se funcionar local mas falhar no Vercel:
# 1. Verificar node version em package.json
# 2. Verificar variáveis de ambiente
# 3. Ver logs: vercel logs
```

### **Erro: Variáveis de ambiente não funcionam**

1. Vercel dashboard → Project Settings → Environment Variables
2. Verificar se adicionou para **Production**, **Preview** e **Development**
3. Redeploy: `vercel --prod`

### **Erro: Timeout (10s)**

```bash
# Opção 1: Reduzir count/pages
curl "/api/scrape-news?count=3&pages=1"

# Opção 2: Upgrade para Pro ($20/mês)
# Opção 3: Usar Railway/Render (sem limite timeout)
```

---

## 💰 Custos Estimados

### **Plano Hobby (Gratuito)**
- ✅ 100 GB bandwidth/mês
- ✅ Domínio .vercel.app grátis
- ✅ SSL automático
- ✅ Unlimited requests (com fair use)
- ✅ 100 cron executions/dia
- ⚠️ Timeout: 10s

**Suficiente para:** POC, demos, projetos pessoais, até ~10k visits/mês

### **Plano Pro ($20/mês)**
- ✅ 1 TB bandwidth/mês
- ✅ Domínios customizados ilimitados
- ✅ Timeout: 300s (5 minutos)
- ✅ Suporte prioritário
- ✅ Analytics avançado

**Quando upgrade:** Produção com tráfego alto, scraping pesado

---

## 🎯 Após Deploy

### **Enviar para Cliente**

1. **URL de Produção**:
   ```
   https://importador-licitacoes-sres-mg.vercel.app
   ```

2. **URLs Principais**:
   - Homepage: `/`
   - Dashboard Licitações: `/licitacoes`
   - Dashboard Notícias: `/noticias`
   - API Coleta: `/api/scrape-news?sre=barbacena&pages=2`

3. **Credenciais** (se necessário):
   - Se implementar autenticação, fornecer usuário/senha

4. **Documentação**:
   - Link para GitHub README
   - API endpoints disponíveis
   - Exemplos de uso

---

## 📚 Recursos Úteis

- **Dashboard Vercel**: https://vercel.com/dashboard
- **Documentação**: https://vercel.com/docs
- **CLI Reference**: https://vercel.com/docs/cli
- **Limites do Plano Hobby**: https://vercel.com/docs/limits/overview

---

## ✅ Checklist de Deploy

Antes de enviar ao cliente:

- [ ] Código commitado no GitHub
- [ ] Variáveis de ambiente configuradas
- [ ] Build testado localmente (`npm run build`)
- [ ] Deploy no Vercel funcionando
- [ ] Testar todas as páginas principais
- [ ] Testar API de coleta
- [ ] Verificar se Supabase está acessível
- [ ] Verificar logs no Vercel
- [ ] Documentar URLs para o cliente
- [ ] (Opcional) Configurar domínio customizado
- [ ] (Opcional) Configurar cron job para coleta diária

---

**Deploy concluído! 🚀**

Seu POC está rodando em produção e pronto para apresentar ao cliente!
