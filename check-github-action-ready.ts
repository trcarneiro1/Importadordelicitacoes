/**
 * Script: Verificar se tudo está pronto para GitHub Action
 */

// Carregar variáveis de ambiente
import { config } from 'dotenv';
config({ path: '.env.local' });

import { existsSync } from 'fs';
import { prisma } from './lib/prisma/client.js';

async function main() {
  console.log('\n🔍 === VERIFICAÇÃO PRÉ-GITHUB ACTION ===\n');

  let allGood = true;

  // 1. Verificar variáveis de ambiente
  console.log('1️⃣ Verificando variáveis de ambiente...');
  const requiredEnvVars = [
    'DATABASE_URL',
    'OPENROUTER_API_KEY',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];

  for (const envVar of requiredEnvVars) {
    if (process.env[envVar]) {
      console.log(`   ✅ ${envVar}: Configurado`);
    } else {
      console.log(`   ❌ ${envVar}: FALTANDO!`);
      allGood = false;
    }
  }
  console.log('');

  // 2. Verificar arquivos da GitHub Action
  console.log('2️⃣ Verificando arquivos da GitHub Action...');
  const githubActionFile = '.github/workflows/enrich-daily.yml';
  if (existsSync(githubActionFile)) {
    console.log(`   ✅ ${githubActionFile}: Existe`);
  } else {
    console.log(`   ❌ ${githubActionFile}: NÃO ENCONTRADO!`);
    allGood = false;
  }
  console.log('');

  // 3. Verificar conexão com banco
  console.log('3️⃣ Verificando conexão com banco de dados...');
  try {
    const count = await prisma.licitacoes.count();
    console.log(`   ✅ Conexão OK - ${count} licitações no banco`);
    
    const pendentes = await prisma.licitacoes.count({
      where: { processado_ia: false, objeto: { not: null } }
    });
    console.log(`   ✅ ${pendentes} licitações pendentes de processamento`);
    
    if (pendentes === 0) {
      console.log(`   ⚠️  AVISO: Não há licitações pendentes para processar!`);
    }
  } catch (error: any) {
    console.log(`   ❌ Erro ao conectar: ${error.message}`);
    allGood = false;
  }
  console.log('');

  // 4. Verificar Prisma Client
  console.log('4️⃣ Verificando Prisma Client...');
  try {
    const clientPath = 'node_modules/@prisma/client';
    if (existsSync(clientPath)) {
      console.log(`   ✅ Prisma Client gerado`);
    } else {
      console.log(`   ❌ Prisma Client não encontrado! Execute: npx prisma generate`);
      allGood = false;
    }
  } catch (error: any) {
    console.log(`   ❌ Erro: ${error.message}`);
    allGood = false;
  }
  console.log('');

  // 5. Verificar OpenRouter
  console.log('5️⃣ Verificando OpenRouter...');
  try {
    const { getOpenRouterClient } = await import('./lib/openrouter/client.js');
    const client = getOpenRouterClient();
    console.log(`   ✅ Cliente OpenRouter criado`);
    
    // Teste rápido (sem fazer request real)
    if (process.env.OPENROUTER_API_KEY?.startsWith('sk-or-v1-')) {
      console.log(`   ✅ Formato da API key válido`);
    } else {
      console.log(`   ⚠️  Formato da API key pode estar incorreto`);
    }
  } catch (error: any) {
    console.log(`   ❌ Erro: ${error.message}`);
    allGood = false;
  }
  console.log('');

  // 6. Verificar endpoints da API
  console.log('6️⃣ Verificando endpoints da API...');
  const apiFiles = [
    'app/api/process-ia/route.ts',
    'app/api/test-ia/route.ts'
  ];
  
  for (const file of apiFiles) {
    if (existsSync(file)) {
      console.log(`   ✅ ${file}: Existe`);
    } else {
      console.log(`   ❌ ${file}: NÃO ENCONTRADO!`);
      allGood = false;
    }
  }
  console.log('');

  // 7. Verificar scripts de teste
  console.log('7️⃣ Verificando scripts de teste...');
  const testFiles = [
    'test-enrich.ts',
    'test-batch.ts',
    'test-setup.mjs'
  ];
  
  for (const file of testFiles) {
    if (existsSync(file)) {
      console.log(`   ✅ ${file}: Existe`);
    } else {
      console.log(`   ⚠️  ${file}: Não encontrado (opcional)`);
    }
  }
  console.log('');

  // 8. Resumo
  console.log('═══════════════════════════════════════\n');
  
  if (allGood) {
    console.log('✅ TUDO PRONTO PARA GITHUB ACTION!\n');
    console.log('📋 PRÓXIMOS PASSOS:');
    console.log('   1. Commit e push para GitHub');
    console.log('   2. Fazer deploy no Vercel');
    console.log('   3. Configurar 3 secrets no GitHub:');
    console.log('      - DATABASE_URL');
    console.log('      - OPENROUTER_API_KEY');
    console.log('      - VERCEL_URL');
    console.log('   4. Testar manualmente a action');
    console.log('   5. Aguardar execução automática (7:30 AM BRT)');
    console.log('');
    console.log('📖 Leia: GITHUB-ACTION-SETUP.md para instruções detalhadas\n');
  } else {
    console.log('❌ PROBLEMAS ENCONTRADOS!\n');
    console.log('Corrija os erros acima antes de continuar.\n');
  }

  await prisma.$disconnect();
}

main().catch(console.error);
