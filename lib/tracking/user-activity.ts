/**
 * Sistema de Rastreamento de Atividade de Usuário
 * 
 * Permite entender o comportamento do usuário para personalizar
 * recomendações de licitações e notícias.
 */

import { prisma } from '@/lib/prisma/client';
import { NextRequest } from 'next/server';

export interface UserActivityData {
  user_id?: string;
  session_id?: string;
  tipo_acesso: string; // Aceita qualquer string
  recurso_id?: string;
  pagina_url?: string;
  categoria_acessada?: string;
  sre_acessada?: string;
  valor_licitacao?: number;
  tempo_permanencia_seg?: number;
  origem?: string;
  user_agent?: string;
}

/**
 * Extrai identificador do usuário (IP ou session)
 */
export function getUserId(request: NextRequest): string {
  // Tentar obter IP real
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0] || realIp || 'unknown';
  
  // Criar hash simples do IP (para privacidade)
  return `user_${ip.replace(/\./g, '_')}`;
}

/**
 * Extrai session ID dos cookies ou headers
 */
export function getSessionId(request: NextRequest): string {
  // Tentar obter session ID de cookie
  const sessionCookie = request.cookies.get('session_id');
  if (sessionCookie) return sessionCookie.value;
  
  // Gerar novo session ID se não existir
  return `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

/**
 * Registra atividade do usuário no banco
 */
export async function trackUserActivity(
  request: NextRequest,
  data: Partial<UserActivityData>
): Promise<void> {
  // TEMPORARIAMENTE DESABILITADO - tracking será reativado após migração completa para Prisma
  return;
}

/**
 * Obtém perfil do usuário baseado no histórico de acessos
 */
export async function getUserProfile(userId: string) {
  // TEMPORARIAMENTE DESABILITADO - será reativado após migração para Prisma
  return null;
}

/**
 * Função auxiliar para encontrar o item mais comum em um array
 */
function getMostCommon(arr: string[]): string | null {
  if (arr.length === 0) return null;
  
  const counts = new Map<string, number>();
  arr.forEach(item => {
    const count = counts.get(item) || 0;
    counts.set(item, count + 1);
  });

  let maxCount = 0;
  let mostCommon = null;
  
  counts.forEach((count, item) => {
    if (count > maxCount) {
      maxCount = count;
      mostCommon = item;
    }
  });

  return mostCommon;
}

/**
 * Limpar atividades antigas (GDPR compliance)
 * Manter apenas últimos 90 dias
 */
export async function cleanOldActivities() {
  // TEMPORARIAMENTE DESABILITADO - será reativado após migração para Prisma
  return;
}
