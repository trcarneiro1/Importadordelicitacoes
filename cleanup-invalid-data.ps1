# Script de Limpeza de Dados Inválidos
# Uso: .\cleanup-invalid-data.ps1

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "🧹 SCRIPT DE LIMPEZA DE DADOS" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se node_modules existe
if (!(Test-Path "node_modules")) {
    Write-Host "❌ node_modules não encontrado. Execute 'npm install' primeiro." -ForegroundColor Red
    exit 1
}

# Executar script TypeScript
Write-Host "🔄 Iniciando limpeza..." -ForegroundColor Yellow
Write-Host ""

npx ts-node lib/prisma/cleanup.ts

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ LIMPEZA CONCLUÍDA COM SUCESSO!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 Próximos passos:" -ForegroundColor Cyan
    Write-Host "  1. Visualizar dados brutos: http://localhost:3001/operations/licitacoes-raw" -ForegroundColor Gray
    Write-Host "  2. Processar com IA: npm run process-ia" -ForegroundColor Gray
    Write-Host "  3. Ver resultados finais: http://localhost:3001/operations/licitacoes" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ ERRO DURANTE A LIMPEZA" -ForegroundColor Red
    Write-Host ""
    exit 1
}
