/**
 * Script: Testar processamento em batch (10 licitações)
 */

// Carregar variáveis de ambiente
import { config } from 'dotenv';
config({ path: '.env.local' });

import { processLicitacoesPendentes, getEnrichmentStats } from './lib/agents/enrichment-agent.js';
import { prisma } from './lib/prisma/client.js';

async function main() {
  console.log('\n🚀 === TESTE DE BATCH PROCESSING (10 LICITAÇÕES) ===\n');

  const startTime = Date.now();

  // Estatísticas antes
  console.log('📊 Estatísticas ANTES do processamento:');
  const statsBefore = await getEnrichmentStats();
  console.log(`   Total: ${statsBefore.total}`);
  console.log(`   Processadas: ${statsBefore.processadas} (${statsBefore.taxa_processamento}%)`);
  console.log(`   Pendentes: ${statsBefore.pendentes}`);
  console.log('');

  // Processar 10 licitações
  console.log('🧠 Processando 10 licitações com IA...\n');
  
  try {
    const result = await processLicitacoesPendentes(10);
    
    const duration = Date.now() - startTime;
    const avgTime = duration / result.processed;

    console.log('\n✅ === RESULTADOS ===\n');
    console.log(`   ⏱️  Tempo total: ${(duration / 1000).toFixed(1)}s`);
    console.log(`   ⚡ Tempo médio: ${(avgTime / 1000).toFixed(1)}s por licitação`);
    console.log(`   ✅ Sucesso: ${result.success}/${result.processed}`);
    console.log(`   ❌ Falhas: ${result.failed}/${result.processed}`);
    console.log(`   📊 Taxa de sucesso: ${Math.round((result.success / result.processed) * 100)}%`);
    console.log('');

    // Mostrar resumo por categoria
    const categorias = result.results
      .filter(r => r.success && r.categoria)
      .reduce((acc, r) => {
        const cat = r.categoria || 'outros';
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    console.log('📦 Distribuição por categoria:');
    Object.entries(categorias)
      .sort((a, b) => b[1] - a[1])
      .forEach(([cat, count]) => {
        console.log(`   ${cat}: ${count}`);
      });
    console.log('');

    // Mostrar algumas escolas encontradas
    const escolas = result.results
      .filter(r => r.success && r.escola)
      .slice(0, 5);

    if (escolas.length > 0) {
      console.log('🏫 Escolas identificadas (amostra):');
      escolas.forEach(e => {
        console.log(`   - ${e.escola}`);
      });
      console.log('');
    }

    // Estatísticas depois
    console.log('📊 Estatísticas DEPOIS do processamento:');
    const statsAfter = await getEnrichmentStats();
    console.log(`   Total: ${statsAfter.total}`);
    console.log(`   Processadas: ${statsAfter.processadas} (${statsAfter.taxa_processamento}%)`);
    console.log(`   Pendentes: ${statsAfter.pendentes}`);
    console.log('');

    console.log('📈 PROGRESSO:');
    console.log(`   +${statsAfter.processadas - statsBefore.processadas} licitações processadas`);
    console.log(`   ${statsAfter.pendentes} ainda pendentes`);
    console.log('');

  } catch (error: any) {
    console.error('❌ Erro ao processar batch:', error.message);
    console.error(error);
  }

  await prisma.$disconnect();
  console.log('✅ Teste de batch concluído!\n');
}

main();
