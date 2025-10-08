/**
 * Script: Testar Enriquecimento de IA em uma licitação
 */

// Carregar variáveis de ambiente
import { config } from 'dotenv';
config({ path: '.env.local' });

import { prisma } from './lib/prisma/client.js';
import { 
  enrichLicitacao, 
  saveLicitacaoEnriquecida,
  getLicitacoesPendentes 
} from './lib/agents/enrichment-agent.js';

async function main() {
  console.log('\n🤖 === TESTE DE ENRIQUECIMENTO COM IA ===\n');

  // 1. Buscar licitações pendentes
  console.log('📋 Buscando licitações pendentes...');
  const pendentes = await getLicitacoesPendentes(5);
  
  if (pendentes.length === 0) {
    console.log('❌ Nenhuma licitação pendente encontrada');
    await prisma.$disconnect();
    return;
  }

  console.log(`✅ ${pendentes.length} licitações encontradas\n`);

  // 2. Pegar a primeira e mostrar dados
  const licitacao = pendentes[0];
  console.log('📄 LICITAÇÃO SELECIONADA:');
  console.log(`   ID: ${licitacao.id}`);
  console.log(`   SRE: ${licitacao.sre_source}`);
  console.log(`   Número Edital: ${licitacao.numero_edital || 'N/A'}`);
  console.log(`   Objeto: ${licitacao.objeto?.substring(0, 150)}...`);
  console.log('');

  // 3. Processar com IA
  console.log('🧠 Processando com IA (Grok-4-fast)...');
  const startTime = Date.now();
  
  try {
    const enrichedData = await enrichLicitacao(licitacao);
    const duration = Date.now() - startTime;

    console.log(`✅ Processamento concluído em ${duration}ms\n`);

    // 4. Mostrar resultados
    console.log('📊 DADOS ENRIQUECIDOS:');
    console.log(`   🏫 Escola: ${enrichedData.escola || 'Não identificada'}`);
    console.log(`   📍 Município: ${enrichedData.municipio_escola || 'N/A'}`);
    console.log(`   📦 Categoria: ${enrichedData.categoria_principal}`);
    if (enrichedData.categorias_secundarias && enrichedData.categorias_secundarias.length > 0) {
      console.log(`   📦 Categorias Sec.: ${enrichedData.categorias_secundarias.join(', ')}`);
    }
    console.log(`   ⭐ Score: ${enrichedData.score_relevancia}/100`);
    console.log(`   🏢 Fornecedor: ${enrichedData.fornecedor_tipo}`);
    console.log(`   📊 Complexidade: ${enrichedData.complexidade}`);
    
    if (enrichedData.itens_principais && enrichedData.itens_principais.length > 0) {
      console.log(`\n   📝 Itens Principais:`);
      enrichedData.itens_principais.forEach((item, idx) => {
        console.log(`      ${idx + 1}. ${item}`);
      });
    }
    
    if (enrichedData.palavras_chave && enrichedData.palavras_chave.length > 0) {
      console.log(`\n   🔍 Palavras-chave: ${enrichedData.palavras_chave.join(', ')}`);
    }
    
    if (enrichedData.resumo_executivo) {
      console.log(`\n   📄 Resumo: ${enrichedData.resumo_executivo}`);
    }

    // 5. Salvar no banco
    console.log('\n💾 Salvando dados enriquecidos...');
    await saveLicitacaoEnriquecida(licitacao.id, enrichedData);
    console.log('✅ Dados salvos no banco de dados!\n');

    // 6. Verificar no banco
    const updated = await prisma.licitacoes.findUnique({
      where: { id: licitacao.id },
      select: {
        processado_ia: true,
        processado_ia_at: true,
        escola: true,
        categoria_principal: true,
        score_relevancia: true
      }
    });

    console.log('🔍 VERIFICAÇÃO NO BANCO:');
    console.log(`   Processado: ${updated?.processado_ia ? '✅ Sim' : '❌ Não'}`);
    console.log(`   Data: ${updated?.processado_ia_at?.toLocaleString('pt-BR')}`);
    console.log(`   Escola: ${updated?.escola}`);
    console.log(`   Categoria: ${updated?.categoria_principal}`);
    console.log(`   Score: ${updated?.score_relevancia}\n`);

  } catch (error: any) {
    console.error('❌ Erro ao processar:', error.message);
    console.error(error);
  }

  await prisma.$disconnect();
  console.log('✅ Teste concluído!\n');
}

main();
