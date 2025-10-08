/**
 * =====================================================
 * SETUP PRISMA - Configuração Automática do Banco
 * =====================================================
 * 
 * Este script:
 * 1. Conecta no Supabase via Prisma
 * 2. Aplica fixes de schema (scraping_logs, URLs)
 * 3. Sincroniza schema do Prisma
 * 4. Gera Prisma Client com tipos TypeScript
 */

import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Carregar variáveis de ambiente do .env.local
dotenv.config({ path: '.env.local' });

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Iniciando setup do Prisma...\n');

  try {
    // ===== PASSO 1: Verificar conexão =====
    console.log('📡 Testando conexão com Supabase...');
    await prisma.$connect();
    console.log('✅ Conexão estabelecida!\n');

    // ===== PASSO 2: Fix scraping_logs (adicionar coluna licitacoes_coletadas) =====
    console.log('🔧 Aplicando fix: scraping_logs...');
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE scraping_logs 
        ADD COLUMN IF NOT EXISTS licitacoes_coletadas INTEGER DEFAULT 0;
      `);
      console.log('✅ Coluna licitacoes_coletadas adicionada');

      await prisma.$executeRawUnsafe(`
        ALTER TABLE scraping_logs 
        ADD COLUMN IF NOT EXISTS metadata JSONB;
      `);
      console.log('✅ Coluna metadata adicionada');

      // Criar índices
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS idx_scraping_logs_sre_source 
        ON scraping_logs(sre_source);
      `);
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS idx_scraping_logs_status 
        ON scraping_logs(status);
      `);
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS idx_scraping_logs_started_at 
        ON scraping_logs(started_at DESC);
      `);
      console.log('✅ Índices criados\n');
    } catch (error: any) {
      if (error.code === '42701') {
        console.log('ℹ️  Colunas já existem, pulando...\n');
      } else {
        throw error;
      }
    }

    // ===== PASSO 3: Fix URLs das SREs =====
    console.log('🔧 Aplicando fix: URLs das SREs...');
    const result = await prisma.$executeRawUnsafe(`
      UPDATE sres 
      SET url_licitacoes = REPLACE(url_licitacoes, '/index.php/licitacoes-e-compras', '/index.php/licitacoes')
      WHERE url_licitacoes LIKE '%/index.php/licitacoes-e-compras';
    `);
    console.log(`✅ ${result} SREs atualizadas com URLs corretas\n`);

    // ===== PASSO 4: Verificar estado do banco =====
    console.log('📊 Verificando estado do banco...');
    
    const totalSREs = await prisma.sres.count();
    console.log(`   - Total de SREs: ${totalSREs}`);
    
    const totalLicitacoes = await prisma.licitacoes.count();
    console.log(`   - Total de Licitações: ${totalLicitacoes}`);
    
    const totalLogs = await prisma.scraping_logs.count();
    console.log(`   - Total de Logs: ${totalLogs}`);

    // Verificar URLs corretas
    const sresComURLCorreta = await prisma.sres.count({
      where: {
        url_licitacoes: {
          contains: '/index.php/licitacoes'
        }
      }
    });
    console.log(`   - SREs com URL correta: ${sresComURLCorreta}/${totalSREs}\n`);

    // ===== PASSO 5: Mostrar amostra de dados =====
    console.log('📋 Amostra de SREs configuradas:');
    const amostraSREs = await prisma.sres.findMany({
      take: 5,
      orderBy: { codigo: 'asc' },
      select: {
        codigo: true,
        nome: true,
        url_licitacoes: true,
        ativo: true
      }
    });

    amostraSREs.forEach((sre: any) => {
      console.log(`   [${sre.codigo}] ${sre.nome}`);
      console.log(`        ${sre.url_licitacoes}`);
      console.log(`        Ativo: ${sre.ativo ? '✅' : '❌'}`);
    });

    console.log('\n✨ Setup concluído com sucesso!');
    console.log('\n📝 Próximos passos:');
    console.log('   1. Execute: npx prisma generate');
    console.log('   2. Teste scraping: http://localhost:3001/api/test-scraper?sre=6');
    console.log('   3. Verifique dados no Supabase\n');

  } catch (error) {
    console.error('❌ Erro durante setup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => {
    console.log('👋 Script finalizado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erro fatal:', error);
    process.exit(1);
  });
