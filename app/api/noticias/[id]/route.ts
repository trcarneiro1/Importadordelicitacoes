import { NextRequest, NextResponse } from 'next/server';
import { getNoticiaById } from '@/lib/supabase/queries';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const noticia = await getNoticiaById(params.id);

    if (!noticia) {
      return NextResponse.json(
        { success: false, error: 'Notícia não encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      noticia,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Erro ao buscar notícia:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro ao buscar notícia',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}
