import { NextRequest, NextResponse } from 'next/server';
import { parseSpecificSRE } from '@/lib/scrapers/specific-parser';
import { SRE_URLS, getSREName } from '@/lib/scrapers/sre-urls';
import { insertLicitacoes, logScraping, updateScrapingLog } from '@/lib/supabase/queries';

/**
 * API endpoint mehorado que usa o parser específico
 * GET /api/scrape-specific?sre=metro&count=5
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const sreParam = searchParams.get('sre');
  const count = parseInt(searchParams.get('count') || '3');

  try {
    let sresToScrape: string[] = [];

    if (sreParam) {
      // Buscar SRE específica
      const foundSRE = SRE_URLS.find((url) => url.toLowerCase().includes(sreParam.toLowerCase()));
      sresToScrape = foundSRE ? [foundSRE] : [];
    } else {
      // Pegar primeiras N SREs
      sresToScrape = SRE_URLS.slice(0, Math.min(count, SRE_URLS.length));
    }

    if (sresToScrape.length === 0) {
      return NextResponse.json({ error: 'Nenhuma SRE encontrada' }, { status: 404 });
    }

    const results = [];

    for (const url of sresToScrape) {
      const sreName = getSREName(url);
      const startTime = Date.now();

      // Log inicial
      const log = await logScraping({
        sre_source: sreName,
        status: 'in_progress',
      });

      try {
        // Usar parser específico
        const result = await parseSpecificSRE(url);

        if (result.success && result.licitacoes.length > 0) {
          // Inserir licitações no banco
          const licitacoesToInsert = result.licitacoes.map((l) => ({
            sre_source: sreName,
            numero_edital: l.numero_edital,
            modalidade: l.modalidade,
            objeto: l.objeto,
            valor_estimado: l.valor_estimado,
            data_publicacao: l.data_publicacao,
            data_abertura: l.data_abertura,
            situacao: l.situacao,
            documentos: l.documentos.length > 0 ? l.documentos : undefined,
            raw_data: l.raw_data,
            categoria: l.categoria,
            processo: l.processo,
          }));

          await insertLicitacoes(licitacoesToInsert);

          // Atualizar log
          await updateScrapingLog(log.id, {
            status: 'success',
            records_found: result.licitacoes.length,
            completed_at: new Date(),
          });

          results.push({
            sre: sreName,
            success: true,
            licitacoes: result.licitacoes.length,
            parser: result.parser_usado,
            duration: `${((Date.now() - startTime) / 1000).toFixed(2)}s`,
          });
        } else {
          // Nenhuma licitação encontrada
          await updateScrapingLog(log.id, {
            status: 'error',
            error_message: result.error || 'Nenhuma licitação encontrada',
            completed_at: new Date(),
          });

          results.push({
            sre: sreName,
            success: false,
            licitacoes: 0,
            parser: result.parser_usado,
            duration: `${((Date.now() - startTime) / 1000).toFixed(2)}s`,
            error: result.error || 'Nenhuma licitação encontrada',
          });
        }
      } catch (error: any) {
        // Erro durante scraping
        await updateScrapingLog(log.id, {
          status: 'error',
          error_message: error.message,
          completed_at: new Date(),
        });

        results.push({
          sre: sreName,
          success: false,
          licitacoes: 0,
          duration: `${((Date.now() - startTime) / 1000).toFixed(2)}s`,
          error: error.message,
        });
      }
    }

    const totalLicitacoes = results.reduce((sum, r) => sum + r.licitacoes, 0);
    const successfulScrapes = results.filter((r) => r.success).length;

    return NextResponse.json({
      success: true,
      results,
      summary: {
        total_sres: results.length,
        successful: successfulScrapes,
        failed: results.length - successfulScrapes,
        total_licitacoes: totalLicitacoes,
      },
    });
  } catch (error: any) {
    console.error('Erro no scraping:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST endpoint para scraping customizado
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sres } = body; // Array de SRE names ou URLs

    if (!Array.isArray(sres) || sres.length === 0) {
      return NextResponse.json({ error: 'Forneça um array de SREs' }, { status: 400 });
    }

    const results = [];

    for (const sreIdentifier of sres) {
      const url =
        SRE_URLS.find((u) => u.includes(sreIdentifier)) ||
        (sreIdentifier.startsWith('http') ? sreIdentifier : null);

      if (!url) {
        results.push({
          sre: sreIdentifier,
          success: false,
          error: 'SRE não encontrada',
        });
        continue;
      }

      const sreName = getSREName(url);
      const startTime = Date.now();

      const log = await logScraping({
        sre_source: sreName,
        status: 'in_progress',
      });

      try {
        const result = await parseSpecificSRE(url);

        if (result.success && result.licitacoes.length > 0) {
          const licitacoesToInsert = result.licitacoes.map((l) => ({
            sre_source: sreName,
            numero_edital: l.numero_edital,
            modalidade: l.modalidade,
            objeto: l.objeto,
            valor_estimado: l.valor_estimado,
            data_publicacao: l.data_publicacao,
            data_abertura: l.data_abertura,
            situacao: l.situacao,
            documentos: l.documentos.length > 0 ? l.documentos : undefined,
            raw_data: l.raw_data,
            categoria: l.categoria,
            processo: l.processo,
          }));

          await insertLicitacoes(licitacoesToInsert);

          await updateScrapingLog(log.id, {
            status: 'success',
            records_found: result.licitacoes.length,
            completed_at: new Date(),
          });

          results.push({
            sre: sreName,
            success: true,
            licitacoes: result.licitacoes.length,
            parser: result.parser_usado,
            duration: `${((Date.now() - startTime) / 1000).toFixed(2)}s`,
          });
        } else {
          await updateScrapingLog(log.id, {
            status: 'error',
            error_message: result.error || 'Nenhuma licitação encontrada',
            completed_at: new Date(),
          });

          results.push({
            sre: sreName,
            success: false,
            licitacoes: 0,
            duration: `${((Date.now() - startTime) / 1000).toFixed(2)}s`,
            error: result.error || 'Nenhuma licitação encontrada',
          });
        }
      } catch (error: any) {
        await updateScrapingLog(log.id, {
          status: 'error',
          error_message: error.message,
          completed_at: new Date(),
        });

        results.push({
          sre: sreName,
          success: false,
          licitacoes: 0,
          duration: `${((Date.now() - startTime) / 1000).toFixed(2)}s`,
          error: error.message,
        });
      }
    }

    const totalLicitacoes = results.reduce((sum, r) => sum + r.licitacoes, 0);
    const successfulScrapes = results.filter((r) => r.success).length;

    return NextResponse.json({
      success: true,
      results,
      summary: {
        total_sres: results.length,
        successful: successfulScrapes,
        failed: results.length - successfulScrapes,
        total_licitacoes: totalLicitacoes,
      },
    });
  } catch (error: any) {
    console.error('Erro no POST scraping:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
