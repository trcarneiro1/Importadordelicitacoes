import axios from 'axios';
import * as cheerio from 'cheerio';
import { format, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface ScrapedLicitacao {
  numero_edital?: string;
  modalidade?: string;
  objeto?: string;
  valor_estimado?: number;
  data_publicacao?: Date;
  data_abertura?: Date;
  situacao?: string;
  documentos?: string[];
  raw_data?: any;
}

export interface ScrapeResult {
  success: boolean;
  sre_source: string;
  licitacoes: ScrapedLicitacao[];
  error?: string;
}

// Parse Brazilian date format (DD/MM/YYYY)
export function parseBrazilianDate(dateStr: string): Date | undefined {
  if (!dateStr) return undefined;
  
  try {
    // Try common Brazilian formats
    const formats = ['dd/MM/yyyy', 'dd/MM/yy', 'dd-MM-yyyy'];
    
    for (const fmt of formats) {
      try {
        const date = parse(dateStr.trim(), fmt, new Date(), { locale: ptBR });
        if (!isNaN(date.getTime())) return date;
      } catch (e) {
        continue;
      }
    }
  } catch (error) {
    console.warn(`Failed to parse date: ${dateStr}`);
  }
  
  return undefined;
}

// Extract currency value from Brazilian format (R$ 1.234,56)
export function parseBrazilianCurrency(valueStr: string): number | undefined {
  if (!valueStr) return undefined;
  
  try {
    // Remove R$, spaces, and convert , to .
    const cleaned = valueStr
      .replace(/R\$\s*/gi, '')
      .replace(/\./g, '')
      .replace(/,/g, '.')
      .trim();
    
    const value = parseFloat(cleaned);
    return isNaN(value) ? undefined : value;
  } catch (error) {
    console.warn(`Failed to parse currency: ${valueStr}`);
    return undefined;
  }
}

// Generic scraper for SRE portals
export async function scrapeSRE(sreUrl: string): Promise<ScrapeResult> {
  const result: ScrapeResult = {
    success: false,
    sre_source: new URL(sreUrl).hostname,
    licitacoes: [],
  };

  try {
    // Try common licitação page paths
    const possiblePaths = [
      '/licitacoes',
      '/compras',
      '/editais',
      '/licitacao',
      '/index.php/licitacoes',
    ];

    let html: string | null = null;
    let finalUrl = sreUrl;

    // Try to find the licitações page
    for (const path of possiblePaths) {
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
      } catch (e) {
        // Try next path
        continue;
      }
    }

    // If no specific path worked, try base URL
    if (!html) {
      const response = await axios.get(sreUrl, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });
      html = response.data;
    }

    if (!html) {
      throw new Error('Failed to fetch HTML from any URL');
    }

    // Parse HTML
    const $ = cheerio.load(html);

    // This is a generic parser - will need customization per SRE
    // For POC, we'll extract any table rows or list items that might be licitações
    const licitacoes: ScrapedLicitacao[] = [];

    // Try to find tables with bidding data
    $('table tr').each((_, row) => {
      const cells = $(row).find('td');
      if (cells.length >= 2) {
        const text = $(row).text();
        
        // Look for patterns indicating a licitação
        if (
          text.match(/pregão|concorrência|edital|licitação/i) ||
          text.match(/\d{1,4}\/\d{4}/) // Edital number pattern
        ) {
          licitacoes.push({
            objeto: $(row).text().trim().substring(0, 200),
            raw_data: {
              html: $(row).html(),
              text: $(row).text().trim(),
              url: finalUrl,
            },
          });
        }
      }
    });

    // Try to find list items with bidding data
    $('li, article, .post').each((_, element) => {
      const text = $(element).text();
      
      if (
        (text.match(/pregão|concorrência|edital|licitação/i) ||
        text.match(/\d{1,4}\/\d{4}/)) &&
        text.length > 30 &&
        text.length < 500
      ) {
        licitacoes.push({
          objeto: text.trim().substring(0, 200),
          raw_data: {
            html: $(element).html(),
            text: text.trim(),
            url: finalUrl,
          },
        });
      }
    });

    result.licitacoes = licitacoes.slice(0, 10); // Limit to first 10 for POC
    result.success = true;

  } catch (error: any) {
    result.error = error.message || 'Unknown error';
    result.success = false;
  }

  return result;
}

// Scrape multiple SREs
export async function scrapeMultipleSREs(sreUrls: string[]): Promise<ScrapeResult[]> {
  const results: ScrapeResult[] = [];

  for (const url of sreUrls) {
    try {
      console.log(`Scraping ${url}...`);
      const result = await scrapeSRE(url);
      results.push(result);
      
      // Rate limiting: wait 2 seconds between requests
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error: any) {
      results.push({
        success: false,
        sre_source: url,
        licitacoes: [],
        error: error.message,
      });
    }
  }

  return results;
}
