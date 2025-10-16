/**
 * Scraping Configuration API
 * GET /api/settings/scraping - Obter configurações
 * POST /api/settings/scraping - Atualizar configurações
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getScrapingConfig,
  updateScrapingConfig,
  getScrapingStats,
} from '@/lib/scraping-config';

export async function GET() {
  try {
    const config = await getScrapingConfig();
    const stats = await getScrapingStats();

    return NextResponse.json({
      success: true,
      config,
      stats,
    });
  } catch (error: any) {
    console.error('[API] ❌ Error fetching scraping config:', error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validar campos
    const allowedFields = [
      'enabled',
      'interval_hours',
      'interval_minutes',
      'max_retries',
      'timeout_seconds',
      'sres_enabled',
    ];

    const updateData: any = {};
    for (const field of allowedFields) {
      if (field in body) {
        updateData[field] = body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: 'Nenhum campo para atualizar' },
        { status: 400 }
      );
    }

    const config = await updateScrapingConfig(updateData);
    const stats = await getScrapingStats();

    return NextResponse.json({
      success: true,
      config,
      stats,
      message: 'Configuração atualizada com sucesso',
    });
  } catch (error: any) {
    console.error('[API] ❌ Error updating scraping config:', error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
