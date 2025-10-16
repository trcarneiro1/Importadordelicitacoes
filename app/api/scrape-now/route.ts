/**
 * Trigger Scraping Manual
 * POST /api/scrape-now - Iniciar scraping imediatamente
 */

import { NextRequest, NextResponse } from 'next/server';
import { scrapeAllSREs } from '@/lib/scrapers/orchestrator';
import {
  recordScrapingRun,
  getScrapingConfig,
  updateScrapingConfig,
} from '@/lib/scraping-config';

export const maxDuration = 3600; // 1 hora max (Vercel Pro)

export async function POST(request: NextRequest) {
  try {
    const config = await getScrapingConfig();

    if (!config.enabled) {
      return NextResponse.json(
        { success: false, error: 'Scraping is disabled in configuration' },
        { status: 400 }
      );
    }

    console.log('[API] 🚀 Starting manual scraping...');
    const startTime = Date.now();

    // Executar scraping de todas as 47 SREs
    const results = await scrapeAllSREs();

    const duration = Date.now() - startTime;
    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;
    const totalLicitacoes = results.reduce((sum, r) => sum + r.licitacoes_found, 0);

    console.log(
      `[API] ✅ Scraping completed: ${successful}/${results.length} successful, ${totalLicitacoes} licitações`
    );

    // Registrar execução
    await recordScrapingRun({
      success: failed === 0,
      licitacoes_found: totalLicitacoes,
      duration_ms: duration,
    });

    return NextResponse.json({
      success: true,
      scraping_completed: {
        total_sres: results.length,
        successful_sres: successful,
        failed_sres: failed,
        total_licitacoes: totalLicitacoes,
        duration_ms: duration,
        duration_readable: `${Math.floor(duration / 1000)}s`,
        results: results.map((r) => ({
          sre_code: r.sre_code,
          sre_name: r.sre_name,
          success: r.success,
          licitacoes_found: r.licitacoes_found,
          urls_scraped: r.urls_scraped,
          duration_ms: r.duration_ms,
          error: r.error,
        })),
      },
      message: `Scraping completed: ${successful}/${results.length} SREs successful, ${totalLicitacoes} licitações found`,
    });
  } catch (error: any) {
    console.error('[API] ❌ Error during scraping:', error.message);

    // Registrar erro
    try {
      await recordScrapingRun({
        success: false,
        licitacoes_found: 0,
        duration_ms: Date.now() - Date.now(),
        error: error.message,
      });
    } catch (logError) {
      console.error('[API] Error recording failed run:', logError);
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const config = await getScrapingConfig();

    return NextResponse.json({
      success: true,
      enabled: config.enabled,
      next_run_at: config.next_run_at,
      interval: `${config.interval_hours}h ${config.interval_minutes}m`,
      last_run: {
        at: config.last_run_at,
        success: config.last_run_success,
        licitacoes_found: config.last_run_licitacoes,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
