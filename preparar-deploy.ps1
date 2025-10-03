#!/usr/bin/env pwsh
# ============================================
# Script de Preparação para Deploy
# ============================================
# Valida e prepara o projeto para deploy

Write-Host "`n🚀 PREPARANDO PROJETO PARA DEPLOY`n" -ForegroundColor Cyan

$errors = @()
$warnings = @()

# ============================================
# 1. VERIFICAR GIT
# ============================================
Write-Host "📂 Verificando Git..." -ForegroundColor Yellow

if (-not (Test-Path ".git")) {
    $errors += "❌ Repositório Git não inicializado"
    Write-Host "   ❌ Git não inicializado" -ForegroundColor Red
    Write-Host "   💡 Execute: git init" -ForegroundColor Gray
} else {
    Write-Host "   ✅ Git inicializado" -ForegroundColor Green
    
    # Verificar remote
    $remote = git remote -v 2>$null
    if (-not $remote) {
        $warnings += "⚠️  Nenhum remote configurado"
        Write-Host "   ⚠️  Remote não configurado" -ForegroundColor Yellow
        Write-Host "   💡 Execute: git remote add origin https://github.com/USUARIO/REPO.git" -ForegroundColor Gray
    } else {
        Write-Host "   ✅ Remote configurado" -ForegroundColor Green
        Write-Host "      $($remote[0])" -ForegroundColor Gray
    }
    
    # Verificar uncommitted changes
    $status = git status --porcelain 2>$null
    if ($status) {
        $warnings += "⚠️  Existem alterações não commitadas"
        Write-Host "   ⚠️  Alterações não commitadas" -ForegroundColor Yellow
        Write-Host "   💡 Execute: git add . && git commit -m 'prep: deploy'" -ForegroundColor Gray
    } else {
        Write-Host "   ✅ Working tree limpo" -ForegroundColor Green
    }
}

# ============================================
# 2. VERIFICAR .gitignore
# ============================================
Write-Host "`n🔒 Verificando .gitignore..." -ForegroundColor Yellow

if (-not (Test-Path ".gitignore")) {
    $errors += "❌ .gitignore não encontrado"
    Write-Host "   ❌ .gitignore ausente" -ForegroundColor Red
} else {
    $gitignoreContent = Get-Content ".gitignore" -Raw
    $requiredEntries = @(
        "node_modules",
        ".next",
        ".env.local",
        "*.log"
    )
    
    $missing = @()
    foreach ($entry in $requiredEntries) {
        if ($gitignoreContent -notmatch [regex]::Escape($entry)) {
            $missing += $entry
        }
    }
    
    if ($missing.Count -gt 0) {
        $warnings += "⚠️  .gitignore incompleto: $($missing -join ', ')"
        Write-Host "   ⚠️  Faltam entradas no .gitignore" -ForegroundColor Yellow
        foreach ($m in $missing) {
            Write-Host "      - $m" -ForegroundColor Gray
        }
    } else {
        Write-Host "   ✅ .gitignore completo" -ForegroundColor Green
    }
}

# ============================================
# 3. VERIFICAR package.json
# ============================================
Write-Host "`n📦 Verificando package.json..." -ForegroundColor Yellow

if (-not (Test-Path "package.json")) {
    $errors += "❌ package.json não encontrado"
    Write-Host "   ❌ package.json ausente" -ForegroundColor Red
} else {
    $pkg = Get-Content "package.json" | ConvertFrom-Json
    
    # Verificar scripts
    $requiredScripts = @("dev", "build", "start")
    foreach ($script in $requiredScripts) {
        if ($pkg.scripts.$script) {
            Write-Host "   ✅ Script '$script' encontrado" -ForegroundColor Green
        } else {
            $errors += "❌ Script '$script' ausente em package.json"
            Write-Host "   ❌ Script '$script' ausente" -ForegroundColor Red
        }
    }
    
    # Verificar dependências críticas
    $requiredDeps = @("next", "react", "@supabase/supabase-js")
    foreach ($dep in $requiredDeps) {
        if ($pkg.dependencies.$dep) {
            Write-Host "   ✅ Dependência '$dep' encontrada" -ForegroundColor Green
        } else {
            $errors += "❌ Dependência '$dep' ausente"
            Write-Host "   ❌ Dependência '$dep' ausente" -ForegroundColor Red
        }
    }
}

# ============================================
# 4. VERIFICAR .env.example
# ============================================
Write-Host "`n🔐 Verificando .env.example..." -ForegroundColor Yellow

if (-not (Test-Path ".env.example")) {
    $warnings += "⚠️  .env.example não encontrado"
    Write-Host "   ⚠️  .env.example ausente" -ForegroundColor Yellow
    Write-Host "   💡 Crie para documentar variáveis necessárias" -ForegroundColor Gray
} else {
    Write-Host "   ✅ .env.example encontrado" -ForegroundColor Green
    
    $envExample = Get-Content ".env.example" -Raw
    $requiredVars = @(
        "NEXT_PUBLIC_SUPABASE_URL",
        "NEXT_PUBLIC_SUPABASE_ANON_KEY",
        "SUPABASE_SERVICE_ROLE_KEY"
    )
    
    foreach ($var in $requiredVars) {
        if ($envExample -match $var) {
            Write-Host "   ✅ Variável '$var' documentada" -ForegroundColor Green
        } else {
            $warnings += "⚠️  Variável '$var' não documentada"
            Write-Host "   ⚠️  Variável '$var' não documentada" -ForegroundColor Yellow
        }
    }
}

# ============================================
# 5. TESTAR BUILD
# ============================================
Write-Host "`n🔨 Testando build..." -ForegroundColor Yellow

if (Test-Path ".next") {
    Remove-Item ".next" -Recurse -Force -ErrorAction SilentlyContinue
}

Write-Host "   ⏳ Executando npm run build..." -ForegroundColor Gray
$buildOutput = npm run build 2>&1
$buildExitCode = $LASTEXITCODE

if ($buildExitCode -eq 0) {
    Write-Host "   ✅ Build executado com sucesso" -ForegroundColor Green
} else {
    $errors += "❌ Build falhou"
    Write-Host "   ❌ Build falhou" -ForegroundColor Red
    Write-Host "`n   📋 Últimas linhas do erro:" -ForegroundColor Gray
    $buildOutput | Select-Object -Last 10 | ForEach-Object {
        Write-Host "      $_" -ForegroundColor Red
    }
}

# ============================================
# 6. VERIFICAR ARQUIVOS CRÍTICOS
# ============================================
Write-Host "`n📄 Verificando arquivos críticos..." -ForegroundColor Yellow

$criticalFiles = @(
    "next.config.ts",
    "tsconfig.json",
    "app/layout.tsx",
    "app/page.tsx",
    "lib/supabase/client.ts"
)

foreach ($file in $criticalFiles) {
    if (Test-Path $file) {
        Write-Host "   ✅ $file" -ForegroundColor Green
    } else {
        $warnings += "⚠️  Arquivo crítico ausente: $file"
        Write-Host "   ⚠️  $file ausente" -ForegroundColor Yellow
    }
}

# ============================================
# 7. VERIFICAR TAMANHO
# ============================================
Write-Host "`n📊 Verificando tamanho do projeto..." -ForegroundColor Yellow

$totalSize = 0
$folders = @("app", "lib", "components", "public")

foreach ($folder in $folders) {
    if (Test-Path $folder) {
        $folderSize = (Get-ChildItem $folder -Recurse -File -ErrorAction SilentlyContinue | 
                       Measure-Object -Property Length -Sum).Sum
        $totalSize += $folderSize
        $sizeMB = [math]::Round($folderSize / 1MB, 2)
        Write-Host "   📁 $folder : $sizeMB MB" -ForegroundColor Gray
    }
}

$totalMB = [math]::Round($totalSize / 1MB, 2)
Write-Host "   📦 Total (código): $totalMB MB" -ForegroundColor Cyan

if ($totalMB -gt 100) {
    $warnings += "⚠️  Projeto grande ($totalMB MB) - considere otimizar"
    Write-Host "   ⚠️  Projeto grande - pode impactar deploy" -ForegroundColor Yellow
} else {
    Write-Host "   ✅ Tamanho adequado" -ForegroundColor Green
}

# ============================================
# 8. GERAR vercel.json (se não existir)
# ============================================
Write-Host "`n⚙️  Verificando vercel.json..." -ForegroundColor Yellow

if (-not (Test-Path "vercel.json")) {
    Write-Host "   📝 Criando vercel.json..." -ForegroundColor Gray
    
    $vercelConfig = @{
        "functions" = @{
            "app/api/scrape-news/route.ts" = @{
                "maxDuration" = 300
            }
            "app/api/scrape-specific/route.ts" = @{
                "maxDuration" = 300
            }
        }
    } | ConvertTo-Json -Depth 10
    
    Set-Content "vercel.json" $vercelConfig
    Write-Host "   ✅ vercel.json criado" -ForegroundColor Green
} else {
    Write-Host "   ✅ vercel.json já existe" -ForegroundColor Green
}

# ============================================
# RESUMO FINAL
# ============================================
Write-Host "`n" -NoNewline
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "📋 RESUMO DA PREPARAÇÃO" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

if ($errors.Count -eq 0 -and $warnings.Count -eq 0) {
    Write-Host "`n✅ PROJETO PRONTO PARA DEPLOY!" -ForegroundColor Green
    Write-Host "`n🚀 Próximos passos:" -ForegroundColor Cyan
    Write-Host "   1. git add . && git commit -m 'feat: preparar deploy'" -ForegroundColor White
    Write-Host "   2. git push origin main" -ForegroundColor White
    Write-Host "   3. Conectar repositório no Vercel (vercel.com)" -ForegroundColor White
    Write-Host "   4. Configurar variáveis de ambiente" -ForegroundColor White
    Write-Host "   5. Deploy automático!" -ForegroundColor White
    Write-Host "`n📚 Guia completo: docs/DEPLOY-VERCEL.md" -ForegroundColor Gray
    exit 0
} else {
    if ($errors.Count -gt 0) {
        Write-Host "`n❌ ERROS ENCONTRADOS ($($errors.Count)):" -ForegroundColor Red
        foreach ($err in $errors) {
            Write-Host "   $err" -ForegroundColor Red
        }
    }
    
    if ($warnings.Count -gt 0) {
        Write-Host "`n⚠️  AVISOS ($($warnings.Count)):" -ForegroundColor Yellow
        foreach ($warn in $warnings) {
            Write-Host "   $warn" -ForegroundColor Yellow
        }
    }
    
    Write-Host "`n💡 Corrija os erros antes de fazer deploy" -ForegroundColor Cyan
    Write-Host "📚 Consulte: docs/DEPLOY-VERCEL.md para ajuda" -ForegroundColor Gray
    
    if ($errors.Count -gt 0) {
        exit 1
    } else {
        exit 0
    }
}
