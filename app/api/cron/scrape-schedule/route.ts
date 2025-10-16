/**
 * Vercel Cron Job - Scraping Automático
 * /api/cron/scrape-schedule
 * 
 * Configurar no vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/scrape-schedule",
 *     "schedule": "0 0 * * *"  // Todo dia à meia-noite
 *   }]
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  shouldRunScraping,
  recordScrapingRun,
  getScrapingConfig,
} from '@/lib/scraping-config';
import { scrapeAllSREs } from '@/lib/scrapers/orchestrator';

export const maxDuration = 3600; // 1 hora max

export async function GET(request: NextRequest) {
  // Verificar token de segurança (Vercel envia um header)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.warn('[CRON] ⚠️ CRON_SECRET não configurada');
  }

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    console.error('[CRON] ❌ Unauthorized cron call');
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    console.log('[CRON] 🔄 Checking if scraping should run...');

    const shouldRun = await shouldRunScraping();

    if (!shouldRun) {
      console.log('[CRON] ℹ️ Scraping skipped (not time yet or disabled)');
      return NextResponse.json({
        success: true,
        skipped: true,
        reason: 'Not scheduled to run yet',
      });
    }

    console.log('[CRON] 🚀 Starting scheduled scraping...');
    const startTime = Date.now();

    // Executar scraping
    const results = await scrapeAllSREs();

    const duration = Date.now() - startTime;
    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;
    const totalLicitacoes = results.reduce((sum, r) => sum + r.licitacoes_found, 0);

    console.log(
      `[CRON] ✅ Scraping completed: ${successful}/${results.length} successful`
    );

    // Registrar execução
    await recordScrapingRun({
      success: failed === 0,
      licitacoes_found: totalLicitacoes,
      duration_ms: duration,
    });

    return NextResponse.json({
      success: true,
      executed: true,
      summary: {
        total_sres: results.length,
        successful_sres: successful,
        failed_sres: failed,
        total_licitacoes: totalLicitacoes,
        duration_ms: duration,
        duration_readable: `${Math.floor(duration / 1000)}s`,
      },
    });
  } catch (error: any) {
    console.error('[CRON] ❌ Error during scheduled scraping:', error.message);

    try {
      await recordScrapingRun({
        success: false,
        licitacoes_found: 0,
        duration_ms: 0,
        error: error.message,
      });
    } catch (logError) {
      console.error('[CRON] Error recording failed run:', logError);
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

/**
 * POST também permitido para testes
 */
export async function POST(request: NextRequest) {
  return GET(request);
}
