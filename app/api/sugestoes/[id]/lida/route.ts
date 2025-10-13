import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma/client';
import { getUserId } from '@/lib/tracking/user-activity';

/**
 * API de Marcar Sugestão como Lida
 * POST /api/sugestoes/[id]/lida - Marca sugestão como lida para o usuário
 */

type RouteParams = {
  params: {
    id: string;
  };
};

export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params;
    const userId = await getUserId(request);

    // Verificar se já existe registro de leitura
    const existente = await prisma.user_activity.findFirst({
      where: {
        user_id: userId,
        tipo_acesso: 'sugestao_lida',
        recurso_id: id
      }
    });

    if (existente) {
      return NextResponse.json({
        success: true,
        message: 'Sugestão já marcada como lida',
        already_read: true
      });
    }

    // Criar registro de leitura
    await prisma.user_activity.create({
      data: {
        user_id: userId,
        tipo_acesso: 'sugestao_lida',
        recurso_id: id,
        accessed_at: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Sugestão marcada como lida',
      already_read: false
    });

  } catch (error) {
    console.error('Erro ao marcar sugestão como lida:', error);
    return NextResponse.json(
      { error: 'Erro ao processar solicitação' },
      { status: 500 }
    );
  }
}

// GET para verificar se sugestão foi lida
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params;
    const userId = await getUserId(request);

    const lida = await prisma.user_activity.findFirst({
      where: {
        user_id: userId,
        tipo_acesso: 'sugestao_lida',
        recurso_id: id
      }
    });

    return NextResponse.json({
      success: true,
      lida: !!lida,
      timestamp: lida?.accessed_at
    });

  } catch (error) {
    console.error('Erro ao verificar status de leitura:', error);
    return NextResponse.json(
      { error: 'Erro ao processar solicitação' },
      { status: 500 }
    );
  }
}
