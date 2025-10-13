/**
 * =====================================================
 * PRISMA CLIENT - Singleton Instance
 * =====================================================
 * 
 * Cliente Prisma com type-safety completo para todas as tabelas.
 * Substitui o supabase client com ORM completo e tipos TypeScript.
 */

import { PrismaClient } from '@prisma/client';

// Previne múltiplas instâncias em desenvolvimento (hot reload)
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// =====================================================
// HELPER FUNCTIONS - Queries Comuns
// =====================================================

/**
 * Busca SREs ativas ordenadas por prioridade de coleta
 */
export async function getSREsAtivas(limit?: number) {
  return prisma.sres.findMany({
    where: { ativo: true },
    orderBy: [
      { ultima_coleta: 'asc' },
      { codigo: 'asc' }
    ],
    take: limit
  });
}

/**
 * Busca SRE por código
 */
export async function getSREByCodigo(codigo: number) {
  return prisma.sres.findUnique({
    where: { codigo }
  });
}

/**
 * Atualiza status de coleta da SRE
 */
export async function updateSREStatus(
  codigo: number,
  data: {
    ultima_coleta?: Date;
    proxima_coleta?: Date;
    taxa_sucesso?: number;
    total_coletas?: number;
  }
) {
  return prisma.sres.update({
    where: { codigo },
    data
  });
}

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

interface LicitacaoData {
  sre_source?: string;
  sre_code?: number;
  regional?: string;
  numero_edital?: string;
  modalidade?: string;
  objeto?: string;
  valor_estimado?: number | null;
  data_publicacao?: Date | string | null;
  data_abertura?: Date | string | null;
  situacao?: string;
  documentos?: JsonValue;
  raw_data?: Record<string, JsonValue>;
  raw_html?: string | null;
}

/**
 * Salva múltiplas licitações (bulk insert)
 */
export async function saveLicitacoes(licitacoes: LicitacaoData[]) {
  return prisma.licitacoes.createMany({
    data: licitacoes as Parameters<typeof prisma.licitacoes.createMany>[0]['data'],
    skipDuplicates: true
  });
}

/**
 * Registra log de scraping
 */
export async function logScraping(data: {
  sre_code?: number;
  sre_source?: string;
  sre_url?: string;
  status?: string;
  records_found?: number;
  licitacoes_coletadas?: number;
  error_message?: string;
  execution_time_ms?: number;
  metadata?: any;
}) {
  return prisma.scraping_logs.create({
    data
  });
}

/**
 * Busca licitações não processadas pela IA
 */
export async function getLicitacoesPendentesIA(limit: number = 50) {
  return prisma.licitacoes.findMany({
    where: {
      processado_ia: false,
      objeto: { not: null }
    },
    orderBy: { created_at: 'desc' },
    take: limit
  });
}

/**
 * Marca licitação como processada pela IA
 */
export async function marcarLicitacaoProcessada(
  id: string,
  dadosEnriquecidos: {
    escola?: string;
    municipio_escola?: string;
    categoria_principal?: string;
    categorias_secundarias?: string[];
    itens_principais?: string[];
    palavras_chave?: string[];
    fornecedor_tipo?: string;
    score_relevancia?: number;
    resumo_executivo?: string;
    complexidade?: string;
    itens_detalhados?: any;
  }
) {
  return prisma.licitacoes.update({
    where: { id },
    data: {
      ...dadosEnriquecidos,
      processado_ia: true,
      processado_ia_at: new Date()
    }
  });
}

/**
 * Busca licitações com filtros (B2B)
 */
export async function buscarLicitacoes({
  sres_interesse,
  categorias,
  valor_minimo,
  valor_maximo,
  municipios,
  palavras_chave,
  limit = 50,
  offset = 0
}: {
  sres_interesse?: number[];
  categorias?: string[];
  valor_minimo?: number;
  valor_maximo?: number;
  municipios?: string[];
  palavras_chave?: string[];
  limit?: number;
  offset?: number;
}) {
  const where: any = {
    processado_ia: true
  };

  if (sres_interesse && sres_interesse.length > 0) {
    where.sre_code = { in: sres_interesse };
  }

  if (categorias && categorias.length > 0) {
    where.OR = [
      { categoria_principal: { in: categorias } },
      { categorias_secundarias: { hasSome: categorias } }
    ];
  }

  if (valor_minimo || valor_maximo) {
    where.valor_estimado = {};
    if (valor_minimo) where.valor_estimado.gte = valor_minimo;
    if (valor_maximo) where.valor_estimado.lte = valor_maximo;
  }

  if (municipios && municipios.length > 0) {
    where.municipio_escola = { in: municipios };
  }

  // TODO: Implementar busca por palavras-chave em full-text search

  return prisma.licitacoes.findMany({
    where,
    orderBy: [
      { score_relevancia: 'desc' },
      { data_publicacao: 'desc' }
    ],
    take: limit,
    skip: offset,
    include: {
      sre: {
        select: {
          codigo: true,
          nome: true,
          municipio: true
        }
      }
    }
  });
}

export default prisma;
