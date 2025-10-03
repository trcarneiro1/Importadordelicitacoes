#!/usr/bin/env pwsh
# Script de Verificação - POC Importador de Licitações

Write-Host "🔍 Verificação do Sistema" -ForegroundColor Cyan
Write-Host ""

$allOk = $true

# 1. Node.js
Write-Host "1️⃣ Node.js" -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "  ✓ $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Não instalado" -ForegroundColor Red
    $allOk = $false
}

# 2. NPM
Write-Host ""
Write-Host "2️⃣ NPM" -ForegroundColor Yellow
try {
    $npmVersion = npm --version
    Write-Host "  ✓ v$npmVersion" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Não instalado" -ForegroundColor Red
    $allOk = $false
}

# 3. Dependências
Write-Host ""
Write-Host "3️⃣ Dependências" -ForegroundColor Yellow
if (Test-Path "node_modules") {
    $packageCount = (Get-ChildItem "node_modules" -Directory).Count
    Write-Host "  ✓ $packageCount pacotes instalados" -ForegroundColor Green
} else {
    Write-Host "  ❌ node_modules não encontrado - Execute: npm install" -ForegroundColor Red
    $allOk = $false
}

# 4. Configuração
Write-Host ""
Write-Host "4️⃣ Configuração (.env.local)" -ForegroundColor Yellow
if (Test-Path ".env.local") {
    $envContent = Get-Content ".env.local" -Raw
    if ($envContent -match "your-project|your_supabase|sua-chave") {
        Write-Host "  ⚠️  Arquivo existe mas precisa ser configurado" -ForegroundColor Yellow
        $allOk = $false
    } else {
        Write-Host "  ✓ Configurado" -ForegroundColor Green
    }
} else {
    Write-Host "  ❌ .env.local não encontrado" -ForegroundColor Red
    $allOk = $false
}

# 5. Arquivos Críticos
Write-Host ""
Write-Host "5️⃣ Arquivos Críticos" -ForegroundColor Yellow
$criticalFiles = @(
    "app/page.tsx",
    "app/dashboard/page.tsx",
    "app/scrape/page.tsx",
    "app/api/scrape/route.ts",
    "app/api/licitacoes/route.ts",
    "lib/supabase/client.ts",
    "lib/supabase/queries.ts",
    "lib/scrapers/sre-scraper.ts"
)

$missingFiles = @()
foreach ($file in $criticalFiles) {
    if (Test-Path $file) {
        Write-Host "  ✓ $file" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $file" -ForegroundColor Red
        $missingFiles += $file
        $allOk = $false
    }
}

# 6. Servidor
Write-Host ""
Write-Host "6️⃣ Servidor" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001" -TimeoutSec 3 -UseBasicParsing
    Write-Host "  ✓ Rodando em http://localhost:3001" -ForegroundColor Green
} catch {
    Write-Host "  ⚠️  Não está rodando - Execute: npm run dev" -ForegroundColor Yellow
}

# 7. Build
Write-Host ""
Write-Host "7️⃣ Verificação de Build (pode demorar...)" -ForegroundColor Yellow
Write-Host "  Executando npm run build..." -ForegroundColor Gray
$buildOutput = npm run build 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✓ Build OK!" -ForegroundColor Green
} else {
    Write-Host "  ❌ Build com erros" -ForegroundColor Red
    Write-Host "    Execute 'npm run build' para ver detalhes" -ForegroundColor Gray
    $allOk = $false
}

# Resumo
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host ""

if ($allOk) {
    Write-Host "✅ Sistema OK! Tudo funcionando." -ForegroundColor Green
    Write-Host ""
    Write-Host "Para iniciar:" -ForegroundColor White
    Write-Host "  npm run dev" -ForegroundColor Cyan
} else {
    Write-Host "⚠️  Problemas encontrados!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Ações recomendadas:" -ForegroundColor White
    Write-Host "  1. npm install" -ForegroundColor Cyan
    Write-Host "  2. Configure .env.local" -ForegroundColor Cyan
    Write-Host "  3. npm run dev" -ForegroundColor Cyan
}

Write-Host ""
