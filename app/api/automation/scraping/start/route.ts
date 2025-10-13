import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST() {
  try {
    console.log('🚀 Iniciando scraping manual...');

    // Atualizar status
    await fetch('http://localhost:3001/api/automation/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scraping_ativo: true }),
    });

    // Executar scraping em background
    setTimeout(async () => {
      try {
        // Executar script de scraping
        const { stdout, stderr } = await execAsync(
          'npx tsx scripts/scrape-enhanced.ts https://sremetropa.educacao.mg.gov.br/licitacoes'
        );
        
        console.log('✅ Scraping concluído:', stdout);
        if (stderr) console.error('Warnings:', stderr);

        // Atualizar status para inativo
        await fetch('http://localhost:3001/api/automation/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scraping_ativo: false }),
        });

        // Iniciar processamento IA automático
        await fetch('http://localhost:3001/api/automation/ia/process', {
          method: 'POST',
        });

      } catch (error) {
        console.error('❌ Erro no scraping:', error);
        await fetch('http://localhost:3001/api/automation/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scraping_ativo: false }),
        });
      }
    }, 100);

    return NextResponse.json({ 
      success: true, 
      message: 'Scraping iniciado em background' 
    });

  } catch (error) {
    console.error('Erro ao iniciar scraping:', error);
    return NextResponse.json(
      { error: 'Erro ao iniciar scraping' },
      { status: 500 }
    );
  }
}
