/**
 * Script para APAGAR TODAS AS LICITAÇÕES do banco de dados
 * Usar APENAS quando quiser reimportar tudo do zero
 * 
 * Uso: npx tsx scripts/clear-licitacoes.ts
 */

import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Carregar variáveis de ambiente
config({ path: '.env.local' });

const prisma = new PrismaClient();

async function clearLicitacoes() {
  try {
    console.log('🗑️  Iniciando limpeza do banco de dados...\n');

    // Contagem antes de deletar
    const countBefore = await prisma.licitacoes.count();
    console.log(`📊 Total de licitações antes: ${countBefore}`);

    if (countBefore === 0) {
      console.log('✅ Banco já está vazio. Nada a fazer.');
      return;
    }

    // Confirmação (comentar esta linha para deletar sem perguntar)
    console.log('\n⚠️  ATENÇÃO: Esta operação vai DELETAR TODAS as licitações!');
    console.log('   Pressione Ctrl+C para CANCELAR ou Enter para CONTINUAR...\n');
    
    // Aguardar confirmação (remover em produção)
    await new Promise(resolve => {
      process.stdin.once('data', () => resolve(true));
    });

    // Deletar TUDO
    const result = await prisma.licitacoes.deleteMany({});
    
    console.log(`\n✅ ${result.count} licitações DELETADAS com sucesso!`);
    
    // Contagem depois
    const countAfter = await prisma.licitacoes.count();
    console.log(`📊 Total de licitações agora: ${countAfter}`);

    console.log('\n🎯 Banco limpo! Pronto para reimportar.\n');

  } catch (error) {
    console.error('❌ Erro ao limpar banco:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

clearLicitacoes();
