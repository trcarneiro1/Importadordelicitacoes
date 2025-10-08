/**
 * Debug HTML Structure
 * Fetches and analyzes HTML from SRE to debug parser
 * GET /api/debug-html?url=https://srebarbacena.educacao.mg.gov.br/licitacoes
 */

import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const url = searchParams.get('url');

    if (!url) {
      return NextResponse.json({
        error: 'Missing url parameter',
        usage: 'GET /api/debug-html?url=https://srebarbacena.educacao.mg.gov.br/licitacoes'
      }, { status: 400 });
    }

    console.log(`🔍 Fetching HTML from: ${url}`);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      return NextResponse.json({
        error: `HTTP ${response.status}: ${response.statusText}`,
        url
      }, { status: response.status });
    }

    const html = await response.text();
    const $ = cheerio.load(html) as any as cheerio.CheerioAPI;

    // Analyze structure
    const analysis = {
      url,
      html_length: html.length,
      title: $('title').text().trim(),
      
      // Joomla specific selectors
      joomla_articles: $('.item-page').length,
      joomla_items: $('.item').length,
      article_tags: $('article').length,
      
      // Common licitação containers
      tables: $('table').length,
      lists: $('ul li').length,
      divs_with_class: $('[class*="licit"]').length,
      
      // Links and documents
      pdf_links: $('a[href*=".pdf"]').length,
      doc_links: $('a[href*=".doc"]').length,
      external_links: $('a[href^="http"]').length,
      
      // Text content samples
      h1_titles: $('h1').map((i, el) => $(el).text().trim()).get(),
      h2_titles: $('h2').map((i, el) => $(el).text().trim()).get(),
      
      // Find potential licitação containers
      potential_containers: []
    };

    // Look for common patterns
    const potentialSelectors = [
      '.item-page',
      '.item',
      'article',
      '.licitacao',
      '.edital',
      '.compras',
      'table tr',
      '.blog-featured',
      '.category-list'
    ];

    for (const selector of potentialSelectors) {
      const count = $(selector).length;
      if (count > 0) {
        const sample = $(selector).first();
        (analysis.potential_containers as any).push({
          selector,
          count,
          sample_html: sample.html()?.substring(0, 500),
          sample_text: sample.text().trim().substring(0, 200)
        });
      }
    }

    // Get first 1000 chars of body for manual inspection
    const bodyText = $('body').text().trim().substring(0, 1000);

    return NextResponse.json({
      success: true,
      analysis,
      body_preview: bodyText,
      suggestions: [
        'Check potential_containers to see which selector has content',
        'Look for patterns in sample_html',
        'Check if site requires JavaScript (length < 5000 might indicate redirect)',
        'Verify if URL is correct (might need /index.php prefix)'
      ]
    }, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      }
    });

  } catch (error: any) {
    console.error('Debug HTML error:', error);
    return NextResponse.json({
      error: error.message
    }, { status: 500 });
  }
}
