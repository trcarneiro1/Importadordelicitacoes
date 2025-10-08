/**
 * Script de teste: Verificar conexão com banco e OpenRouter
 */

// Testar Prisma
console.log('=== Testando Prisma ===');
try {
  const { prisma } = require('./lib/prisma/client');
  console.log('✅ Prisma Client importado com sucesso');
  
  prisma.sres.count().then(count => {
    console.log(`✅ Conexão com banco OK - ${count} SREs`);
  }).catch(err => {
    console.error('❌ Erro ao conectar no banco:', err.message);
  });
} catch (error) {
  console.error('❌ Erro ao importar Prisma:', error.message);
}

// Testar OpenRouter
console.log('\n=== Testando OpenRouter ===');
try {
  const { getOpenRouterClient } = require('./lib/openrouter/client');
  console.log('✅ OpenRouter Client importado com sucesso');
  
  const client = getOpenRouterClient();
  console.log('✅ Cliente OpenRouter criado');
  
  // Testar API
  client.test().then(result => {
    console.log('✅ API OpenRouter funcionando:', result);
  }).catch(err => {
    console.error('❌ Erro na API OpenRouter:', err.message);
  });
} catch (error) {
  console.error('❌ Erro ao importar OpenRouter:', error.message);
}

// Testar Enrichment Agent
console.log('\n=== Testando Enrichment Agent ===');
try {
  const { getLicitacoesPendentes } = require('./lib/agents/enrichment-agent');
  console.log('✅ Enrichment Agent importado com sucesso');
  
  getLicitacoesPendentes(5).then(lics => {
    console.log(`✅ ${lics.length} licitações pendentes encontradas`);
    if (lics.length > 0) {
      console.log(`   Primeira: ${lics[0].numero_edital} - ${lics[0].sre_source}`);
    }
  }).catch(err => {
    console.error('❌ Erro ao buscar licitações:', err.message);
  });
} catch (error) {
  console.error('❌ Erro ao importar Enrichment Agent:', error.message);
}

// Manter script rodando por 5 segundos para ver todos os resultados
setTimeout(() => {
  console.log('\n=== Teste concluído ===');
  process.exit(0);
}, 5000);
