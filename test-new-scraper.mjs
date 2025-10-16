import { scrapeSREMultiPage } from './lib/scrapers/sre-scraper-enhanced';

async function test() {
  const sre = 'https://sremetropa.educacao.mg.gov.br';
  
  console.log('🧪 TESTANDO NOVO SCRAPER MULTI-PÁGINA\n');
  
  const licitacoes = await scrapeSREMultiPage(sre);
  
  console.log(`\n\n📊 RESULTADOS:\n${'='.repeat(80)}`);
  console.log(`Total extraído: ${licitacoes.length} licitações\n`);
  
  licitacoes.slice(0, 5).forEach((lic, i) => {
    console.log(`\n${i + 1}. ${lic.numero_edital}`);
    console.log(`   Título: ${lic.titulo}`);
    console.log(`   Objeto: ${lic.objeto.substring(0, 80)}...`);
    console.log(`   Modalidade: ${lic.modalidade}`);
    console.log(`   Data Pub: ${lic.data_publicacao?.toLocaleDateString('pt-BR') || 'N/A'}`);
    console.log(`   Valor: ${lic.valor_estimado ? `R$ ${lic.valor_estimado.toLocaleString('pt-BR')}` : 'N/A'}`);
    console.log(`   Docs: ${lic.documentos.length} links`);
  });
}

test().catch(console.error);
