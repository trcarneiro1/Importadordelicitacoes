# ⚡ Comandos Essenciais - POC Licitações

## 🚀 Setup Inicial

```bash
# Instalar dependências
npm install

# Executar em desenvolvimento
npm run dev

# Abrir no navegador
# http://localhost:3000
```

## 🏗️ Build e Deploy

```bash
# Build para produção
npm run build

# Executar build localmente
npm start

# Lint do código
npm run lint
```

## 🗄️ Supabase

### Criar Projeto
1. Acesse https://supabase.com/dashboard
2. Click "New Project"
3. Preencha nome e senha
4. Aguarde criação (~2 min)

### Configurar Banco
```sql
-- Cole no SQL Editor do Supabase:
-- Copie conteúdo de lib/supabase/schema.sql
-- Clique em Run
```

### Obter Credenciais
```
Settings > API > 
- Project URL
- anon public (Reveal)
- service_role (Reveal)
```

## 🧪 Testes Manuais

### Testar Coleta (Browser)
```
1. http://localhost:3000/scrape
2. Escolher 1 SRE
3. Clicar "Iniciar Coleta"
4. Aguardar resultados
```

### Testar API (cURL)

```bash
# Coletar 2 SREs
curl http://localhost:3000/api/scrape?count=2

# Listar licitações
curl http://localhost:3000/api/licitacoes

# Ver logs
curl http://localhost:3000/api/logs
```

### Testar API (PowerShell)

```powershell
# Coletar 2 SREs
Invoke-RestMethod -Uri "http://localhost:3000/api/scrape?count=2"

# Listar licitações
Invoke-RestMethod -Uri "http://localhost:3000/api/licitacoes"

# Ver logs
Invoke-RestMethod -Uri "http://localhost:3000/api/logs"
```

## 📊 Monitoramento

### Ver Logs em Tempo Real
```bash
# Terminal onde rodou npm run dev
# Logs aparecem automaticamente
```

### Verificar Banco de Dados
```
Supabase Dashboard > Table Editor > 
- licitacoes (dados coletados)
- scraping_logs (histórico)
```

## 🐛 Troubleshooting

### Erro: "Module not found"
```bash
# Reinstalar dependências
rm -rf node_modules package-lock.json
npm install
```

### Erro: "Supabase environment variables"
```bash
# Verificar .env.local existe
ls .env.local

# Ver conteúdo (sem mostrar senhas)
Get-Content .env.local | Select-String "NEXT_PUBLIC"
```

### Porta 3000 ocupada
```bash
# Usar porta diferente
npm run dev -- -p 3001

# Ou matar processo na porta 3000
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Build com erros
```bash
# Limpar cache do Next.js
rm -rf .next
npm run build
```

## 🔧 Utilitários

### Contar Linhas de Código
```powershell
# PowerShell
Get-ChildItem -Path . -Include *.ts,*.tsx -Recurse | 
  Where-Object { $_.FullName -notlike "*node_modules*" } | 
  Measure-Object -Line -Sum

# Bash
find . -name "*.ts" -o -name "*.tsx" | 
  grep -v node_modules | 
  xargs wc -l
```

### Verificar Dependências Desatualizadas
```bash
npm outdated
```

### Atualizar Dependências
```bash
# Atualizar minor versions
npm update

# Atualizar major versions (cuidado!)
npx npm-check-updates -u
npm install
```

## 🌐 Deploy Vercel

### Via CLI
```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Deploy para produção
vercel --prod
```

### Via Dashboard
```
1. https://vercel.com/new
2. Import Git Repository
3. Configure:
   - Framework: Next.js
   - Build Command: npm run build
   - Output Directory: .next
4. Environment Variables:
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - SUPABASE_SERVICE_ROLE_KEY
5. Deploy
```

## 📦 Backup

### Exportar Dados do Supabase
```sql
-- No SQL Editor:
COPY licitacoes TO '/tmp/licitacoes_backup.csv' 
  WITH (FORMAT CSV, HEADER);

COPY scraping_logs TO '/tmp/logs_backup.csv' 
  WITH (FORMAT CSV, HEADER);
```

### Backup Código
```bash
# Git
git add .
git commit -m "Backup $(date)"
git push

# ZIP
tar -czf backup-$(date +%Y%m%d).tar.gz \
  --exclude=node_modules \
  --exclude=.next \
  .
```

## 🎯 Atalhos Úteis

### Desenvolvimento
```bash
# Abrir VSCode
code .

# Abrir no browser
start http://localhost:3000

# Ver diferenças Git
git diff

# Status Git
git status
```

### Produção
```bash
# Verificar build
npm run build && npm start

# Testar produção local
PORT=3000 npm start
```

## 📱 Acesso Remoto (Demo)

### ngrok (Expor localhost)
```bash
# Instalar: https://ngrok.com/download
ngrok http 3000

# Copiar URL gerada: https://xxxx.ngrok.io
# Enviar para cliente testar
```

## 🔐 Segurança

### Verificar Vulnerabilidades
```bash
npm audit

# Corrigir automaticamente
npm audit fix

# Forçar correções (breaking changes)
npm audit fix --force
```

### Variáveis de Ambiente
```bash
# NUNCA commite .env.local
# Sempre use .env.local.example como template

# Verificar se .env.local está no .gitignore
cat .gitignore | grep .env
```

## 📈 Performance

### Analisar Bundle
```bash
# Instalar analyzer
npm install -D @next/bundle-analyzer

# Adicionar em next.config.ts:
# withBundleAnalyzer({ enabled: true })

# Build e analisar
ANALYZE=true npm run build
```

### Verificar Tamanho
```bash
npm run build

# Ver output:
# Page Size First Load JS
```

## ✅ Checklist Pré-Demo

```bash
# 1. Dependências instaladas
npm list --depth=0

# 2. Build sem erros
npm run build

# 3. Supabase configurado
# - Verificar .env.local
# - Testar conexão no dashboard

# 4. Dados de exemplo
# - Rodar coleta de 1 SRE
# - Verificar no dashboard

# 5. API funcionando
curl http://localhost:3000/api/licitacoes

# ✅ PRONTO PARA DEMO!
```

---

**Última atualização**: Outubro 2025
