# 🚀 Deploy - Comandos Prontos

## Quick Start: Vercel (5 minutos)

### 1. Preparar Repositório

```bash
# Verificar projeto
.\preparar-deploy.ps1

# Adicionar arquivos ao Git
git add .
git commit -m "feat: preparar deploy para produção"

# Criar repositório no GitHub
# Vá em: https://github.com/new
# Nome: importador-licitacoes-sres-mg
# Descrição: Sistema de coleta e análise de licitações e notícias das SREs-MG

# Conectar ao remote (substitua SEU_USUARIO)
git remote add origin https://github.com/SEU_USUARIO/importador-licitacoes-sres-mg.git
git branch -M main
git push -u origin main
```

### 2. Deploy no Vercel (Via Dashboard)

1. **Acesse**: https://vercel.com/
2. **Login**: Use GitHub
3. **New Project** → **Import Git Repository**
4. **Selecione**: seu repositório
5. **Configure**:
   - Framework: Next.js ✅ (detectado automaticamente)
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `.next`

6. **Environment Variables** (copie do seu `.env.local`):

```env
NEXT_PUBLIC_SUPABASE_URL=https://inyrnjdefirzgamnmufi.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
OPENROUTER_API_KEY=sk-or-v1-sua-chave
OPENROUTER_DEFAULT_MODEL=openai/gpt-4o-mini
OPENROUTER_FALLBACK_TO_LOCAL=true
```

7. **Deploy** → Aguardar 2-3 minutos

8. **Pronto!** URL: `https://seu-projeto.vercel.app`

---

## Alternativa: Vercel CLI

```bash
# Instalar CLI
npm install -g vercel

# Login
vercel login

# Deploy (primeira vez)
vercel

# Adicionar variáveis
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add OPENROUTER_API_KEY
vercel env add OPENROUTER_DEFAULT_MODEL
vercel env add OPENROUTER_FALLBACK_TO_LOCAL

# Deploy para produção
vercel --prod
```

---

## URLs para Enviar ao Cliente

Após deploy, você terá:

### **Homepage**
```
https://seu-projeto.vercel.app
```

### **Dashboard de Licitações**
```
https://seu-projeto.vercel.app/licitacoes
```

### **Dashboard de Notícias**
```
https://seu-projeto.vercel.app/noticias
```

### **API - Coletar Notícias**
```
https://seu-projeto.vercel.app/api/scrape-news?sre=barbacena&pages=2
```

### **API - Coletar Licitações**
```
https://seu-projeto.vercel.app/api/scrape-specific?sre=barbacena
```

---

## Teste Rápido Pós-Deploy

```bash
# Testar homepage
curl https://seu-projeto.vercel.app

# Testar API de notícias
curl "https://seu-projeto.vercel.app/api/scrape-news?sre=barbacena&pages=1"

# Ver logs em tempo real
vercel logs --follow
```

---

## Deploy Automático

Após configuração inicial, **deploy é automático**:

```bash
# Fazer alterações
git add .
git commit -m "feat: nova funcionalidade"
git push origin main

# Vercel detecta automaticamente e faz deploy!
# Você receberá email com link da nova versão
```

---

## Rollback (se necessário)

```bash
# Listar deployments
vercel ls

# Promover deployment anterior para produção
vercel promote [deployment-url]

# Ou via dashboard:
# Vercel → Project → Deployments → ... → Promote to Production
```

---

## Configurar Domínio Customizado (Opcional)

Se você tiver um domínio próprio:

### Via Dashboard:
1. Vercel → Project Settings → Domains
2. Add Domain → Digite `licitacoes.seudominio.com.br`
3. Configure DNS conforme instruções
4. Aguardar propagação (5-30 minutos)

### Via CLI:
```bash
vercel domains add licitacoes.seudominio.com.br
vercel domains inspect licitacoes.seudominio.com.br
```

---

## Monitoramento

### Ver métricas:
```
https://vercel.com/seu-usuario/seu-projeto/analytics
```

### Ver logs:
```bash
# Logs recentes
vercel logs

# Logs de produção
vercel logs --prod

# Seguir logs (tempo real)
vercel logs --follow
```

---

## Custo Estimado

### Plano Hobby (Gratuito):
- ✅ 100 GB bandwidth/mês
- ✅ Domínio .vercel.app
- ✅ SSL automático
- ✅ Unlimited requests
- ⚠️ Timeout: 10s

**Suficiente para**: POC, demo, até ~10k visitas/mês

### Quando precisa upgrade ($20/mês):
- Timeout > 10s (scraping de muitas SREs)
- Domínio customizado
- Tráfego > 100 GB/mês
- Analytics avançado

---

## Troubleshooting

### Build falhou no Vercel:
```bash
# Testar build local
npm run build

# Ver erros detalhados
vercel logs
```

### Timeout (10s):
```bash
# Reduzir scope
# Em vez de: ?count=47&pages=3
# Usar: ?count=5&pages=1

# Ou upgrade para Pro ($20/mês)
```

### Variáveis de ambiente não funcionam:
1. Vercel dashboard → Project Settings → Environment Variables
2. Verificar se adicionou para: Production, Preview, Development
3. Redeploy: `vercel --prod`

---

## Checklist Pré-Apresentação Cliente

- [ ] Deploy funcionando
- [ ] Todas as páginas carregam
- [ ] API de coleta funciona
- [ ] Dashboards exibem dados
- [ ] Logs sem erros críticos
- [ ] Domínio configurado (se aplicável)
- [ ] README atualizado com URLs de produção
- [ ] Documentação completa

---

## Email para Cliente (Template)

```
Assunto: POC Importador de Licitações - Ambiente de Demonstração

Olá [Nome do Cliente],

O POC do Importador de Licitações e Notícias das SREs-MG está disponível para demonstração:

🌐 ACESSO:
Homepage: https://seu-projeto.vercel.app
Dashboard Licitações: https://seu-projeto.vercel.app/licitacoes
Dashboard Notícias: https://seu-projeto.vercel.app/noticias

📊 FUNCIONALIDADES:
✅ Coleta automatizada de 47 SREs
✅ Categorização com IA (8 categorias)
✅ Dashboards visuais interativos
✅ Busca e filtros avançados
✅ API REST documentada

📚 DOCUMENTAÇÃO:
Repositório GitHub: https://github.com/SEU_USUARIO/importador-licitacoes-sres-mg
README: Instruções completas de uso

🔧 SUPORTE:
Para dúvidas ou sugestões, estou à disposição.

Atenciosamente,
[Seu Nome]
```

---

## Próximos Passos

### Fase 1: Demo (CONCLUÍDO)
- ✅ Deploy no Vercel
- ✅ URLs funcionando
- ✅ Apresentação ao cliente

### Fase 2: Feedback
- [ ] Agendar reunião de demo
- [ ] Coletar feedback
- [ ] Documentar ajustes necessários

### Fase 3: Produção
- [ ] Implementar ajustes
- [ ] Configurar cron jobs (coleta diária)
- [ ] Domínio customizado
- [ ] Upgrade para Pro (se necessário)

---

**🎉 Seu POC está no ar! Pronto para impressionar o cliente!**
