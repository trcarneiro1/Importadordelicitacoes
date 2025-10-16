/**
 * DEPRECATED FILE
 * This file is no longer used. Use orchestrator.ts instead.
 * Keeping minimal stubs to avoid import errors.
 */

// Minimal stubs for backward compatibility only
interface ScrapingResult {
  sre_code: number;
  sre_name: string;
  success: boolean;
  licitacoes_found: number;
  error?: string;
  duration_ms: number;
  urls_scraped: number;
}

// Export empty function to satisfy any old imports
export async function scrapeAllSREs(): Promise<ScrapingResult[]> {
  console.warn('⚠️ orchestrator-old.ts is deprecated. Use orchestrator.ts instead.');
  return [];
}

