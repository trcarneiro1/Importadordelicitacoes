import { NextRequest, NextResponse } from 'next/server';
import {
  type Licitacao,
  type LicitacaoContato,
  type LicitacaoDocumento,
  type RawLicitacaoData,
  getAllLicitacoes,
  getLicitacoesBySRE,
} from '@/lib/supabase/queries';

type SupabaseLicitacaoRow = Licitacao & {
  documentos?: LicitacaoDocumento[] | null;
  contato?: LicitacaoContato | null;
  categorias_secundarias?: string[] | null;
  itens_principais?: string[] | null;
  palavras_chave?: string[] | null;
  raw_data?: RawLicitacaoData | null;
};

interface NormalizedLicitacao {
  id?: string;
  sre_code?: number;
  sre_source: string;
  regional?: string;
  numero_edital: string;
  modalidade: string;
  tipo_processo?: string;
  objeto: string;
  valor_estimado?: number;
  data_publicacao?: string;
  data_abertura?: string;
  data_limite_impugnacao?: string;
  prazo_entrega?: string;
  situacao: string;
  categoria?: string;
  categoria_principal?: string;
  categorias_secundarias: string[];
  processo?: string;
  documentos: LicitacaoDocumento[];
  contato?: LicitacaoContato;
  escola?: string;
  municipio_escola?: string;
  fornecedor_tipo?: string;
  score_relevancia?: number;
  resumo_executivo?: string;
  complexidade?: string;
  itens_principais: string[];
  palavras_chave: string[];
  raw_data?: RawLicitacaoData | null;
  created_at?: string;
  updated_at?: string;
  scraped_at?: string;
}

function isLicitacaoDocumento(value: unknown): value is LicitacaoDocumento {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<LicitacaoDocumento>;
  return typeof candidate.url === 'string' && typeof candidate.nome === 'string';
}

function toNumber(value: unknown): number | undefined {
  if (value === null || value === undefined) return undefined;
  const parsed = typeof value === 'string' ? Number(value) : value;
  if (typeof parsed !== 'number') return undefined;
  return Number.isFinite(parsed) ? parsed : undefined;
}

function normalizeSituacao(value?: string | null): string {
  if (!value) return 'Aberto';
  const lower = value.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

function normalizeDate(value?: string | Date | null): string | undefined {
  if (!value) return undefined;
  if (value instanceof Date) return value.toISOString();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

function normalizeDocumentos(value: unknown): LicitacaoDocumento[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isLicitacaoDocumento);
}

function normalizeContato(row: SupabaseLicitacaoRow): LicitacaoContato | undefined {
  const responsavel = row.contato_responsavel ?? row.contato?.responsavel;
  const email = row.contato_email ?? row.contato?.email;
  const telefone = row.contato_telefone ?? row.contato?.telefone;

  if (!responsavel && !email && !telefone) return undefined;

  return {
    responsavel,
    email,
    telefone,
  };
}

function normalizeLicitacao(row: SupabaseLicitacaoRow): NormalizedLicitacao {
  return {
    id: row.id,
    sre_code: row.sre_code ?? undefined,
    sre_source: row.sre_source ?? row.regional ?? 'SRE Desconhecida',
    regional: row.regional ?? undefined,
    numero_edital: row.numero_edital ?? 'S/N',
    modalidade: row.modalidade ?? 'Não informada',
    tipo_processo: row.tipo_processo ?? undefined,
    objeto: row.objeto ?? '',
    valor_estimado: toNumber(row.valor_estimado),
    data_publicacao: normalizeDate(row.data_publicacao),
    data_abertura: normalizeDate(row.data_abertura),
    data_limite_impugnacao: normalizeDate(row.data_limite_impugnacao),
    prazo_entrega: row.prazo_entrega ?? undefined,
    situacao: normalizeSituacao(row.situacao),
    categoria: row.categoria_principal ?? row.categoria ?? undefined,
    categoria_principal: row.categoria_principal ?? undefined,
    categorias_secundarias: row.categorias_secundarias ?? [],
    processo: row.tipo_processo ?? row.processo ?? undefined,
  documentos: normalizeDocumentos(row.documentos),
    contato: normalizeContato(row),
    escola: row.escola ?? undefined,
    municipio_escola: row.municipio_escola ?? undefined,
    fornecedor_tipo: row.fornecedor_tipo ?? undefined,
    score_relevancia: toNumber(row.score_relevancia),
    resumo_executivo: row.resumo_executivo ?? undefined,
    complexidade: row.complexidade ?? undefined,
    itens_principais: row.itens_principais ?? [],
    palavras_chave: row.palavras_chave ?? [],
    raw_data: row.raw_data ?? undefined,
    created_at: normalizeDate(row.created_at),
    updated_at: normalizeDate(row.updated_at),
    scraped_at: normalizeDate(row.scraped_at),
  };
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const sre = searchParams.get('sre');
  const limit = parseInt(searchParams.get('limit') || '100');
  const processadoParam = searchParams.get('processado');
  const processado = processadoParam === 'true';

  try {
    let licitacoes;

    if (sre) {
      licitacoes = await getLicitacoesBySRE(sre);
    } else {
      licitacoes = await getAllLicitacoes();
    }

    // Filtrar por processado se especificado
    let filtered = licitacoes;
    if (processadoParam) {
      filtered = licitacoes.filter(lic => processado ? lic.processado_ia : !lic.processado_ia);
    }

    // Ordenar por mais recente
    filtered.sort((a, b) => {
      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();
      return dateB - dateA;
    });

    // Aplicar limite
    const limited = filtered.slice(0, limit);

    const normalized = limited.map((licitacao) =>
      normalizeLicitacao(licitacao as SupabaseLicitacaoRow)
    );

    return NextResponse.json({
      success: true,
      count: normalized.length,
      licitacoes: normalized,
      data: normalized,
    });
  } catch (error: unknown) {
    console.error('Database error:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch licitações';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
