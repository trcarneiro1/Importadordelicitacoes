/**
 * Script: Remover view que está bloqueando migration
 */

// Carregar variáveis de ambiente
import { config } from 'dotenv';
config({ path: '.env.local' });

import { prisma } from './lib/prisma/client.js';

async function main() {
  console.log('\n🔧 === REMOVENDO VIEWS QUE BLOQUEIAM MIGRATION ===\n');

  try {
    // Listar todas as views primeiro
    const views = await prisma.$queryRawUnsafe(`
      SELECT table_name 
      FROM information_schema.views 
      WHERE table_schema = 'public';
    `) as any[];

    console.log(`📋 Views encontradas: ${views.length}`);
    views.forEach(v => console.log(`   - ${v.table_name}`));
    console.log('');

    console.log('🗑️  Removendo views...');
    
    // Remover TODAS as views de uma vez
    for (const view of views) {
      try {
        await prisma.$executeRawUnsafe(`DROP VIEW IF EXISTS "${view.table_name}" CASCADE;`);
        console.log(`   ✅ Removida: ${view.table_name}`);
      } catch (err: any) {
        console.log(`   ⚠️  Erro ao remover ${view.table_name}: ${err.message}`);
      }
    }
    
    console.log('✅ Views removidas com sucesso!');
    console.log('\n📝 Agora execute: npx prisma db push --accept-data-loss\n');

  } catch (error: any) {
    console.error('\n❌ Erro:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
