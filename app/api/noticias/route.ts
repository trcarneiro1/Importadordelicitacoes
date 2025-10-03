import { NextRequest, NextResponse } from 'next/server';
import { 
  getAllNoticias, 
  getNoticiasStats 
} from '@/lib/supabase/queries';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');

    // Buscar notícias
    const noticias = await getAllNoticias(limit);

    // Calcular estatísticas
    const stats = {
      total: noticias.length,
      alta_prioridade: noticias.filter(n => n.prioridade === 'alta').length,
      media_prioridade: noticias.filter(n => n.prioridade === 'media').length,
      baixa_prioridade: noticias.filter(n => n.prioridade === 'baixa').length,
      por_categoria: noticias.reduce((acc, n) => {
        acc[n.categoria_ia] = (acc[n.categoria_ia] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      por_sre: noticias.reduce((acc, n) => {
        acc[n.sre_source] = (acc[n.sre_source] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };

    return NextResponse.json({
      success: true,
      noticias,
      stats,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Erro ao buscar notícias:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro ao buscar notícias',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}
