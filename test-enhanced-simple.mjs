#!/usr/bin/env node

// Test the new enhanced scraper directly

import axios from 'axios';
import * as cheerio from 'cheerio';

async function testEnhancedScraper() {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🧪 TESTE DO NOVO SCRAPER ENHANCED`);
  console.log(`${'='.repeat(80)}\n`);

  const baseUrl = 'https://sremetropa.educacao.mg.gov.br';

  try {
    // ETAPA 1: Buscar lista de licitações
    console.log(`🔗 ETAPA 1: Buscando lista de licitações...`);
    const listUrl = `${baseUrl}/licitacoes`;
    
    const listResponse = await axios.get(listUrl, {
      timeout: 10000,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });

    const $ = cheerio.load(listResponse.data);
    const links = [];

    $('a').each((_, el) => {
      const href = $(el).attr('href') || '';
      const text = $(el).text().trim();
      
      if (href.includes('/licitacoes/') && text.match(/publicação|aviso|processo|contratação/i)) {
        links.push({
          href: href.startsWith('http') ? href : `${baseUrl}${href}`,
          title: text
        });
      }
    });

    console.log(`✅ Encontrados ${links.length} links de licitações\n`);
    links.slice(0, 3).forEach((link, i) => {
      console.log(`   ${i + 1}. ${link.title.substring(0, 60)}`);
      console.log(`      ${link.href.substring(0, 80)}`);
    });

    // ETAPA 2: Extrair dados de cada licitação
    console.log(`\n🔎 ETAPA 2: Extraindo dados de cada licitação...\n`);

    const licitacoes = [];

    for (let i = 0; i < Math.min(links.length, 3); i++) {
      const link = links[i];
      console.log(`\n   [${i + 1}/3] ${link.title.substring(0, 50)}...`);

      try {
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

        // Extrair informações
        let numeroEdital = 'S/N';
        
        // Tentar múltiplos padrões
        const patterns = [
          /(?:processo|edital|pregão|número)[:\s]*(\d{1,4}\/\d{4})/i,
          /PROCESSO\s+SIMPLIFICADO\s+(\d{1,4}\/\d{4})/i,
          /(\d{1,4}\/\d{4})/i,
        ];

        for (const pattern of patterns) {
          const match = articleText.match(pattern);
          if (match && match[1]) {
            numeroEdital = match[1];
            break;
          }
        }

        // Objeto - múltiplos padrões
        let objeto = 'Não especificado';
        const objetoPatterns = [
          /objeto[:\s]*([^.\n]{20,300})/i,
          /contratação[:\s]*([^.\n]{20,300})/i,
          /CAIXA ESCOLAR\s+([^,]+)/i,
        ];

        for (const pattern of objetoPatterns) {
          const match = articleText.match(pattern);
          if (match && match[1] && match[1].length > 20) {
            objeto = match[1].trim().substring(0, 100);
            break;
          }
        }

        // Datas
        const dataMatches = articleText.match(/\d{1,2}\/\d{1,2}\/\d{4}/g) || [];
        let dataPub = null;
        if (dataMatches[0]) {
          const [dia, mes, ano] = dataMatches[0].split('/');
          dataPub = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
        }

        licitacoes.push({
          numero_edital: numeroEdital,
          objeto: objeto,
          data_publicacao: dataPub,
          titulo: link.title
        });

        console.log(`   ✅ Extraído: ${numeroEdital} - ${objeto.substring(0, 50)}`);

      } catch (error) {
        console.log(`   ❌ Erro: ${error instanceof Error ? error.message.substring(0, 50) : 'Desconhecido'}`);
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Resultados
    console.log(`\n${'='.repeat(80)}`);
    console.log(`📊 RESULTADOS DO TESTE:\n`);

    licitacoes.forEach((lic, i) => {
      console.log(`${i + 1}. ${lic.numero_edital}`);
      console.log(`   Objeto: ${lic.objeto}`);
      console.log(`   Data: ${lic.data_publicacao?.toLocaleDateString('pt-BR') || 'N/A'}\n`);
    });

    // Verificar qualidade
    console.log(`${'='.repeat(80)}`);
    console.log(`✅ Teste Concluído!`);
    console.log(`   Total: ${licitacoes.length} licitações`);
    console.log(`   Com número válido: ${licitacoes.filter(l => l.numero_edital !== 'S/N').length}`);
    console.log(`   Com objeto preenchido: ${licitacoes.filter(l => l.objeto !== 'Não especificado').length}`);
    console.log(`   Com data válida: ${licitacoes.filter(l => l.data_publicacao !== null).length}`);
    console.log(`${'='.repeat(80)}\n`);

  } catch (error) {
    console.error('❌ Erro:', error instanceof Error ? error.message : 'Desconhecido');
  }
}

testEnhancedScraper();
