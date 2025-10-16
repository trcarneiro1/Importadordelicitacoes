/**
 * Data Validator - Compara dados brutos, processados e IA
 * Para debug e validação de qualidade de dados
 */

import { LicitacaoEnhanced } from '@/types/licitacao';

export interface RawDataPoint {
  field: string;
  rawValue: string;
  source: 'html' | 'text';
  confidence: number; // 0-100%
}

export interface DataValidation {
  numero_edital: {
    raw: string;
    processed: string;
    confidence: number;
    valid: boolean;
  };
  objeto: {
    raw: string;
    processed: string;
    confidence: number;
    valid: boolean;
  };
  data_publicacao: {
    raw: string;
    processed: string;
    confidence: number;
    valid: boolean;
  };
  data_abertura?: {
    raw: string;
    processed: string;
    confidence: number;
    valid: boolean;
  };
  valor_estimado?: {
    raw: string;
    processed: string;
    confidence: number;
    valid: boolean;
  };
  documentos?: {
    raw: string[];
    processed: string[];
    confidence: number;
    valid: boolean;
  };
  quality_score: number; // 0-100%
  relevance_score: number; // 0-100% - tem informação relevante?
  is_relevant: boolean; // Deve aparecer no dashboard?
}

/**
 * Valida se número de edital é válido
 */
export function validateEditial(value: string): { valid: boolean; confidence: number } {
  if (!value) return { valid: false, confidence: 0 };

  // Padrões válidos: XX/YYYY, X/YYYY, etc
  const editialPattern = /^(\d{1,4})\/(\d{4})$/;
  const match = value.match(editialPattern);

  if (!match) return { valid: false, confidence: 0 };

  const year = parseInt(match[2]);
  const currentYear = new Date().getFullYear();

  // Ano válido (dentro de 5 anos do passado ou futuro)
  if (year < currentYear - 5 || year > currentYear + 5) {
    return { valid: false, confidence: 30 };
  }

  return { valid: true, confidence: 95 };
}

/**
 * Valida se objeto (descrição) é relevante
 */
export function validateObjeto(value: string): { valid: boolean; confidence: number; relevance: number } {
  if (!value || value.length < 10) {
    return { valid: false, confidence: 0, relevance: 0 };
  }

  // Palavras inúteis
  const invalid_keywords = ['não informado', 'objeto não especificado', 's/n', 'n/a', 'indefinido'];
  const lower = value.toLowerCase();

  if (invalid_keywords.some(kw => lower.includes(kw))) {
    return { valid: false, confidence: 100, relevance: 0 };
  }

  // Relevância: quanto mais texto, mais relevante (mas com limite)
  const relevance = Math.min(100, (value.length / 200) * 100);

  return { valid: true, confidence: 85, relevance };
}

/**
 * Valida data
 */
export function validateData(
  value: string | Date | null | undefined
): { valid: boolean; confidence: number } {
  if (!value) return { valid: false, confidence: 0 };

  try {
    const date = typeof value === 'string' ? new Date(value) : value;

    // Verificar se é data válida
    if (isNaN(date.getTime())) {
      return { valid: false, confidence: 0 };
    }

    // Data não pode ser muito antiga (< 1 ano atrás) ou muito futura (> 1 ano)
    const now = new Date();
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    const oneYearFuture = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());

    if (date < oneYearAgo || date > oneYearFuture) {
      return { valid: false, confidence: 50 };
    }

    return { valid: true, confidence: 90 };
  } catch (e) {
    return { valid: false, confidence: 0 };
  }
}

/**
 * Valida valor (currency)
 */
export function validateValor(value: number | null | undefined): { valid: boolean; confidence: number } {
  if (value === null || value === undefined || value <= 0) {
    return { valid: false, confidence: 0 };
  }

  // Valores muito altos (> 100 milhões) são suspeitos
  if (value > 100_000_000) {
    return { valid: false, confidence: 30 };
  }

  return { valid: true, confidence: 80 };
}

/**
 * Cria um relatório de validação completo
 */
export function createValidationReport(
  rawData: Record<string, any>,
  processedData: LicitacaoEnhanced
): DataValidation {
  // Validar numero_edital
  const editialValidation = validateEditial(processedData.numero_edital);
  const numero_edital = {
    raw: rawData.numero_edital_raw || '',
    processed: processedData.numero_edital,
    confidence: editialValidation.confidence,
    valid: editialValidation.valid,
  };

  // Validar objeto
  const objetoValidation = validateObjeto(processedData.objeto);
  const objeto = {
    raw: rawData.objeto_raw || '',
    processed: processedData.objeto,
    confidence: objetoValidation.confidence,
    valid: objetoValidation.valid,
  };

  // Validar data_publicacao
  const dataValidation = validateData(processedData.data_publicacao);
  const data_publicacao = {
    raw: rawData.data_publicacao_raw || '',
    processed: processedData.data_publicacao?.toISOString() || '',
    confidence: dataValidation.confidence,
    valid: dataValidation.valid,
  };

  // Validar data_abertura (optional)
  let data_abertura;
  if (processedData.data_abertura) {
    const dataAberturaValidation = validateData(processedData.data_abertura);
    data_abertura = {
      raw: rawData.data_abertura_raw || '',
      processed: processedData.data_abertura.toISOString(),
      confidence: dataAberturaValidation.confidence,
      valid: dataAberturaValidation.valid,
    };
  }

  // Validar valor_estimado (optional)
  let valor_estimado;
  if (processedData.valor_estimado !== undefined) {
    const valorValidation = validateValor(processedData.valor_estimado);
    valor_estimado = {
      raw: rawData.valor_estimado_raw || '',
      processed: processedData.valor_estimado.toString(),
      confidence: valorValidation.confidence,
      valid: valorValidation.valid,
    };
  }

  // Validar documentos (optional)
  let documentos;
  if (processedData.documentos && processedData.documentos.length > 0) {
    documentos = {
      raw: rawData.documentos_raw || [],
      processed: processedData.documentos,
      confidence: 85,
      valid: true,
    };
  }

  // Calcular quality_score
  const validFields = [
    numero_edital.valid,
    objeto.valid,
    data_publicacao.valid,
    data_abertura?.valid ?? true,
    valor_estimado?.valid ?? true,
  ].filter(v => v).length;

  const totalFields = [
    true,
    true,
    true,
    processedData.data_abertura ? true : null,
    processedData.valor_estimado ? true : null,
  ].filter(v => v !== null).length;

  const quality_score = (validFields / totalFields) * 100;

  // Calcular relevance_score
  const relevance_score = Math.min(
    100,
    (objeto.confidence + objetoValidation.relevance) / 2 + (numero_edital.confidence / 2)
  );

  // Determinar se é relevante
  const is_relevant =
    objeto.valid && // Objeto deve ser válido
    numero_edital.valid && // Edital deve ser válido
    quality_score >= 70 && // Score de qualidade mínimo
    relevance_score >= 60; // Score de relevância mínimo

  return {
    numero_edital,
    objeto,
    data_publicacao,
    data_abertura,
    valor_estimado,
    documentos,
    quality_score: Math.round(quality_score),
    relevance_score: Math.round(relevance_score),
    is_relevant,
  };
}

/**
 * Filtra apenas licitações relevantes
 */
export function filterRelevantLicitacoes(
  licitacoes: Array<{
    id: string;
    numero_edital: string;
    objeto: string;
    data_publicacao: Date | null;
    data_abertura?: Date | null;
    valor_estimado?: number | null;
    documentos?: any;
  }>
) {
  return licitacoes.filter(lic => {
    // Verificar campos essenciais
    if (!lic.numero_edital || lic.numero_edital === 'S/N') return false;
    if (!lic.objeto || lic.objeto === 'Objeto não especificado') return false;
    if (!lic.data_publicacao) return false;

    // Validar número
    const editialValid = validateEditial(lic.numero_edital).valid;
    if (!editialValid) return false;

    // Validar objeto
    const objetoValid = validateObjeto(lic.objeto).valid;
    if (!objetoValid) return false;

    // Validar data
    const dataValid = validateData(lic.data_publicacao).valid;
    if (!dataValid) return false;

    return true;
  });
}

/**
 * Compara dados da página com os do banco
 */
export function comparePageVsDatabase(
  pageRawData: string,
  databaseRecord: LicitacaoEnhanced
): {
  matches: number; // Quantos campos combinam?
  differences: string[];
  confidence: number; // 0-100% de confiança na extração
} {
  const differences: string[] = [];
  let matches = 0;

  // Verificar numero_edital
  if (!pageRawData.includes(databaseRecord.numero_edital)) {
    differences.push(`numero_edital "${databaseRecord.numero_edital}" não encontrado na página`);
  } else {
    matches++;
  }

  // Verificar objeto (buscar palavras-chave)
  const objetoWords = databaseRecord.objeto.split(' ').slice(0, 3).join(' ');
  if (!pageRawData.includes(objetoWords)) {
    differences.push(`objeto "${objetoWords}..." não encontrado na página`);
  } else {
    matches++;
  }

  // Confidence baseado em quantas coisas combinam
  const confidence = (matches / 2) * 100;

  return {
    matches,
    differences,
    confidence: Math.round(confidence),
  };
}
