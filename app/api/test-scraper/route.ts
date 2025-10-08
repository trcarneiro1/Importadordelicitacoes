/**
 * Test Scraper API Endpoint
 * Test scraping via Next.js API route
 * GET /api/test-scraper?sre=6
 */

import { NextRequest, NextResponse } from 'next/server';
import { testScrapeSRE, scrapeMultipleSREs } from '@/lib/scrapers/orchestrator';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sreParam = searchParams.get('sre');

    if (!sreParam) {
      return NextResponse.json({
        error: 'Missing sre parameter',
        usage: 'GET /api/test-scraper?sre=6 or GET /api/test-scraper?sre=6,13,22'
      }, { status: 400 });
    }

    // Check if multiple SREs
    if (sreParam.includes(',')) {
      const codes = sreParam.split(',').map(s => parseInt(s.trim()));
      
      console.log(`🧪 Testing ${codes.length} SREs: ${codes.join(', ')}`);
      const results = await scrapeMultipleSREs(codes);

      return NextResponse.json({
        success: true,
        sres_tested: codes.length,
        results: results.map(r => ({
          sre_code: r.sre_code,
          sre_name: r.sre_name,
          success: r.success,
          licitacoes_found: r.licitacoes_found,
          urls_scraped: r.urls_scraped,
          duration_seconds: Math.round(r.duration_ms / 1000),
          error: r.error
        }))
      });

    } else {
      const sreCode = parseInt(sreParam);
      
      if (isNaN(sreCode) || sreCode < 1 || sreCode > 47) {
        return NextResponse.json({
          error: 'Invalid SRE code. Must be between 1 and 47.'
        }, { status: 400 });
      }

      console.log(`🧪 Testing SRE ${sreCode}...`);
      const result = await testScrapeSRE(sreCode);

      if (!result) {
        return NextResponse.json({
          error: `SRE ${sreCode} not found`
        }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        result: {
          sre_code: result.sre_code,
          sre_name: result.sre_name,
          success: result.success,
          licitacoes_found: result.licitacoes_found,
          urls_scraped: result.urls_scraped,
          duration_seconds: Math.round(result.duration_ms / 1000),
          error: result.error
        }
      });
    }

  } catch (error: any) {
    console.error('Test scraper error:', error);
    return NextResponse.json({
      error: error.message
    }, { status: 500 });
  }
}
