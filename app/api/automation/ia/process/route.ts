import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Função para processar licitação com IA
async function processarLicitacaoComIA(licitacaoId: string) {
  try {
    // Buscar licitação
    const licitacao = await prisma.licitacoes.findUnique({
      where: { id: licitacaoId },
    });

    if (!licitacao) {
      throw new Error('Licitação não encontrada');
    }

    // Categorizar baseado no objeto
    const categorias = {
      'obras': ['construção', 'reforma', 'ampliação', 'adequação'],
      'serviços': ['limpeza', 'vigilância', 'manutenção', 'consultoria'],
      'materiais': ['aquisição', 'compra', 'fornecimento'],
      'tecnologia': ['computador', 'software', 'internet', 'sistema'],
      'alimentação': ['merenda', 'alimentação', 'refeição'],
    };

    let categoria = 'Outros';
    let score = 0.5;

    const objetoLower = (licitacao.objeto || '').toLowerCase();
    
    for (const [cat, palavras] of Object.entries(categorias)) {
      for (const palavra of palavras) {
        if (objetoLower.includes(palavra)) {
          categoria = cat.charAt(0).toUpperCase() + cat.slice(1);
          score = 0.75;
          break;
        }
      }
      if (score > 0.5) break;
    }

    // Atualizar licitação
    await prisma.licitacoes.update({
      where: { id: licitacaoId },
      data: {
        processado_ia: true,
        categoria_principal: categoria,
        score_relevancia: score,
      },
    });

    return true;
  } catch (error) {
    console.error('Erro ao processar com IA:', error);
    return false;
  }
}

export async function POST() {
  try {
    console.log('🧠 Iniciando processamento IA...');

    // Atualizar status
    await fetch('http://localhost:3001/api/automation/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ processamento_ativo: true }),
    });

    // Buscar licitações não processadas
    const licitacoesPendentes = await prisma.licitacoes.findMany({
      where: {
        processado_ia: false,
      },
      take: 50, // Processar 50 por vez
    });

    console.log(`📊 Encontradas ${licitacoesPendentes.length} licitações pendentes`);

    // Processar em background
    setTimeout(async () => {
      let processadas = 0;
      let erros = 0;

      for (const licitacao of licitacoesPendentes) {
        try {
          console.log(`  Processando: ${licitacao.numero_edital}...`);
          
          await processarLicitacaoComIA(licitacao.id);
          processadas++;
          
          // Delay entre requisições para não sobrecarregar API
          await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (error) {
          console.error(`  ❌ Erro ao processar ${licitacao.numero_edital}:`, error);
          erros++;
        }
      }

      console.log(`\n✅ Processamento concluído:`);
      console.log(`   Processadas: ${processadas}`);
      console.log(`   Erros: ${erros}`);

      // Atualizar status para inativo
      await fetch('http://localhost:3001/api/automation/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ processamento_ativo: false }),
      });

      await prisma.$disconnect();
    }, 100);

    return NextResponse.json({ 
      success: true, 
      message: `Processando ${licitacoesPendentes.length} licitações em background` 
    });

  } catch (error) {
    console.error('Erro ao iniciar processamento:', error);
    
    await fetch('http://localhost:3001/api/automation/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ processamento_ativo: false }),
    });

    return NextResponse.json(
      { error: 'Erro ao iniciar processamento' },
      { status: 500 }
    );
  }
}
