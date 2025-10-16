import { scrapeSREMultiPage } from './sre-scraper-enhanced';
import { getSREsToScrape } from './orchestrator';
import { addScrapingLog } from '@/lib/scraping-logs';
import { prisma } from '@/lib/prisma/client';

export interface ScrapingResultEnhanced {
  sre_code: number;
  sre_name: string;
  licitacoes_found: number;
  licitacoes_saved: number;
  errors: number;
  duration_ms: number;
}

/**
 * NOVO SCRAPER: Multi-página com dados COMPLETOS
 * Estratégia:
 * 1. Busca lista de links na página principal
 * 2. Entra em CADA PÁGINA para extrair dados completos
 * 3. Resultado: número_edital, objeto, datas válidas, etc.
 */
export async function scrapeAllSREsEnhanced(sessionId: string): Promise<ScrapingResultEnhanced[]> {
  const results: ScrapingResultEnhanced[] = [];
  const sres = await getSREsToScrape();

  console.log(`\n${'='.repeat(80)}`);
  console.log(`🚀 NOVO SCRAPER MULTI-PÁGINA - SESSION: ${sessionId}`);
  console.log(`📍 Total de SREs: ${sres.length}`);
  console.log(`${'='.repeat(80)}\n`);

  let sreIndex = 0;

  for (const sre of sres) {
    sreIndex++;
    const sreStartTime = Date.now();
    let successCount = 0;
    let errorCount = 0;

    try {
      // Log: Iniciando SRE
      await addScrapingLog(sessionId, {
        sre_name: sre.nome,
        sre_code: sre.codigo,
        status: 'starting',
        message: `[${sreIndex}/${sres.length}] Iniciando scraping ENHANCED da SRE ${sre.nome}`,
      });

      console.log(`\n[${sreIndex}/${sres.length}] 🔍 SRE: ${sre.nome}`);
      console.log(`URL Base: ${sre.url_base}`);
      console.log('-'.repeat(70));

      // Chamar novo scraper multi-página
      const licitacoes = await scrapeSREMultiPage(sre.url_base);

      console.log(`✅ Encontradas ${licitacoes.length} licitações`);

      // Log: Processando licitações
      await addScrapingLog(sessionId, {
        sre_name: sre.nome,
        sre_code: sre.codigo,
        status: 'processing',
        message: `Salvando ${licitacoes.length} licitações no banco...`,
      });

      // Salvar no banco de dados
      for (const lic of licitacoes) {
        try {
          // Verificar se já existe
          const existing = await prisma.licitacoes.findFirst({
            where: {
              numero_edital: lic.numero_edital,
              sre_code: sre.codigo,
            },
          });

          if (!existing) {
            await prisma.licitacoes.create({
              data: {
                numero_edital: lic.numero_edital,
                objeto: lic.objeto,
                modalidade: lic.modalidade,
                valor_estimado: lic.valor_estimado ? new Decimal(lic.valor_estimado) : undefined,
                data_publicacao: lic.data_publicacao,
                data_abertura: lic.data_abertura,
                situacao: lic.situacao,
                documentos: lic.documentos as any,
                raw_data: lic.raw_data as any,
                sre_code: sre.codigo,
                sre_source: sre.nome,
                regional: sre.municipio || 'Não especificado',
                categoria_principal: undefined,
                processado_ia: false,
              },
            });

            successCount++;
            console.log(`   ✅ ${lic.numero_edital} - ${lic.objeto.substring(0, 50)}`);
          } else {
            console.log(`   ⏭️  ${lic.numero_edital} - Já existe no banco`);
          }
        } catch (error) {
          errorCount++;
          console.log(
            `   ❌ Erro ao salvar: ${error instanceof Error ? error.message.substring(0, 60) : 'Desconhecido'}`
          );
        }
      }

      const duration = Date.now() - sreStartTime;

      // Log: Concluído
      await addScrapingLog(sessionId, {
        sre_name: sre.nome,
        sre_code: sre.codigo,
        status: 'completed',
        message: `✨ SRE concluída - ${successCount} salvas, ${errorCount} erros`,
      });

      results.push({
        sre_code: sre.codigo,
        sre_name: sre.nome,
        licitacoes_found: licitacoes.length,
        licitacoes_saved: successCount,
        errors: errorCount,
        duration_ms: duration,
      });

      console.log(
        `📊 Resultado: ${successCount}/${licitacoes.length} salvas em ${(duration / 1000).toFixed(1)}s`
      );

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error(`❌ Erro na SRE ${sre.nome}:`, errorMsg);

      // Log: Erro
      await addScrapingLog(sessionId, {
        sre_name: sre.nome,
        sre_code: sre.codigo,
        status: 'error',
        message: `❌ Erro fatal: ${errorMsg.substring(0, 100)}`,
        error_message: errorMsg,
      });

      results.push({
        sre_code: sre.codigo,
        sre_name: sre.nome,
        licitacoes_found: 0,
        licitacoes_saved: 0,
        errors: 1,
        duration_ms: Date.now() - sreStartTime,
      });
    }

    // Rate limiting: esperar 2 segundos entre SREs
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Resumo final
  const totalFound = results.reduce((sum, r) => sum + r.licitacoes_found, 0);
  const totalSaved = results.reduce((sum, r) => sum + r.licitacoes_saved, 0);
  const totalErrors = results.reduce((sum, r) => sum + r.errors, 0);
  const totalDuration = results.reduce((sum, r) => sum + r.duration_ms, 0);

  console.log(`\n${'='.repeat(80)}`);
  console.log(`📊 RESUMO FINAL - SCRAPING ENHANCED`);
  console.log(`${'='.repeat(80)}`);
  console.log(`✅ Total encontradas: ${totalFound} licitações`);
  console.log(`✅ Total salvas: ${totalSaved} licitações`);
  console.log(`❌ Erros: ${totalErrors}`);
  console.log(`⏱️  Tempo total: ${(totalDuration / 1000).toFixed(1)}s`);
  console.log(`${'='.repeat(80)}\n`);

  return results;
}

// Import Decimal for Prisma
import { Decimal } from '@prisma/client/runtime/library';
