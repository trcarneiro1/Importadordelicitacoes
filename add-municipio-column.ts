/**
 * Script: Adicionar coluna municipio ao banco de dados
 */

// Carregar variáveis de ambiente
import { config } from 'dotenv';
config({ path: '.env.local' });

import { prisma } from './lib/prisma/client.js';

async function main() {
  console.log('\n🔧 === ADICIONANDO COLUNA MUNICIPIO ===\n');

  try {
    // Verificar se a coluna já existe
    const result = await prisma.$queryRawUnsafe(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'licitacoes' 
      AND column_name = 'municipio';
    `) as any[];

    if (result.length > 0) {
      console.log('✅ Coluna "municipio" já existe!');
    } else {
      console.log('➕ Adicionando coluna "municipio"...');
      
      await prisma.$executeRawUnsafe(`
        ALTER TABLE licitacoes 
        ADD COLUMN IF NOT EXISTS municipio VARCHAR(100);
      `);
      
      console.log('✅ Coluna "municipio" adicionada com sucesso!');
    }

    console.log('\n📊 Verificando estrutura da tabela...');
    const columns = await prisma.$queryRawUnsafe(`
      SELECT column_name, data_type, character_maximum_length
      FROM information_schema.columns 
      WHERE table_name = 'licitacoes'
      AND column_name IN ('municipio', 'municipio_escola', 'escola')
      ORDER BY column_name;
    `) as any[];

    console.log('\nColunas encontradas:');
    columns.forEach(col => {
      const length = col.character_maximum_length ? `(${col.character_maximum_length})` : '';
      console.log(`   ✅ ${col.column_name}: ${col.data_type}${length}`);
    });

  } catch (error: any) {
    console.error('\n❌ Erro:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }

  console.log('\n✅ Script concluído!\n');
}

main();
