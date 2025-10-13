import { NextRequest, NextResponse } from 'next/server';
import { scrapeSRE, scrapeMultipleSREs, ScrapeResult, ScrapedLicitacao } from '@/lib/scrapers/sre-scraper';
import { SRE_URLS, getSREName } from '@/lib/scrapers/sre-urls';
import { insertLicitacoes, logScraping, updateScrapingLog } from '@/lib/supabase/queries';
import { processLicitacoesPendentes } from '@/lib/agents/enrichment-agent';
import type { Licitacao, LicitacaoDocumento } from '@/lib/supabase/queries';

type ScrapePostBody = {
  sres?: string[];
};

const toLicitacaoDocumentos = (docs?: string[]): LicitacaoDocumento[] | undefined => {
  if (!docs?.length) return undefined;

  return docs.map((docUrl, index) => ({
    nome: docUrl.split('/').pop() || `Documento ${index + 1}`,
    url: docUrl,
  }));
};

const mapScrapedToLicitacao = (licitacao: ScrapedLicitacao, source: string): Licitacao => ({
  sre_source: source,
  numero_edital: licitacao.numero_edital,
  modalidade: licitacao.modalidade,
  objeto: licitacao.objeto,
  valor_estimado: licitacao.valor_estimado ?? null,
  data_publicacao: licitacao.data_publicacao ?? null,
  data_abertura: licitacao.data_abertura ?? null,
  situacao: licitacao.situacao,
  documentos: toLicitacaoDocumentos(licitacao.documentos),
  raw_data: licitacao.raw_data ? (licitacao.raw_data as unknown as Licitacao['raw_data']) : null,
});

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const sre = searchParams.get('sre'); // Specific SRE to scrape
  const countParam = searchParams.get('count');
  const parsedCount = Number(countParam);
  const count = Number.isInteger(parsedCount) && parsedCount > 0 ? parsedCount : 1; // Number of SREs to scrape

  try {
    let results: ScrapeResult[];

    if (sre) {
      // Scrape specific SRE
      const sreUrl = SRE_URLS.find(url => url.includes(sre));
      if (!sreUrl) {
        return NextResponse.json(
          { error: 'SRE not found' },
          { status: 404 }
        );
      }

      const log = await logScraping({
        sre_source: getSREName(sreUrl),
        status: 'in_progress',
        started_at: new Date(),
      });

      const result = await scrapeSRE(sreUrl);

      // Save to database
      if (result.success && result.licitacoes.length > 0) {
        const sreSource = getSREName(sreUrl);
        const licitacoesToInsert = result.licitacoes.map((l) =>
          mapScrapedToLicitacao(l, sreSource)
        );

        await insertLicitacoes(licitacoesToInsert);
        
        await updateScrapingLog(log.id, {
          status: 'success',
          records_found: result.licitacoes.length,
          completed_at: new Date(),
        });
      } else {
        await updateScrapingLog(log.id, {
          status: 'error',
          error_message: result.error || 'No data found',
          completed_at: new Date(),
        });
      }

      results = [result];
    } else {
      // Scrape first N SREs
      const sresToScrape = SRE_URLS.slice(0, count);
      
      const logs = await Promise.all(
        sresToScrape.map(url =>
          logScraping({
            sre_source: getSREName(url),
            status: 'in_progress',
            started_at: new Date(),
          })
        )
      );

  results = await scrapeMultipleSREs(sresToScrape);

      // Save results to database
      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        const log = logs[i];

        if (result.success && result.licitacoes.length > 0) {
          const sreSource = getSREName(sresToScrape[i]);
          const licitacoesToInsert = result.licitacoes.map((l) =>
            mapScrapedToLicitacao(l, sreSource)
          );

          await insertLicitacoes(licitacoesToInsert);
          
          await updateScrapingLog(log.id, {
            status: 'success',
            records_found: result.licitacoes.length,
            completed_at: new Date(),
          });
        } else {
          await updateScrapingLog(log.id, {
            status: 'error',
            error_message: result.error || 'No data found',
            completed_at: new Date(),
          });
        }
      }
    }

    // 🤖 PROCESSAMENTO AUTOMÁTICO COM IA
    console.log('🤖 Iniciando processamento automático com IA...');
    try {
      const iaResults = await processLicitacoesPendentes(100); // Processa até 100 por vez
      console.log(`✅ IA processou ${iaResults.success} licitações com sucesso`);
    } catch (iaError) {
      console.error('⚠️ Erro no processamento IA (não crítico):', iaError);
      // Não falhar a requisição se IA falhar
    }

    return NextResponse.json({
      success: true,
      results,
      total_scraped: results.length,
      total_records: results.reduce((sum, r) => sum + r.licitacoes.length, 0),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Scraping failed';
    console.error('Scraping error:', error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as ScrapePostBody;
    const { sres } = body; // Array of SRE URLs to scrape

    if (!sres || !Array.isArray(sres)) {
      return NextResponse.json(
        { error: 'Invalid request: sres array required' },
        { status: 400 }
      );
    }

    const results = await scrapeMultipleSREs(sres);

    // Save to database
    for (let i = 0; i < results.length; i++) {
      const result = results[i];

      if (result.success && result.licitacoes.length > 0) {
        const sreSource = getSREName(sres[i]);
        const licitacoesToInsert = result.licitacoes.map((l) =>
          mapScrapedToLicitacao(l, sreSource)
        );

        await insertLicitacoes(licitacoesToInsert);
      }
    }

    return NextResponse.json({
      success: true,
      results,
      total_scraped: results.length,
      total_records: results.reduce((sum, r) => sum + r.licitacoes.length, 0),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Scraping failed';
    console.error('Scraping error:', error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
