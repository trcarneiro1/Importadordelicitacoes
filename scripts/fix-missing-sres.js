/**
 * Script: Fix missing SREs
 * Adds Ubá (42) and Vespasiano (47), plus fixes Monte Carmelo -> Montes Claros
 * Run: node scripts/fix-missing-sres.js
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const missingSREs = [
  {
    codigo: 46,
    nome: 'Ubá',
    municipio: 'Ubá',
    url_base: 'https://sreuba.educacao.mg.gov.br/',
    url_licitacoes: 'https://sreuba.educacao.mg.gov.br/index.php/licitacoes-e-compras',
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

async function fixMissingSREs() {
  console.log('🔧 Fixing missing SREs...\n');

  // Fix Monte Carmelo -> Montes Claros
  console.log('1️⃣ Fixing Monte Carmelo -> Montes Claros (codigo 25)...');
  const { error: updateError } = await supabase
    .from('sres')
    .update({
      nome: 'Montes Claros',
      municipio: 'Montes Claros',
      url_base: 'https://sremontesclaros.educacao.mg.gov.br/',
      url_licitacoes: 'https://sremontesclaros.educacao.mg.gov.br/index.php/licitacoes-e-compras'
    })
    .eq('codigo', 25);

  if (updateError) {
    console.error('   ❌ Failed:', updateError.message);
  } else {
    console.log('   ✅ Updated successfully');
  }

  // Insert missing SREs
  console.log('\n2️⃣ Inserting missing SREs (46, 47)...');
  
  for (const sre of missingSREs) {
    const { error } = await supabase
      .from('sres')
      .insert(sre);

    if (error) {
      console.error(`   ❌ Failed to insert ${sre.nome}:`, error.message);
    } else {
      console.log(`   ✅ Inserted ${sre.nome} (codigo ${sre.codigo})`);
    }
  }

  // Verify final count
  console.log('\n3️⃣ Verifying final count...');
  const { count } = await supabase
    .from('sres')
    .select('*', { count: 'exact', head: true });

  console.log(`   📊 Total SREs: ${count}`);

  if (count === 47) {
    console.log('\n✅ SUCCESS! All 47 SREs are now in the database!');
  } else {
    console.log(`\n⚠️  Expected 47 SREs, but found ${count}`);
  }

  console.log('\n📌 Run verification: npm run verify:sres\n');
}

fixMissingSREs().catch(error => {
  console.error('💥 Unexpected error:', error);
  process.exit(1);
});
