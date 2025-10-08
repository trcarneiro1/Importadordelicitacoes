/**
 * Scraping Orchestrator
 * Coordinates scraping of all 47 SREs with intelligent scheduling and retry logic
 * NOW USING PRISMA ORM for type-safety and better performance
 */

import { prisma, getSREsAtivas, getSREByCodigo, updateSREStatus, saveLicitacoes as prismaInsertLicitacoes, logScraping } from '../prisma/client';
import { parseSpecificSRE } from './specific-parser';

// Types from Prisma
import type { sres } from '@prisma/client';

interface ScrapingResult {
  sre_code: number;
  sre_name: string;
  success: boolean;
  licitacoes_found: number;
  error?: string;
  duration_ms: number;
  urls_scraped: number;
}

interface Licitacao {
  sre_source: string;
  sre_code: number;
  regional: string;
  numero_edital?: string;
  modalidade?: string;
  objeto: string;
  valor_estimado?: number;
  data_publicacao?: Date;
  data_abertura?: Date;
  situacao: string;
  documentos?: any;
  raw_data?: any;
}

/**
 * Get all active SREs that need scraping
 */
export async function getSREsToScrape(limit?: number): Promise<sres[]> {
  return getSREsAtivas(limit);
}

/**
 * Get specific SRE by code
 */
export async function getSREByCode(codigo: number): Promise<SRE | null> {
  const { data, error } = await supabase
    .from('sres')
    .select('*')
    .eq('codigo', codigo)
    .single();

  if (error) {
    console.error(`Failed to fetch SRE ${codigo}:`, error.message);
    return null;
  }

  return data;
}

/**
 * Update SRE scraping status
 */
async function updateSREStatus(
  codigo: number,
  success: boolean,
  licitacoesFound: number
): Promise<void> {
  const now = new Date().toISOString();
  
  // Calculate next collection time (24 hours from now)
  const nextCollection = new Date();
  nextCollection.setHours(nextCollection.getHours() + 24);

  const updates: any = {
    ultima_coleta: now,
    proxima_coleta: nextCollection.toISOString(),
    updated_at: now
  };

  // Update success rate (weighted average: 70% old + 30% new)
  const { data: currentSRE } = await supabase
    .from('sres')
    .select('taxa_sucesso')
    .eq('codigo', codigo)
    .single();

  if (currentSRE) {
    const oldRate = currentSRE.taxa_sucesso || 0;
    const newRate = success ? 100 : 0;
    updates.taxa_sucesso = Math.round(oldRate * 0.7 + newRate * 0.3);
  }

  const { error } = await supabase
    .from('sres')
    .update(updates)
    .eq('codigo', codigo);

  if (error) {
    console.error(`Failed to update SRE ${codigo} status:`, error.message);
  }
}

/**
 * Log scraping activity
 */
async function logScrapingActivity(
  sreCode: number,
  sreName: string,
  success: boolean,
  licitacoesFound: number,
  errorMessage?: string
): Promise<void> {
  const { error } = await supabase
    .from('scraping_logs')
    .insert({
      sre_source: sreName,
      status: success ? 'success' : 'error',
      licitacoes_coletadas: licitacoesFound,
      error_message: errorMessage || null,
      metadata: {
        sre_code: sreCode,
        timestamp: new Date().toISOString()
      }
    });

  if (error) {
    console.error('Failed to log scraping activity:', error.message);
  }
}

/**
 * Save licitações to database
 */
async function saveLicitacoes(licitacoes: Licitacao[]): Promise<number> {
  if (licitacoes.length === 0) return 0;

  const { data, error } = await supabase
    .from('licitacoes')
    .insert(licitacoes)
    .select();

  if (error) {
    console.error('Failed to save licitações:', error.message);
    return 0;
  }

  return data?.length || 0;
}

/**
 * Scrape a single SRE
 */
export async function scrapeSRE(sre: SRE, retries = 2): Promise<ScrapingResult> {
  const startTime = Date.now();
  const result: ScrapingResult = {
    sre_code: sre.codigo,
    sre_name: sre.nome,
    success: false,
    licitacoes_found: 0,
    duration_ms: 0,
    urls_scraped: 0
  };

  console.log(`🔄 Scraping SRE ${sre.codigo}: ${sre.nome}`);

  try {
    // Handle special cases
    if (sre.tipo_cms === 'google-sites' || sre.tipo_cms === 'google-docs') {
      console.log(`   ⚠️  Special case: ${sre.tipo_cms} - skipping for now`);
      result.error = `${sre.tipo_cms} not yet supported`;
      result.duration_ms = Date.now() - startTime;
      await updateSREStatus(sre.codigo, false, 0);
      await logScrapingActivity(sre.codigo, sre.nome, false, 0, result.error);
      return result;
    }

    // Collect URLs to scrape
    const urlsToScrape = [sre.url_licitacoes];
    if (sre.urls_adicionais && sre.urls_adicionais.length > 0) {
      urlsToScrape.push(...sre.urls_adicionais);
    }

    result.urls_scraped = urlsToScrape.length;
    const allLicitacoes: Licitacao[] = [];

    // Scrape each URL
    for (const url of urlsToScrape) {
      try {
        console.log(`   📥 Scraping: ${url}`);
        
        // Parse with specific parser (passes URL, fetches internally)
        const parsedData = await parseSpecificSRE(url);
        
        if (parsedData.success && parsedData.licitacoes && parsedData.licitacoes.length > 0) {
          // Enrich with SRE metadata
          const enrichedLicitacoes = parsedData.licitacoes.map(lic => ({
            ...lic,
            sre_source: sre.nome,
            sre_code: sre.codigo,
            regional: `SRE ${sre.nome}`,
            situacao: lic.situacao || 'aberto',
            raw_data: {
              ...lic.raw_data,
              scraped_from: url,
              scraped_at: new Date().toISOString()
            }
          }));

          allLicitacoes.push(...enrichedLicitacoes);
          console.log(`   ✅ Found ${enrichedLicitacoes.length} licitações`);
        } else {
          console.log(`   ℹ️  No licitações found`);
        }

        // Rate limiting: wait 2 seconds between requests
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (urlError: any) {
        console.error(`   ❌ Error scraping ${url}:`, urlError.message);
      }
    }

    // Save to database
    if (allLicitacoes.length > 0) {
      const saved = await saveLicitacoes(allLicitacoes);
      result.licitacoes_found = saved;
      result.success = saved > 0;
      console.log(`   💾 Saved ${saved} licitações to database`);
    } else {
      result.success = true; // Success even if no data (site might be empty)
      console.log(`   ℹ️  No new licitações to save`);
    }

    result.duration_ms = Date.now() - startTime;
    await updateSREStatus(sre.codigo, result.success, result.licitacoes_found);
    await logScrapingActivity(sre.codigo, sre.nome, result.success, result.licitacoes_found);

    return result;

  } catch (error: any) {
    result.success = false;
    result.error = error.message;
    result.duration_ms = Date.now() - startTime;

    console.error(`   ❌ Fatal error:`, error.message);

    // Retry logic
    if (retries > 0) {
      console.log(`   🔄 Retrying... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5s before retry
      return scrapeSRE(sre, retries - 1);
    }

    await updateSREStatus(sre.codigo, false, 0);
    await logScrapingActivity(sre.codigo, sre.nome, false, 0, result.error);

    return result;
  }
}

/**
 * Scrape multiple SREs in batch
 */
export async function scrapeMultipleSREs(
  sreCodes?: number[],
  limit?: number
): Promise<ScrapingResult[]> {
  console.log('🚀 Starting batch scraping...\n');

  let sres: SRE[];

  if (sreCodes && sreCodes.length > 0) {
    // Scrape specific SREs
    sres = [];
    for (const code of sreCodes) {
      const sre = await getSREByCode(code);
      if (sre) sres.push(sre);
    }
  } else {
    // Get SREs needing collection
    sres = await getSREsToScrape(limit);
  }

  console.log(`📋 SREs to scrape: ${sres.length}\n`);

  const results: ScrapingResult[] = [];

  for (const sre of sres) {
    const result = await scrapeSRE(sre);
    results.push(result);
    console.log(''); // Empty line for readability
  }

  // Summary
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const totalLicitacoes = results.reduce((sum, r) => sum + r.licitacoes_found, 0);
  const totalTime = results.reduce((sum, r) => sum + r.duration_ms, 0);

  console.log('═══════════════════════════════════════════════════');
  console.log('📊 SCRAPING SUMMARY');
  console.log('═══════════════════════════════════════════════════');
  console.log(`   Total SREs: ${results.length}`);
  console.log(`   ✅ Successful: ${successful}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📄 Licitações found: ${totalLicitacoes}`);
  console.log(`   ⏱️  Total time: ${Math.round(totalTime / 1000)}s`);
  console.log(`   ⚡ Average time: ${Math.round(totalTime / results.length / 1000)}s per SRE`);
  console.log('═══════════════════════════════════════════════════\n');

  return results;
}

/**
 * Scrape all active SREs
 */
export async function scrapeAllSREs(): Promise<ScrapingResult[]> {
  return scrapeMultipleSREs();
}

/**
 * Test scraping with a single SRE
 */
export async function testScrapeSRE(sreCode: number): Promise<ScrapingResult | null> {
  const sre = await getSREByCode(sreCode);
  if (!sre) {
    console.error(`❌ SRE ${sreCode} not found`);
    return null;
  }

  return scrapeSRE(sre);
}
