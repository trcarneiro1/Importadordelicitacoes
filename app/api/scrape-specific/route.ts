import { NextRequest, NextResponse } from 'next/server';
import { parseSpecificSRE } from '@/lib/scrapers/specific-parser';
import { SRE_URLS, getSREName } from '@/lib/scrapers/sre-urls';
import { insertLicitacoes, logScraping, updateScrapingLog } from '@/lib/supabase/queries';
import type { Licitacao, LicitacaoDocumento } from '@/lib/supabase/queries';
import type { LicitacaoCompleta } from '@/lib/scrapers/specific-parser';

type SpecificScrapeResult = {
  sre: string;
  success: boolean;
  licitacoes: number;
  parser?: string;
  duration: string;
  error?: string;
};

const toLicitacaoDocumentos = (documentos: LicitacaoCompleta['documentos']): LicitacaoDocumento[] | undefined => {
  if (!documentos?.length) return undefined;
  return documentos.map((doc) => ({
    nome: doc.nome,
    url: doc.url,
    tipo: doc.tipo,
  }));
};

const mapSpecificToLicitacao = (licitacao: LicitacaoCompleta, source: string): Licitacao => ({
  sre_source: source,
  numero_edital: licitacao.numero_edital,
  modalidade: licitacao.modalidade,
  objeto: licitacao.objeto,
  valor_estimado: licitacao.valor_estimado ?? null,
  data_publicacao: licitacao.data_publicacao ?? null,
  data_abertura: licitacao.data_abertura ?? null,
  situacao: licitacao.situacao,
  documentos: toLicitacaoDocumentos(licitacao.documentos),
  raw_data: licitacao.raw_data as unknown as Licitacao['raw_data'],
  categoria: licitacao.categoria,
  processo: licitacao.processo,
  contato_responsavel: licitacao.contato?.responsavel ?? null,
  contato_email: licitacao.contato?.email ?? null,
  contato_telefone: licitacao.contato?.telefone ?? null,
});

const parsePositiveInteger = (value: string | null, fallback: number): number => {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

/**
 * API endpoint mehorado que usa o parser específico
 * GET /api/scrape-specific?sre=metro&count=5
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const sreParam = searchParams.get('sre');
  const count = parsePositiveInteger(searchParams.get('count'), 3);

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

  const results: SpecificScrapeResult[] = [];

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
          const licitacoesToInsert = result.licitacoes.map((licitacao) =>
            mapSpecificToLicitacao(licitacao, sreName)
          );

          await insertLicitacoes(licitacoesToInsert);

          // Atualizar log
          await updateScrapingLog(log.id, {
            status: 'success',
            records_found: result.licitacoes.length,
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
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Erro desconhecido';
        // Erro durante scraping
        await updateScrapingLog(log.id, {
          status: 'error',
          error_message: message,
        });

        results.push({
          sre: sreName,
          success: false,
          licitacoes: 0,
          duration: `${((Date.now() - startTime) / 1000).toFixed(2)}s`,
          error: message,
        });
      }
    }

    const totalLicitacoes = results.reduce((sum, r) => sum + (r.licitacoes || 0), 0);
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
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('Erro no scraping:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST endpoint para scraping customizado
 * Aceita: { sres: string[] } ou { sreUrl: string, sreNome: string, sreId: number }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({} as { sres?: string[]; sreUrl?: string; sreNome?: string }));
    
    let sresToProcess: string[] = [];
    
    // Suporte para scraping de SRE única
    if (body.sreUrl) {
      sresToProcess = [body.sreUrl];
    } 
    // Suporte para array de SREs
    else if (Array.isArray(body.sres) && body.sres.length > 0) {
      sresToProcess = body.sres;
    } 
    else {
      return NextResponse.json({ error: 'Forneça sreUrl ou array de sres' }, { status: 400 });
    }

  const results: SpecificScrapeResult[] = [];
  let novas = 0;
  let duplicadas = 0;

    for (const sreIdentifier of sresToProcess) {
      const url =
        SRE_URLS.find((u) => u.includes(sreIdentifier)) ||
        (sreIdentifier.startsWith('http') ? sreIdentifier : null);

      if (!url) {
        results.push({
          sre: sreIdentifier,
          success: false,
          licitacoes: 0,
          duration: '0s',
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
          const licitacoesToInsert = result.licitacoes.map((licitacao) =>
            mapSpecificToLicitacao(licitacao, sreName)
          );

          const totalEncontradas = licitacoesToInsert.length;
          let inseridas = 0;

          try {
            const inserted = await insertLicitacoes(licitacoesToInsert);
            inseridas = inserted?.length || 0;
          } catch (error) {
            // Pode dar erro se houver duplicatas (unique constraint)
            console.log('Algumas licitações já existem (duplicadas)');
            inseridas = 0;
          }

          const duplicadasCount = totalEncontradas - inseridas;
          novas += inseridas;
          duplicadas += duplicadasCount;

          await updateScrapingLog(log.id, {
            status: 'success',
            records_found: result.licitacoes.length,
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
          });

          results.push({
            sre: sreName,
            success: false,
            licitacoes: 0,
            duration: `${((Date.now() - startTime) / 1000).toFixed(2)}s`,
            error: result.error || 'Nenhuma licitação encontrada',
          });
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Erro desconhecido';
        await updateScrapingLog(log.id, {
          status: 'error',
          error_message: message,
        });

        results.push({
          sre: sreName,
          success: false,
          licitacoes: 0,
          duration: `${((Date.now() - startTime) / 1000).toFixed(2)}s`,
          error: message,
        });
      }
    }

    const totalLicitacoes = results.reduce((sum, r) => sum + (r.licitacoes || 0), 0);
    const successfulScrapes = results.filter((r) => r.success).length;

    return NextResponse.json({
      success: true,
      total: totalLicitacoes,
      novas,
      duplicadas,
      results,
      summary: {
        total_sres: results.length,
        successful: successfulScrapes,
        failed: results.length - successfulScrapes,
        total_licitacoes: totalLicitacoes,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('Erro no POST scraping:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
