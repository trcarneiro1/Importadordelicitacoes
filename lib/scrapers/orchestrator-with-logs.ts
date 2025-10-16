import { getSREsToScrape, getSREByCode } from './orchestrator';
import { parseSpecificSRE } from './specific-parser';
import { addScrapingLog } from '@/lib/scraping-logs';
import { prisma } from '@/lib/prisma/client';

export interface ScrapingLogWithPages {
  sre_code: number;
  sre_name: string;
  pages: number;
  licitacoes_found: number;
  duration_ms: number;
}

/**
 * Scrape all SREs with detailed logging for each page
 * Pega pelo menos 3 páginas de cada SRE
 */
export async function scrapeAllSREsWithLogs(sessionId: string): Promise<ScrapingLogWithPages[]> {
  const results: ScrapingLogWithPages[] = [];
  const sres = await getSREsToScrape();

  console.log(`\n🚀 Iniciando scraping com logs - Session: ${sessionId}`);
  console.log(`📍 Total de SREs para processar: ${sres.length}\n`);

  let sreIndex = 0;

  for (const sre of sres) {
    sreIndex++;
    const sreStartTime = Date.now();
    let totalLicitacoesThisSRE = 0;
    let successfulPages = 0;

    try {
      // Log: Iniciando SRE
      await addScrapingLog(sessionId, {
        sre_name: sre.nome,
        sre_code: sre.codigo,
        status: 'starting',
        message: `[${sreIndex}/${sres.length}] Iniciando scraping da SRE ${sre.nome}`,
      });

      console.log(
        `\n${'='.repeat(70)}`
      );
      console.log(
        `[${sreIndex}/${sres.length}] 🔍 SRE: ${sre.nome} (código: ${sre.codigo})`
      );
      console.log(
        `${'='.repeat(70)}`
      );

      // Tentar scraping de múltiplas páginas
      const maxPages = 3;
      let allLicitacoes: any[] = [];

      for (let page = 1; page <= maxPages; page++) {
        const pageStartTime = Date.now();

        // Log: Processando página
        await addScrapingLog(sessionId, {
          sre_name: sre.nome,
          sre_code: sre.codigo,
          status: 'page_processing',
          message: `Processando página ${page}/${maxPages}...`,
          page_number: page,
          total_pages: maxPages,
        });

        console.log(`\n  📄 Página ${page}/${maxPages}:`);

        try {
          // Construir URL com parâmetro de página
          let pageUrl = sre.url_licitacoes;
          
          // Adicionar parâmetro de página dependendo do CMS
          if (page > 1) {
            if (pageUrl.includes('joomla') || pageUrl.includes('.php')) {
              pageUrl = `${sre.url_licitacoes}?start=${(page - 1) * 18}`;
            } else if (pageUrl.includes('wordpress') || pageUrl.includes('wp-admin')) {
              pageUrl = `${sre.url_licitacoes}?paged=${page}`;
            } else {
              // Tentar adicionar /page/N ou ?page=N
              pageUrl = `${sre.url_licitacoes}?page=${page}`;
            }
          }

          console.log(`     URL: ${pageUrl}`);

          // Fazer scraping da página
          const pageResult = await parseSpecificSRE(pageUrl);

          if (pageResult.success && pageResult.licitacoes.length > 0) {
            const pageDuration = Date.now() - pageStartTime;
            successfulPages++;
            totalLicitacoesThisSRE += pageResult.licitacoes.length;
            allLicitacoes.push(...pageResult.licitacoes);

            // Log: Página bem-sucedida
            await addScrapingLog(sessionId, {
              sre_name: sre.nome,
              sre_code: sre.codigo,
              status: 'success',
              message: `✅ Página ${page} concluída`,
              page_number: page,
              licitacoes_found_this_page: pageResult.licitacoes.length,
              duration_ms: pageDuration,
            });

            console.log(
              `     ✅ Encontradas ${pageResult.licitacoes.length} licitações (${pageDuration}ms)`
            );
          } else {
            console.log(`     ⚠️  Nenhuma licitação encontrada nesta página`);
          }

          // Pequeno delay entre páginas para respeitar rate limiting
          if (page < maxPages) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        } catch (pageError: any) {
          console.error(`     ❌ Erro na página ${page}:`, pageError.message);

          await addScrapingLog(sessionId, {
            sre_name: sre.nome,
            sre_code: sre.codigo,
            status: 'error',
            message: `❌ Erro ao processar página ${page}`,
            page_number: page,
            error_message: pageError.message,
          });
        }
      }

      // Log: SRE concluída
      const sreDuration = Date.now() - sreStartTime;

      if (totalLicitacoesThisSRE > 0) {
        // Salvar licitações no banco
        try {
          const createdCount = await prisma.licitacoes.createMany({
            data: allLicitacoes.map((lic) => ({
              numero_edital: lic.numero_edital || `SRE-${sre.codigo}-${Date.now()}`,
              modalidade: lic.modalidade || 'Não informado',
              objeto: lic.objeto || 'Não informado',
              valor_estimado: lic.valor_estimado,
              data_publicacao: lic.data_publicacao,
              data_abertura: lic.data_abertura,
              situacao: lic.situacao || 'aberto',
              sre_code: sre.codigo,
              sre_source: sre.nome,
              regional: `SRE ${sre.nome}`,
              documentos: lic.documentos,
              raw_data: lic.raw_data,
            })),
            skipDuplicates: true,
          });

          console.log(`\n  💾 Salvas ${createdCount.count} licitações no banco`);
        } catch (dbError: any) {
          console.error(`  ❌ Erro ao salvar no banco:`, dbError.message);
        }
      }

      await addScrapingLog(sessionId, {
        sre_name: sre.nome,
        sre_code: sre.codigo,
        status: 'completed',
        message: `✅ SRE ${sre.nome} concluída: ${totalLicitacoesThisSRE} licitações em ${successfulPages}/${maxPages} páginas`,
        total_pages: maxPages,
        licitacoes_found_this_page: totalLicitacoesThisSRE,
        duration_ms: sreDuration,
      });

      console.log(
        `\n  ✅ RESULTADO: ${totalLicitacoesThisSRE} licitações (${successfulPages}/${maxPages} páginas processadas em ${sreDuration}ms)`
      );

      results.push({
        sre_code: sre.codigo,
        sre_name: sre.nome,
        pages: successfulPages,
        licitacoes_found: totalLicitacoesThisSRE,
        duration_ms: sreDuration,
      });

      // Delay entre SREs para respeitar rate limiting
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (sreError: any) {
      console.error(`\n  ❌ Erro geral na SRE ${sre.nome}:`, sreError.message);

      await addScrapingLog(sessionId, {
        sre_name: sre.nome,
        sre_code: sre.codigo,
        status: 'error',
        message: `❌ Erro durante scraping da SRE`,
        error_message: sreError.message,
        duration_ms: Date.now() - sreStartTime,
      });

      results.push({
        sre_code: sre.codigo,
        sre_name: sre.nome,
        pages: 0,
        licitacoes_found: 0,
        duration_ms: Date.now() - sreStartTime,
      });
    }
  }

  // Log final
  const totalLicitacoes = results.reduce((sum, r) => sum + r.licitacoes_found, 0);
  const totalSREsProcessed = results.filter((r) => r.licitacoes_found > 0).length;

  await addScrapingLog(sessionId, {
    sre_name: 'SISTEMA',
    status: 'completed',
    message: `🎉 Scraping concluído! ${totalSREsProcessed}/${sres.length} SREs com dados. Total: ${totalLicitacoes} licitações coletadas.`,
  });

  console.log(`\n\n${'='.repeat(70)}`);
  console.log(`🎉 SCRAPING FINALIZADO`);
  console.log(`${'='.repeat(70)}`);
  console.log(`   ✅ SREs com sucesso: ${totalSREsProcessed}/${sres.length}`);
  console.log(`   📊 Total de licitações: ${totalLicitacoes}`);
  console.log(`${'='.repeat(70)}\n`);

  return results;
}
