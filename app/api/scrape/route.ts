import { NextRequest, NextResponse } from 'next/server';
import { scrapeSRE, scrapeMultipleSREs } from '@/lib/scrapers/sre-scraper';
import { SRE_URLS, getSREName } from '@/lib/scrapers/sre-urls';
import { insertLicitacoes, logScraping, updateScrapingLog } from '@/lib/supabase/queries';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const sre = searchParams.get('sre'); // Specific SRE to scrape
  const count = parseInt(searchParams.get('count') || '1'); // Number of SREs to scrape

  try {
    let results;

    if (sre) {
      // Scrape specific SRE
      const sreUrl = SRE_URLS.find(url => url.includes(sre));
      if (!sreUrl) {
        return NextResponse.json(
          { error: 'SRE not found' },
          { status: 404 }
        );
      }

      const log = await logScraping({
        sre_source: getSREName(sreUrl),
        status: 'in_progress',
      });

      const result = await scrapeSRE(sreUrl);

      // Save to database
      if (result.success && result.licitacoes.length > 0) {
        const licitacoesToInsert = result.licitacoes.map(l => ({
          ...l,
          sre_source: getSREName(sreUrl),
        }));

        await insertLicitacoes(licitacoesToInsert);
        
        await updateScrapingLog(log.id, {
          status: 'success',
          records_found: result.licitacoes.length,
          completed_at: new Date(),
        });
      } else {
        await updateScrapingLog(log.id, {
          status: 'error',
          error_message: result.error || 'No data found',
          completed_at: new Date(),
        });
      }

      results = [result];
    } else {
      // Scrape first N SREs
      const sresToScrape = SRE_URLS.slice(0, count);
      
      const logs = await Promise.all(
        sresToScrape.map(url =>
          logScraping({
            sre_source: getSREName(url),
            status: 'in_progress',
          })
        )
      );

      results = await scrapeMultipleSREs(sresToScrape);

      // Save results to database
      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        const log = logs[i];

        if (result.success && result.licitacoes.length > 0) {
          const licitacoesToInsert = result.licitacoes.map(l => ({
            ...l,
            sre_source: getSREName(sresToScrape[i]),
          }));

          await insertLicitacoes(licitacoesToInsert);
          
          await updateScrapingLog(log.id, {
            status: 'success',
            records_found: result.licitacoes.length,
            completed_at: new Date(),
          });
        } else {
          await updateScrapingLog(log.id, {
            status: 'error',
            error_message: result.error || 'No data found',
            completed_at: new Date(),
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      results,
      total_scraped: results.length,
      total_records: results.reduce((sum, r) => sum + r.licitacoes.length, 0),
    });
  } catch (error: any) {
    console.error('Scraping error:', error);
    return NextResponse.json(
      { error: error.message || 'Scraping failed' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sres } = body; // Array of SRE URLs to scrape

    if (!sres || !Array.isArray(sres)) {
      return NextResponse.json(
        { error: 'Invalid request: sres array required' },
        { status: 400 }
      );
    }

    const results = await scrapeMultipleSREs(sres);

    // Save to database
    for (let i = 0; i < results.length; i++) {
      const result = results[i];

      if (result.success && result.licitacoes.length > 0) {
        const licitacoesToInsert = result.licitacoes.map(l => ({
          ...l,
          sre_source: getSREName(sres[i]),
        }));

        await insertLicitacoes(licitacoesToInsert);
      }
    }

    return NextResponse.json({
      success: true,
      results,
      total_scraped: results.length,
      total_records: results.reduce((sum, r) => sum + r.licitacoes.length, 0),
    });
  } catch (error: any) {
    console.error('Scraping error:', error);
    return NextResponse.json(
      { error: error.message || 'Scraping failed' },
      { status: 500 }
    );
  }
}
