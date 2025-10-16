/**
 * Scraping Configuration Service
 * Gerencia as configurações de scraping automático
 */

import { prisma } from './prisma/client';

export interface ScrapingConfigData {
  enabled?: boolean;
  interval_hours?: number;
  interval_minutes?: number;
  max_retries?: number;
  timeout_seconds?: number;
  sres_enabled?: number[];
}

/**
 * Obter configuração de scraping (ou criar padrão se não existir)
 */
export async function getScrapingConfig() {
  try {
    let config = await prisma.scraping_config.findFirst();

    if (!config) {
      // Criar configuração padrão (a cada 24 horas)
      config = await prisma.scraping_config.create({
        data: {
          enabled: true,
          interval_hours: 24,
          interval_minutes: 0,
          max_retries: 3,
          timeout_seconds: 3600,
          sres_enabled: [],
          next_run_at: new Date(Date.now() + 5 * 60000), // Próximo run em 5 minutos
        },
      });

      console.log('[ScrapingConfig] ✨ Created default configuration');
    }

    return config;
  } catch (error: any) {
    console.error('[ScrapingConfig] ❌ Error fetching config:', error.message);
    throw error;
  }
}

/**
 * Atualizar configuração de scraping
 */
export async function updateScrapingConfig(data: ScrapingConfigData) {
  try {
    // Validar intervalos
    if (data.interval_hours !== undefined) {
      if (data.interval_hours < 1 || data.interval_hours > 72) {
        throw new Error('interval_hours deve estar entre 1 e 72');
      }
    }

    if (data.interval_minutes !== undefined) {
      if (data.interval_minutes < 0 || data.interval_minutes > 59) {
        throw new Error('interval_minutes deve estar entre 0 e 59');
      }
    }

    // Calcular próximo run se foi alterado o intervalo
    let next_run_at = undefined;
    if (data.interval_hours !== undefined || data.interval_minutes !== undefined) {
      const config = await getScrapingConfig();
      const hours = data.interval_hours ?? config.interval_hours;
      const minutes = data.interval_minutes ?? config.interval_minutes;
      const intervalMs = (hours * 3600 + minutes * 60) * 1000;
      next_run_at = new Date(Date.now() + intervalMs);
    }

    const updateData: any = {
      ...data,
      updated_at: new Date(),
    };

    if (next_run_at) {
      updateData.next_run_at = next_run_at;
    }

    const config = await prisma.scraping_config.update({
      where: { id: (await getScrapingConfig()).id },
      data: updateData,
    });

    console.log('[ScrapingConfig] ✅ Configuration updated');
    return config;
  } catch (error: any) {
    console.error('[ScrapingConfig] ❌ Error updating config:', error.message);
    throw error;
  }
}

/**
 * Registrar execução de scraping
 */
export async function recordScrapingRun(data: {
  success: boolean;
  licitacoes_found: number;
  duration_ms: number;
  error?: string;
}) {
  try {
    const config = await getScrapingConfig();
    const intervalMs =
      (config.interval_hours * 3600 + config.interval_minutes * 60) * 1000;
    const next_run_at = new Date(Date.now() + intervalMs);

    const updateData = {
      last_run_at: new Date(),
      last_run_success: data.success,
      last_run_licitacoes: data.licitacoes_found,
      last_run_duration_ms: data.duration_ms,
      last_run_error: data.error || null,
      next_run_at,
      total_runs: { increment: 1 },
      successful_runs: data.success ? { increment: 1 } : undefined,
      failed_runs: data.success ? undefined : { increment: 1 },
      total_licitacoes_found: { increment: data.licitacoes_found },
    };

    // Remover undefined values
    Object.keys(updateData).forEach(
      (key) =>
        (updateData as any)[key] === undefined && delete (updateData as any)[key]
    );

    const updated = await prisma.scraping_config.update({
      where: { id: config.id },
      data: updateData as any,
    });

    console.log(
      `[ScrapingConfig] 📊 Run recorded: ${data.success ? '✅' : '❌'} | ${data.licitacoes_found} licitações | ${data.duration_ms}ms`
    );
    return updated;
  } catch (error: any) {
    console.error('[ScrapingConfig] ❌ Error recording run:', error.message);
    throw error;
  }
}

/**
 * Obter estatísticas de scraping
 */
export async function getScrapingStats() {
  try {
    const config = await getScrapingConfig();

    const timeUntilNext = config.next_run_at
      ? Math.max(0, config.next_run_at.getTime() - Date.now())
      : 0;

    return {
      enabled: config.enabled,
      interval: {
        hours: config.interval_hours,
        minutes: config.interval_minutes,
        description: `${config.interval_hours}h ${config.interval_minutes}m`,
      },
      last_run: {
        at: config.last_run_at,
        success: config.last_run_success,
        licitacoes_found: config.last_run_licitacoes,
        duration_ms: config.last_run_duration_ms,
        error: config.last_run_error,
      },
      next_run: {
        at: config.next_run_at,
        time_until_ms: timeUntilNext,
        time_until_readable: formatTimeUntil(timeUntilNext),
      },
      statistics: {
        total_runs: config.total_runs,
        successful_runs: config.successful_runs,
        failed_runs: config.failed_runs,
        success_rate:
          config.total_runs > 0
            ? Math.round((config.successful_runs / config.total_runs) * 100)
            : 0,
        total_licitacoes_found: config.total_licitacoes_found,
      },
    };
  } catch (error: any) {
    console.error('[ScrapingConfig] ❌ Error fetching stats:', error.message);
    throw error;
  }
}

/**
 * Formatar tempo até próxima execução
 */
function formatTimeUntil(ms: number): string {
  if (ms <= 0) return 'Agora';

  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

/**
 * Verificar se é hora de executar scraping
 */
export async function shouldRunScraping(): Promise<boolean> {
  try {
    const config = await getScrapingConfig();

    if (!config.enabled) {
      return false;
    }

    if (!config.next_run_at) {
      return true;
    }

    return new Date() >= config.next_run_at;
  } catch (error: any) {
    console.error('[ScrapingConfig] ❌ Error checking if should run:', error.message);
    return false;
  }
}
