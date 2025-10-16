import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';

async function debugSRE() {
  const sreUrl = 'https://sremetropa.educacao.mg.gov.br/licitacoes';
  
  try {
    console.log('Fetching:', sreUrl);
    const response = await axios.get(sreUrl, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    console.log('✅ Got response, analyzing structure...\n');
    
    const $ = cheerio.load(response.data);
    
    // Save HTML para análise manual
    fs.writeFileSync('sre-sample.html', response.data);
    console.log('✅ HTML salvo em sre-sample.html\n');
    
    // Analyze structure
    console.log('📊 STRUCTURE ANALYSIS:');
    console.log('========================\n');
    
    // Buscar articles
    const articles = $('article');
    console.log(`🔹 Articles encontrados: ${articles.length}`);
    if (articles.length > 0) {
      articles.slice(0, 2).each((i, el) => {
        console.log(`\n   Article ${i + 1}:`);
        console.log(`   Classes: ${$(el).attr('class')}`);
        const title = $(el).find('h2, h3, h4, .entry-title').first().text().trim();
        console.log(`   Título: ${title.substring(0, 100)}`);
        const text = $(el).text().trim();
        console.log(`   Texto length: ${text.length}`);
        console.log(`   Primeiras 200 chars: ${text.substring(0, 200)}`);
      });
    }
    
    // Buscar divs com classe "item"
    const items = $('.item');
    console.log(`\n🔹 Divs .item encontrados: ${items.length}`);
    if (items.length > 0) {
      items.slice(0, 2).each((i, el) => {
        console.log(`\n   Item ${i + 1}:`);
        console.log(`   Classes: ${$(el).attr('class')}`);
        const text = $(el).text().trim();
        console.log(`   Texto length: ${text.length}`);
        console.log(`   Primeiras 200 chars: ${text.substring(0, 200)}`);
      });
    }
    
    // Buscar links com "edital" ou "licitação"
    const links = $('a');
    console.log(`\n🔹 Links encontrados: ${links.length}`);
    const relevantLinks = [];
    links.each((i, el) => {
      const text = $(el).text().toLowerCase();
      const href = $(el).attr('href') || '';
      if (text.match(/edital|licitação|pregão|contratação|aviso|publicação/i) || href.match(/edital|licitacao|pregao/i)) {
        relevantLinks.push({
          text: $(el).text().trim(),
          href: href
        });
      }
    });
    console.log(`   Links relevantes encontrados: ${relevantLinks.length}`);
    relevantLinks.slice(0, 5).forEach((link, i) => {
      console.log(`\n   Link ${i + 1}:`);
      console.log(`   Texto: ${link.text.substring(0, 80)}`);
      console.log(`   Href: ${link.href.substring(0, 100)}`);
    });
    
    // Buscar por padrão de data
    const content = response.data;
    const dateMatches = content.match(/\d{1,2}\/\d{1,2}\/\d{4}/g);
    console.log(`\n🔹 Datas encontradas: ${dateMatches ? dateMatches.length : 0}`);
    if (dateMatches) {
      console.log(`   Amostras: ${dateMatches.slice(0, 5).join(', ')}`);
    }
    
    // Buscar por padrão de edital
    const editalMatches = content.match(/\d{1,4}\/\d{4}/g);
    console.log(`\n🔹 Padrões de edital (/YYYY): ${editalMatches ? editalMatches.length : 0}`);
    if (editalMatches) {
      console.log(`   Amostras: ${editalMatches.slice(0, 5).join(', ')}`);
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

debugSRE();
