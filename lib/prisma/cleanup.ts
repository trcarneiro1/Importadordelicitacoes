/**
 * Script de Limpeza de Dados Inválidos
 * Remove licitações com Invalid Date, S/N, "Não informado", etc
 * 
 * Uso: npx ts-node lib/prisma/cleanup.ts
 */

import { prisma } from './client';

interface CleanupStats {
  totalBefore: number;
  totalAfter: number;
  deletedCount: number;
  deletedInvalidDate: number;
  deletedEmptyFields: number;
  deletedNoNumeroEdital: number;
  deletedNoObjeto: number;
  deletedSN: number;
  deletedNaoInformado: number;
  processedWithIA: number;
}

async function cleanupInvalidData(): Promise<CleanupStats> {
  console.log('🧹 INICIANDO LIMPEZA DE DADOS INVÁLIDOS\n');

  const stats: CleanupStats = {
    totalBefore: 0,
    totalAfter: 0,
    deletedCount: 0,
    deletedInvalidDate: 0,
    deletedEmptyFields: 0,
    deletedNoNumeroEdital: 0,
    deletedNoObjeto: 0,
    deletedSN: 0,
    deletedNaoInformado: 0,
    processedWithIA: 0,
  };

  try {
    // 1. Contar antes
    stats.totalBefore = await prisma.licitacoes.count();
    console.log(`📊 Total de licitações ANTES: ${stats.totalBefore}\n`);

    // 2. Encontrar e deletar licitações com Invalid Date
    console.log('🔍 Buscando licitações com "Invalid Date"...');
    const invalidDateCount = await prisma.licitacoes.count({
      where: {
        OR: [
          { data_abertura: new Date('Invalid') },
          { data_publicacao: new Date('Invalid') },
        ],
      },
    });

    // Na verdade, vamos procurar por strings
    const invalidDates = await prisma.licitacoes.findMany({
      where: {
        data_abertura: null,
        data_publicacao: null,
      },
      select: { id: true },
    });

    if (invalidDates.length > 0) {
      stats.deletedInvalidDate = invalidDates.length;
      await prisma.licitacoes.deleteMany({
        where: {
          id: { in: invalidDates.map((l: any) => l.id) },
        },
      });
      console.log(`  ✅ Deletadas ${invalidDates.length} licitações com datas inválidas\n`);
    }

    // 3. Deletar licitações sem numero_edital (exceto S/N válido)
    console.log('🔍 Buscando licitações sem numero_edital...');
    const noNumeroEdital = await prisma.licitacoes.findMany({
      where: {
        OR: [
          { numero_edital: null },
          { numero_edital: '' },
          { numero_edital: 'S/N' },
          { numero_edital: 's/n' },
        ],
      },
      select: { id: true, numero_edital: true },
    });

    if (noNumeroEdital.length > 0) {
      stats.deletedNoNumeroEdital = noNumeroEdital.length;
      await prisma.licitacoes.deleteMany({
        where: {
          id: { in: noNumeroEdital.map((l: any) => l.id) },
        },
      });
      console.log(`  ✅ Deletadas ${noNumeroEdital.length} licitações sem numero_edital\n`);
    }

    // 4. Deletar licitações sem objeto (descrição)
    console.log('🔍 Buscando licitações sem objeto/descrição válida...');
    const noObjeto = await prisma.licitacoes.findMany({
      where: {
        OR: [
          { objeto: null },
          { objeto: '' },
          { objeto: 'S/N' },
          { objeto: 's/n' },
          { objeto: 'Não informado' },
          { objeto: 'não informado' },
        ],
      },
      select: { id: true, objeto: true },
    });

    if (noObjeto.length > 0) {
      stats.deletedNoObjeto = noObjeto.length;
      await prisma.licitacoes.deleteMany({
        where: {
          id: { in: noObjeto.map((l: any) => l.id) },
        },
      });
      console.log(`  ✅ Deletadas ${noObjeto.length} licitações sem objeto\n`);
    }

    // 5. Deletar licitações onde modalidade = "Não informada"
    console.log('🔍 Buscando licitações com "Não informada" em modalidade...');
    const naoInformada = await prisma.licitacoes.findMany({
      where: {
        OR: [
          { modalidade: 'Não informada' },
          { modalidade: 'não informada' },
          { modalidade: null },
          { modalidade: '' },
        ],
      },
      select: { id: true, modalidade: true },
    });

    if (naoInformada.length > 0) {
      stats.deletedNaoInformado = naoInformada.length;
      await prisma.licitacoes.deleteMany({
        where: {
          id: { in: naoInformada.map((l: any) => l.id) },
        },
      });
      console.log(`  ✅ Deletadas ${naoInformada.length} licitações com modalidade inválida\n`);
    }

    // 6. Deletar registros completamente vazios
    console.log('🔍 Buscando licitações completamente vazias...');
    const emptyRecords = await prisma.licitacoes.findMany({
      where: {
        AND: [
          { objeto: { in: [null, '', 'S/N'] } },
          { numero_edital: { in: [null, '', 'S/N'] } },
          { modalidade: { in: [null, '', 'Não informada'] } },
        ],
      },
      select: { id: true },
    });

    if (emptyRecords.length > 0) {
      stats.deletedEmptyFields = emptyRecords.length;
      await prisma.licitacoes.deleteMany({
        where: {
          id: { in: emptyRecords.map((l: any) => l.id) },
        },
      });
      console.log(`  ✅ Deletadas ${emptyRecords.length} licitações completamente vazias\n`);
    }

    // 7. Contar depois
    stats.totalAfter = await prisma.licitacoes.count();
    stats.deletedCount = stats.totalBefore - stats.totalAfter;

    // 8. Contar licitações já processadas com IA
    const withIA = await prisma.licitacoes.count({
      where: {
        categoria_ia: { not: null },
      },
    });
    stats.processedWithIA = withIA;

    // Relatório final
    console.log('\n========================================');
    console.log('📋 RELATÓRIO FINAL DE LIMPEZA');
    console.log('========================================');
    console.log(`Total ANTES:                      ${stats.totalBefore}`);
    console.log(`Total DEPOIS:                     ${stats.totalAfter}`);
    console.log(`Total DELETADAS:                  ${stats.deletedCount} ❌\n`);

    console.log('Detalhamento de deletadas:');
    console.log(`  • Invalid Date:                 ${stats.deletedInvalidDate}`);
    console.log(`  • Sem numero_edital:            ${stats.deletedNoNumeroEdital}`);
    console.log(`  • Sem objeto/descrição:         ${stats.deletedNoObjeto}`);
    console.log(`  • Modalidade "Não informada":   ${stats.deletedNaoInformado}`);
    console.log(`  • Campos vazios:                ${stats.deletedEmptyFields}\n`);

    console.log(`Licitações com IA (processadas):  ${stats.processedWithIA} ✅`);
    console.log(`Licitações VÁLIDAS restantes:    ${stats.totalAfter - stats.processedWithIA} 📝\n`);

    console.log('========================================');

    // Estatísticas adicionais
    if (stats.totalAfter > 0) {
      const percentProcessada = ((stats.processedWithIA / stats.totalAfter) * 100).toFixed(1);
      console.log(`\n📊 Taxa de processamento: ${percentProcessada}%`);
      console.log(`🎯 Próximo passo: Processar ${stats.totalAfter - stats.processedWithIA} licitações restantes com IA\n`);
    }

    return stats;
  } catch (error) {
    console.error('❌ Erro durante limpeza:', error);
    throw error;
  }
}

/**
 * Função alternativa: Backup dos dados antes de limpar
 */
async function backupBeforeCleanup(): Promise<void> {
  console.log('💾 Criando backup dos dados...\n');

  const allLicitacoes = await prisma.licitacoes.findMany({
    select: {
      id: true,
      numero_edital: true,
      objeto: true,
      modalidade: true,
      data_abertura: true,
      data_publicacao: true,
      valor_estimado: true,
      sre_source: true,
    },
  });

  const fs = require('fs');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `backup-licitacoes-${timestamp}.json`;

  fs.writeFileSync(filename, JSON.stringify(allLicitacoes, null, 2));
  console.log(`✅ Backup salvo em: ${filename}\n`);
}

/**
 * Função para restaurar dados de um backup
 */
async function restoreFromBackup(filename: string): Promise<void> {
  console.log(`🔄 Restaurando dados de: ${filename}\n`);

  const fs = require('fs');
  const data = JSON.parse(fs.readFileSync(filename, 'utf-8'));

  // Deletar dados atuais (CUIDADO!)
  await prisma.licitacoes.deleteMany({});

  // Restaurar
  for (const item of data) {
    await prisma.licitacoes.create({
      data: {
        numero_edital: item.numero_edital,
        objeto: item.objeto,
        modalidade: item.modalidade,
        data_abertura: item.data_abertura ? new Date(item.data_abertura) : null,
        data_publicacao: item.data_publicacao ? new Date(item.data_publicacao) : null,
        valor_estimado: item.valor_estimado,
        sre_source: item.sre_source,
      },
    });
  }

  console.log(`✅ Restaurados ${data.length} registros\n`);
}

// Executar se chamado diretamente
if (require.main === module) {
  (async () => {
    try {
      // Backup primeiro (opcional)
      // await backupBeforeCleanup();

      // Executar limpeza
      const stats = await cleanupInvalidData();

      process.exit(0);
    } catch (error) {
      console.error('Erro fatal:', error);
      process.exit(1);
    }
  })();
}

export { cleanupInvalidData, backupBeforeCleanup, restoreFromBackup };
export type { CleanupStats };
