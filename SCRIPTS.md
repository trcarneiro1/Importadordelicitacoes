# 🤖 Scripts de Automação

Este projeto inclui vários scripts PowerShell para automatizar tarefas comuns.

## 📜 Scripts Disponíveis

### 🚀 `setup.ps1` - Setup Completo
Configura todo o projeto automaticamente.

```powershell
.\setup.ps1
```

**O que faz:**
- ✅ Verifica Node.js instalado
- ✅ Instala dependências (npm install)
- ✅ Cria/verifica .env.local
- ✅ Oferece iniciar servidor automaticamente

---

### 🎬 `demo.ps1` - Demonstração Automatizada
Executa uma demo completa do sistema.

```powershell
.\demo.ps1
```

**O que faz:**
- ✅ Verifica/inicia servidor
- ✅ Testa API de licitações
- ✅ Executa coleta de 1 SRE
- ✅ Verifica logs
- ✅ Abre navegador automaticamente

---

### 🔍 `check.ps1` - Verificação do Sistema
Verifica se tudo está configurado corretamente.

```powershell
.\check.ps1
```

**O que faz:**
- ✅ Verifica Node.js/NPM
- ✅ Verifica dependências instaladas
- ✅ Verifica .env.local configurado
- ✅ Verifica arquivos críticos
- ✅ Testa servidor
- ✅ Executa build de teste

---

### 🔍 `scrape.ps1` - Coleta Automatizada
Executa coleta de dados via API.

```powershell
# Coletar 3 SREs (padrão)
.\scrape.ps1

# Coletar 5 SREs
.\scrape.ps1 -Count 5

# Coletar SRE específica
.\scrape.ps1 -SRE "metropa"
```

**O que faz:**
- ✅ Verifica servidor rodando
- ✅ Executa coleta via API
- ✅ Mostra resultados detalhados
- ✅ Indica próximos passos

---

## 🎯 Fluxo de Trabalho Recomendado

### Primeira Vez
```powershell
# 1. Setup completo
.\setup.ps1

# 2. Configure .env.local manualmente
# 3. Execute SQL no Supabase

# 4. Verificar tudo
.\check.ps1

# 5. Demo automatizada
.\demo.ps1
```

### Desenvolvimento Diário
```powershell
# Iniciar servidor
npm run dev

# Em outro terminal, executar coleta
.\scrape.ps1 -Count 2
```

### Antes de Demonstração
```powershell
# Verificar tudo
.\check.ps1

# Demo completa
.\demo.ps1
```

---

## 💡 Dicas

### Executar Script sem Restrições
Se encontrar erro de política de execução:

```powershell
# Temporário (sessão atual)
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

# Ou executar diretamente
powershell -ExecutionPolicy Bypass -File .\setup.ps1
```

### Atalhos PowerShell
Adicione ao seu perfil (`$PROFILE`):

```powershell
# Atalhos para scripts
function sre-setup { .\setup.ps1 }
function sre-demo { .\demo.ps1 }
function sre-check { .\check.ps1 }
function sre-scrape { param($c=3) .\scrape.ps1 -Count $c }
```

Depois use:
```powershell
sre-demo
sre-scrape 5
```

---

## 🔧 Scripts NPM (package.json)

```bash
npm run dev      # Inicia servidor (porta 3001)
npm run build    # Build de produção
npm run start    # Inicia build de produção
npm run setup    # Instala dependências
npm run demo     # Alias para dev
npm run check    # Verifica build
```

---

## 📋 Troubleshooting

### Script não executa
```powershell
# Verificar política de execução
Get-ExecutionPolicy

# Liberar temporariamente
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

### Servidor não inicia
```powershell
# Verificar porta ocupada
netstat -ano | findstr :3001

# Matar processo
taskkill /PID <PID> /F

# Ou usar porta diferente
npm run dev -- -p 3002
```

### Erro de permissão
```powershell
# Executar PowerShell como Administrador
# Ou rodar com bypass
powershell -ExecutionPolicy Bypass -File .\script.ps1
```

---

## 🎓 Exemplos de Uso

### Setup inicial completo
```powershell
# Clone repo
git clone <repo>
cd importador-licitacoes

# Setup automático
.\setup.ps1
# Responda 'S' para iniciar servidor
```

### Coleta em lote
```powershell
# Terminal 1: Servidor
npm run dev

# Terminal 2: Coletas sequenciais
.\scrape.ps1 -Count 5
Start-Sleep -Seconds 5
.\scrape.ps1 -Count 5
```

### Verificação pré-deploy
```powershell
.\check.ps1
npm run build
```

---

## ✅ Checklist de Automação

- [x] Setup automatizado (setup.ps1)
- [x] Demo automatizada (demo.ps1)
- [x] Verificação de sistema (check.ps1)
- [x] Coleta automatizada (scrape.ps1)
- [x] Scripts NPM no package.json
- [ ] CI/CD (GitHub Actions) - futuro
- [ ] Deploy automatizado - futuro
- [ ] Testes automatizados - futuro

---

**Tudo automatizado para facilitar sua vida! 🚀**
