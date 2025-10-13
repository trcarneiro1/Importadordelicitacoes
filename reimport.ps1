# SCRIPT DE REIMPORT COMPLETO
# 1. Limpa o banco de dados
# 2. Faz scraping melhorado com MUITO MAIS DADOS

Write-Host "`n=============================================================" -ForegroundColor Cyan
Write-Host "  REIMPORT COMPLETO - Licitacoes Enhanced" -ForegroundColor Cyan
Write-Host "=============================================================`n" -ForegroundColor Cyan

# Passo 1: Limpar banco
Write-Host "Passo 1: Limpando banco de dados..." -ForegroundColor Yellow
Write-Host "   ATENCAO: Todas as licitacoes serao DELETADAS!`n" -ForegroundColor Red

$confirmacao = Read-Host "   Digite 'SIM' para continuar"

if ($confirmacao -ne "SIM") {
    Write-Host "`nOperacao cancelada pelo usuario.`n" -ForegroundColor Red
    exit
}

Write-Host "`n   Deletando licitacoes..." -ForegroundColor Yellow

# Criar arquivo SQL temporário
$sqlContent = "DELETE FROM licitacoes;"
$sqlFile = "temp-delete.sql"
Set-Content -Path $sqlFile -Value $sqlContent

# Executar via Prisma
npx prisma db execute --file=$sqlFile --schema=./prisma/schema.prisma

# Remover arquivo temporário
Remove-Item $sqlFile -ErrorAction SilentlyContinue

if ($LASTEXITCODE -eq 0) {
    Write-Host "   Banco limpo com sucesso!`n" -ForegroundColor Green
} else {
    Write-Host "   Aviso: Possivel erro ao limpar (continuando...)`n" -ForegroundColor Yellow
}

# Passo 2: Scraping Enhanced
Write-Host "`nPasso 2: Iniciando scraping ENHANCED..." -ForegroundColor Yellow
Write-Host "   Capturando dados COMPLETOS de cada licitacao`n" -ForegroundColor Cyan

Write-Host "   Pressione ENTER para usar sremetropa padrao" -ForegroundColor Gray
Write-Host "   Ou digite a URL completa do SRE:`n" -ForegroundColor Gray
$sreUrlInput = Read-Host "   URL do SRE"

if ([string]::IsNullOrWhiteSpace($sreUrlInput)) {
    $sreUrl = "https://sremetropa.educacao.mg.gov.br/licitacoes"
    Write-Host "   Usando URL padrao: $sreUrl`n" -ForegroundColor Cyan
} else {
    $sreUrl = $sreUrlInput
    Write-Host "   Usando URL informada: $sreUrl`n" -ForegroundColor Cyan
}

npx tsx scripts/scrape-enhanced.ts $sreUrl

Write-Host "`n=============================================================" -ForegroundColor Green
Write-Host "  REIMPORT CONCLUIDO COM SUCESSO!" -ForegroundColor Green
Write-Host "=============================================================`n" -ForegroundColor Green

Write-Host "Verifique os resultados no dashboard:`n" -ForegroundColor Cyan
Write-Host "   http://localhost:3001/operations/licitacoes`n" -ForegroundColor White
