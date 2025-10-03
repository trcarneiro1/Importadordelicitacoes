#!/usr/bin/env pwsh
# Quick Start - POC Importador de Licitações
# Execute este script para iniciar rapidamente

Write-Host "⚡ Quick Start - Importador de Licitações" -ForegroundColor Cyan
Write-Host ""

# Verificar se node_modules existe
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Instalando dependências..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erro ao instalar dependências!" -ForegroundColor Red
        exit 1
    }
}

# Verificar .env.local
if (-not (Test-Path ".env.local")) {
    Write-Host "⚠️  Criando .env.local..." -ForegroundColor Yellow
    Copy-Item ".env.local.example" ".env.local"
    Write-Host ""
    Write-Host "📝 ATENÇÃO: Configure o .env.local com suas credenciais do Supabase!" -ForegroundColor Red
    Write-Host ""
    $response = Read-Host "Deseja abrir .env.local para editar agora? (S/n)"
    if ($response -eq "" -or $response -eq "S" -or $response -eq "s") {
        notepad .env.local
        Write-Host ""
        Read-Host "Pressione ENTER após configurar e salvar o arquivo"
    }
}

# Iniciar servidor
Write-Host ""
Write-Host "🚀 Iniciando servidor..." -ForegroundColor Green
Write-Host ""
Write-Host "   Acesse: http://localhost:3001" -ForegroundColor Cyan
Write-Host "   Dashboard: http://localhost:3001/dashboard" -ForegroundColor Cyan
Write-Host "   Coleta: http://localhost:3001/scrape" -ForegroundColor Cyan
Write-Host ""
Write-Host "   Pressione Ctrl+C para parar" -ForegroundColor Gray
Write-Host ""

npm run dev
