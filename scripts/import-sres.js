/**
 * Script: Import SREs data to Supabase
 * Populates the sres table with all 47 regional superintendencies
 * Run: node scripts/import-sres.js
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 47 SREs de Minas Gerais
const sresData = [
  {
    codigo: 1,
    nome: 'Metropolitana A',
    municipio: 'Belo Horizonte',
    url_base: 'https://sremetropa.educacao.mg.gov.br/',
    url_licitacoes: 'https://sremetropa.educacao.mg.gov.br/index.php/licitacoes-e-compras',
    tipo_cms: 'joomla',
    ativo: true
  },
  {
    codigo: 2,
    nome: 'Metropolitana B',
    municipio: 'Belo Horizonte',
    url_base: 'https://sremetropb.educacao.mg.gov.br/',
    url_licitacoes: 'https://sremetropb.educacao.mg.gov.br/index.php/licitacoes-e-compras',
    tipo_cms: 'joomla',
    ativo: true
  },
  {
    codigo: 3,
    nome: 'Metropolitana C',
    municipio: 'Belo Horizonte',
    url_base: 'https://sremetropc.educacao.mg.gov.br/',
    url_licitacoes: 'https://sremetropc.educacao.mg.gov.br/index.php/licitacoes-e-compras',
    tipo_cms: 'joomla',
    ativo: true
  },
  {
    codigo: 4,
    nome: 'Almenara',
    municipio: 'Almenara',
    url_base: 'https://srealmenara.educacao.mg.gov.br/',
    url_licitacoes: 'https://srealmenara.educacao.mg.gov.br/index.php/licitacoes-e-compras',
    tipo_cms: 'joomla',
    ativo: true
  },
  {
    codigo: 5,
    nome: 'Araçuaí',
    municipio: 'Araçuaí',
    url_base: 'https://srearauai.educacao.mg.gov.br/',
    url_licitacoes: 'https://srearauai.educacao.mg.gov.br/index.php/licitacoes-e-compras',
    tipo_cms: 'joomla',
    ativo: true
  },
  {
    codigo: 6,
    nome: 'Barbacena',
    municipio: 'Barbacena',
    url_base: 'https://srebarbacena.educacao.mg.gov.br/',
    url_licitacoes: 'https://srebarbacena.educacao.mg.gov.br/index.php/licitacoes-e-compras',
    tipo_cms: 'joomla',
    ativo: true
  },
  {
    codigo: 7,
    nome: 'Campo Belo',
    municipio: 'Campo Belo',
    url_base: 'https://srecampobelo.educacao.mg.gov.br/',
    url_licitacoes: 'https://srecampobelo.educacao.mg.gov.br/index.php/licitacoes-e-compras',
    tipo_cms: 'joomla',
    ativo: true
  },
  {
    codigo: 8,
    nome: 'Carangola',
    municipio: 'Carangola',
    url_base: 'https://srecarangola.educacao.mg.gov.br/',
    url_licitacoes: 'https://srecarangola.educacao.mg.gov.br/index.php/licitacoes-e-compras',
    tipo_cms: 'joomla',
    ativo: true
  },
  {
    codigo: 9,
    nome: 'Caratinga',
    municipio: 'Caratinga',
    url_base: 'https://srecaratinga.educacao.mg.gov.br/',
    url_licitacoes: 'https://srecaratinga.educacao.mg.gov.br/index.php/licitacoes-e-compras',
    tipo_cms: 'joomla',
    ativo: true
  },
  {
    codigo: 10,
    nome: 'Caxambu',
    municipio: 'Caxambu',
    url_base: 'https://srecaxambu.educacao.mg.gov.br/',
    url_licitacoes: 'https://srecaxambu.educacao.mg.gov.br/index.php/licitacoes-e-compras',
    tipo_cms: 'joomla',
    ativo: true
  },
  {
    codigo: 11,
    nome: 'Conselheiro Lafaiete',
    municipio: 'Conselheiro Lafaiete',
    url_base: 'https://sreconselheiro.educacao.mg.gov.br/',
    url_licitacoes: 'https://sreconselheiro.educacao.mg.gov.br/index.php/licitacoes-e-compras',
    tipo_cms: 'joomla',
    ativo: true
  },
  {
    codigo: 12,
    nome: 'Coronel Fabriciano',
    municipio: 'Coronel Fabriciano',
    url_base: 'https://srecoronelfabriciano.educacao.mg.gov.br/',
    url_licitacoes: 'https://srecoronelfabriciano.educacao.mg.gov.br/index.php/licitacoes-e-compras',
    tipo_cms: 'joomla',
    ativo: true
  },
  {
    codigo: 13,
    nome: 'Curvelo',
    municipio: 'Curvelo',
    url_base: 'https://srecurvelo.educacao.mg.gov.br/',
    url_licitacoes: 'https://srecurvelo.educacao.mg.gov.br/index.php/licitacoes-e-compras',
    urls_adicionais: [
      'https://srecurvelo.educacao.mg.gov.br/index.php/transparencia/licitacoes-contratos-e-convenios/category/10-licitacoes',
      'https://srecurvelo.educacao.mg.gov.br/index.php/transparencia/licitacoes-contratos-e-convenios/category/9-contratos',
      'https://srecurvelo.educacao.mg.gov.br/index.php/transparencia/licitacoes-contratos-e-convenios/category/11-editais',
      'https://srecurvelo.educacao.mg.gov.br/index.php/transparencia/licitacoes-contratos-e-convenios/category/38-pdde',
      'https://srecurvelo.educacao.mg.gov.br/index.php/transparencia/licitacoes-contratos-e-convenios/category/41-outros'
    ],
    tipo_cms: 'joomla',
    notas: '6 URLs diferentes para categorias de licitações',
    ativo: true
  },
  {
    codigo: 14,
    nome: 'Diamantina',
    municipio: 'Diamantina',
    url_base: 'https://srediamantina.educacao.mg.gov.br/',
    url_licitacoes: 'https://srediamantina.educacao.mg.gov.br/index.php/licitacoes-e-compras',
    urls_adicionais: [
      'https://srediamantina.educacao.mg.gov.br/index.php/licitacoes-e-compras/category/43-contratacao-direta',
      'https://srediamantina.educacao.mg.gov.br/index.php/licitacoes-e-compras/category/10-licitacoes',
      'https://srediamantina.educacao.mg.gov.br/index.php/licitacoes-e-compras/category/46-dispensa-de-licitacao'
    ],
    tipo_cms: 'joomla',
    notas: '4 URLs: principal + 3 categorias',
    ativo: true
  },
  {
    codigo: 15,
    nome: 'Divinópolis',
    municipio: 'Divinópolis',
    url_base: 'https://sredivinopolis.educacao.mg.gov.br/',
    url_licitacoes: 'https://sredivinopolis.educacao.mg.gov.br/index.php/licitacoes-e-compras',
    tipo_cms: 'joomla',
    ativo: true
  },
  {
    codigo: 16,
    nome: 'Governador Valadares',
    municipio: 'Governador Valadares',
    url_base: 'https://sregovernadorvaladares.educacao.mg.gov.br/',
    url_licitacoes: 'https://sregovernadorvaladares.educacao.mg.gov.br/index.php/licitacoes-e-compras',
    tipo_cms: 'joomla',
    ativo: true
  },
  {
    codigo: 17,
    nome: 'Guanhães',
    municipio: 'Guanhães',
    url_base: 'https://sreguanhaes.educacao.mg.gov.br/',
    url_licitacoes: 'https://sreguanhaes.educacao.mg.gov.br/index.php/licitacoes-e-compras',
    tipo_cms: 'joomla',
    ativo: true
  },
  {
    codigo: 18,
    nome: 'Itajubá',
    municipio: 'Itajubá',
    url_base: 'https://sreitajuba.educacao.mg.gov.br/',
    url_licitacoes: 'https://sreitajuba.educacao.mg.gov.br/index.php/licitacoes-e-compras',
    tipo_cms: 'joomla',
    ativo: true
  },
  {
    codigo: 19,
    nome: 'Ituiutaba',
    municipio: 'Ituiutaba',
    url_base: 'https://sreituiutaba.educacao.mg.gov.br/',
    url_licitacoes: 'https://sreituiutaba.educacao.mg.gov.br/index.php/licitacoes-e-compras',
    tipo_cms: 'joomla',
    ativo: true
  },
  {
    codigo: 20,
    nome: 'Janaúba',
    municipio: 'Janaúba',
    url_base: 'https://srejanauba.educacao.mg.gov.br/',
    url_licitacoes: 'https://srejanauba.educacao.mg.gov.br/index.php/licitacoes-e-compras',
    tipo_cms: 'joomla',
    ativo: true
  },
  {
    codigo: 21,
    nome: 'Januária',
    municipio: 'Januária',
    url_base: 'https://srejanuaria.educacao.mg.gov.br/',
    url_licitacoes: 'https://srejanuaria.educacao.mg.gov.br/index.php/licitacoes-e-compras',
    tipo_cms: 'joomla',
    ativo: true
  },
  {
    codigo: 22,
    nome: 'Juiz de Fora',
    municipio: 'Juiz de Fora',
    url_base: 'https://sites.google.com/educacao.mg.gov.br/sre-juiz-de-fora',
    url_licitacoes: 'https://sites.google.com/educacao.mg.gov.br/sre-juiz-de-fora/compras-e-licita%C3%A7%C3%B5es',
    tipo_cms: 'google-sites',
    notas: 'Google Sites - requer scraping diferente',
    ativo: true
  },
  {
    codigo: 23,
    nome: 'Leopoldina',
    municipio: 'Leopoldina',
    url_base: 'https://sreleopoldina.educacao.mg.gov.br/',
    url_licitacoes: 'https://sreleopoldina.educacao.mg.gov.br/index.php/licitacoes-e-compras',
    tipo_cms: 'joomla',
    ativo: true
  },
  {
    codigo: 24,
    nome: 'Manhuaçu',
    municipio: 'Manhuaçu',
    url_base: 'https://sremanhuacu.educacao.mg.gov.br/',
    url_licitacoes: 'https://sremanhuacu.educacao.mg.gov.br/index.php/licitacoes-e-compras',
    tipo_cms: 'joomla',
    ativo: true
  },
  {
    codigo: 25,
    nome: 'Montes Claros',
    municipio: 'Montes Claros',
    url_base: 'https://sremontesclaros.educacao.mg.gov.br/',
    url_licitacoes: 'https://sremontesclaros.educacao.mg.gov.br/index.php/licitacoes-e-compras',
    tipo_cms: 'joomla',
    ativo: true
  },
  {
    codigo: 26,
    nome: 'Muriaé',
    municipio: 'Muriaé',
    url_base: 'https://sremurie.educacao.mg.gov.br/',
    url_licitacoes: 'https://sremurie.educacao.mg.gov.br/index.php/licitacoes-e-compras',
    tipo_cms: 'joomla',
    ativo: true
  },
  {
    codigo: 27,
    nome: 'Nova Era',
    municipio: 'Nova Era',
    url_base: 'https://srenovaera.educacao.mg.gov.br/',
    url_licitacoes: 'https://srenovaera.educacao.mg.gov.br/index.php/licitacoes-e-compras',
    tipo_cms: 'joomla',
    ativo: true
  },
  {
    codigo: 28,
    nome: 'Ouro Preto',
    municipio: 'Ouro Preto',
    url_base: 'https://sreourupreto.educacao.mg.gov.br/',
    url_licitacoes: 'https://sreourupreto.educacao.mg.gov.br/index.php/licitacoes-e-compras',
    tipo_cms: 'joomla',
    ativo: true
  },
  {
    codigo: 29,
    nome: 'Pará de Minas',
    municipio: 'Pará de Minas',
    url_base: 'https://sreparademinas.educacao.mg.gov.br/',
    url_licitacoes: 'https://sreparademinas.educacao.mg.gov.br/index.php/licitacoes-e-compras',
    tipo_cms: 'joomla',
    ativo: true
  },
  {
    codigo: 30,
    nome: 'Paracatu',
    municipio: 'Paracatu',
    url_base: 'https://sreparacatu.educacao.mg.gov.br/',
    url_licitacoes: 'https://sreparacatu.educacao.mg.gov.br/index.php/licitacoes-e-compras',
    tipo_cms: 'joomla',
    ativo: true
  },
  {
    codigo: 31,
    nome: 'Passos',
    municipio: 'Passos',
    url_base: 'https://srepassos.educacao.mg.gov.br/',
    url_licitacoes: 'https://srepassos.educacao.mg.gov.br/index.php/licitacoes-e-compras',
    tipo_cms: 'joomla',
    ativo: true
  },
  {
    codigo: 32,
    nome: 'Patos de Minas',
    municipio: 'Patos de Minas',
    url_base: 'https://srepatosdeminas.educacao.mg.gov.br/',
    url_licitacoes: 'https://srepatosdeminas.educacao.mg.gov.br/index.php/licitacoes-e-compras',
    tipo_cms: 'joomla',
    ativo: true
  },
  {
    codigo: 33,
    nome: 'Patrocínio',
    municipio: 'Patrocínio',
    url_base: 'https://srepatrocinio.educacao.mg.gov.br',
    url_licitacoes: 'https://srepatrocinio.educacao.mg.gov.br/index.php/licitacoes-e-compras',
    tipo_cms: 'joomla',
    notas: 'URL sem trailing slash',
    ativo: true
  },
  {
    codigo: 34,
    nome: 'Pirapora',
    municipio: 'Pirapora',
    url_base: 'https://srepirapora.educacao.mg.gov.br/',
    url_licitacoes: 'https://srepirapora.educacao.mg.gov.br/index.php/licitacoes-e-compras',
    tipo_cms: 'joomla',
    ativo: true
  },
  {
    codigo: 35,
    nome: 'Poços de Caldas',
    municipio: 'Poços de Caldas',
    url_base: 'https://srepocosdecaldas.educacao.mg.gov.br/',
    url_licitacoes: 'https://srepocosdecaldas.educacao.mg.gov.br/index.php/licitacoes-e-compras',
    tipo_cms: 'joomla',
    ativo: true
  },
  {
    codigo: 36,
    nome: 'Ponte Nova',
    municipio: 'Ponte Nova',
    url_base: 'https://srepontenova.educacao.mg.gov.br/',
    url_licitacoes: 'https://srepontenova.educacao.mg.gov.br/index.php/licitacoes-e-compras',
    tipo_cms: 'joomla',
    ativo: true
  },
  {
    codigo: 37,
    nome: 'Pouso Alegre',
    municipio: 'Pouso Alegre',
    url_base: 'https://srepousoalegre.educacao.mg.gov.br/',
    url_licitacoes: 'https://srepousoalegre.educacao.mg.gov.br/index.php/licitacoes-e-compras',
    tipo_cms: 'joomla',
    ativo: true
  },
  {
    codigo: 38,
    nome: 'São João del Rei',
    municipio: 'São João del Rei',
    url_base: 'https://sresaojoaodelrei.educacao.mg.gov.br/',
    url_licitacoes: 'https://sresaojoaodelrei.educacao.mg.gov.br/index.php/licitacoes-e-compras',
    tipo_cms: 'joomla',
    ativo: true
  },
  {
    codigo: 39,
    nome: 'São Sebastião do Paraíso',
    municipio: 'São Sebastião do Paraíso',
    url_base: 'https://sresaoparaiso.educacao.mg.gov.br/',
    url_licitacoes: 'https://sresaoparaiso.educacao.mg.gov.br/index.php/licitacoes-e-compras',
    tipo_cms: 'joomla',
    ativo: true
  },
  {
    codigo: 40,
    nome: 'Sete Lagoas',
    municipio: 'Sete Lagoas',
    url_base: 'https://sresetegoas.educacao.mg.gov.br/',
    url_licitacoes: 'https://sresetegoas.educacao.mg.gov.br/index.php/licitacoes-e-compras',
    tipo_cms: 'joomla',
    ativo: true
  },
  {
    codigo: 41,
    nome: 'Teófilo Otoni',
    municipio: 'Teófilo Otoni',
    url_base: 'https://sreteofilootoni.educacao.mg.gov.br/',
    url_licitacoes: 'https://sreteofilootoni.educacao.mg.gov.br/index.php/licitacoes-e-compras',
    urls_adicionais: [
      'https://docs.google.com/spreadsheets/d/1lp8k5BfBx4eZfr86Ei6bPvCBrvRGEILUEv4pOEt6h_o/edit?gid=0#gid=0'
    ],
    tipo_cms: 'joomla',
    notas: 'Site Joomla + planilha Google Sheets',
    ativo: true
  },
  {
    codigo: 42,
    nome: 'Ubá',
    municipio: 'Ubá',
    url_base: 'https://sreuba.educacao.mg.gov.br/',
    url_licitacoes: 'https://sreuba.educacao.mg.gov.br/index.php/licitacoes-e-compras',
    tipo_cms: 'joomla',
    ativo: true
  },
  {
    codigo: 43,
    nome: 'Uberaba',
    municipio: 'Uberaba',
    url_base: 'https://sreuberaba.educacao.mg.gov.br/',
    url_licitacoes: 'https://sreuberaba.educacao.mg.gov.br/index.php/licitacoes-e-compras',
    tipo_cms: 'joomla',
    ativo: true
  },
  {
    codigo: 44,
    nome: 'Uberlândia',
    municipio: 'Uberlândia',
    url_base: 'https://sreuberlandia.educacao.mg.gov.br/',
    url_licitacoes: 'https://sreuberlandia.educacao.mg.gov.br/index.php/licitacoes-e-compras',
    tipo_cms: 'joomla',
    ativo: true
  },
  {
    codigo: 45,
    nome: 'Unaí',
    municipio: 'Unaí',
    url_base: 'https://sreunai.educacao.mg.gov.br/',
    url_licitacoes: 'https://sreunai.educacao.mg.gov.br/index.php/licitacoes-e-compras',
    tipo_cms: 'joomla',
    ativo: true
  },
  {
    codigo: 46,
    nome: 'Varginha',
    municipio: 'Varginha',
    url_base: 'https://srevarginha.educacao.mg.gov.br/',
    url_licitacoes: 'https://srevarginha.educacao.mg.gov.br/index.php/licitacoes-e-compras',
    tipo_cms: 'joomla',
    ativo: true
  },
  {
    codigo: 47,
    nome: 'Vespasiano',
    municipio: 'Vespasiano',
    url_base: 'https://srevespasiano.educacao.mg.gov.br/',
    url_licitacoes: 'https://srevespasiano.educacao.mg.gov.br/index.php/licitacoes-e-compras',
    tipo_cms: 'joomla',
    ativo: true
  }
];

async function importSREs() {
  console.log('🚀 Starting SREs import...\n');

  // Check if table exists and is empty
  const { count, error: countError } = await supabase
    .from('sres')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error('❌ Error checking sres table:', countError.message);
    console.error('   Make sure you ran schema-sres.sql first!');
    process.exit(1);
  }

  console.log(`📊 Current records in sres table: ${count}`);

  if (count > 0) {
    console.log('⚠️  Table already has data. Skipping import.');
    console.log('   Run: DELETE FROM sres; to clear and re-import.\n');
    return;
  }

  // Insert all SREs
  console.log(`📥 Inserting ${sresData.length} SREs...`);

  const { data, error } = await supabase
    .from('sres')
    .insert(sresData)
    .select();

  if (error) {
    console.error('❌ Import failed:', error.message);
    console.error('   Details:', error);
    process.exit(1);
  }

  console.log(`✅ Successfully imported ${data.length} SREs!\n`);

  // Verify import
  const { data: verification } = await supabase
    .from('sres')
    .select('codigo, nome, tipo_cms')
    .order('codigo');

  console.log('📋 Imported SREs Summary:');
  console.log('─'.repeat(60));
  
  const joomlaCount = verification.filter(s => s.tipo_cms === 'joomla').length;
  const googleSitesCount = verification.filter(s => s.tipo_cms === 'google-sites').length;
  
  console.log(`   Total: ${verification.length}`);
  console.log(`   Joomla: ${joomlaCount}`);
  console.log(`   Google Sites: ${googleSitesCount}`);
  console.log('─'.repeat(60));
  
  // Show first 5 and last 5
  console.log('\n🔍 Sample records:');
  verification.slice(0, 3).forEach(sre => {
    console.log(`   ${sre.codigo}. ${sre.nome} (${sre.tipo_cms})`);
  });
  console.log('   ...');
  verification.slice(-3).forEach(sre => {
    console.log(`   ${sre.codigo}. ${sre.nome} (${sre.tipo_cms})`);
  });

  // Show special cases
  console.log('\n⚠️  Special cases requiring custom scrapers:');
  const specialCases = verification.filter(s => 
    s.nome.includes('Curvelo') || 
    s.nome.includes('Diamantina') || 
    s.nome.includes('Juiz de Fora') ||
    s.nome.includes('Teófilo Otoni')
  );
  specialCases.forEach(sre => {
    console.log(`   - ${sre.nome} (codigo: ${sre.codigo})`);
  });

  console.log('\n🎉 Import completed successfully!');
  console.log('\n📌 Next steps:');
  console.log('   1. Verify data: SELECT * FROM sres ORDER BY codigo;');
  console.log('   2. Test scraping: node scripts/test-scraper.js 6');
  console.log('   3. Build orchestrator: lib/scrapers/orchestrator.ts\n');
}

// Run import
importSREs().catch(error => {
  console.error('💥 Unexpected error:', error);
  process.exit(1);
});
