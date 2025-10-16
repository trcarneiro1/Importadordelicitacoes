import { scrapeSREMultiPage } from './lib/scrapers/sre-scraper-enhanced';

async function testEnhancedScraper() {
  console.log(`\n🧪 TESTANDO NOVO SCRAPER ENHANCED\n`);
  console.log(`${'='.repeat(80)}`);
  
  const sreUrl = 'https://sremetropa.educacao.mg.gov.br';
  
  try {
    console.log(`🔗 Scraping: ${sreUrl}\n`);
    
    const licitacoes = await scrapeSREMultiPage(sreUrl);
    
    console.log(`\n✅ RESULTADO: ${licitacoes.length} licitações extraídas\n`);
    console.log(`${'='.repeat(80)}`);
    
    // Mostrar primeiras 5
    licitacoes.slice(0, 5).forEach((lic, i) => {
      console.log(`\n${i + 1}. EDITAL: ${lic.numero_edital}`);
      console.log(`   Título: ${lic.titulo}`);
      console.log(`   Objeto: ${lic.objeto.substring(0, 70)}...`);
      console.log(`   Modalidade: ${lic.modalidade}`);
      console.log(`   Data Publicação: ${lic.data_publicacao?.toLocaleDateString('pt-BR') || 'N/A'}`);
      console.log(`   Data Abertura: ${lic.data_abertura?.toLocaleDateString('pt-BR') || 'N/A'}`);
      console.log(`   Valor: ${lic.valor_estimado ? `R$ ${lic.valor_estimado.toLocaleString('pt-BR')}` : 'N/A'}`);
      console.log(`   Documentos: ${lic.documentos.length} link(s)`);
      if (lic.documentos.length > 0) {
        console.log(`      └─ ${lic.documentos[0].url.substring(0, 70)}...`);
      }
    });
    
    console.log(`\n${'='.repeat(80)}`);
    console.log(`📊 ESTATÍSTICAS:`);
    
    // Contar dados bons vs ruim
    const comNumeroEdital = licitacoes.filter(l => l.numero_edital !== 'S/N').length;
    const comObjeto = licitacoes.filter(l => l.objeto !== 'Não especificado').length;
    const comData = licitacoes.filter(l => l.data_publicacao !== undefined).length;
    const comValor = licitacoes.filter(l => l.valor_estimado !== undefined).length;
    const comDocs = licitacoes.filter(l => l.documentos.length > 0).length;
    
    console.log(`   ✅ Com número edital válido: ${comNumeroEdital}/${licitacoes.length}`);
    console.log(`   ✅ Com objeto preenchido: ${comObjeto}/${licitacoes.length}`);
    console.log(`   ✅ Com data válida: ${comData}/${licitacoes.length}`);
    console.log(`   ✅ Com valor estimado: ${comValor}/${licitacoes.length}`);
    console.log(`   ✅ Com documentos: ${comDocs}/${licitacoes.length}`);
    
    console.log(`\n${'='.repeat(80)}\n`);
    
  } catch (error) {
    console.error('❌ Erro:', error instanceof Error ? error.message : 'Desconhecido');
  }
}

testEnhancedScraper();
