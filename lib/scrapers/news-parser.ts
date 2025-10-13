import axios from 'axios';
import * as cheerio from 'cheerio';
import { parseBrazilianDate } from './sre-scraper';

export interface Noticia {
  titulo: string;
  conteudo: string;
  resumo?: string;
  data_publicacao?: Date;
  categoria_original?: string;
  url: string;
  documentos: Array<{
    nome: string;
    url: string;
    tipo: string;
  }>;
  links_externos: string[];
  raw_html: string;
}

export interface NewsParserResult {
  success: boolean;
  sre_source: string;
  noticias: Noticia[];
  total_paginas?: number;
  error?: string;
}

/**
 * Parser universal para banco de notícias das SREs
 * Extrai TODAS as notícias (licitações, editais, avisos, etc)
 */
export async function parseNewsFromSRE(
  sreUrl: string,
  maxPages: number = 3
): Promise<NewsParserResult> {
  const result: NewsParserResult = {
    success: false,
    sre_source: new URL(sreUrl).hostname,
    noticias: [],
  };

  try {
    // URLs comuns para banco de notícias
    const newsPaths = [
      '/index.php/banco-de-noticias',
      '/banco-de-noticias',
      '/noticias',
      '/index.php/noticias',
    ];

    let newsPageUrl = '';
    let html = '';

    // Tentar encontrar a página de notícias
    for (const path of newsPaths) {
      const testUrl = sreUrl.replace(/\/$/, '') + path;
      try {
        const response = await axios.get(testUrl, { timeout: 8000 });
        if (response.status === 200 && response.data.includes('noticia')) {
          newsPageUrl = testUrl;
          html = response.data;
          console.log(`✅ Página de notícias encontrada: ${testUrl}`);
          break;
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error(`Erro ao processar notícia ${index}:`, message);
        continue;
      }
    }

    if (!newsPageUrl || !html) {
      result.error = 'Página de notícias não encontrada';
      return result;
    }

    // Parsear todas as páginas
    for (let page = 0; page < maxPages; page++) {
      const pageUrl = page === 0 
        ? newsPageUrl 
        : `${newsPageUrl}?start=${page * 18}`;

      try {
        if (page > 0) {
          const response = await axios.get(pageUrl, { timeout: 8000 });
          html = response.data;
        }

        const $ = cheerio.load(html) as any as cheerio.CheerioAPI;
        
        // Detectar estrutura (Joomla típico de SREs)
        const noticias = parseJoomlaNews($, pageUrl);
        
        if (noticias.length === 0 && page === 0) {
          console.log('⚠️ Nenhuma notícia encontrada na primeira página');
          break;
        }

        result.noticias.push(...noticias);
        console.log(`📄 Página ${page + 1}: ${noticias.length} notícias extraídas`);

        // Se não encontrou notícias, parar paginação
        if (noticias.length === 0) break;

      } catch (err) {
        console.error(`Erro ao processar página ${page + 1}:`, err);
        break;
      }

      // Delay entre páginas
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    result.success = result.noticias.length > 0;
    result.total_paginas = Math.ceil(result.noticias.length / 18);

    return result;
  } catch (error: any) {
    result.error = error.message;
    return result;
  }
}

/**
 * Parser para estrutura Joomla (padrão das SREs de MG)
 */
function parseJoomlaNews($: cheerio.CheerioAPI, baseUrl: string): Noticia[] {
  const noticias: Noticia[] = [];

  // Seletor para artigos Joomla
  $('div.item, article, .blog-item, .news-item').each((index, element) => {
    try {
      const $item = $(element);

      // Título (h2, h3, ou link principal)
      let titulo = $item.find('h2 a, h3 a, .item-title a, .entry-title a').first().text().trim();
      if (!titulo) {
        titulo = $item.find('a').first().text().trim();
      }

      // URL do artigo
      let articleUrl = $item.find('h2 a, h3 a, .item-title a').first().attr('href') || '';
      if (articleUrl && !articleUrl.startsWith('http')) {
        const baseUrlObj = new URL(baseUrl);
        articleUrl = `${baseUrlObj.protocol}//${baseUrlObj.hostname}${articleUrl}`;
      }

      // Conteúdo/resumo
      let conteudo = $item.find('p').first().text().trim();
      if (!conteudo) {
        conteudo = $item.text().trim().substring(0, 500);
      }

      // Limpar conteúdo
      conteudo = conteudo
        .replace(/\s+/g, ' ')
        .replace(/Leia mais:?\.?\.\./gi, '')
        .trim();

      // Data de publicação
      let dataStr = $item.find('.published, .create, time, .date, .item-date').first().text().trim();
      let data_publicacao: Date | undefined;
      
      if (dataStr) {
        // Extrair apenas números e barras (ex: "29 SETEMBRO 2025" ou "29/09/2025")
        const dateMatch = dataStr.match(/(\d{1,2})\s*(?:\/|\s+)(\w+|\d{1,2})\s*(?:\/|\s+)(\d{4})/);
        if (dateMatch) {
          data_publicacao = parseBrazilianDate(dateMatch[0]);
        }
      }

      // Categoria original (se disponível)
      let categoria_original = $item.find('.category, .cat-name, .badge').first().text().trim();

      // Extrair documentos (PDFs, links importantes)
      const documentos: Array<{ nome: string; url: string; tipo: string }> = [];
      const links_externos: string[] = [];

      $item.find('a').each((i, link) => {
        const href = $(link).attr('href') || '';
        const texto = $(link).text().trim();

        if (!href) return;

        // Detectar documentos
        if (href.match(/\.(pdf|docx?|xlsx?|zip)$/i)) {
          documentos.push({
            nome: texto || 'Documento',
            url: href.startsWith('http') ? href : new URL(href, baseUrl).href,
            tipo: href.split('.').pop()?.toUpperCase() || 'ARQUIVO',
          });
        } 
        // Links do Google Drive (editais)
        else if (href.includes('drive.google.com') || href.includes('docs.google.com')) {
          documentos.push({
            nome: texto || 'Edital/Documento',
            url: href,
            tipo: 'PDF',
          });
        }
        // Links externos importantes
        else if (href.startsWith('http') && !href.includes(new URL(baseUrl).hostname)) {
          links_externos.push(href);
        }
      });

      // Só adicionar se tiver título e conteúdo mínimo
      if (titulo && titulo.length > 10 && conteudo && conteudo.length > 20) {
        noticias.push({
          titulo,
          conteudo,
          resumo: conteudo.substring(0, 300) + '...',
          data_publicacao,
          categoria_original,
          url: articleUrl,
          documentos,
          links_externos,
          raw_html: $item.html() || '',
        });
      }
    } catch (err) {
      console.error('Erro ao processar notícia individual:', err);
    }
  });

  return noticias;
}

/**
 * Extrai keywords do texto para análise
 */
export function extractKeywords(texto: string): string[] {
  // Remover stopwords comuns em português
  const stopwords = [
    'o', 'a', 'os', 'as', 'de', 'da', 'do', 'das', 'dos', 'em', 'no', 'na',
    'nos', 'nas', 'para', 'por', 'com', 'sem', 'sob', 'sobre', 'ao', 'aos',
    'e', 'ou', 'mas', 'que', 'se', 'foi', 'ser', 'ter', 'estar', 'sua', 'seu',
  ];

  const palavras = texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(p => p.length > 3 && !stopwords.includes(p));

  // Contar frequência
  const frequencia: Record<string, number> = {};
  palavras.forEach(p => {
    frequencia[p] = (frequencia[p] || 0) + 1;
  });

  // Ordenar por frequência e retornar top 15
  return Object.entries(frequencia)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([palavra]) => palavra);
}

/**
 * Categorização básica por palavras-chave (antes de usar IA)
 */
export function categorizarBasico(titulo: string, conteudo: string): string {
  const texto = (titulo + ' ' + conteudo).toLowerCase();

  // Licitações e compras
  if (texto.match(/licita[çc][ãa]o|pregão|edital.*compra|tomada.*pre[çc]o|concorr[êe]ncia|dispensa|inexigibilidade/)) {
    return 'Licitações';
  }

  // Processos Seletivos e RH
  if (texto.match(/processo.*seletivo|concurso|convoca[çc][ãa]o|inscri[çc][õo]es|vaga|classifica[çc][ãa]o|edital.*professor|edital.*servidor|designa[çc][ãa]o/)) {
    return 'Processos Seletivos';
  }

  // Editais RH específicos
  if (texto.match(/atl|autoriza[çc][ãa]o.*lecionar|atd|cadastro.*reserva|magist[ée]rio|quadro.*administrativo/)) {
    return 'Editais RH';
  }

  // Programas e Projetos Educacionais
  if (texto.match(/programa|projeto|trilhas.*futuro|educa[çc][ãa]o.*profissional|curso.*t[ée]cnico|bolsa|forma[çc][ãa]o/)) {
    return 'Programas Educacionais';
  }

  // Avisos e Comunicados
  if (texto.match(/aviso|comunicado|informa[çc][ãa]o|aten[çc][ãa]o|suspens[ãa]o|altera[çc][ãa]o|retifica[çc][ãa]o|errata/)) {
    return 'Avisos Administrativos';
  }

  // Eventos e Comemorações
  if (texto.match(/evento|comemora[çc][ãa]o|anos|anivers[áa]rio|festival|feira|competi[çc][ãa]o/)) {
    return 'Eventos';
  }

  // Resultados e Publicações
  if (texto.match(/resultado.*preliminar|resultado.*definitivo|resultado.*final|lista.*aprovados|publica[çc][ãa]o/)) {
    return 'Resultados';
  }

  return 'Outros';
}

/**
 * Detecta prioridade/urgência baseado em palavras-chave
 */
export function detectarPrioridade(titulo: string, conteudo: string, dataPublicacao?: Date): 'alta' | 'media' | 'baixa' {
  const texto = (titulo + ' ' + conteudo).toLowerCase();

  // Alta prioridade
  if (texto.match(/urgente|aten[çc][ãa]o|prazo.*encerra|[úu]ltimo.*dia|hoje|amanh[ãa]|improrrog[áa]vel/)) {
    return 'alta';
  }

  // Verificar se é recente (últimos 7 dias)
  if (dataPublicacao) {
    const diasAtras = (Date.now() - dataPublicacao.getTime()) / (1000 * 60 * 60 * 24);
    if (diasAtras <= 7) {
      return 'alta';
    }
  }

  // Média prioridade (editais, processos)
  if (texto.match(/edital|processo.*seletivo|inscri[çc][õo]es|licita[çc][ãa]o/)) {
    return 'media';
  }

  return 'baixa';
}
