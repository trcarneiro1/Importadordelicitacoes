#!/usr/bin/env pwsh
# Script de Setup Automatizado - POC Importador de Licitações
# PowerShell 5.1+ / PowerShell Core

Write-Host "🚀 Setup Automatizado - Importador de Licitações" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar Node.js
Write-Host "✓ Verificando Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "  Node.js instalado: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Node.js não encontrado! Instale em https://nodejs.org" -ForegroundColor Red
    exit 1
}

# 2. Instalar dependências
Write-Host ""
Write-Host "✓ Instalando dependências..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ❌ Erro ao instalar dependências!" -ForegroundColor Red
    exit 1
}
Write-Host "  ✓ Dependências instaladas!" -ForegroundColor Green

# 3. Verificar .env.local
Write-Host ""
Write-Host "✓ Verificando configuração..." -ForegroundColor Yellow
if (Test-Path ".env.local") {
    $envContent = Get-Content ".env.local" -Raw
    if ($envContent -match "your-project|your_supabase|sua-chave") {
        Write-Host "  ⚠️  .env.local existe mas precisa ser configurado!" -ForegroundColor Yellow
        Write-Host "  📝 Edite .env.local com suas credenciais do Supabase" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "  Como obter credenciais:" -ForegroundColor White
        Write-Host "  1. Acesse https://supabase.com/dashboard" -ForegroundColor Gray
        Write-Host "  2. Crie/abra seu projeto" -ForegroundColor Gray
        Write-Host "  3. Settings > API > Copie URL e Keys" -ForegroundColor Gray
        Write-Host ""
    } else {
        Write-Host "  ✓ .env.local configurado!" -ForegroundColor Green
    }
} else {
    Write-Host "  ⚠️  Criando .env.local do template..." -ForegroundColor Yellow
    Copy-Item ".env.local.example" ".env.local"
    Write-Host "  📝 .env.local criado! Configure com suas credenciais do Supabase" -ForegroundColor Cyan
    Write-Host ""
}

# 4. Verificar banco de dados
Write-Host ""
Write-Host "✓ Próximos passos:" -ForegroundColor Yellow
Write-Host "  1. Configure .env.local com credenciais do Supabase" -ForegroundColor White
Write-Host "  2. Execute o SQL em lib/supabase/schema.sql no Supabase" -ForegroundColor White
Write-Host "  3. Rode: npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "📚 Documentação completa em README.md" -ForegroundColor Cyan
Write-Host "🎯 Guia de demonstração em DEMO-GUIDE.md" -ForegroundColor Cyan
Write-Host ""

# Perguntar se quer iniciar agora
$response = Read-Host "Deseja iniciar o servidor agora? (S/n)"
if ($response -eq "" -or $response -eq "S" -or $response -eq "s") {
    Write-Host ""
    Write-Host "🚀 Iniciando servidor em http://localhost:3001..." -ForegroundColor Green
    Write-Host ""
    npm run dev
} else {
    Write-Host ""
    Write-Host "✅ Setup completo! Execute 'npm run dev' quando estiver pronto." -ForegroundColor Green
}
