import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Status global da automação (em produção, usar Redis ou banco)
let scrapingAtivo = false;
let processamentoAtivo = false;
let ultimoScraping: Date | null = null;
let ultimoProcessamento: Date | null = null;

export async function GET() {
  try {
    // Buscar estatísticas do banco
    const total = await prisma.licitacoes.count();
    const processados = await prisma.licitacoes.count({
      where: { processado_ia: true },
    });
    const pendentes = total - processados;
    const taxa_sucesso = total > 0 ? (processados / total) * 100 : 0;

    return NextResponse.json({
      scraping_ativo: scrapingAtivo,
      processamento_ativo: processamentoAtivo,
      ultimo_scraping: ultimoScraping,
      ultimo_processamento: ultimoProcessamento,
      stats: {
        total,
        processados,
        pendentes,
        taxa_sucesso,
        tempo_medio: 2.5, // Estimativa
      },
    });
  } catch (error) {
    console.error('Erro ao buscar status:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar status' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Atualizar status (chamado pelos workers)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    if (body.scraping_ativo !== undefined) {
      scrapingAtivo = body.scraping_ativo;
      if (body.scraping_ativo === false) {
        ultimoScraping = new Date();
      }
    }
    
    if (body.processamento_ativo !== undefined) {
      processamentoAtivo = body.processamento_ativo;
      if (body.processamento_ativo === false) {
        ultimoProcessamento = new Date();
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar status' },
      { status: 500 }
    );
  }
}

// Exportar para uso em outros módulos
export function setScrapingStatus(ativo: boolean) {
  scrapingAtivo = ativo;
  if (!ativo) ultimoScraping = new Date();
}

export function setProcessamentoStatus(ativo: boolean) {
  processamentoAtivo = ativo;
  if (!ativo) ultimoProcessamento = new Date();
}
