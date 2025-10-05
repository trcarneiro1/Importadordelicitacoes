import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';

/**
 * GET /api/licitacoes/[id]
 * Retorna dados completos de uma licitação específica
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'ID não fornecido' },
        { status: 400 }
      );
    }

    // Buscar licitação no banco
    const { data, error } = await supabaseAdmin
      .from('licitacoes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Erro ao buscar licitação:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar licitação', details: error.message },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Licitação não encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      licitacao: data,
    });
  } catch (error: any) {
    console.error('Erro no endpoint:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
