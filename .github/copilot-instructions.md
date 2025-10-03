# Importador de Licitações - AI Coding Agent Instructions

## Project Overview
This is a **bidding/procurement data importer** system targeting educational institutions in Minas Gerais, Brazil. The system is designed to collect and process public bidding (licitações) information from regional education departments (SREs - Superintendências Regionais de Ensino).

## Data Sources
- **SRE Endpoints**: `SREs.txt` contains 47 URLs for regional education department portals
- All URLs follow pattern: `https://sre{region}.educacao.mg.gov.br/`
- Regions include: metropolitana (A/B/C), interior cities (Almenara, Araçuaí, Barbacena, etc.)

## Tech Stack
- **Framework**: Next.js (React-based)
- **Runtime**: Node.js
- **Database**: PostgreSQL hosted on Supabase
- **Language**: JavaScript/TypeScript (recommended for type safety)
- **Web Scraping**: Consider Puppeteer (for dynamic content) or Cheerio (for static HTML)

## Architecture Context
**Current State**: Greenfield project - only data source configuration exists.

**Target Architecture**:
- **Next.js App**: 
  - API Routes (`/app/api/*` or `/pages/api/*`) for scraper endpoints and data queries
  - Server-side rendering for dashboard/admin interface
  - Server Actions or API routes to trigger scraping jobs
- **Scraper Module**: Node.js service to extract bidding data from 47 SRE portals
- **Supabase Integration**:
  - PostgreSQL database for storing licitação records
  - Use `@supabase/supabase-js` client
  - Consider Row Level Security (RLS) policies
  - Real-time subscriptions for live data updates (optional)
- **Data Normalization**: Transform varying SRE formats into unified schema

## Development Considerations

### Data Scraping Patterns
When implementing scrapers for SRE portals:
- Use **Puppeteer** if SRE sites require JavaScript rendering or have dynamic content
- Use **Cheerio** for simple HTML parsing (faster, lighter)
- Expect Portuguese language content and BR date formats (DD/MM/YYYY)
- Implement retry logic with exponential backoff for failed requests
- Respect robots.txt and implement rate limiting (government sites - 1-2 sec delays recommended)
- Consider different portal implementations across regions (test multiple SREs first)
- Store raw HTML snapshots for debugging and re-parsing

### Brazilian Public Procurement Context
- **Licitação**: Public bidding/procurement process
- Common bidding types: Pregão, Concorrência, Tomada de Preços
- Legal framework: Lei 8.666/93 (old) and Lei 14.133/21 (new)
- Data typically includes: edital number, object description, dates, budget values

### Key Data Points to Extract
- Bidding announcement number (número do edital)
- Publication date (data de publicação)
- Opening date (data de abertura)
- Description/object (objeto)
- Budget value (valor estimado)
- Category (modalidade)
- Bidding documents (editais/anexos)

## Supabase Database Schema (Recommended)
```sql
-- Table: licitacoes
CREATE TABLE licitacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sre_source VARCHAR(100) NOT NULL,  -- Which SRE portal
  numero_edital VARCHAR(50),
  modalidade VARCHAR(50),            -- Pregão, Concorrência, etc.
  objeto TEXT,
  valor_estimado DECIMAL(15,2),
  data_publicacao DATE,
  data_abertura TIMESTAMP,
  situacao VARCHAR(50),              -- Aberto, Encerrado, Suspenso
  documentos JSONB,                  -- Array of document URLs
  raw_data JSONB,                    -- Store original scraped data
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sre_source ON licitacoes(sre_source);
CREATE INDEX idx_data_publicacao ON licitacoes(data_publicacao DESC);
```

## Development Workflow

### Initial Setup
```bash
# Create Next.js app with TypeScript
npx create-next-app@latest importador-licitacoes --typescript --app --use-npm

# Install dependencies
npm install @supabase/supabase-js
npm install cheerio axios          # For static HTML scraping
npm install puppeteer              # Optional: for dynamic content
npm install date-fns               # For BR date parsing
```

### Environment Variables
Create `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key  # For server-side operations
```

### Project Structure (Recommended)
```
/app
  /api
    /scrape              # API route to trigger scraping
    /licitacoes          # API route to query data
  /dashboard             # Admin interface to view imported data
/lib
  /scrapers
    sre-scraper.ts       # Generic SRE scraper
    parsers.ts           # HTML parsing utilities
  /supabase
    client.ts            # Supabase client initialization
    queries.ts           # Database operations
  /utils
    date-parser.ts       # BR date format handling
SREs.txt                 # Data source list (existing)
```

### Key Implementation Patterns
1. **Error Handling**: Wrap scraper calls in try-catch, log failures per SRE to database
2. **Logging**: Use structured logging (e.g., `pino` or `winston`) to track scraping progress
3. **Rate Limiting**: Add 1-2 second delays between requests to same domain
4. **Incremental Updates**: Store last scrape timestamp per SRE, only fetch new data

## File References
- `SREs.txt`: Complete list of target URLs (47 SRE portals)
- Each line is a base URL; actual bidding pages may be at subpaths like `/licitacoes` or `/compras`

## Next Steps for Implementation
1. **Setup Next.js project** with TypeScript and Supabase integration
2. **Create Supabase tables** using the schema above
3. **Investigate SRE portal structures**: 
   - Manually visit 3-5 sample SREs from `SREs.txt`
   - Identify common URL patterns (e.g., `/licitacoes`, `/compras`, `/editais`)
   - Document differences in HTML structure across SREs
4. **Build proof-of-concept scraper** for 1-2 SREs before scaling to all 47
5. **Create API route** to trigger scraping jobs (e.g., `/api/scrape?sre=metropa`)
6. **Build dashboard** to visualize imported licitações data
7. **Add monitoring**: Track scraping success/failure rates per SRE

## Common Gotchas
- **URL Inconsistency**: One SRE URL missing trailing slash (`srepatrocinio.educacao.mg.gov.br`) - normalize in code
- **Authentication**: Some SRE portals may require login or CAPTCHA - handle gracefully
- **HTML Structure Variance**: Each SRE may use different CMS/templates - build flexible parsers
- **Rate Limits**: Government sites may throttle aggressive scraping - respect 429 responses
