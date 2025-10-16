import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';

// GET - Buscar SRE específica
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { data, error } = await supabaseAdmin
      .from('sres')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    if (!data) {
      return NextResponse.json(
        { error: 'SRE não encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro ao buscar SRE:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar SRE' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar SRE
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const { data, error } = await supabaseAdmin
      .from('sres')
      .update({
        codigo: body.codigo,
        nome: body.nome,
        municipio: body.municipio || null,
        url_base: body.url_base,
        url_licitacoes: body.url_licitacoes,
        urls_adicionais: body.urls_adicionais || [],
        tipo_cms: body.tipo_cms || null,
        ativo: body.ativo ?? true
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return NextResponse.json(
        { error: 'SRE não encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Erro ao atualizar SRE:', error);
    
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'Código de SRE já existe' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Erro ao atualizar SRE' },
      { status: 500 }
    );
  }
}

// DELETE - Excluir SRE
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Verificar se há licitações vinculadas
    const { count } = await supabaseAdmin
      .from('licitacoes')
      .select('id', { count: 'exact', head: true })
      .eq('sre_code', id);

    if (count && count > 0) {
      return NextResponse.json(
        { error: `Não é possível excluir. Existem ${count} licitações vinculadas a esta SRE.` },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from('sres')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir SRE:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir SRE' },
      { status: 500 }
    );
  }
}
