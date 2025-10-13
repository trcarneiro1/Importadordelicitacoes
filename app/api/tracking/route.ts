import { NextRequest, NextResponse } from 'next/server';
import { trackUserActivity, getUserId, getSessionId } from '@/lib/tracking/user-activity';
import { supabaseAdmin } from '@/lib/supabase/client';

/**
 * API endpoint para rastreamento de atividades do usuário
 * 
 * POST /api/tracking
 * Body: {
 *   tipo_acesso: string,
 *   recurso_id?: string,
 *   url_acessada?: string,
 *   categoria_acessada?: string,
 *   sre_acessada?: string,
 *   valor_licitacao?: number,
 *   tempo_permanencia_seg?: number
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tipo_acesso, recurso_id, url_acessada } = body;
    
    // Validar tipo_acesso
    if (!tipo_acesso) {
      return NextResponse.json(
        { error: 'tipo_acesso é obrigatório' },
        { status: 400 }
      );
    }
    
    // Se for acesso a detalhes, buscar dados adicionais
    let categoria_acessada: string | undefined;
    let sre_acessada: string | undefined;
    let valor_licitacao: number | undefined;
    
    if (tipo_acesso === 'licitacao_detalhes' && recurso_id) {
      // Buscar dados da licitação
      const { data: licitacao } = await supabaseAdmin
        .from('licitacoes')
        .select('categoria_principal, sre_source, valor_estimado')
        .eq('id', recurso_id)
        .single();
      
      if (licitacao) {
        categoria_acessada = licitacao.categoria_principal || undefined;
        sre_acessada = licitacao.sre_source || undefined;
        valor_licitacao = licitacao.valor_estimado ? parseFloat(licitacao.valor_estimado.toString()) : undefined;
      }
    } else if (tipo_acesso === 'noticia_detalhes' && recurso_id) {
      // Buscar dados da notícia
      const { data: noticia } = await supabaseAdmin
        .from('noticias')
        .select('categoria_ia, sre_source')
        .eq('id', recurso_id)
        .single();
      
      if (noticia) {
        categoria_acessada = noticia.categoria_ia || undefined;
        sre_acessada = noticia.sre_source || undefined;
      }
    }
    
    // Rastrear atividade
    await trackUserActivity(request, {
      tipo_acesso,
      recurso_id,
      pagina_url: url_acessada,
      categoria_acessada,
      sre_acessada,
      valor_licitacao,
      tempo_permanencia_seg: body.tempo_permanencia_seg
    });
    
    return NextResponse.json({ 
      success: true,
      message: 'Atividade registrada com sucesso'
    });
    
  } catch (error) {
    console.error('Erro ao rastrear atividade:', error);
    
    // Retornar sucesso mesmo com erro para não bloquear o usuário
    return NextResponse.json({ 
      success: true,
      message: 'Tracking failed but request continues'
    });
  }
}

/**
 * GET /api/tracking
 * Retorna estatísticas de tracking para debug (apenas em desenvolvimento)
 */
export async function GET(request: NextRequest) {
  // Apenas em desenvolvimento
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Endpoint disponível apenas em desenvolvimento' },
      { status: 403 }
    );
  }
  
  try {
    const userId = getUserId(request);
    const sessionId = getSessionId(request);
    
    return NextResponse.json({
      user_id: userId,
      session_id: sessionId,
      message: 'Use Supabase Dashboard para ver atividades'
    });
    
  } catch (error) {
    console.error('Erro ao buscar estatísticas de tracking:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar estatísticas' },
      { status: 500 }
    );
  }
}
