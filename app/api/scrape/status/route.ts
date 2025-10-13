import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma/client';

/**
 * API de Status do Scraping
 * GET /api/scrape/status - Retorna status de todas as SREs e logs recentes
 */
export async function GET(request: NextRequest) {
  try {
    // Buscar logs recentes (últimas 24h)
    const logs = await prisma.scraping_logs.findMany({
      where: {
        started_at: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      },
      orderBy: { started_at: 'desc' },
      take: 100
    });

    // Agrupar por SRE
    const sresMap = new Map<string, any>();
    
    // Lista de todas as 47 SREs
    const allSREs = [
      'sremetropolitanaa', 'sremetropolitanab', 'sremetropolitanac',
      'srealmenara', 'srearacuai', 'srebarbacena', 'srebarroso', 'srebomdespacho',
      'srebrazopolis', 'srcamanducaia', 'srcampoebelo', 'srcampos',
      'srecaracol', 'srecaratinga', 'srcaxambu', 'sreclaudia',
      'sreconceicao', 'srediamantina', 'sredivino', 'sredivino',
      'srefranciscopolis', 'sregovernadorvaladares', 'sreguanhaes', 'sreiguatu',
      'sreitajuba', 'srejaboticatubas', 'srejalapao', 'srejanaubaiba',
      'srejoaopinheiro', 'srejuatuba', 'srejuizdefora', 'sreleopoldina',
      'sreluz', 'sremantena', 'sremontalvania', 'sremonteacimoviana',
      'sremontesclaros', 'sremuriae', 'srenanuque', 'sreouvidor',
      'sreparacatu', 'srepassoquatro', 'srepatosdeminas', 'srepatrocinio',
      'srepiuipe', 'srepocos', 'srepontanova', 'srepouso',
      'sresabaraminas', 'sresantaamaro', 'sresantamariadositio',
      'sresaojoaodelrei', 'sresaosebastiao', 'sresetemde',
      'sresetelagoas', 'sresubira', 'sretaibinha', 'sreteofilo',
      'sretimoteo', 'sretuibas', 'sreuberlandia', 'sreuberaba',
      'sreubuai', 'sreunamai', 'sreunaipirapora', 'srevarginha'
    ];

    // Inicializar todas as SREs
    allSREs.forEach(sre => {
      sresMap.set(sre, {
        sre,
        status: 'idle',
        licitacoes_encontradas: 0,
        noticias_encontradas: 0,
        ultima_execucao: null,
        tempo_execucao: 0,
        progresso: 0
      });
    });

    // Atualizar com dados dos logs
    logs.forEach(log => {
      const sre = log.sre_source;
      if (!sre) return; // Skip null sources
      
      if (!sresMap.has(sre)) {
        sresMap.set(sre, {
          sre,
          status: 'idle',
          licitacoes_encontradas: 0,
          noticias_encontradas: 0,
          ultima_execucao: null,
          tempo_execucao: 0,
          progresso: 0
        });
      }

      const sreData = sresMap.get(sre);
      if (!sreData) return; // Should not happen, but TypeScript safety
      
      if (log.status === 'running') {
        sreData.status = 'running';
        sreData.progresso = Math.round((log.licitacoes_coletadas || 0) / Math.max(log.records_found || 1, 1) * 100);
      } else if (log.status === 'completed') {
        sreData.status = 'success';
        sreData.licitacoes_encontradas = log.licitacoes_coletadas || 0;
        sreData.progresso = 100;
      } else if (log.status === 'failed') {
        sreData.status = 'error';
        sreData.erro = log.error_message || 'Erro desconhecido';
      }

      if (!sreData.ultima_execucao || new Date(log.started_at) > new Date(sreData.ultima_execucao)) {
        sreData.ultima_execucao = log.started_at.toISOString();
        sreData.tempo_execucao = Math.round((log.execution_time_ms || 0) / 1000);
      }
    });

    // Calcular estatísticas
    const stats = {
      total_execucoes: logs.length,
      sucesso: logs.filter(l => l.status === 'completed').length,
      erros: logs.filter(l => l.status === 'failed').length,
      licitacoes_total: logs.reduce((sum, l) => sum + (l.licitacoes_coletadas || 0), 0),
      noticias_total: 0, // TODO: Implementar contagem de notícias
      tempo_medio: logs.filter(l => l.execution_time_ms).length > 0
        ? Math.round(
            logs
              .filter(l => l.execution_time_ms)
              .reduce((sum, l) => sum + ((l.execution_time_ms || 0) / 1000), 0) /
            logs.filter(l => l.execution_time_ms).length
          )
        : 0
    };

    // Logs recentes formatados
    const recentLogs = logs.slice(0, 20).map(log => ({
      timestamp: new Date(log.started_at).toLocaleTimeString('pt-BR'),
      sre: log.sre_source,
      tipo: log.status === 'completed' ? 'success' : log.status === 'failed' ? 'error' : 'info',
      mensagem: log.status === 'completed' 
        ? `Scraping completo - ${log.licitacoes_coletadas} itens processados` 
        : log.status === 'failed'
        ? `Erro: ${log.error_message}`
        : 'Scraping em andamento...'
    }));

    return NextResponse.json({
      success: true,
      sres: Array.from(sresMap.values()),
      stats,
      recent_logs: recentLogs,
      is_running: Array.from(sresMap.values()).some(s => s.status === 'running')
    });

  } catch (error) {
    console.error('Erro ao buscar status:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar status do scraping' },
      { status: 500 }
    );
  }
}
