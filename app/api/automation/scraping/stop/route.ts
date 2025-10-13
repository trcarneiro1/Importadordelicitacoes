import { NextResponse } from 'next/server';

export async function POST() {
  try {
    console.log('⏹️  Parando scraping...');

    // Atualizar status para inativo
    await fetch('http://localhost:3001/api/automation/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scraping_ativo: false }),
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Scraping parado' 
    });

  } catch (error) {
    console.error('Erro ao parar scraping:', error);
    return NextResponse.json(
      { error: 'Erro ao parar scraping' },
      { status: 500 }
    );
  }
}
