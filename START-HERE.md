# 🎯 START HERE - Importador de Licitações POC

## ⚡ Início Rápido (1 minuto)

```powershell
# Tudo em um comando!
.\start.ps1
```

## 📚 Ordem de Leitura dos Documentos

Para entender o projeto, leia nesta ordem:

1. **README.md** - Visão geral e setup manual
2. **SCRIPTS.md** - Scripts de automação (setup, demo, check, scrape)
3. **DEMO-GUIDE.md** - Como apresentar para o cliente
4. **DELIVERY-CHECKLIST.md** - O que foi entregue
5. **COMMANDS.md** - Comandos úteis avançados

## 🚀 Fluxos de Trabalho

### Primeira Vez - Setup Completo
```powershell
# 1. Setup automatizado
.\setup.ps1

# 2. Configure .env.local com credenciais Supabase
# 3. Execute SQL em lib/supabase/schema.sql

# 4. Verificar
.\check.ps1

# 5. Demo
.\demo.ps1
```

### Uso Diário - Desenvolvimento
```powershell
# Iniciar servidor
npm run dev
# ou
.\start.ps1

# Em outro terminal: coletar dados
.\scrape.ps1 -Count 3
```

### Antes de Apresentação
```powershell
# Verificar tudo
.\check.ps1

# Demo automatizada
.\demo.ps1
```

## 📂 Estrutura do Projeto

```
importadordelicitacoes/
│
├── 📄 START-HERE.md          ← VOCÊ ESTÁ AQUI
├── 📄 README.md               ← Documentação principal
├── 📄 DEMO-GUIDE.md           ← Guia de apresentação
├── 📄 SCRIPTS.md              ← Scripts de automação
├── 📄 COMMANDS.md             ← Comandos úteis
├── 📄 DELIVERY-CHECKLIST.md   ← Lista de entregáveis
│
├── 🤖 Scripts PowerShell (AUTOMATIZAÇÃO)
│   ├── setup.ps1              ← Setup completo
│   ├── start.ps1              ← Início rápido
│   ├── demo.ps1               ← Demo automatizada
│   ├── check.ps1              ← Verificação
│   └── scrape.ps1             ← Coleta automatizada
│
├── 📁 app/                    ← Next.js App Router
│   ├── page.tsx               ← Homepage
│   ├── dashboard/             ← Dashboard de visualização
│   ├── scrape/                ← Interface de coleta
│   └── api/                   ← API REST endpoints
│
├── 📁 lib/                    ← Bibliotecas
│   ├── scrapers/              ← Web scraping
│   └── supabase/              ← Database
│
├── 📁 .github/
│   └── copilot-instructions.md ← Instruções para AI
│
├── ⚙️ Configuração
│   ├── .env.local             ← Suas credenciais (configure!)
│   ├── .env.local.example     ← Template
│   ├── package.json           ← Dependências
│   └── tsconfig.json          ← TypeScript
│
└── 📝 SREs.txt                ← 47 URLs das SREs
```

## 🎯 Comandos Essenciais

### NPM Scripts
```bash
npm run dev      # Inicia servidor (porta 3001)
npm run build    # Build de produção
npm run start    # Inicia produção
npm run check    # Verifica build
```

### Scripts PowerShell
```powershell
.\start.ps1              # Início rápido
.\setup.ps1              # Setup completo
.\demo.ps1               # Demo automatizada
.\check.ps1              # Verificação
.\scrape.ps1 -Count 5    # Coletar 5 SREs
```

### APIs
```bash
# Listar licitações
curl http://localhost:3001/api/licitacoes

# Coletar dados
curl http://localhost:3001/api/scrape?count=2

# Ver logs
curl http://localhost:3001/api/logs
```

## ✅ Checklist Pré-Uso

- [ ] Node.js 18+ instalado
- [ ] NPM atualizado
- [ ] Conta Supabase criada
- [ ] `.env.local` configurado
- [ ] SQL executado no Supabase
- [ ] `npm install` executado
- [ ] Servidor rodando (`npm run dev`)

## 🔧 Resolução Rápida de Problemas

### Erro ao executar script PowerShell
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\setup.ps1
```

### Porta 3001 ocupada
```powershell
# Ver processo
netstat -ano | findstr :3001

# Matar processo
taskkill /PID <PID> /F

# Ou usar porta diferente
npm run dev -- -p 3002
```

### Erro de build
```powershell
# Limpar cache
Remove-Item -Recurse -Force .next, node_modules
npm install
npm run build
```

### Supabase não conecta
1. Verificar `.env.local` configurado
2. Verificar credenciais corretas
3. Verificar SQL executado
4. Testar conexão no Supabase Dashboard

## 🎓 Recursos

### Documentação
- **Next.js**: https://nextjs.org/docs
- **Supabase**: https://supabase.com/docs
- **TypeScript**: https://www.typescriptlang.org/docs

### Suporte
- Issues: (adicionar link do GitHub)
- Email: (adicionar email)

## 🎯 Próximos Passos

Após setup inicial:

1. **Testar coleta**: `.\scrape.ps1 -Count 1`
2. **Ver dashboard**: http://localhost:3001/dashboard
3. **Ler DEMO-GUIDE.md** para apresentação
4. **Explorar código** em `/app` e `/lib`

## 💡 Dicas

### Atalhos Úteis
```powershell
# Adicione ao seu $PROFILE
function sre { Set-Location "h:\projetos\Importadordelicitacoes" }
function sre-start { .\start.ps1 }
function sre-demo { .\demo.ps1 }
function sre-scrape { param($n=3) .\scrape.ps1 -Count $n }
```

### VS Code
```bash
# Abrir projeto
code .

# Tasks recomendadas (Ctrl+Shift+B):
- npm: dev
- npm: build
```

### Git
```bash
# Ignorar .env.local (já configurado)
git status  # Verificar que .env.local não aparece

# Commit
git add .
git commit -m "feat: POC completo"
git push
```

## 🚨 Importante

⚠️ **Nunca commitar .env.local** (já está no .gitignore)
⚠️ **Configurar Supabase antes de usar** (senão APIs falham)
⚠️ **Executar SQL schema** (lib/supabase/schema.sql)

## ✅ Status do Projeto

- [x] ✅ POC completo e funcional
- [x] ✅ Documentação completa
- [x] ✅ Scripts de automação
- [x] ✅ API REST funcionando
- [x] ✅ Dashboard web
- [x] ✅ Web scraping genérico
- [x] ✅ Integração Supabase
- [x] ✅ TypeScript 100%
- [x] ✅ Zero erros de compilação
- [x] ✅ Pronto para demonstração

---

**Versão**: 1.0.0 (POC)  
**Data**: Outubro 2025  
**Status**: ✅ COMPLETO

🎉 **Tudo pronto para usar! Execute `.\start.ps1` e comece!**
