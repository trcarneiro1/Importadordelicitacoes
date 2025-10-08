/**
 * Test Scraper
 * Test scraping for specific SREs
 * Usage: node scripts/test-scraper.js [sre_code]
 */

import { testScrapeSRE, scrapeMultipleSREs } from '../lib/scrapers/orchestrator.js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('📖 Usage:');
    console.log('   node scripts/test-scraper.js <sre_code>');
    console.log('   node scripts/test-scraper.js 6           # Test Barbacena');
    console.log('   node scripts/test-scraper.js 13          # Test Curvelo (multiple URLs)');
    console.log('   node scripts/test-scraper.js 22          # Test Juiz de Fora (Google Sites)');
    console.log('   node scripts/test-scraper.js 6,13,22     # Test multiple SREs');
    console.log('\n📋 Recommended tests:');
    console.log('   6  - Barbacena (standard Joomla)');
    console.log('   13 - Curvelo (6 URLs)');
    console.log('   14 - Diamantina (4 URLs)');
    console.log('   22 - Juiz de Fora (Google Sites - special case)');
    console.log('   41 - Teófilo Otoni (Joomla + Google Sheets)');
    process.exit(0);
  }

  const input = args[0];
  
  // Check if multiple SREs
  if (input.includes(',')) {
    const codes = input.split(',').map(s => parseInt(s.trim()));
    console.log(`🧪 Testing ${codes.length} SREs: ${codes.join(', ')}\n`);
    
    const results = await scrapeMultipleSREs(codes);
    
    console.log('\n📊 Individual Results:');
    results.forEach(r => {
      const status = r.success ? '✅' : '❌';
      console.log(`   ${status} SRE ${r.sre_code} (${r.sre_name}): ${r.licitacoes_found} licitações`);
      if (r.error) {
        console.log(`      Error: ${r.error}`);
      }
    });
    
  } else {
    const sreCode = parseInt(input);
    if (isNaN(sreCode) || sreCode < 1 || sreCode > 47) {
      console.error('❌ Invalid SRE code. Must be between 1 and 47.');
      process.exit(1);
    }

    console.log(`🧪 Testing SRE ${sreCode}...\n`);
    
    const result = await testScrapeSRE(sreCode);
    
    if (!result) {
      console.error(`❌ Failed to scrape SRE ${sreCode}`);
      process.exit(1);
    }

    console.log('\n📊 Result:');
    console.log(`   Status: ${result.success ? '✅ Success' : '❌ Failed'}`);
    console.log(`   Licitações found: ${result.licitacoes_found}`);
    console.log(`   URLs scraped: ${result.urls_scraped}`);
    console.log(`   Duration: ${Math.round(result.duration_ms / 1000)}s`);
    
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  }

  console.log('\n✨ Test complete!\n');
}

main().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
