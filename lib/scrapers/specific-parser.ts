import axios from 'axios';
import * as cheerio from 'cheerio';
type CheerioRoot = ReturnType<typeof cheerio.load>;
type CheerioElement = cheerio.Element;
type CheerioSelection = cheerio.Cheerio;
import { parseBrazilianDate, parseBrazilianCurrency } from './sre-scraper';

export interface LicitacaoCompleta {
  numero_edital: string;
  modalidade: string;
  objeto: string;
  valor_estimado?: number;
  data_publicacao?: Date;
  data_abertura?: Date;
  situacao: string;
  documentos: Array<{
    nome: string;
    url: string;
    tipo: string;
  }>;
  contato?: {
    responsavel?: string;
    email?: string;
    telefone?: string;
  };
  processo?: string;
  categoria?: string;
  raw_data: LicitacaoRawData;
}

export interface LicitacaoRawData {
  html?: string | null;
  text?: string;
  url?: string;
  titulo?: string;
  [key: string]: unknown;
}

export interface ParserResult {
  success: boolean;
  sre_source: string;
  licitacoes: LicitacaoCompleta[];
  error?: string;
  parser_usado: string;
}

/**
 * Parser específico otimizado - detecta automaticamente a estrutura
 * @param sreUrl - URL base da SRE
 * @param daysAgo - Número de dias atrás para buscar (padrão: 60 para testes, depois 30)
 */
export async function parseSpecificSRE(sreUrl: string, daysAgo: number = 60): Promise<ParserResult> {
  const result: ParserResult = {
    success: false,
    sre_source: new URL(sreUrl).hostname,
    licitacoes: [],
    parser_usado: 'generico',
  };

  try {
    console.log(`🔍 Buscando licitações de até ${daysAgo} dias atrás...`);
    
    // Tentar URLs comuns de licitações
    const paths = [
      '/licitacoes',
      '/compras',
      '/editais',
      '/index.php/licitacoes',
      '/portal-licitacoes',
      '/licitacao',
    ];

    let html: string = '';
    let finalUrl = sreUrl;

    for (const path of paths) {
      try {
        const testUrl = sreUrl.endsWith('/') ? sreUrl + path.substring(1) : sreUrl + path;
        const response = await axios.get(testUrl, {
          timeout: 10000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        });

        if (response.status === 200 && response.data) {
          html = response.data;
          finalUrl = testUrl;
          break;
        }
      } catch (_error) {
        continue;
      }
    }

    if (!html) {
      const response = await axios.get(sreUrl, { timeout: 10000 });
      html = response.data;
    }

    const $ = cheerio.load(html);

    // Tentar diferentes parsers específicos
    const licitacoes = 
      tryParserWordPress($, finalUrl) ||
      tryParserJoomla($, finalUrl) ||
      tryParserCustomTable($, finalUrl) ||
      tryParserGeneric($, finalUrl);

    result.licitacoes = licitacoes;
    result.success = licitacoes.length > 0;
    result.parser_usado = detectParserType($);

  } catch (error: unknown) {
    result.error = error instanceof Error ? error.message : 'Erro desconhecido';
    result.success = false;
  }

  return result;
}

/**
 * Detecta tipo de CMS/estrutura usado
 */
function detectParserType($: CheerioRoot): string {
  const html = $.html();
  
  if (html.includes('wp-content') || html.includes('wordpress')) {
    return 'WordPress';
  }
  if (html.includes('joomla') || html.includes('/components/com_')) {
    return 'Joomla';
  }
  if (html.includes('drupal')) {
    return 'Drupal';
  }
  if ($('table.licitacoes').length > 0 || $('div.licitacao-item').length > 0) {
    return 'CMS Customizado';
  }
  
  return 'Genérico';
}

/**
 * Parser para sites WordPress
 */
function tryParserWordPress($: CheerioRoot, baseUrl: string): LicitacaoCompleta[] | null {
  const licitacoes: LicitacaoCompleta[] = [];
  
  // WordPress geralmente usa posts ou custom post types
  $('.post, .licitacao, article').each((index: number, element: CheerioElement) => {
    const $el = $(element);
    const texto = $el.text();

    // Extrair informações
    const numeroMatch = texto.match(/(?:Pregão|Concorrência|Convite|Tomada de Preços|Dispensa|Inexigibilidade)[:\s]*(\d+\/\d{4})/i);
    const valorMatch = texto.match(/R\$\s*[\d.,]+/);
    const dataMatch = texto.match(/\d{2}\/\d{2}\/\d{4}/);

    if (numeroMatch || texto.match(/edital|licitação|pregão/i)) {
      const licitacao: LicitacaoCompleta = {
        numero_edital: numeroMatch ? numeroMatch[0] : 'S/N',
        modalidade: extractModalidade(texto),
        objeto: extractObjeto($el),
        valor_estimado: valorMatch ? parseBrazilianCurrency(valorMatch[0]) : undefined,
        data_publicacao: dataMatch ? parseBrazilianDate(dataMatch[0]) : undefined,
        situacao: extractSituacao(texto),
  documentos: extractDocumentos($, $el, baseUrl),
        categoria: extractCategoria(texto),
        raw_data: {
          html: $el.html(),
          text: texto.substring(0, 500),
          url: baseUrl,
        },
      };

      licitacoes.push(licitacao);
    }
  });

  return licitacoes.length > 0 ? licitacoes : null;
}

/**
 * Parser para sites Joomla
 */
function tryParserJoomla($: CheerioRoot, baseUrl: string): LicitacaoCompleta[] | null {
  const licitacoes: LicitacaoCompleta[] = [];

  // Joomla geralmente usa divs com classes específicas
  // Seletores atualizados baseados em análise real de SREs
  const joomlaSelectors = [
    'article.item',           // Artigos Joomla (principal)
    '.item',                  // Items Joomla genéricos
    '.blog-featured .item',   // Blog featured items
    '.item-page',             // Páginas de item
    '.article',               // Artigos genéricos
    '.blog-item'              // Blog items
  ];

  // Tentar cada seletor
  for (const selector of joomlaSelectors) {
    const elements = $(selector);
    
    if (elements.length > 0) {
      console.log(`   🔍 Found ${elements.length} items with selector: ${selector}`);
      
      elements.each((index: number, element: CheerioElement) => {
        const $el = $(element);
        const texto = $el.text();
        const titulo = $el.find('h2, h3, h4, .entry-title, [itemprop="name"]').first().text().trim();

        // Log para debug
        console.log(`   🔎 Item ${index + 1}: Título="${titulo.substring(0, 60)}..." | Texto length=${texto.length}`);

        // Buscar por padrões de licitação/edital - expandido para incluir "aviso", "publicação", etc.
        const hasKeywords = texto.match(/edital|licitação|licitacao|pregão|pregao|contratação|contratacao|processo seletivo|aviso de publicação|publicação|dispensa|inexigibilidade/i);
        const hasTituloKeywords = titulo.match(/edital|licitação|pregão|aviso|publicação|dispensa|inexigibilidade/i);
        
        if (hasKeywords || hasTituloKeywords) {
          console.log(`   ✨ MATCH! Keywords found in ${hasKeywords ? 'text' : 'title'}`);
          const licitacao = createLicitacaoFromElement($, $el, texto, baseUrl, titulo);
          if (licitacao) {
            console.log(`   ✅ Parsed: ${licitacao.numero_edital} - ${licitacao.objeto.substring(0, 50)}...`);
            licitacoes.push(licitacao);
          } else {
            console.log(`   ⚠️ createLicitacaoFromElement returned null`);
          }
        } else {
          console.log(`   ⏭️ Skipped - no keywords match`);
        }
      });

      // Se encontrou licitações, retorna (não precisa testar outros seletores)
      if (licitacoes.length > 0) break;
    }
  }

  return licitacoes.length > 0 ? licitacoes : null;
}

/**
 * Parser para tabelas customizadas
 */
function tryParserCustomTable($: CheerioRoot, baseUrl: string): LicitacaoCompleta[] | null {
  const licitacoes: LicitacaoCompleta[] = [];

  // Procurar tabelas com licitações
  $('table').each((index: number, table: CheerioElement) => {
    const $table = $(table);
    const headers = $table
      .find('th, thead td')
      .map((headerIndex: number, th: CheerioElement) => $(th).text().toLowerCase())
      .get();

    // Se tem headers relacionados a licitações
    if (headers.some((h: string) => h.match(/edital|modalidade|objeto|valor/))) {
      $table.find('tbody tr, tr').each((rowIndex: number, row: CheerioElement) => {
        const $row = $(row);
        const cells = $row
          .find('td')
          .map((cellIndex: number, td: CheerioElement) => $(td).text().trim())
          .get();

        if (cells.length > 0 && cells.some((cell) => cell.length > 5)) {
          const texto = cells.join(' | ');
          const licitacao = createLicitacaoFromText($, texto, $row, baseUrl);
          if (licitacao) licitacoes.push(licitacao);
        }
      });
    }
  });

  return licitacoes.length > 0 ? licitacoes : null;
}

/**
 * Parser genérico aprimorado
 */
function tryParserGeneric($: CheerioRoot, baseUrl: string): LicitacaoCompleta[] {
  const licitacoes: LicitacaoCompleta[] = [];

  // Procurar em qualquer elemento que mencione licitação
  $('*').each((index: number, element: CheerioElement) => {
    const $el = $(element);
    const texto = $el.text();

    // Filtrar apenas elementos com conteúdo relevante
    if (
      texto.length > 50 &&
      texto.length < 2000 &&
      texto.match(/(?:pregão|concorrência|edital|licitação)/i) &&
      texto.match(/\d{1,4}\/\d{4}/)
    ) {
    const licitacao = createLicitacaoFromElement($, $el, texto, baseUrl);
      if (licitacao) {
        // Evitar duplicatas
        const exists = licitacoes.some((l: LicitacaoCompleta) => 
          l.numero_edital === licitacao.numero_edital &&
          l.objeto === licitacao.objeto
        );
        if (!exists) {
          licitacoes.push(licitacao);
        }
      }
    }
  });

  return licitacoes.slice(0, 20); // Limitar a 20 para evitar dados demais
}

/**
 * Cria objeto de licitação a partir de elemento HTML
 */
function createLicitacaoFromElement(
  $: CheerioRoot,
  $el: CheerioSelection,
  texto: string,
  baseUrl: string,
  titulo?: string,
  daysAgo: number = 60
): LicitacaoCompleta | null {
  // Se tem título, usar ele como objeto principal
  const objeto = titulo && titulo.length > 10 ? titulo : extractObjeto($el);
  
  // Buscar número do edital no texto ou título - REGEX MELHORADO
  // Primeiro: Tentar padrão completo com tipo + número
  const numeroCompleto = (texto + ' ' + (titulo || '')).match(/(?:Pregão|Concorrência|Convite|Tomada de Preços|Dispensa|Inexigibilidade|Edital|Processo|Aviso)[:\s#nº]*(\d+[\/\-_]\d{4})/i);
  
  // Segundo: Tentar apenas número com ano (ex: "1582/2025" ou "28/08/2025" na URL)
  const numeroAno = (texto + ' ' + (titulo || '') + ' ' + baseUrl).match(/\b(\d{3,4})[\/\-](\d{4})\b/);
  
  // Terceiro: Extrair da URL se tiver padrão /licitacoes/NUMERO-descricao
  const numeroUrl = baseUrl.match(/\/licitacoes\/(\d+)-/i);
  
  // Quarto: Buscar data no formato DD/MM/YYYY no título (pode ser identificador único)
  const dataNoTitulo = (titulo || '').match(/(\d{2}\/\d{2}\/\d{4})/);
  
  let numeroEdital = 'S/N';
  
  if (numeroCompleto) {
    numeroEdital = numeroCompleto[0];
    console.log(`   🔢 Número extraído (completo): ${numeroEdital}`);
  } else if (numeroUrl) {
    numeroEdital = `#${numeroUrl[1]}`;
    console.log(`   🔢 Número extraído (URL): ${numeroEdital}`);
  } else if (numeroAno && numeroAno[1].length >= 3) {
    numeroEdital = `${numeroAno[1]}/${numeroAno[2]}`;
    console.log(`   🔢 Número extraído (padrão ano): ${numeroEdital}`);
  } else if (dataNoTitulo) {
    numeroEdital = `Aviso-${dataNoTitulo[1].replace(/\//g, '-')}`;
    console.log(`   🔢 Número extraído (data): ${numeroEdital}`);
  } else {
    console.log(`   ⚠️ Número do edital não encontrado - usando S/N`);
  }

  // Verificar data de publicação - aceitar até N dias atrás
  const dataPublicacao = extractData(texto, 'publicação') || extractData(titulo || '', 'publicação');
  if (dataPublicacao) {
    const diasAtras = (new Date().getTime() - dataPublicacao.getTime()) / (1000 * 60 * 60 * 24);
    console.log(`   📅 Data publicação: ${dataPublicacao.toLocaleDateString('pt-BR')} (${Math.floor(diasAtras)} dias atrás)`);
    
    // COMENTADO: Filtro de data desabilitado para testes
    // if (diasAtras > daysAgo) {
    //   console.log(`   ⏭️ Skipped - too old (${Math.floor(diasAtras)} > ${daysAgo} days)`);
    //   return null;
    // }
  }

  return {
    numero_edital: numeroEdital,
    modalidade: extractModalidade(texto),
    objeto: objeto,
    valor_estimado: extractValor(texto),
    data_publicacao: extractData(texto, 'publicação'),
    data_abertura: extractData(texto, 'abertura'),
    situacao: extractSituacao(texto),
  documentos: extractDocumentos($, $el, baseUrl),
    categoria: extractCategoria(texto),
    processo: extractProcesso(texto),
    raw_data: {
      text: texto.substring(0, 1000),
      titulo: titulo || '',
      url: baseUrl,
    },
  };
}

/**
 * Cria licitação a partir de texto puro
 */
function createLicitacaoFromText(
  $: CheerioRoot,
  texto: string,
  $el: CheerioSelection,
  baseUrl: string
): LicitacaoCompleta | null {
  const numeroMatch = texto.match(/(?:Pregão|Concorrência|Convite|Tomada de Preços)[:\s]*(\d+\/\d{4})/i);
  
  if (!numeroMatch) return null;

  return createLicitacaoFromElement($, $el, texto, baseUrl);
}

// Funções auxiliares de extração

function extractModalidade(texto: string): string {
  const modalidades = [
    'Pregão Eletrônico',
    'Pregão Presencial',
    'Pregão',
    'Concorrência Pública',
    'Concorrência',
    'Tomada de Preços',
    'Convite',
    'Dispensa de Licitação',
    'Inexigibilidade',
  ];

  for (const mod of modalidades) {
    if (texto.match(new RegExp(mod, 'i'))) {
      return mod;
    }
  }

  return 'Não especificada';
}

function extractObjeto($el: CheerioSelection): string {
  const texto = $el.text();
  
  // Procurar por "objeto:" ou similar
  const objetoMatch = texto.match(/objeto[:\s]+(.*?)(?:\n|\.{2,}|\||data|valor)/i);
  if (objetoMatch) {
    return objetoMatch[1].trim().substring(0, 500);
  }

  // Pegar primeira frase longa
  const sentences = texto.split(/[.\n]/);
  for (const sentence of sentences) {
    if (sentence.length > 30 && sentence.length < 500) {
      return sentence.trim();
    }
  }

  return texto.substring(0, 200).trim();
}

function extractValor(texto: string): number | undefined {
  const valorMatch = texto.match(/(?:valor|estimado|orçado)[:\s]*R\$\s*([\d.,]+)/i);
  if (valorMatch) {
    return parseBrazilianCurrency(valorMatch[0]);
  }

  const valorSimplesMatch = texto.match(/R\$\s*[\d.,]+/);
  if (valorSimplesMatch) {
    return parseBrazilianCurrency(valorSimplesMatch[0]);
  }

  return undefined;
}

function extractData(texto: string, tipo: string): Date | undefined {
  const pattern = new RegExp(`${tipo}[:\\s]*(\\d{2}\\/\\d{2}\\/\\d{4})`, 'i');
  const match = texto.match(pattern);
  
  if (match) {
    return parseBrazilianDate(match[1]);
  }

  // Pegar primeira data encontrada
  const dataMatch = texto.match(/\d{2}\/\d{2}\/\d{4}/);
  if (dataMatch) {
    return parseBrazilianDate(dataMatch[0]);
  }

  return undefined;
}

function extractSituacao(texto: string): string {
  const situacoes = [
    { pattern: /em andamento|aberta|vigente/i, status: 'Aberta' },
    { pattern: /encerrada|finalizada|concluída/i, status: 'Encerrada' },
    { pattern: /suspensa|cancelada/i, status: 'Suspensa' },
    { pattern: /homologada/i, status: 'Homologada' },
    { pattern: /deserta/i, status: 'Deserta' },
  ];

  for (const { pattern, status } of situacoes) {
    if (texto.match(pattern)) {
      return status;
    }
  }

  // Se tem data futura, provavelmente está aberta
  const dataMatch = texto.match(/\d{2}\/\d{2}\/\d{4}/);
  if (dataMatch) {
    const data = parseBrazilianDate(dataMatch[0]);
    if (data && data > new Date()) {
      return 'Aberta';
    }
  }

  return 'Em andamento';
}

function extractDocumentos(
  $: CheerioRoot,
  $el: CheerioSelection,
  baseUrl: string
): Array<{ nome: string; url: string; tipo: string }> {
  const documentos: Array<{ nome: string; url: string; tipo: string }> = [];

  $el.find('a').each((index: number, link: CheerioElement) => {
    if (!('attribs' in link) || !link.attribs) {
      return;
    }
    const href = link.attribs.href;
    const texto = $(link).text().trim();

    if (href && (href.includes('.pdf') || href.includes('edital') || href.includes('anexo'))) {
      const url = href.startsWith('http') ? href : new URL(href, baseUrl).href;
      documentos.push({
        nome: texto || 'Documento',
        url,
        tipo: href.includes('.pdf') ? 'PDF' : 'Link',
      });
    }
  });

  return documentos;
}

function extractCategoria(texto: string): string {
  const categorias = [
    { pattern: /material escolar|material did[aá]tico|livro/i, categoria: 'Material Escolar' },
    { pattern: /alimenta[çc][ãa]o|merenda|refeição/i, categoria: 'Alimentação' },
    { pattern: /reforma|obra|construção/i, categoria: 'Obras' },
    { pattern: /servi[çc]o|manutenção|conservação/i, categoria: 'Serviços' },
    { pattern: /equipamento|mobili[aá]rio|inform[aá]tica/i, categoria: 'Equipamentos' },
    { pattern: /transporte|ve[íi]culo/i, categoria: 'Transporte' },
  ];

  for (const { pattern, categoria } of categorias) {
    if (texto.match(pattern)) {
      return categoria;
    }
  }

  return 'Outros';
}

function extractProcesso(texto: string): string | undefined {
  const processoMatch = texto.match(/processo[:\s]*(\d+[\/\-]\d+)/i);
  return processoMatch ? processoMatch[1] : undefined;
}
