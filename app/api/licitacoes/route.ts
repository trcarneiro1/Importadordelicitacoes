import { NextRequest, NextResponse } from 'next/server';
import { getAllLicitacoes, getLicitacoesBySRE } from '@/lib/supabase/queries';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const sre = searchParams.get('sre');

  try {
    let licitacoes;

    if (sre) {
      licitacoes = await getLicitacoesBySRE(sre);
    } else {
      licitacoes = await getAllLicitacoes();
    }

    return NextResponse.json({
      success: true,
      count: licitacoes.length,
      data: licitacoes,
    });
  } catch (error: any) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch licitações' },
      { status: 500 }
    );
  }
}
