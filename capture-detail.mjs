import axios from 'axios';
import fs from 'fs';

async function captureDetailPage() {
  const url = 'https://sremetropa.educacao.mg.gov.br/licitacoes/1585-aviso-de-publicacao-10-09-2025';
  
  try {
    const response = await axios.get(url, {
      timeout: 10000,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });

    fs.writeFileSync('sre-detail-sample.html', response.data);
    console.log('✅ HTML salvo em sre-detail-sample.html');
    
    // Print o texto main
    const mainStart = response.data.indexOf('<article');
    const mainEnd = response.data.indexOf('</article>');
    if (mainStart > 0 && mainEnd > mainStart) {
      const article = response.data.substring(mainStart, mainEnd + 10);
      console.log('\n📄 CONTEÚDO PRINCIPAL:');
      console.log(article.substring(0, 1000));
    }
  } catch (error) {
    console.error('❌ Erro:', error instanceof Error ? error.message : 'Desconhecido');
  }
}

captureDetailPage();
