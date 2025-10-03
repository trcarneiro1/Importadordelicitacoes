#!/usr/bin/env pwsh
# Script de Demo Automatizado - POC Importador de Licitações

Write-Host "🎬 Demo Automatizada - Importador de Licitações" -ForegroundColor Cyan
Write-Host ""

# Verificar se servidor está rodando
Write-Host "✓ Verificando servidor..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001" -TimeoutSec 5 -UseBasicParsing
    Write-Host "  ✓ Servidor rodando em http://localhost:3001" -ForegroundColor Green
} catch {
    Write-Host "  ⚠️  Servidor não está rodando!" -ForegroundColor Yellow
    Write-Host "  Iniciando servidor..." -ForegroundColor Cyan
    Write-Host ""
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev"
    Write-Host "  Aguarde 10 segundos para o servidor iniciar..." -ForegroundColor Gray
    Start-Sleep -Seconds 10
}

Write-Host ""
Write-Host "🎯 Executando Demo Automatizada..." -ForegroundColor Cyan
Write-Host ""

# 1. Testar API - Listar licitações
Write-Host "1️⃣ Testando API - Listar licitações" -ForegroundColor Yellow
try {
    $licitacoes = Invoke-RestMethod -Uri "http://localhost:3001/api/licitacoes"
    Write-Host "  ✓ API funcionando! Licitações encontradas: $($licitacoes.count)" -ForegroundColor Green
} catch {
    Write-Host "  ⚠️  Nenhuma licitação ainda (normal na primeira execução)" -ForegroundColor Yellow
}

Write-Host ""

# 2. Executar coleta de 1 SRE
Write-Host "2️⃣ Coletando dados de 1 SRE (isso demora ~5-10 segundos)..." -ForegroundColor Yellow
try {
    $scrapeResult = Invoke-RestMethod -Uri "http://localhost:3001/api/scrape?count=1" -TimeoutSec 30
    Write-Host "  ✓ Coleta concluída!" -ForegroundColor Green
    Write-Host "    - SREs coletadas: $($scrapeResult.total_scraped)" -ForegroundColor Gray
    Write-Host "    - Registros encontrados: $($scrapeResult.total_records)" -ForegroundColor Gray
} catch {
    Write-Host "  ⚠️  Erro na coleta (verifique .env.local)" -ForegroundColor Red
    Write-Host "    Erro: $($_.Exception.Message)" -ForegroundColor Gray
}

Write-Host ""

# 3. Verificar logs
Write-Host "3️⃣ Verificando logs de execução" -ForegroundColor Yellow
try {
    $logs = Invoke-RestMethod -Uri "http://localhost:3001/api/logs"
    Write-Host "  ✓ Logs encontrados: $($logs.count)" -ForegroundColor Green
    if ($logs.count -gt 0) {
        $ultimoLog = $logs.data[0]
        Write-Host "    Último log: $($ultimoLog.sre_source) - Status: $($ultimoLog.status)" -ForegroundColor Gray
    }
} catch {
    Write-Host "  ⚠️  Erro ao buscar logs" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host ""
Write-Host "✅ Demo concluída!" -ForegroundColor Green
Write-Host ""
Write-Host "📱 Acesse no navegador:" -ForegroundColor Cyan
Write-Host "   → http://localhost:3001" -ForegroundColor White
Write-Host "   → http://localhost:3001/dashboard" -ForegroundColor White
Write-Host "   → http://localhost:3001/scrape" -ForegroundColor White
Write-Host ""

# Perguntar se quer abrir no navegador
$response = Read-Host "Deseja abrir no navegador? (S/n)"
if ($response -eq "" -or $response -eq "S" -or $response -eq "s") {
    Start-Process "http://localhost:3001"
}
