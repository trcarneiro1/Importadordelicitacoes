/**
 * API de Recomendações Personalizadas
 * 
 * Retorna notícias e licitações personalizadas baseadas no perfil do usuário
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { getUserProfile } from '@/lib/tracking/user-activity';

/**
 * GET /api/recomendacoes?tipo=noticias|licitacoes&limit=10
 * 
 * Retorna recomendações personalizadas baseadas no histórico do usuário
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tipo = searchParams.get('tipo') || 'noticias';
    const limit = parseInt(searchParams.get('limit') || '10');

    // Extrair user_id (IP hash)
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ip = forwarded?.split(',')[0] || realIp || 'unknown';
    const userId = `user_${ip.replace(/\./g, '_')}`;

    // Obter perfil do usuário
    const profile = await getUserProfile(userId);

    if (!profile || profile.total_acessos < 3) {
      // Usuário novo ou sem histórico suficiente - retornar conteúdo popular
      return await getPopularContent(tipo, limit);
    }

    // Retornar recomendações personalizadas
    if (tipo === 'noticias') {
      return await getPersonalizedNoticias(profile, limit);
    } else if (tipo === 'licitacoes') {
      return await getPersonalizedLicitacoes(profile, limit);
    } else {
      return NextResponse.json(
        { error: 'Tipo inválido. Use: noticias ou licitacoes' },
        { status: 400 }
      );
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao buscar recomendações';
    console.error('Erro na API de recomendações:', error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

/**
 * Buscar notícias personalizadas baseadas no perfil
 */
async function getPersonalizedNoticias(profile: any, limit: number) {
  try {
    let query = supabaseAdmin
      .from('noticias')
      .select('*')
      .order('data_publicacao', { ascending: false })
      .limit(limit * 2); // Buscar mais para filtrar

    // Filtrar por categorias favoritas se disponível
    if (profile.categorias_favoritas && profile.categorias_favoritas.length > 0) {
      query = query.in('categoria_ia', profile.categorias_favoritas);
    }

    // Filtrar por SREs favoritas se disponível
    if (profile.sres_favoritas && profile.sres_favoritas.length > 0) {
      query = query.in('sre_source', profile.sres_favoritas);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Ordenar por relevância e limitar
    const noticias = (data || [])
      .sort((a, b) => (b.relevancia || 0) - (a.relevancia || 0))
      .slice(0, limit);

    return NextResponse.json({
      noticias,
      perfil: {
        categorias_favoritas: profile.categorias_favoritas,
        sres_favoritas: profile.sres_favoritas,
        total_acessos: profile.total_acessos,
      },
      personalized: true,
    });
  } catch (error) {
    console.error('Erro ao buscar notícias personalizadas:', error);
    throw error;
  }
}

/**
 * Buscar licitações personalizadas baseadas no perfil
 */
async function getPersonalizedLicitacoes(profile: any, limit: number) {
  try {
    let query = supabaseAdmin
      .from('licitacoes')
      .select('*')
      .eq('processado_ia', true)
      .order('created_at', { ascending: false })
      .limit(limit * 2);

    // Filtrar por categorias favoritas
    if (profile.categorias_favoritas && profile.categorias_favoritas.length > 0) {
      query = query.in('categoria_principal', profile.categorias_favoritas);
    }

    // Filtrar por SREs favoritas
    if (profile.sres_favoritas && profile.sres_favoritas.length > 0) {
      query = query.in('sre_source', profile.sres_favoritas);
    }

    // Filtrar por faixa de valor se disponível
    if (profile.faixa_valor?.minimo && profile.faixa_valor?.maximo) {
      const margem = 0.5; // 50% de margem
      const valorMin = profile.faixa_valor.minimo * (1 - margem);
      const valorMax = profile.faixa_valor.maximo * (1 + margem);
      
      query = query
        .gte('valor_estimado', valorMin)
        .lte('valor_estimado', valorMax);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Ordenar por score de relevância
    const licitacoes = (data || [])
      .sort((a, b) => (b.score_relevancia || 0) - (a.score_relevancia || 0))
      .slice(0, limit);

    return NextResponse.json({
      licitacoes,
      perfil: {
        categorias_favoritas: profile.categorias_favoritas,
        sres_favoritas: profile.sres_favoritas,
        faixa_valor: profile.faixa_valor,
        total_acessos: profile.total_acessos,
      },
      personalized: true,
    });
  } catch (error) {
    console.error('Erro ao buscar licitações personalizadas:', error);
    throw error;
  }
}

/**
 * Buscar conteúdo popular para usuários novos
 */
async function getPopularContent(tipo: string, limit: number) {
  try {
    if (tipo === 'noticias') {
      const { data, error } = await supabaseAdmin
        .from('noticias')
        .select('*')
        .order('relevancia', { ascending: false })
        .order('data_publicacao', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return NextResponse.json({
        noticias: data || [],
        personalized: false,
        message: 'Conteúdo popular (sem histórico suficiente)',
      });
    } else {
      const { data, error } = await supabaseAdmin
        .from('licitacoes')
        .select('*')
        .eq('processado_ia', true)
        .order('score_relevancia', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return NextResponse.json({
        licitacoes: data || [],
        personalized: false,
        message: 'Conteúdo popular (sem histórico suficiente)',
      });
    }
  } catch (error) {
    console.error('Erro ao buscar conteúdo popular:', error);
    throw error;
  }
}
