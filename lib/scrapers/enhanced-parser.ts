/**
 * ENHANCED PARSER - Captura MUITO MAIS DADOS das licitações
 * 
 * Extrai de páginas individuais de licitação:
 * - Número do edital/termo
 * - Objeto detalhado (descrição completa)
 * - Instituição/Caixa Escolar
 * - Prazo de entrega de propostas
 * - Local de entrega
 * - Email de contato
 * - Links de documentos (Google Drive, etc)
 * - Observações importantes
 * - Modalidade (quando disponível)
 */

import axios from 'axios';
import * as cheerio from 'cheerio';

export interface LicitacaoEnriquecida {
  numero_edital: string;
  titulo: string;
  objeto: string;
  instituicao?: string;
  termo_compromisso?: string;
  data_publicacao?: Date;
  data_abertura?: Date;
  prazo_propostas?: string;
  local_entrega?: string;
  endereco?: string;
  email_contato?: string;
  telefone?: string;
  modalidade?: string;
  valor_estimado?: number;
  situacao: string;
  documentos: Array<{
    nome: string;
    url: string;
    tipo: string;
  }>;
  observacoes?: string;
  link_google_drive?: string;
  raw_html: string;
  url_fonte: string;
}

export interface EnhancedParserResult {
  success: boolean;
  licitacao: LicitacaoEnriquecida | null;
  error?: string;
}

/**
 * Parse de página individual de licitação
 */
export async function parseIndividualLicitacao(url: string): Promise<EnhancedParserResult> {
  try {
    console.log(`📄 Buscando: ${url}`);

    const response = await axios.get(url, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    const html = response.data;
    const $ = cheerio.load(html);

    // Extrair título
    const titulo = $('h1, h2, .page-title, .article-title').first().text().trim() ||
                   $('title').text().trim();

    // Extrair todo o conteúdo principal
    const mainContent = $('.item-page, .article, main, .content').first();
    const textoCompleto = mainContent.text() || $('body').text();

    // Inicializar dados
    const licitacao: LicitacaoEnriquecida = {
      numero_edital: extractNumeroEdital(textoCompleto, titulo),
      titulo: titulo,
      objeto: extractObjeto(textoCompleto),
      instituicao: extractInstituicao(textoCompleto),
      termo_compromisso: extractTermoCompromisso(textoCompleto),
      data_publicacao: extractDataPublicacao(textoCompleto, titulo),
      prazo_propostas: extractPrazoPropostas(textoCompleto),
      local_entrega: extractLocalEntrega(textoCompleto),
      endereco: extractEndereco(textoCompleto),
      email_contato: extractEmail(textoCompleto),
      telefone: extractTelefone(textoCompleto),
      modalidade: extractModalidade(textoCompleto),
      valor_estimado: extractValor(textoCompleto),
      situacao: determineSituacao(textoCompleto),
      documentos: extractDocumentos($, url),
      observacoes: extractObservacoes(textoCompleto),
      link_google_drive: extractGoogleDriveLink(html),
      raw_html: html,
      url_fonte: url,
    };

    console.log(`✅ Extraído: ${licitacao.numero_edital} - ${licitacao.objeto?.substring(0, 50)}...`);

    return {
      success: true,
      licitacao,
    };

  } catch (error) {
    console.error(`❌ Erro ao parsear ${url}:`, error);
    return {
      success: false,
      licitacao: null,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

/**
 * Extrai número do edital/termo
 */
function extractNumeroEdital(texto: string, titulo: string): string {
  // Tenta extrair do título primeiro
  const patterns = [
    /NÚMERO DO TERMO DE COMPROMISSO\s*(\d+\/\d+)/i,
    /TERMO DE COMPROMISSO\s*[N°]?\s*(\d+\/\d+)/i,
    /EDITAL\s*[N°]?\s*(\d+\/\d+)/i,
    /PREGÃO\s*[N°]?\s*(\d+\/\d+)/i,
    /PROCESSO\s*[N°]?\s*(\d+\/\d+)/i,
    /(\d+\/\d{4})/,
  ];

  for (const pattern of patterns) {
    const match = texto.match(pattern) || titulo.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return 'S/N';
}

/**
 * Extrai objeto/descrição completa
 */
function extractObjeto(texto: string): string {
  const patterns = [
    /ESPECIFICAÇÃO DO OBJETO:\s*([^\n]+(?:\n[^\n]+){0,3})/i,
    /OBJETO:\s*([^\n]+(?:\n[^\n]+){0,3})/i,
    /DESCRIÇÃO:\s*([^\n]+(?:\n[^\n]+){0,3})/i,
  ];

  for (const pattern of patterns) {
    const match = texto.match(pattern);
    if (match && match[1]) {
      return match[1].trim().replace(/\s+/g, ' ');
    }
  }

  return 'Objeto não especificado';
}

/**
 * Extrai instituição/caixa escolar
 */
function extractInstituicao(texto: string): string | undefined {
  const patterns = [
    /CAIXA ESCOLAR\s+([A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ\s]+)/i,
    /ESCOLA ESTADUAL\s+([A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ\s]+)/i,
    /INSTITUIÇÃO:\s*([^\n]+)/i,
  ];

  for (const pattern of patterns) {
    const match = texto.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return undefined;
}

/**
 * Extrai número do termo de compromisso
 */
function extractTermoCompromisso(texto: string): string | undefined {
  const match = texto.match(/NÚMERO DO TERMO DE COMPROMISSO\s*(\d+\/\d+)/i);
  return match ? match[1] : undefined;
}

/**
 * Extrai data de publicação do título ou texto
 */
function extractDataPublicacao(texto: string, titulo: string): Date | undefined {
  const datePattern = /(\d{2})\/(\d{2})\/(\d{4})/;
  const match = titulo.match(datePattern) || texto.match(datePattern);
  
  if (match) {
    const [_, dia, mes, ano] = match;
    return new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
  }

  return undefined;
}

/**
 * Extrai prazo de entrega de propostas
 */
function extractPrazoPropostas(texto: string): string | undefined {
  const patterns = [
    /PRAZO PARA APRESENTAÇÃO DAS PROPOSTAS[^:]*:\s*([^\n]+(?:\n[^\n]+)?)/i,
    /ATÉ\s+(\d{2}\/\d{2}\/\d{4}[^\n]*)/i,
  ];

  for (const pattern of patterns) {
    const match = texto.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return undefined;
}

/**
 * Extrai local de entrega
 */
function extractLocalEntrega(texto: string): string | undefined {
  const patterns = [
    /LOCAL:\s*([^\n]+)/i,
    /ENTREGA[^:]*:\s*([^\n]+)/i,
  ];

  for (const pattern of patterns) {
    const match = texto.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return undefined;
}

/**
 * Extrai endereço completo
 */
function extractEndereco(texto: string): string | undefined {
  const patterns = [
    /Rua\s+[^\n]+(?:\s*-\s*[^\n]+)?/i,
    /Avenida\s+[^\n]+(?:\s*-\s*[^\n]+)?/i,
  ];

  for (const pattern of patterns) {
    const match = texto.match(pattern);
    if (match) {
      return match[0].trim();
    }
  }

  return undefined;
}

/**
 * Extrai email de contato
 */
function extractEmail(texto: string): string | undefined {
  const emailPattern = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/;
  const match = texto.match(emailPattern);
  return match ? match[1] : undefined;
}

/**
 * Extrai telefone
 */
function extractTelefone(texto: string): string | undefined {
  const patterns = [
    /\(?\d{2}\)?\s*\d{4,5}-?\d{4}/,
    /TELEFONE[^:]*:\s*([^\n]+)/i,
  ];

  for (const pattern of patterns) {
    const match = texto.match(pattern);
    if (match) {
      return match[0].trim();
    }
  }

  return undefined;
}

/**
 * Extrai modalidade de licitação
 */
function extractModalidade(texto: string): string | undefined {
  const modalidades = [
    'PREGÃO ELETRÔNICO',
    'PREGÃO PRESENCIAL',
    'CONCORRÊNCIA',
    'TOMADA DE PREÇOS',
    'CONVITE',
    'DISPENSA',
    'INEXIGIBILIDADE',
    'AQUISIÇÃO SIMPLIFICADA',
  ];

  for (const modalidade of modalidades) {
    if (texto.toUpperCase().includes(modalidade)) {
      return modalidade;
    }
  }

  return undefined;
}

/**
 * Extrai valor estimado
 */
function extractValor(texto: string): number | undefined {
  const patterns = [
    /VALOR\s*ESTIMADO[^:]*:\s*R\$\s*([\d.,]+)/i,
    /VALOR[^:]*:\s*R\$\s*([\d.,]+)/i,
  ];

  for (const pattern of patterns) {
    const match = texto.match(pattern);
    if (match && match[1]) {
      const valorStr = match[1].replace(/\./g, '').replace(',', '.');
      return parseFloat(valorStr);
    }
  }

  return undefined;
}

/**
 * Determina situação baseado no prazo
 */
function determineSituacao(texto: string): string {
  const hoje = new Date();
  const prazoMatch = texto.match(/ATÉ\s+(\d{2})\/(\d{2})\/(\d{4})/i);
  
  if (prazoMatch) {
    const [_, dia, mes, ano] = prazoMatch;
    const dataPrazo = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
    
    if (dataPrazo < hoje) {
      return 'Encerrado';
    } else if (dataPrazo.getTime() - hoje.getTime() < 7 * 24 * 60 * 60 * 1000) {
      return 'Urgente';
    }
  }

  return 'Aberto';
}

/**
 * Extrai documentos e links
 */
function extractDocumentos($: ReturnType<typeof cheerio.load>, baseUrl: string): Array<{ nome: string; url: string; tipo: string }> {
  const documentos: Array<{ nome: string; url: string; tipo: string }> = [];

  // Links para PDFs, DOCs, Google Drive
  $('a[href*=".pdf"], a[href*=".doc"], a[href*="drive.google"]').each((_, elem) => {
    const link = $(elem).attr('href');
    const texto = $(elem).text().trim();
    
    if (link) {
      const urlCompleta = link.startsWith('http') ? link : new URL(link, baseUrl).href;
      
      documentos.push({
        nome: texto || 'Documento',
        url: urlCompleta,
        tipo: link.includes('drive.google') ? 'Google Drive' : link.includes('.pdf') ? 'PDF' : 'DOC',
      });
    }
  });

  return documentos;
}

/**
 * Extrai observações importantes
 */
function extractObservacoes(texto: string): string | undefined {
  const patterns = [
    /OBSERVAÇÃO:\s*([^\n]+(?:\n[^\n]+){0,3})/i,
    /OBS[.:]?\s*([^\n]+)/i,
  ];

  for (const pattern of patterns) {
    const match = texto.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return undefined;
}

/**
 * Extrai link do Google Drive
 */
function extractGoogleDriveLink(html: string): string | undefined {
  const match = html.match(/https:\/\/drive\.google\.com\/[^\s"'<>]+/);
  return match ? match[0] : undefined;
}

/**
 * Parse de lista de licitações (página índice)
 */
export async function parseListaLicitacoes(sreUrl: string): Promise<string[]> {
  try {
    console.log(`📋 Buscando lista em: ${sreUrl}`);

    const response = await axios.get(sreUrl, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    const $ = cheerio.load(response.data);
    const urls: string[] = [];

    // Buscar links para páginas individuais
    $('a').each((_, elem) => {
      const href = $(elem).attr('href');
      const texto = $(elem).text().toLowerCase();
      
      if (href && (
        href.includes('/licitacoes/') ||
        href.includes('/editais/') ||
        texto.includes('aviso') ||
        texto.includes('edital') ||
        texto.includes('pregão')
      )) {
        const urlCompleta = href.startsWith('http') ? href : new URL(href, sreUrl).href;
        
        // Evitar duplicatas e URLs genéricas
        if (!urls.includes(urlCompleta) && !urlCompleta.endsWith('/licitacoes')) {
          urls.push(urlCompleta);
        }
      }
    });

    console.log(`✅ Encontradas ${urls.length} URLs de licitações`);
    return urls;

  } catch (error) {
    console.error(`❌ Erro ao buscar lista:`, error);
    return [];
  }
}
