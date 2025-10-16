import axios from 'axios';
import * as cheerio from 'cheerio';

async function debugDetailPage() {
  const detailUrl = 'https://sremetropa.educacao.mg.gov.br/licitacoes/1585-aviso-de-publicacao-10-09-2025';
  
  try {
    console.log('Fetching:', detailUrl);
    const response = await axios.get(detailUrl, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const $ = cheerio.load(response.data);
    
    console.log('✅ Got response, extracting data...\n');
    
    // Get the main article content
    const article = $('article.item').first();
    const fullText = article.text().trim();
    
    console.log('📄 FULL ARTICLE TEXT:');
    console.log('=' .repeat(80));
    console.log(fullText);
    console.log('=' .repeat(80));
    
    // Try to find specific fields
    console.log('\n🔍 SEARCHING FOR SPECIFIC DATA:\n');
    
    // Search for patterns
    const patterns = {
      'Edital/Número': /(?:edital|número|processo)[:\s]*(\d+\/\d{4}|\d+-\d+)/gi,
      'Objeto': /(?:objeto|contratação|serviço)[:\s]*([^\n]{20,200})/gi,
      'Modalidade': /(?:modalidade|pregão|concorrência)[:\s]*([^\n]{10,100})/gi,
      'Data': /\d{1,2}\/\d{1,2}\/\d{4}/gi,
      'Valor': /R\$\s*[\d.,]+/gi,
      'Email': /[\w.-]+@[\w.-]+\.\w+/gi,
    };
    
    for (const [field, pattern] of Object.entries(patterns)) {
      const matches = fullText.match(pattern);
      if (matches) {
        console.log(`✅ ${field}:`);
        matches.slice(0, 3).forEach((m, i) => {
          console.log(`   ${i + 1}. ${m}`);
        });
      }
    }
    
    // Check for links to attachments/documents
    const links = $('a');
    const docLinks = [];
    links.each((i, el) => {
      const href = $(el).attr('href') || '';
      const text = $(el).text().toLowerCase();
      if (href.match(/\.pdf|\.doc|download|edital|anexo/i) || text.match(/download|anexo|edital|pdf/i)) {
        docLinks.push({
          text: $(el).text().trim(),
          href: href.trim()
        });
      }
    });
    
    console.log(`\n📎 DOCUMENT LINKS (${docLinks.length}):`);
    docLinks.slice(0, 5).forEach((link, i) => {
      console.log(`   ${i + 1}. ${link.text.substring(0, 60)} → ${link.href.substring(0, 80)}`);
    });
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

debugDetailPage();
