import { prisma } from '@/lib/prisma/client';

export interface ScrapingLogEntry {
  id: string;
  sre_name: string;
  sre_code?: number;
  sre_source?: string;
  status: string;
  message: string;
  page_number?: number;
  total_pages?: number;
  licitacoes_found_this_page?: number;
  duration_ms?: number;
  error_message?: string;
  timestamp: Date;
}

// Manter logs em memória para broadcasting em tempo real
let currentSessionLogs: Map<string, ScrapingLogEntry[]> = new Map();

/**
 * Cria uma nova sessão de logs de scraping
 */
export function createScrapingSession(sessionId: string, totalSres: number = 47): string {
  currentSessionLogs.set(sessionId, []);
  console.log(`[LOG SESSION] Sessão criada: ${sessionId} para ${totalSres} SREs`);
  return sessionId;
}

/**
 * Adiciona um log à sessão
 */
export function addScrapingLog(
  sessionId: string,
  logEntry: Omit<ScrapingLogEntry, 'id' | 'timestamp'>
): ScrapingLogEntry {
  const entry: ScrapingLogEntry = {
    id: `${sessionId}-${Date.now()}-${Math.random()}`,
    timestamp: new Date(),
    ...logEntry,
  };

  const sessionLogs = currentSessionLogs.get(sessionId) || [];
  sessionLogs.push(entry);
  currentSessionLogs.set(sessionId, sessionLogs);

  console.log(`[${entry.status}] ${entry.sre_name}: ${entry.message}`);

  // Persistir também no banco de dados para auditoria
  prisma.scraping_logs
    .create({
      data: {
        sre_code: entry.sre_code,
        sre_source: entry.sre_source,
        status: entry.status,
        error_message: entry.error_message,
        licitacoes_coletadas: entry.licitacoes_found_this_page || 0,
        execution_time_ms: entry.duration_ms,
        metadata: {
          sessionId,
          message: entry.message,
          page_number: entry.page_number,
          total_pages: entry.total_pages,
        } as any,
      },
    })
    .catch((err) => console.error('Erro ao salvar log no BD:', err));

  return entry;
}

/**
 * Obtém todos os logs de uma sessão
 */
export function getSessionLogs(sessionId: string): ScrapingLogEntry[] {
  return currentSessionLogs.get(sessionId) || [];
}

/**
 * Obtém os últimos N logs de uma sessão
 */
export function getRecentLogs(sessionId: string, limit: number = 50): ScrapingLogEntry[] {
  const logs = currentSessionLogs.get(sessionId) || [];
  return logs.slice(-limit);
}

/**
 * Limpa os logs de uma sessão
 */
export function clearSessionLogs(sessionId: string): void {
  currentSessionLogs.delete(sessionId);
  console.log(`[LOG SESSION] Sessão limpa: ${sessionId}`);
}

/**
 * Limpa logs antigos (mais de 1 hora)
 */
export function clearAllOldLogs(): void {
  const now = Date.now();
  const oneHourAgo = now - 60 * 60 * 1000;

  let cleared = 0;
  for (const [sessionId, logs] of currentSessionLogs.entries()) {
    if (logs.length > 0 && logs[logs.length - 1].timestamp.getTime() < oneHourAgo) {
      currentSessionLogs.delete(sessionId);
      cleared++;
    }
  }

  if (cleared > 0) {
    console.log(`[LOG SESSION] ${cleared} sessões antigas limpas`);
  }
}

/**
 * Obter estatísticas de uma sessão
 */
export function getSessionStats(sessionId: string) {
  const logs = currentSessionLogs.get(sessionId) || [];

  return {
    total_logs: logs.length,
    sres_processadas: new Set(logs.map((l) => l.sre_code)).size,
    total_licitacoes: logs.reduce((sum, log) => sum + (log.licitacoes_found_this_page || 0), 0),
    erros: logs.filter((l) => l.status === 'error').length,
  };
}
