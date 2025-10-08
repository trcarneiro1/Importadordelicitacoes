/**
 * Script de teste: Verificar conexão com banco e OpenRouter
 */

// Carregar variáveis de ambiente
import { config } from 'dotenv';
config({ path: '.env.local' });

import { prisma } from './lib/prisma/client.js';
import { getOpenRouterClient } from './lib/openrouter/client.js';
import { getLicitacoesPendentes } from './lib/agents/enrichment-agent.js';

async function test() {
  console.log('=== Testando Prisma ===');
  try {
    const count = await prisma.sres.count();
    console.log(`✅ Conexão com banco OK - ${count} SREs`);
  } catch (error) {
    console.error('❌ Erro ao conectar no banco:', error.message);
  }

  console.log('\n=== Testando OpenRouter ===');
  try {
    const client = getOpenRouterClient();
    const result = await client.test();
    console.log('✅ API OpenRouter funcionando:', result);
  } catch (error) {
    console.error('❌ Erro na API OpenRouter:', error.message);
  }

  console.log('\n=== Testando Enrichment Agent ===');
  try {
    const lics = await getLicitacoesPendentes(5);
    console.log(`✅ ${lics.length} licitações pendentes encontradas`);
    if (lics.length > 0) {
      console.log(`   Primeira: ${lics[0].numero_edital} - ${lics[0].sre_source}`);
    }
  } catch (error) {
    console.error('❌ Erro ao buscar licitações:', error.message);
  }

  console.log('\n=== Teste concluído ===');
  await prisma.$disconnect();
  process.exit(0);
}

test();
