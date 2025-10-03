# 🔧 Script de Validação do Sistema de Notícias
# Verifica se tudo está configurado corretamente antes de usar

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   VALIDAÇÃO DO SISTEMA DE NOTÍCIAS" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$errors = @()
$warnings = @()
$success = @()

# ===================================
# 1. Verificar estrutura de arquivos
# ===================================
Write-Host "1️⃣  Verificando arquivos necessários..." -ForegroundColor Yellow

$requiredFiles = @(
    "lib\scrapers\news-parser.ts",
    "lib\ai\categorizer.ts",
    "lib\supabase\schema-noticias.sql",
    "app\api\scrape-news\route.ts",
    "app\api\noticias\route.ts",
    "app\api\noticias\[id]\route.ts",
    "app\noticias\page.tsx",
    "app\noticias\[id]\page.tsx",
    "lib\supabase\queries.ts"
)

foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "   ✅ $file" -ForegroundColor Green
        $success += "Arquivo encontrado: $file"
    } else {
        Write-Host "   ❌ $file (FALTANDO)" -ForegroundColor Red
        $errors += "Arquivo não encontrado: $file"
    }
}

# ===================================
# 2. Verificar .env.local
# ===================================
Write-Host "`n2️⃣  Verificando configuração do Supabase..." -ForegroundColor Yellow

if (Test-Path ".env.local") {
    $envContent = Get-Content ".env.local" -Raw
    
    if ($envContent -match "NEXT_PUBLIC_SUPABASE_URL=https://[^s]") {
        Write-Host "   ✅ NEXT_PUBLIC_SUPABASE_URL configurado" -ForegroundColor Green
        $success += "Supabase URL configurada"
    } else {
        Write-Host "   ❌ NEXT_PUBLIC_SUPABASE_URL não configurado ou inválido" -ForegroundColor Red
        $errors += "Configure NEXT_PUBLIC_SUPABASE_URL no .env.local"
    }
    
    if ($envContent -match "NEXT_PUBLIC_SUPABASE_ANON_KEY=ey[A-Za-z0-9]") {
        Write-Host "   ✅ NEXT_PUBLIC_SUPABASE_ANON_KEY configurado" -ForegroundColor Green
        $success += "Supabase Anon Key configurada"
    } else {
        Write-Host "   ❌ NEXT_PUBLIC_SUPABASE_ANON_KEY não configurado ou inválido" -ForegroundColor Red
        $errors += "Configure NEXT_PUBLIC_SUPABASE_ANON_KEY no .env.local"
    }
    
    if ($envContent -match "SUPABASE_SERVICE_ROLE_KEY=ey[A-Za-z0-9]") {
        Write-Host "   ✅ SUPABASE_SERVICE_ROLE_KEY configurado" -ForegroundColor Green
        $success += "Supabase Service Role Key configurada"
    } else {
        Write-Host "   ⚠️  SUPABASE_SERVICE_ROLE_KEY não configurado" -ForegroundColor Yellow
        $warnings += "Configure SUPABASE_SERVICE_ROLE_KEY para operações server-side"
    }
} else {
    Write-Host "   ❌ Arquivo .env.local não encontrado" -ForegroundColor Red
    $errors += "Crie o arquivo .env.local baseado em .env.example"
    Write-Host "      👉 Copie .env.example para .env.local e preencha as credenciais" -ForegroundColor Yellow
}

# ===================================
# 3. Verificar servidor Next.js
# ===================================
Write-Host "`n3️⃣  Verificando servidor Next.js..." -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001" -Method GET -TimeoutSec 3 -UseBasicParsing -ErrorAction Stop
    Write-Host "   ✅ Servidor rodando em http://localhost:3001" -ForegroundColor Green
    $success += "Servidor Next.js ativo"
} catch {
    Write-Host "   ❌ Servidor não está rodando" -ForegroundColor Red
    $errors += "Inicie o servidor com: npm run dev"
}

# ===================================
# 4. Verificar API de notícias
# ===================================
Write-Host "`n4️⃣  Verificando APIs..." -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/api/noticias" -Method GET -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
    $data = $response.Content | ConvertFrom-Json
    
    if ($data.success) {
        Write-Host "   ✅ API /api/noticias respondendo" -ForegroundColor Green
        $success += "API de listagem funcionando"
        
        if ($data.noticias.Count -gt 0) {
            Write-Host "   ✅ $($data.noticias.Count) notícias encontradas no banco" -ForegroundColor Green
            $success += "$($data.noticias.Count) notícias coletadas"
        } else {
            Write-Host "   ⚠️  Nenhuma notícia no banco (execute coleta primeiro)" -ForegroundColor Yellow
            $warnings += "Execute: curl 'http://localhost:3001/api/scrape-news?sre=barbacena&pages=1'"
        }
    } else {
        Write-Host "   ❌ API retornou erro" -ForegroundColor Red
        $errors += "API /api/noticias com erro"
    }
} catch {
    Write-Host "   ❌ Erro ao conectar na API /api/noticias" -ForegroundColor Red
    $errors += "Verifique se a tabela 'noticias' existe no Supabase"
    Write-Host "      👉 Execute o SQL: lib\supabase\schema-noticias.sql" -ForegroundColor Yellow
}

# ===================================
# 5. Verificar dependências
# ===================================
Write-Host "`n5️⃣  Verificando dependências..." -ForegroundColor Yellow

if (Test-Path "package.json") {
    $packageJson = Get-Content "package.json" -Raw | ConvertFrom-Json
    
    $requiredDeps = @(
        "@supabase/supabase-js",
        "cheerio",
        "recharts",
        "lucide-react"
    )
    
    foreach ($dep in $requiredDeps) {
        if ($packageJson.dependencies.$dep) {
            Write-Host "   ✅ $dep instalado" -ForegroundColor Green
        } else {
            Write-Host "   ❌ $dep não encontrado" -ForegroundColor Red
            $errors += "Instale dependência: npm install $dep"
        }
    }
} else {
    Write-Host "   ❌ package.json não encontrado" -ForegroundColor Red
    $errors += "package.json não encontrado no diretório"
}

# ===================================
# 6. Verificar tabela no Supabase
# ===================================
Write-Host "`n6️⃣  Verificando tabela 'noticias' no Supabase..." -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/api/noticias" -Method GET -TimeoutSec 5 -UseBasicParsing -ErrorAction SilentlyContinue
    $data = $response.Content | ConvertFrom-Json
    
    if ($data.success) {
        Write-Host "   ✅ Tabela 'noticias' existe e está acessível" -ForegroundColor Green
        $success += "Tabela noticias configurada"
    }
} catch {
    Write-Host "   ❌ Tabela 'noticias' não encontrada" -ForegroundColor Red
    $errors += "Execute o SQL schema no Supabase"
    Write-Host "      👉 Acesse: https://supabase.com/dashboard" -ForegroundColor Yellow
    Write-Host "      👉 SQL Editor > New Query > Cole lib\supabase\schema-noticias.sql" -ForegroundColor Yellow
}

# ===================================
# RESUMO FINAL
# ===================================
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   RESUMO DA VALIDAÇÃO" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

if ($errors.Count -eq 0 -and $warnings.Count -eq 0) {
    Write-Host "🎉 SISTEMA 100% OPERACIONAL!" -ForegroundColor Green
    Write-Host "`n✅ Tudo está configurado corretamente!`n" -ForegroundColor Green
    Write-Host "Próximos passos:" -ForegroundColor Cyan
    Write-Host "  1. Acesse: http://localhost:3001/noticias" -ForegroundColor White
    Write-Host "  2. Colete notícias: curl 'http://localhost:3001/api/scrape-news?sre=barbacena&pages=2'`n" -ForegroundColor White
} else {
    if ($errors.Count -gt 0) {
        Write-Host "❌ ERROS ENCONTRADOS ($($errors.Count)):`n" -ForegroundColor Red
        foreach ($err in $errors) {
            Write-Host "   • $err" -ForegroundColor Red
        }
        Write-Host ""
    }
    
    if ($warnings.Count -gt 0) {
        Write-Host "⚠️  AVISOS ($($warnings.Count)):`n" -ForegroundColor Yellow
        foreach ($warn in $warnings) {
            Write-Host "   • $warn" -ForegroundColor Yellow
        }
        Write-Host ""
    }
    
    Write-Host "📋 AÇÕES NECESSÁRIAS:`n" -ForegroundColor Cyan
    
    if ($errors -match ".env.local") {
        Write-Host "  1. Criar arquivo .env.local:" -ForegroundColor White
        Write-Host "     Copy-Item .env.example .env.local" -ForegroundColor Gray
        Write-Host "     Edite .env.local com suas credenciais do Supabase`n" -ForegroundColor Gray
    }
    
    if ($errors -match "servidor|npm run dev") {
        Write-Host "  2. Iniciar servidor Next.js:" -ForegroundColor White
        Write-Host "     npm run dev`n" -ForegroundColor Gray
    }
    
    if ($errors -match "tabela|schema|SQL") {
        Write-Host "  3. Criar tabela no Supabase:" -ForegroundColor White
        Write-Host "     Acesse: https://supabase.com/dashboard" -ForegroundColor Gray
        Write-Host "     SQL Editor > New Query > Cole conteúdo de lib\supabase\schema-noticias.sql`n" -ForegroundColor Gray
    }
    
    if ($warnings -match "Execute.*scrape-news") {
        Write-Host "  4. Coletar primeira notícia:" -ForegroundColor White
        Write-Host "     curl 'http://localhost:3001/api/scrape-news?sre=barbacena&pages=1'`n" -ForegroundColor Gray
    }
}

Write-Host "📚 Documentação completa:" -ForegroundColor Cyan
Write-Host "   • INICIO-RAPIDO-NOTICIAS.md" -ForegroundColor White
Write-Host "   • COMO-TESTAR-NOTICIAS.md" -ForegroundColor White
Write-Host "   • SISTEMA-NOTICIAS-IA.md`n" -ForegroundColor White

# Retornar código de saída
if ($errors.Count -gt 0) {
    exit 1
} else {
    exit 0
}
