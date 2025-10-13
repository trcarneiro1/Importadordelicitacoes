# REIMPORT RAPIDO - Usa sremetropa automaticamente
# Executa direto sem perguntas

Write-Host "`n=============================================================" -ForegroundColor Cyan
Write-Host "  REIMPORT RAPIDO - sremetropa" -ForegroundColor Cyan
Write-Host "=============================================================`n" -ForegroundColor Cyan

# URL fixa
$sreUrl = "https://sremetropa.educacao.mg.gov.br/licitacoes"

Write-Host "URL: $sreUrl" -ForegroundColor Yellow
Write-Host "Processando...`n" -ForegroundColor Cyan

# Executar scraping direto
npx tsx scripts/scrape-enhanced.ts $sreUrl

Write-Host "`n=============================================================" -ForegroundColor Green
Write-Host "  CONCLUIDO!" -ForegroundColor Green
Write-Host "=============================================================`n" -ForegroundColor Green

Write-Host "Ver resultados: http://localhost:3001/operations/licitacoes`n" -ForegroundColor Cyan
