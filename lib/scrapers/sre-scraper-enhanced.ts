import axios from 'axios';
import * as cheerio from 'cheerio';
import { parseBrazilianDate, parseBrazilianCurrency } from './sre-scraper';

export interface LicitacaoEnhanced {
  numero_edital: string;
  titulo: string;
  objeto: string;
  modalidade: string;
  valor_estimado?: number;
  data_publicacao?: Date;
  data_abertura?: Date;
  data_limite?: Date;
  situacao: string;
  documentos: Array<{ nome: string; url: string }>;
  raw_data: {
    url: string;
    texto_completo: string;
    [key: string]: unknown;
  };
}

/**
 * NOVO SCRAPER: Estratégia de multi-página
 * 1. Busca links na página principal
 * 2. Entra em cada link e extrai dados completos
 */
export async function scrapeSREMultiPage(baseUrl: string): Promise<LicitacaoEnhanced[]> {
  const licitacoes: LicitacaoEnhanced[] = [];

  try {
    console.log(`\n🔗 ETAPA 1: Buscando lista de licitações...`);
    const listUrl = `${baseUrl.replace(/\/$/, '')}/licitacoes`;
    
    const response = await axios.get(listUrl, {
      timeout: 10000,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });

    const $ = cheerio.load(response.data);
    const links: Array<{ href: string; title: string }> = [];

    // Buscar links de licitações
    $('a').each((_, el) => {
      const href = $(el).attr('href') || '';
      const text = $(el).text().trim();
      
      // Filtrar links relevantes (que contêm datas ou keywords)
      if (href.includes('/licitacoes/') && text.match(/publicação|aviso|processo|contratação/i)) {
        links.push({
          href: href.startsWith('http') ? href : `${baseUrl.replace(/\/$/, '')}${href}`,
          title: text
        });
      }
    });

    console.log(`✅ Encontrados ${links.length} links de licitações`);

    // ETAPA 2: Entrar em cada link
    console.log(`\n🔎 ETAPA 2: Extraindo dados de cada licitação...`);

    for (let i = 0; i < Math.min(links.length, 20); i++) {
      const link = links[i];
      
      try {
        console.log(`\n   [${i + 1}/${Math.min(links.length, 20)}] ${link.title.substring(0, 60)}`);
        
        const detailResponse = await axios.get(link.href, {
          timeout: 10000,
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
        });

        const $detail = cheerio.load(detailResponse.data);
        const articleText = $detail('article.item, .content, main').first().text().trim();

        if (!articleText || articleText.length < 30) {
          console.log(`   ⚠️ Texto muito curto, pulando...`);
          continue;
        }

        // Extrair informações do texto
        const lic = extractLicitacaoFromText(articleText, link.href, link.title);
        
        if (lic.numero_edital !== 'S/N') {
          licitacoes.push(lic);
          console.log(`   ✅ Extraído: ${lic.numero_edital} - ${lic.objeto.substring(0, 40)}`);
        } else {
          console.log(`   ⚠️ Não foi possível extrair número do edital`);
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        console.log(`   ❌ Erro: ${error instanceof Error ? error.message.substring(0, 50) : 'Desconhecido'}`);
      }
    }

    return licitacoes;

  } catch (error) {
    console.error('❌ Erro no scraper:', error instanceof Error ? error.message : 'Desconhecido');
    return [];
  }
}

function extractLicitacaoFromText(texto: string, url: string, titulo: string): LicitacaoEnhanced {
  // Extrair número do edital (formatos: 123/2025, 01/2025, etc)
  let numeroEdital = 'S/N';
  
  // Tentar padrões comuns de número de edital
  const patterns = [
    /(?:processo|edital|pregão|número|edital)[:\s]*(\d{1,4}\/\d{4})/i,
    /PROCESSO\s+SIMPLIFICADO\s+(\d{1,4}\/\d{4})/i,
    /processo\s+(\d{1,4}\/\d{4})/i,
    /(\d{1,4}\/\d{4})/i, // Último recurso: qualquer padrão YYYY/YYYY
  ];

  for (const pattern of patterns) {
    const match = texto.match(pattern);
    if (match && match[1]) {
      numeroEdital = match[1];
      break;
    }
  }

  // Extrair objeto (primeira menção significativa)
  let objeto = 'Não especificado';
  
  // Tentar formatos comuns
  const objetoPatterns = [
    /objeto[:\s]*([^.\n]{20,300})/i,
    /contratação[:\s]*([^.\n]{20,300})/i,
    /CAIXA ESCOLAR\s+([^,]+)/i, // Nome da escola
    /([A-Z\s]{20,100}:\s*[^.\n]{20,200})/i, // Formato geral
  ];

  for (const pattern of objetoPatterns) {
    const match = texto.match(pattern);
    if (match && match[1] && match[1].length > 20) {
      objeto = match[1].trim().substring(0, 300);
      break;
    }
  }

  // Se ainda não achou, pegar primeira frase grande
  if (objeto === 'Não especificado') {
    const sentences = texto.split(/[.\n]/);
    for (const s of sentences) {
      const clean = s.trim();
      if (clean.length > 50 && clean.length < 300 && !clean.match(/^http|^https|processo|edital/i)) {
        objeto = clean.substring(0, 300);
        break;
      }
    }
  }

  // Extrair modalidade
  let modalidade = 'Não especificada';
  const modalidades = ['Pregão', 'Concorrência', 'Tomada de Preços', 'Convite', 'Dispensa', 'Processo Simplificado'];
  for (const mod of modalidades) {
    if (texto.match(new RegExp(mod, 'i'))) {
      modalidade = mod;
      break;
    }
  }

  // Extrair datas
  const dataMatches = texto.match(/\d{1,2}\/\d{1,2}\/\d{4}/g) || [];
  let dataPub: Date | undefined;
  let dataAbertura: Date | undefined;

  if (dataMatches.length > 0 && dataMatches[0]) {
    dataPub = parseBrazilianDate(dataMatches[0]);
    if (dataMatches.length > 1 && dataMatches[1]) {
      dataAbertura = parseBrazilianDate(dataMatches[1]);
    }
  }

  // Extrair valor
  let valor: number | undefined;
  const valorMatch = texto.match(/R\$\s*[\d.,]+/);
  if (valorMatch) {
    valor = parseBrazilianCurrency(valorMatch[0]);
  }

  // Extrair links de documentos
  const docLinks: Array<{ nome: string; url: string }> = [];
  
  // Procurar por padrões de links dentro do texto
  const urlPatterns = /(https?:\/\/[^\s\)]+)/g;
  const urlMatches = texto.match(urlPatterns) || [];
  urlMatches.forEach(u => {
    if (u.match(/drive\.google|dropbox|download|pdf|edital|anexo/i)) {
      docLinks.push({
        nome: 'Documentos',
        url: u.replace(/[,;:.)]$/, '') // Remove caracteres de pontuação no final
      });
    }
  });

  return {
    numero_edital: numeroEdital,
    titulo: titulo.substring(0, 200),
    objeto: objeto,
    modalidade: modalidade,
    valor_estimado: valor,
    data_publicacao: dataPub,
    data_abertura: dataAbertura,
    situacao: 'aberto',
    documentos: [...new Map(docLinks.map(d => [d.url, d])).values()], // Remove duplicatas
    raw_data: {
      url: url,
      texto_completo: texto.substring(0, 1000),
    },
  };
}
