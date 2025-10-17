/**
 * OpenRouter Credit Checker
 * Verifica saldo de créditos antes de processar com IA
 * Se não tiver créditos, coloca job em fila aguardando
 */

interface CreditBalance {
  balance: number;
  hasCredits: boolean;
  status: 'free' | 'limited' | 'ok' | 'insufficient';
  message: string;
}

// Limite mínimo recomendado para operações
const MINIMUM_CREDITS_FOR_BATCH = 10; // $ para processar lote
const MINIMUM_CREDITS_FOR_SINGLE = 0.5; // $ para uma licitação
const FREE_TIER_LIMIT = 0;

/**
 * Obtém saldo de créditos da OpenRouter
 */
export async function checkCreditBalance(): Promise<CreditBalance> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  
  if (!apiKey) {
    return {
      balance: 0,
      hasCredits: false,
      status: 'insufficient',
      message: 'OPENROUTER_API_KEY não configurada'
    };
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/auth/key', {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    if (!response.ok) {
      return {
        balance: 0,
        hasCredits: false,
        status: 'insufficient',
        message: `Erro ao verificar créditos (HTTP ${response.status})`
      };
    }

    const data = await response.json();
    const balance = data.data?.balance || 0;

    // Determinar status
    let status: CreditBalance['status'];
    let message: string;

    if (balance === undefined || balance === null) {
      // Provavelmente Free Tier
      status = 'free';
      message = '🆓 Usando tier gratuito (limitado)';
    } else if (balance <= 0) {
      status = 'insufficient';
      message = `❌ Sem créditos disponíveis (saldo: $${balance.toFixed(2)})`;
    } else if (balance < MINIMUM_CREDITS_FOR_BATCH) {
      status = 'limited';
      message = `⚠️  Créditos limitados (saldo: $${balance.toFixed(2)}) - Apenas operações individuais`;
    } else {
      status = 'ok';
      message = `✅ Créditos disponíveis (saldo: $${balance.toFixed(2)})`;
    }

    return {
      balance,
      hasCredits: balance > 0,
      status,
      message
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[CreditChecker] Error:', message);
    
    return {
      balance: 0,
      hasCredits: false,
      status: 'insufficient',
      message: `Erro ao verificar: ${message}`
    };
  }
}

/**
 * Verifica se tem crédito suficiente para operação em lote
 */
export async function canProcessBatch(): Promise<{
  can: boolean;
  reason: string;
  balance: number;
}> {
  const balance = await checkCreditBalance();

  if (balance.status === 'insufficient') {
    return {
      can: false,
      reason: `Sem créditos. ${balance.message}`,
      balance: balance.balance
    };
  }

  if (balance.status === 'free') {
    return {
      can: false,
      reason: `Usando tier gratuito. Adicione uma chave de pagamento para processar lotes. ${balance.message}`,
      balance: balance.balance
    };
  }

  if (balance.status === 'limited') {
    return {
      can: false,
      reason: `Créditos insuficientes para lote ($${balance.balance.toFixed(2)} < $${MINIMUM_CREDITS_FOR_BATCH}). ${balance.message}`,
      balance: balance.balance
    };
  }

  return {
    can: true,
    reason: `Créditos suficientes. ${balance.message}`,
    balance: balance.balance
  };
}

/**
 * Verifica se tem crédito suficiente para uma operação
 */
export async function canProcessSingle(): Promise<{
  can: boolean;
  reason: string;
  balance: number;
}> {
  const balance = await checkCreditBalance();

  if (balance.status === 'insufficient') {
    return {
      can: false,
      reason: `Sem créditos. ${balance.message}`,
      balance: balance.balance
    };
  }

  if (balance.status === 'free') {
    return {
      can: true, // Free tier pode fazer requisições individuais
      reason: `Usando tier gratuito com limite de requisições. ${balance.message}`,
      balance: balance.balance
    };
  }

  return {
    can: true,
    reason: `Créditos disponíveis. ${balance.message}`,
    balance: balance.balance
  };
}

/**
 * Status da API que retorna para o frontend
 */
export async function getCreditStatus() {
  const batch = await canProcessBatch();
  const single = await canProcessSingle();
  const balance = await checkCreditBalance();

  return {
    credit: balance,
    canProcessBatch: batch.can,
    canProcessSingle: single.can,
    batchReason: batch.reason,
    singleReason: single.reason,
    recommendations: getRecommendations(balance.status)
  };
}

/**
 * Recomendações baseadas no status dos créditos
 */
function getRecommendations(status: CreditBalance['status']): string[] {
  const recs: string[] = [];

  switch (status) {
    case 'insufficient':
      recs.push('❌ Sem créditos para processamento IA');
      recs.push('💳 Adicione uma forma de pagamento em openrouter.ai');
      recs.push('⏳ Ou aguarde reconhecimento de créditos gratuitos');
      recs.push('📧 Contate suporte@openrouter.ai se tiver acesso de tier gratuito');
      break;

    case 'free':
      recs.push('🆓 Usando tier gratuito (requisições limitadas)');
      recs.push('📊 Processamento em lotes não é recomendado');
      recs.push('✅ Processe licitações individuais para não atingir limite');
      recs.push('💳 Para lotes: Adicione pagamento em openrouter.ai');
      break;

    case 'limited':
      recs.push('⚠️  Créditos baixos');
      recs.push('📊 Processe apenas registros críticos');
      recs.push('💳 Considere adicionar mais créditos');
      recs.push('📈 Monitore uso de tokens na dashboard OpenRouter');
      break;

    case 'ok':
      recs.push('✅ Créditos suficientes para processamento em lotes');
      recs.push('📊 Proceda com processamento de licitações');
      recs.push('⏱️  Monitorar logs para otimização de custos');
      break;
  }

  return recs;
}

/**
 * Job status quando em fila aguardando créditos
 */
export interface CreditWaitingJob {
  id: string;
  type: 'batch' | 'single';
  licitacaoCount: number;
  createdAt: Date;
  reason: string;
  lastCheckedAt?: Date;
}

// Simulação de fila em memória (em produção, usar Redis ou DB)
const waitingJobs = new Map<string, CreditWaitingJob>();

/**
 * Adiciona job à fila de espera por créditos
 */
export function addWaitingJob(job: Omit<CreditWaitingJob, 'id' | 'createdAt'>): string {
  const id = `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const fullJob: CreditWaitingJob = {
    ...job,
    id,
    createdAt: new Date()
  };
  waitingJobs.set(id, fullJob);
  console.log(`[CreditWaiting] Job ${id} adicionado à fila: ${job.licitacaoCount} licitações (${job.type})`);
  return id;
}

/**
 * Obtém jobs em fila
 */
export function getWaitingJobs(): CreditWaitingJob[] {
  return Array.from(waitingJobs.values());
}

/**
 * Verifica jobs em fila e processa se tiver crédito
 */
export async function processWaitingJobs(): Promise<{
  processed: number;
  still_waiting: number;
  reason: string;
}> {
  const jobs = getWaitingJobs();
  
  if (jobs.length === 0) {
    return { processed: 0, still_waiting: 0, reason: 'Nenhum job em fila' };
  }

  const canProcess = await canProcessBatch();
  
  if (!canProcess.can) {
    return {
      processed: 0,
      still_waiting: jobs.length,
      reason: `Não é possível processar: ${canProcess.reason}`
    };
  }

  // Aqui você poderia implementar a lógica de reprocessar jobs
  // Por enquanto, apenas retorna status
  
  return {
    processed: 0,
    still_waiting: jobs.length,
    reason: 'Jobs prontos para reprocessamento quando houver acionamento manual'
  };
}

/**
 * Remove job da fila (quando processado ou cancelado)
 */
export function removeWaitingJob(jobId: string): boolean {
  return waitingJobs.delete(jobId);
}

/**
 * Limpa fila (para testes/admin)
 */
export function clearWaitingJobs(): number {
  const count = waitingJobs.size;
  waitingJobs.clear();
  return count;
}
