#!/usr/bin/env pwsh
# Script de Coleta Automatizada - POC Importador de Licitações

param(
    [int]$Count = 3,
    [string]$SRE = ""
)

Write-Host "🔍 Coleta Automatizada de Licitações" -ForegroundColor Cyan
Write-Host ""

# Verificar servidor
Write-Host "✓ Verificando servidor..." -ForegroundColor Yellow
try {
    $null = Invoke-WebRequest -Uri "http://localhost:3001" -TimeoutSec 3 -UseBasicParsing
    Write-Host "  ✓ Servidor OK" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Servidor não está rodando!" -ForegroundColor Red
    Write-Host "  Execute 'npm run dev' em outro terminal" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Executar coleta
if ($SRE -ne "") {
    Write-Host "🎯 Coletando SRE específica: $SRE" -ForegroundColor Cyan
    $url = "http://localhost:3001/api/scrape?sre=$SRE"
} else {
    Write-Host "🎯 Coletando $Count SRE(s)..." -ForegroundColor Cyan
    $url = "http://localhost:3001/api/scrape?count=$Count"
}

Write-Host "  ⏳ Aguarde... (2s por SRE)" -ForegroundColor Gray
Write-Host ""

try {
    $result = Invoke-RestMethod -Uri $url -TimeoutSec 120
    
    if ($result.success) {
        Write-Host "✅ Coleta concluída com sucesso!" -ForegroundColor Green
        Write-Host ""
        Write-Host "📊 Resultados:" -ForegroundColor Cyan
        Write-Host "  • SREs coletadas: $($result.total_scraped)" -ForegroundColor White
        Write-Host "  • Registros encontrados: $($result.total_records)" -ForegroundColor White
        Write-Host ""
        
        if ($result.results) {
            Write-Host "📋 Detalhes por SRE:" -ForegroundColor Cyan
            foreach ($r in $result.results) {
                if ($r.success) {
                    Write-Host "  ✓ $($r.sre_source): $($r.licitacoes.Count) registros" -ForegroundColor Green
                } else {
                    Write-Host "  ✗ $($r.sre_source): Erro - $($r.error)" -ForegroundColor Red
                }
            }
        }
        
        Write-Host ""
        Write-Host "🎯 Próximos passos:" -ForegroundColor Cyan
        Write-Host "  • Ver dashboard: http://localhost:3001/dashboard" -ForegroundColor White
        Write-Host "  • Ver API: http://localhost:3001/api/licitacoes" -ForegroundColor White
        
    } else {
        Write-Host "❌ Erro na coleta: $($result.error)" -ForegroundColor Red
    }
    
} catch {
    Write-Host "❌ Erro ao executar coleta!" -ForegroundColor Red
    Write-Host "  $($_.Exception.Message)" -ForegroundColor Gray
    exit 1
}

Write-Host ""
