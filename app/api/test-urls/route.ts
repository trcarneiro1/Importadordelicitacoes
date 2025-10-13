/**
 * Test URLs
 * Tests multiple URL patterns to find working endpoints
 * GET /api/test-urls?sre=6
 */

import { NextRequest, NextResponse } from 'next/server';

type UrlTestSuccess = {
  url: string;
  status: number;
  ok: boolean;
  content_type: string;
  html_length: number;
  has_content: boolean;
  redirected: boolean;
  final_url: string;
  title: string;
  has_licitacoes_keyword: boolean;
  has_edital_keyword: boolean;
  has_compras_keyword: boolean;
};

type UrlTestResult = UrlTestSuccess | { url: string; error: string };

const isSuccessfulResult = (result: UrlTestResult): result is UrlTestSuccess =>
  'status' in result;

const URL_PATTERNS = [
  '/index.php/licitacoes-e-compras',
  '/licitacoes-e-compras',
  '/index.php/licitacoes',
  '/licitacoes',
  '/index.php/transparencia/licitacoes',
  '/transparencia/licitacoes',
  '/',
  '/index.php'
];

const SRE_BASES: Record<number, string> = {
  6: 'https://srebarbacena.educacao.mg.gov.br',
  13: 'https://srecurvelo.educacao.mg.gov.br',
  25: 'https://sremontesclaros.educacao.mg.gov.br',
  1: 'https://sremetropa.educacao.mg.gov.br',
  4: 'https://srealmenara.educacao.mg.gov.br'
};

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sreParam = searchParams.get('sre');

    if (!sreParam) {
      return NextResponse.json({
        error: 'Missing sre parameter',
        usage: 'GET /api/test-urls?sre=6',
        available_sres: Object.keys(SRE_BASES).join(', ')
      }, { status: 400 });
    }

    const sreCode = Number(sreParam);
    if (!Number.isInteger(sreCode)) {
      return NextResponse.json({
        error: 'Invalid sre parameter. Provide a numeric code.',
        available_sres: Object.keys(SRE_BASES).join(', ')
      }, { status: 400 });
    }
    const baseUrl = SRE_BASES[sreCode];

    if (!baseUrl) {
      return NextResponse.json({
        error: `SRE ${sreCode} not configured for testing`,
        available_sres: Object.keys(SRE_BASES).join(', ')
      }, { status: 400 });
    }

    console.log(`🧪 Testing URLs for SRE ${sreCode}: ${baseUrl}`);

  const results: UrlTestResult[] = [];

    for (const pattern of URL_PATTERNS) {
      const testUrl = baseUrl + pattern;
      console.log(`   Testing: ${testUrl}`);

      try {
        const response = await fetch(testUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          redirect: 'follow'
        });

        const contentType = response.headers.get('content-type') || '';
        const html = await response.text();

        results.push({
          url: testUrl,
          status: response.status,
          ok: response.ok,
          content_type: contentType,
          html_length: html.length,
          has_content: html.length > 5000,
          redirected: response.redirected,
          final_url: response.url,
          title: html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() || 'No title',
          has_licitacoes_keyword: html.toLowerCase().includes('licitaç') || html.toLowerCase().includes('licitac'),
          has_edital_keyword: html.toLowerCase().includes('edital'),
          has_compras_keyword: html.toLowerCase().includes('compras')
        });

        // Wait 500ms between requests
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        results.push({
          url: testUrl,
          error: message
        });
      }
    }

    // Find best candidate
    const workingUrls = results.filter((r): r is UrlTestSuccess =>
      isSuccessfulResult(r) &&
      r.ok &&
      r.has_content &&
      (r.has_licitacoes_keyword || r.has_edital_keyword || r.has_compras_keyword)
    );

    return NextResponse.json({
      sre_code: sreCode,
      base_url: baseUrl,
      results,
      summary: {
        total_tested: results.length,
        working: results.filter(isSuccessfulResult).filter(result => result.ok).length,
        with_content: results.filter(isSuccessfulResult).filter(result => result.has_content).length,
        potential_matches: workingUrls.length
      },
      recommendations: workingUrls.map(r => ({
        url: r.url,
        score: [
          r.has_licitacoes_keyword ? 10 : 0,
          r.has_edital_keyword ? 5 : 0,
          r.has_compras_keyword ? 3 : 0,
          (r.html_length || 0) > 10000 ? 5 : 0
        ].reduce((a, b) => a + b, 0)
      })).sort((a, b) => b.score - a.score)
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Test URLs error:', error);
    return NextResponse.json({
      error: message
    }, { status: 500 });
  }
}
