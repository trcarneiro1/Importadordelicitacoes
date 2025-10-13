/**
 * Script para corrigir URLs de licitações de todas as SREs
 * 
 * Este script:
 * 1. Lista todas as SREs
 * 2. Identifica URLs incorretas (apontando para /noticias, etc)
 * 3. Corrige para o padrão /licitacoes
 * 4. Salva as alterações
 * 
 * Uso: npx tsx scripts/corrigir-urls-automatico.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface SRECorrecao {
  codigo: number;
  nome: string;
  urlAtual: string;
  urlCorrigida: string;
  motivo: string;
}

async function main() {
  console.log('🔧 INICIANDO CORREÇÃO DE URLs DAS SREs\n');
  console.log('═'.repeat(80));

  // 1. Buscar todas as SREs
  const sres = await prisma.sres.findMany({
    select: {
      codigo: true,
      nome: true,
      url_base: true,
      url_licitacoes: true,
      ativo: true,
    },
    orderBy: { codigo: 'asc' },
  });

  console.log(`\n📊 Total de SREs encontradas: ${sres.length}\n`);

  // 2. Identificar URLs que precisam de correção
  const correcoes: SRECorrecao[] = [];

  for (const sre of sres) {
    let urlCorrigida: string | null = null;
    let motivo = '';

    const urlAtual = sre.url_licitacoes || '';
    const urlBase = sre.url_base;

    // Verificar se precisa correção
    if (urlAtual.includes('/home/noticias')) {
      urlCorrigida = urlBase.endsWith('/') 
        ? `${urlBase}licitacoes` 
        : `${urlBase}/licitacoes`;
      motivo = 'Apontava para /home/noticias (página de notícias)';
    } 
    else if (urlAtual.includes('/noticias') && !urlAtual.includes('/licitacoes')) {
      urlCorrigida = urlBase.endsWith('/') 
        ? `${urlBase}licitacoes` 
        : `${urlBase}/licitacoes`;
      motivo = 'Apontava para /noticias (página de notícias)';
    }
    else if (urlAtual === urlBase || urlAtual === `${urlBase}/`) {
      urlCorrigida = urlBase.endsWith('/') 
        ? `${urlBase}licitacoes` 
        : `${urlBase}/licitacoes`;
      motivo = 'Apenas URL base (sem endpoint específico)';
    }
    else if (!urlAtual || urlAtual === '') {
      urlCorrigida = urlBase.endsWith('/') 
        ? `${urlBase}licitacoes` 
        : `${urlBase}/licitacoes`;
      motivo = 'URL de licitações estava vazia';
    }

    if (urlCorrigida) {
      correcoes.push({
        codigo: sre.codigo,
        nome: sre.nome || `SRE ${sre.codigo}`,
        urlAtual,
        urlCorrigida,
        motivo,
      });
    }
  }

  // 3. Exibir correções necessárias
  console.log('📋 URLs QUE SERÃO CORRIGIDAS:\n');
  console.log('═'.repeat(80));

  if (correcoes.length === 0) {
    console.log('✅ Nenhuma correção necessária! Todas as URLs estão corretas.\n');
    await prisma.$disconnect();
    return;
  }

  correcoes.forEach((corr, index) => {
    console.log(`\n${index + 1}. 📍 SRE ${corr.codigo} - ${corr.nome}`);
    console.log(`   ❌ Atual:     ${corr.urlAtual || '(vazio)'}`);
    console.log(`   ✅ Corrigida: ${corr.urlCorrigida}`);
    console.log(`   💡 Motivo:    ${corr.motivo}`);
  });

  console.log('\n' + '═'.repeat(80));
  console.log(`\n📊 TOTAL DE CORREÇÕES: ${correcoes.length} de ${sres.length} SREs\n`);

  // 4. Confirmar execução
  console.log('⚠️  ATENÇÃO: Esta ação irá modificar o banco de dados!\n');
  console.log('Pressione Ctrl+C para cancelar ou aguarde 5 segundos para continuar...\n');

  // Aguardar 5 segundos
  await new Promise(resolve => setTimeout(resolve, 5000));

  console.log('🚀 Iniciando correções...\n');

  // 5. Aplicar correções
  let sucessos = 0;
  let erros = 0;

  for (const corr of correcoes) {
    try {
      await prisma.sres.update({
        where: { codigo: corr.codigo },
        data: {
          url_licitacoes: corr.urlCorrigida,
        },
      });

      console.log(`✅ SRE ${corr.codigo} - ${corr.nome}: Corrigida com sucesso`);
      sucessos++;
    } catch (error) {
      console.error(`❌ SRE ${corr.codigo} - ${corr.nome}: Erro ao corrigir`);
      console.error(error);
      erros++;
    }
  }

  // 6. Resumo final
  console.log('\n' + '═'.repeat(80));
  console.log('\n📊 RESUMO DA CORREÇÃO:\n');
  console.log(`   Total de SREs analisadas: ${sres.length}`);
  console.log(`   URLs que precisavam correção: ${correcoes.length}`);
  console.log(`   ✅ Corrigidas com sucesso: ${sucessos}`);
  console.log(`   ❌ Erros: ${erros}`);
  console.log('\n' + '═'.repeat(80));

  // 7. Verificação pós-correção
  console.log('\n🔍 Verificando resultado...\n');

  const sresPosCorrecao = await prisma.sres.findMany({
    select: {
      codigo: true,
      nome: true,
      url_licitacoes: true,
    },
    orderBy: { codigo: 'asc' },
  });

  const comLicitacoes = sresPosCorrecao.filter(s => 
    s.url_licitacoes?.includes('/licitacoes') || 
    s.url_licitacoes?.includes('/editais') ||
    s.url_licitacoes?.includes('/compras')
  ).length;

  const comNoticias = sresPosCorrecao.filter(s => 
    s.url_licitacoes?.includes('/noticias')
  ).length;

  console.log('📊 ESTATÍSTICAS PÓS-CORREÇÃO:\n');
  console.log(`   ✅ SREs com URLs de licitações: ${comLicitacoes} (${((comLicitacoes/sres.length)*100).toFixed(1)}%)`);
  console.log(`   ❌ SREs ainda com URLs de notícias: ${comNoticias}`);
  console.log(`   ⚠️  SREs que podem precisar ajuste manual: ${sres.length - comLicitacoes}`);

  // 8. Listar SREs que ainda podem precisar de ajuste
  const precisamAjuste = sresPosCorrecao.filter(s => {
    const url = s.url_licitacoes || '';
    return !url.includes('/licitacoes') && 
           !url.includes('/editais') && 
           !url.includes('/compras') &&
           !url.includes('/pregoes') &&
           url !== '';
  });

  if (precisamAjuste.length > 0) {
    console.log('\n⚠️  SREs QUE PODEM PRECISAR DE AJUSTE MANUAL:\n');
    precisamAjuste.forEach(sre => {
      console.log(`   • SRE ${sre.codigo} - ${sre.nome}`);
      console.log(`     URL: ${sre.url_licitacoes}`);
    });
    console.log('\n   💡 Dica: Verifique manualmente estas URLs ou ajuste via interface /sres');
  }

  console.log('\n✅ CORREÇÃO CONCLUÍDA!\n');
  console.log('🎯 PRÓXIMOS PASSOS:\n');
  console.log('   1. Acesse http://localhost:3001/sres');
  console.log('   2. Teste algumas SREs clicando no botão ▶️ (Play)');
  console.log('   3. Verifique se retornam licitações (número > 0)');
  console.log('   4. Se ainda retornar 0, tente endpoints alternativos:');
  console.log('      - /editais');
  console.log('      - /compras');
  console.log('      - /pregoes');
  console.log('\n' + '═'.repeat(80) + '\n');

  await prisma.$disconnect();
}

// Executar script
main()
  .catch(async (error) => {
    console.error('\n❌ ERRO FATAL:\n');
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
