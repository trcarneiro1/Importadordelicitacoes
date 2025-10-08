/**
 * Scraping Orchestrator with Prisma ORM
 * Coordinates scraping of all 47 SREs with intelligent scheduling and retry logic
 * 
 * ✨ NEW: Type-safe database operations with Prisma Client
 */

import { PrismaClient } from '@prisma/client';
import { parseSpecificSRE } from './specific-parser';

const prisma = new PrismaClient();

// ===== TYPES =====

type SRE = {
  id: number;
  codigo: number;
  nome: string;
  municipio: string | null;
  url_base: string;
  url_licitacoes: string;
  urls_adicionais: string[];
  tipo_cms: string | null;
  ativo: boolean;
  ultima_coleta: Date | null;
  proxima_coleta: Date | null;
  taxa_sucesso: number | null;
  total_coletas: number | null;
  created_at: Date;
};

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
  sre_source?: string;
  sre_code?: number;
  regional?: string;
  numero_edital?: string;
  modalidade?: string;
  objeto?: string;
  valor_estimado?: number;
  data_publicacao?: Date;
  data_abertura?: Date;
  situacao?: string;
  documentos?: any;
  raw_data?: any;
}

// ===== DATABASE OPERATIONS =====

/**
 * Get all active SREs that need scraping
 */
export async function getSREsToScrape(limit?: number): Promise<SRE[]> {
  return prisma.sres.findMany({
    where: { ativo: true },
    orderBy: [
      { ultima_coleta: { sort: 'asc', nulls: 'first' } },
      { codigo: 'asc' }
    ],
    take: limit
  });
}

/**
 * Get specific SRE by code
 */
export async function getSREByCode(codigo: number): Promise<SRE | null> {
  try {
    return await prisma.sres.findUnique({
      where: { codigo }
    });
  } catch (error: any) {
    console.error(`Failed to fetch SRE ${codigo}:`, error.message);
    return null;
  }
}

/**
 * Update SRE scraping status
 */
async function updateSREStatusLocal(
  codigo: number,
  success: boolean,
  licitacoesFound: number
): Promise<void> {
  try {
    const now = new Date();
    
    // Calculate next collection time (24 hours from now)
    const nextCollection = new Date();
    nextCollection.setHours(nextCollection.getHours() + 24);

    // Get current SRE data for weighted average
    const currentSRE = await prisma.sres.findUnique({
      where: { codigo },
      select: { taxa_sucesso: true, total_coletas: true }
    });

    // Calculate success rate (weighted average: 70% old + 30% new)
    const oldRate = currentSRE?.taxa_sucesso || 0;
    const newRate = success ? 100 : 0;
    const taxa_sucesso = Math.round(oldRate * 0.7 + newRate * 0.3);

    // Update SRE
    await prisma.sres.update({
      where: { codigo },
      data: {
        ultima_coleta: now,
        proxima_coleta: nextCollection,
        taxa_sucesso,
        total_coletas: (currentSRE?.total_coletas || 0) + 1
      }
    });

    console.log(`   📊 Updated SRE status: success=${success}, taxa=${taxa_sucesso}%`);
  } catch (error: any) {
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
  errorMessage?: string,
  executionTimeMs?: number
): Promise<void> {
  try {
    await prisma.scraping_logs.create({
      data: {
        sre_code: sreCode,
        sre_source: sreName,
        status: success ? 'success' : 'error',
        licitacoes_coletadas: licitacoesFound,
        records_found: licitacoesFound,
        error_message: errorMessage || null,
        execution_time_ms: executionTimeMs,
        metadata: {
          timestamp: new Date().toISOString(),
          sre_code: sreCode
        }
      }
    });
  } catch (error: any) {
    console.error('Failed to log scraping activity:', error.message);
  }
}

/**
 * Save licitações to database
 */
async function saveLicitacoes(licitacoes: Licitacao[]): Promise<number> {
  if (licitacoes.length === 0) return 0;

  try {
    // Prepare licitacoes for insert
    const normalizedLicitacoes = licitacoes.map(lic => ({
      ...lic,
      valor_estimado: lic.valor_estimado || null
    }));

    const result = await prisma.licitacoes.createMany({
      data: normalizedLicitacoes as any,
      skipDuplicates: true
    });

    return result.count;
  } catch (error: any) {
    console.error('Failed to save licitações:', error.message);
    console.error('Error details:', error);
    return 0;
  }
}

// ===== SCRAPING OPERATIONS =====

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
      await updateSREStatusLocal(sre.codigo, false, 0);
      await logScrapingActivity(sre.codigo, sre.nome, false, 0, result.error, result.duration_ms);
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
    await updateSREStatusLocal(sre.codigo, result.success, result.licitacoes_found);
    await logScrapingActivity(sre.codigo, sre.nome, result.success, result.licitacoes_found, undefined, result.duration_ms);

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

    await updateSREStatusLocal(sre.codigo, false, 0);
    await logScrapingActivity(sre.codigo, sre.nome, false, 0, result.error, result.duration_ms);

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
