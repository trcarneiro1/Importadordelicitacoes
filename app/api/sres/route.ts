import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';

// GET - Listar todas as SREs
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('sres')
      .select('*')
      .order('codigo', { ascending: true });

    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Erro ao buscar SREs:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar SREs' },
      { status: 500 }
    );
  }
}

// POST - Criar nova SRE
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { data, error } = await supabaseAdmin
      .from('sres')
      .insert([{
        codigo: body.codigo,
        nome: body.nome,
        municipio: body.municipio || null,
        url_base: body.url_base,
        url_licitacoes: body.url_licitacoes,
        urls_adicionais: body.urls_adicionais || [],
        tipo_cms: body.tipo_cms || null,
        ativo: body.ativo ?? true,
        total_coletas: 0,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    console.error('Erro ao criar SRE:', error);
    
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'Código de SRE já existe' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Erro ao criar SRE' },
      { status: 500 }
    );
  }
}
