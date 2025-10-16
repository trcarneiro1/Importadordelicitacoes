import { prisma } from '@/lib/prisma/client';

export interface AILogEntry {
  id: string;
  licitacao_id?: string;
  licitacao_titulo?: string;
  sre_name?: string;
  status: string;
  message: string;
  category?: string;
  priority?: string;
  confidence?: number;
  processing_time_ms?: number;
  error_message?: string;
  timestamp: Date;
}

// Manter logs em memória para broadcasting em tempo real
let currentSessionAILogs: Map<string, AILogEntry[]> = new Map();

/**
 * Cria uma nova sessão de logs de processamento IA
 */
export function createAISession(sessionId: string, totalLicitacoes: number = 0): string {
  currentSessionAILogs.set(sessionId, []);
  console.log(`[IA LOG SESSION] Sessão criada: ${sessionId} para ${totalLicitacoes} licitações`);
  return sessionId;
}

/**
 * Adiciona um log à sessão de IA
 */
export function addAILog(
  sessionId: string,
  logEntry: Omit<AILogEntry, 'id' | 'timestamp'>
): AILogEntry {
  const entry: AILogEntry = {
    id: `${sessionId}-${Date.now()}-${Math.random()}`,
    timestamp: new Date(),
    ...logEntry,
  };

  const sessionLogs = currentSessionAILogs.get(sessionId) || [];
  sessionLogs.push(entry);
  currentSessionAILogs.set(sessionId, sessionLogs);

  console.log(`[${entry.status}] ${entry.licitacao_titulo || 'IA'}: ${entry.message}`);

  // Nota: Logs IA mantidos em memória para performance em tempo real
  // Dados enriquecidos são persistidos diretamente na tabela licitacoes

  return entry;
}

/**
 * Obtém todos os logs de uma sessão de IA
 */
export function getAISessionLogs(sessionId: string): AILogEntry[] {
  return currentSessionAILogs.get(sessionId) || [];
}

/**
 * Obtém os últimos N logs de uma sessão de IA
 */
export function getRecentAILogs(sessionId: string, limit: number = 50): AILogEntry[] {
  const logs = currentSessionAILogs.get(sessionId) || [];
  return logs.slice(-limit);
}

/**
 * Limpa os logs de uma sessão de IA
 */
export function clearAISessionLogs(sessionId: string): void {
  currentSessionAILogs.delete(sessionId);
  console.log(`[IA LOG SESSION] Sessão limpa: ${sessionId}`);
}

/**
 * Limpa logs IA antigos (mais de 1 hora)
 */
export function clearAllOldAILogs(): void {
  const now = Date.now();
  const oneHourAgo = now - 60 * 60 * 1000;

  let cleared = 0;
  for (const [sessionId, logs] of currentSessionAILogs.entries()) {
    if (logs.length > 0 && logs[logs.length - 1].timestamp.getTime() < oneHourAgo) {
      currentSessionAILogs.delete(sessionId);
      cleared++;
    }
  }

  if (cleared > 0) {
    console.log(`[IA LOG SESSION] ${cleared} sessões antigas limpas`);
  }
}

/**
 * Obter estatísticas de uma sessão de IA
 */
export function getAISessionStats(sessionId: string) {
  const logs = currentSessionAILogs.get(sessionId) || [];

  const stats = {
    total_logs: logs.length,
    licitacoes_processadas: new Set(logs.map((l) => l.licitacao_id)).size,
    categorias_encontradas: new Set(logs.map((l) => l.category)).size,
    prioridades: {
      alta: logs.filter((l) => l.priority === 'Alta').length,
      media: logs.filter((l) => l.priority === 'Média').length,
      baixa: logs.filter((l) => l.priority === 'Baixa').length,
    },
    tempo_medio_ms: logs.reduce((sum, log) => sum + (log.processing_time_ms || 0), 0) / Math.max(logs.length, 1),
    erros: logs.filter((l) => l.status === 'error').length,
    sucesso: logs.filter((l) => l.status === 'success').length,
  };

  return stats;
}
