# ============================================
# TESTE DO SISTEMA DE NOTÍCIAS COM IA
# ============================================
# Script para testar coleta e categorização
# de notícias das SREs de Minas Gerais
# ============================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  TESTE: Sistema de Notícias com IA   " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:3001"

# Verificar se servidor está rodando
Write-Host "1. Verificando servidor..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/licitacoes" -UseBasicParsing -TimeoutSec 5
    Write-Host "   [OK] Servidor rodando em $baseUrl" -ForegroundColor Green
} catch {
    Write-Host "   [ERRO] Servidor não está rodando!" -ForegroundColor Red
    Write-Host "   Execute 'npm run dev' primeiro" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  TESTE 1: Coletar Notícias (1 SRE)   " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Coletando notícias da SRE Barbacena..." -ForegroundColor Yellow
Write-Host "Endpoint: GET /api/scrape-news?sre=barbacena&pages=2" -ForegroundColor Gray
Write-Host ""

try {
    $startTime = Get-Date
    
    $response = Invoke-RestMethod -Uri "$baseUrl/api/scrape-news?sre=barbacena&pages=2" -Method Get
    
    $endTime = Get-Date
    $duration = ($endTime - $startTime).TotalSeconds
    
    if ($response.success) {
        Write-Host "[SUCESSO] Coleta concluída em $([math]::Round($duration, 1))s" -ForegroundColor Green
        Write-Host ""
        Write-Host "RESUMO:" -ForegroundColor Cyan
        Write-Host "  SREs processadas: $($response.resumo.sres_processadas)" -ForegroundColor White
        Write-Host "  Notícias coletadas: $($response.resumo.noticias_coletadas)" -ForegroundColor White
        Write-Host "  Notícias categorizadas: $($response.resumo.noticias_categorizadas)" -ForegroundColor White
        Write-Host "  Notícias salvas no banco: $($response.resumo.noticias_salvas_banco)" -ForegroundColor White
        Write-Host "  Tempo total: $([math]::Round($response.resumo.tempo_total_ms / 1000, 1))s" -ForegroundColor White
        
        Write-Host ""
        Write-Host "CATEGORIAS ENCONTRADAS:" -ForegroundColor Cyan
        foreach ($categoria in $response.estatisticas.por_categoria.PSObject.Properties) {
            Write-Host "  $($categoria.Name): $($categoria.Value)" -ForegroundColor White
        }
        
        Write-Host ""
        Write-Host "PRIORIDADES:" -ForegroundColor Cyan
        foreach ($prioridade in $response.estatisticas.por_prioridade.PSObject.Properties) {
            $cor = switch($prioridade.Name) {
                "alta" { "Red" }
                "media" { "Yellow" }
                "baixa" { "Gray" }
                default { "White" }
            }
            Write-Host "  $($prioridade.Name): $($prioridade.Value)" -ForegroundColor $cor
        }
        
        if ($response.erros -and $response.erros.Count -gt 0) {
            Write-Host ""
            Write-Host "ERROS ENCONTRADOS:" -ForegroundColor Yellow
            foreach ($erro in $response.erros) {
                Write-Host "  - $erro" -ForegroundColor Yellow
            }
        }
    } else {
        Write-Host "[ERRO] Falha na coleta" -ForegroundColor Red
        Write-Host "Mensagem: $($response.error)" -ForegroundColor Red
    }
    
} catch {
    Write-Host "[ERRO] Exceção durante coleta" -ForegroundColor Red
    Write-Host "Mensagem: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  TESTE 2: Coletar Múltiplas SREs     " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$opcao = Read-Host "Deseja coletar de 3 SREs (1 página cada)? (S/N)"

if ($opcao -eq "S" -or $opcao -eq "s") {
    Write-Host ""
    Write-Host "Coletando de 3 SREs..." -ForegroundColor Yellow
    Write-Host "Endpoint: GET /api/scrape-news?count=3&pages=1" -ForegroundColor Gray
    Write-Host ""
    
    try {
        $startTime = Get-Date
        
        $response = Invoke-RestMethod -Uri "$baseUrl/api/scrape-news?count=3&pages=1" -Method Get
        
        $endTime = Get-Date
        $duration = ($endTime - $startTime).TotalSeconds
        
        if ($response.success) {
            Write-Host "[SUCESSO] Coleta concluída em $([math]::Round($duration, 1))s" -ForegroundColor Green
            Write-Host ""
            Write-Host "RESUMO:" -ForegroundColor Cyan
            Write-Host "  SREs processadas: $($response.resumo.sres_processadas)" -ForegroundColor White
            Write-Host "  Notícias coletadas: $($response.resumo.noticias_coletadas)" -ForegroundColor White
            Write-Host "  Notícias categorizadas: $($response.resumo.noticias_categorizadas)" -ForegroundColor White
            Write-Host "  Notícias salvas: $($response.resumo.noticias_salvas_banco)" -ForegroundColor White
            
            Write-Host ""
            Write-Host "DETALHES POR SRE:" -ForegroundColor Cyan
            foreach ($sre in $response.detalhes_por_sre) {
                if ($sre.success) {
                    Write-Host "  $($sre.sre): $($sre.noticias_coletadas) notícias" -ForegroundColor Green
                } else {
                    Write-Host "  $($sre.sre): FALHA - $($sre.error)" -ForegroundColor Red
                }
            }
            
            Write-Host ""
            Write-Host "CATEGORIAS TOTAIS:" -ForegroundColor Cyan
            foreach ($categoria in $response.estatisticas.por_categoria.PSObject.Properties) {
                Write-Host "  $($categoria.Name): $($categoria.Value)" -ForegroundColor White
            }
        } else {
            Write-Host "[ERRO] Falha na coleta" -ForegroundColor Red
        }
        
    } catch {
        Write-Host "[ERRO] Exceção durante coleta" -ForegroundColor Red
        Write-Host "Mensagem: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "Teste 2 pulado." -ForegroundColor Gray
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  TESTE 3: POST com SREs Específicas  " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$opcao = Read-Host "Deseja testar POST com SREs específicas? (S/N)"

if ($opcao -eq "S" -or $opcao -eq "s") {
    Write-Host ""
    Write-Host "Coletando de Barbacena e Ubá..." -ForegroundColor Yellow
    Write-Host "Endpoint: POST /api/scrape-news" -ForegroundColor Gray
    Write-Host ""
    
    $body = @{
        sres = @("barbacena", "uba")
        pages = 2
    } | ConvertTo-Json
    
    try {
        $startTime = Get-Date
        
        $response = Invoke-RestMethod -Uri "$baseUrl/api/scrape-news" -Method Post -Body $body -ContentType "application/json"
        
        $endTime = Get-Date
        $duration = ($endTime - $startTime).TotalSeconds
        
        if ($response.success) {
            Write-Host "[SUCESSO] Coleta concluída em $([math]::Round($duration, 1))s" -ForegroundColor Green
            Write-Host ""
            Write-Host "RESUMO:" -ForegroundColor Cyan
            Write-Host "  Notícias coletadas: $($response.resumo.noticias_coletadas)" -ForegroundColor White
            Write-Host "  Notícias salvas: $($response.resumo.noticias_salvas_banco)" -ForegroundColor White
        } else {
            Write-Host "[ERRO] Falha na coleta" -ForegroundColor Red
        }
        
    } catch {
        Write-Host "[ERRO] Exceção durante coleta" -ForegroundColor Red
        Write-Host "Mensagem: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "Teste 3 pulado." -ForegroundColor Gray
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  RESUMO DOS TESTES                   " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "TESTES CONCLUÍDOS!" -ForegroundColor Green
Write-Host ""
Write-Host "PRÓXIMOS PASSOS:" -ForegroundColor Yellow
Write-Host "  1. Verificar dados no Supabase" -ForegroundColor White
Write-Host "     SELECT * FROM noticias ORDER BY created_at DESC LIMIT 10;" -ForegroundColor Gray
Write-Host ""
Write-Host "  2. Testar busca por categoria" -ForegroundColor White
Write-Host "     SELECT categoria_ia, COUNT(*) FROM noticias GROUP BY categoria_ia;" -ForegroundColor Gray
Write-Host ""
Write-Host "  3. Ver tags populares" -ForegroundColor White
Write-Host "     SELECT * FROM noticias_tags_populares;" -ForegroundColor Gray
Write-Host ""
Write-Host "  4. Criar dashboard de notícias" -ForegroundColor White
Write-Host "     Implemente app/noticias/page.tsx" -ForegroundColor Gray
Write-Host ""

Write-Host "Documentação completa em SISTEMA-NOTICIAS-IA.md" -ForegroundColor Cyan
Write-Host ""
