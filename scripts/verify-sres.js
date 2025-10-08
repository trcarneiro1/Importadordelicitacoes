/**
 * Script: Verify SREs data
 * Checks which SREs are missing or have issues
 * Run: node scripts/verify-sres.js
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

async function verifySREs() {
  console.log('🔍 Verifying SREs data...\n');

  const { data: sres, error } = await supabase
    .from('sres')
    .select('codigo, nome, municipio, tipo_cms, ativo')
    .order('codigo');

  if (error) {
    console.error('❌ Error fetching SREs:', error.message);
    process.exit(1);
  }

  console.log(`📊 Total SREs in database: ${sres.length}\n`);

  // Check for missing codes (1-47)
  const existingCodes = new Set(sres.map(s => s.codigo));
  const missingCodes = [];
  
  for (let i = 1; i <= 47; i++) {
    if (!existingCodes.has(i)) {
      missingCodes.push(i);
    }
  }

  if (missingCodes.length > 0) {
    console.log('❌ Missing SRE codes:', missingCodes.join(', '));
  } else {
    console.log('✅ All 47 SRE codes present (1-47)');
  }

  // Group by CMS type
  const byCMS = sres.reduce((acc, sre) => {
    acc[sre.tipo_cms] = (acc[sre.tipo_cms] || 0) + 1;
    return acc;
  }, {});

  console.log('\n📋 By CMS Type:');
  Object.entries(byCMS).forEach(([cms, count]) => {
    console.log(`   ${cms}: ${count}`);
  });

  // Check active/inactive
  const active = sres.filter(s => s.ativo).length;
  const inactive = sres.filter(s => !s.ativo).length;

  console.log('\n🎯 Active Status:');
  console.log(`   Active: ${active}`);
  console.log(`   Inactive: ${inactive}`);

  // List all SREs
  console.log('\n📄 Complete list:');
  console.log('─'.repeat(70));
  sres.forEach(sre => {
    const status = sre.ativo ? '✓' : '✗';
    console.log(`   ${status} ${String(sre.codigo).padStart(2, '0')}. ${sre.nome.padEnd(30)} (${sre.tipo_cms})`);
  });
  console.log('─'.repeat(70));

  // Special cases
  const specialCases = sres.filter(s => 
    s.nome.includes('Curvelo') || 
    s.nome.includes('Diamantina') || 
    s.nome.includes('Juiz de Fora') ||
    s.nome.includes('Teófilo Otoni')
  );

  if (specialCases.length > 0) {
    console.log('\n⚠️  Special cases (multiple URLs or non-Joomla):');
    specialCases.forEach(sre => {
      console.log(`   - ${sre.nome} (codigo: ${sre.codigo}, ${sre.tipo_cms})`);
    });
  }

  console.log('\n✨ Verification complete!\n');
}

verifySREs().catch(error => {
  console.error('💥 Unexpected error:', error);
  process.exit(1);
});
