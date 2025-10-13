/**
 * AUTOMAÇÃO DIÁRIA - Script Completo
 * 
 * Executa 1x por dia:
 * 1. Scraping de todos os 47 SREs
 * 2. Processamento IA imediato de novas licitações
 * 3. Limpeza de dados antigos
 * 4. Geração de relatório
 * 
 * Uso: npx tsx scripts/daily-automation.ts
 * Cron: 0 3 * * * (03:00 todos os dias)
 */

import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { PrismaClient } from '@prisma/client';
import { parseListaLicitacoes, parseIndividualLicitacao } from '../lib/scrapers/enhanced-parser';

config({ path: '.env.local' });

const prisma = new PrismaClient();

// Função simples para processar com IA
async function processarComIA(licitacaoId: string) {
  try {
    // Chamar API de processamento IA
    const response = await fetch(`http://localhost:3001/api/process-ia`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ licitacaoId }),
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}

interface AutomationStats {
  inicio: Date;
  fim?: Date;
  sres_processados: number;
  licitacoes_encontradas: number;
  licitacoes_novas: number;
  licitacoes_ia_processadas: number;
  erros: number;
}

async function dailyAutomation() {
  const stats: AutomationStats = {
    inicio: new Date(),
    sres_processados: 0,
    licitacoes_encontradas: 0,
    licitacoes_novas: 0,
    licitacoes_ia_processadas: 0,
    erros: 0,
  };

  console.log(`
╔════════════════════════════════════════════════════════════╗
║           AUTOMACAO DIARIA - Importador de Licitacoes      ║
║           Iniciado em: ${stats.inicio.toLocaleString('pt-BR')}     ║
╚════════════════════════════════════════════════════════════╝
`);

  try {
    // 1. CARREGAR LISTA DE SREs
    console.log('\n📋 ETAPA 1: Carregando lista de SREs...');
    const sresContent = readFileSync('SREs.txt', 'utf-8');
    const sres = sresContent.split('\n').filter(line => line.trim());
    console.log(`   Encontrados ${sres.length} SREs para processar\n`);

    // 2. SCRAPING DE CADA SRE
    console.log('🔍 ETAPA 2: Scraping de licitações...\n');
    
    for (let i = 0; i < sres.length; i++) {
      const sreBase = sres[i].trim();
      const sreUrl = sreBase.endsWith('/') ? `${sreBase}licitacoes` : `${sreBase}/licitacoes`;
      
      console.log(`[${i + 1}/${sres.length}] Processando: ${sreUrl}`);
      
      try {
        // Buscar lista de licitações
        const urls = await parseListaLicitacoes(sreUrl);
        stats.licitacoes_encontradas += urls.length;
        
        console.log(`   ✅ ${urls.length} licitações encontradas`);

        // Processar cada licitação individual
        for (const url of urls) {
          try {
            const result = await parseIndividualLicitacao(url);
            
            if (!result.success || !result.licitacao) {
              continue;
            }

            const lic = result.licitacao;

            // Verificar se já existe
            const jaExiste = await prisma.licitacoes.findFirst({
              where: {
                OR: [
                  { numero_edital: lic.numero_edital },
                  { raw_data: { path: ['url_fonte'], equals: url } },
                ],
              },
            });

            if (jaExiste) {
              continue; // Pular duplicadas
            }

            // Salvar nova licitação
            const sreName = new URL(sreBase).hostname.replace('.educacao.mg.gov.br', '');

            const novaLicitacao = await prisma.licitacoes.create({
              data: {
                numero_edital: lic.numero_edital,
                modalidade: lic.modalidade || 'Aquisição Simplificada',
                objeto: lic.objeto,
                valor_estimado: lic.valor_estimado || null,
                data_publicacao: lic.data_publicacao || new Date(),
                data_abertura: lic.data_abertura || null,
                situacao: lic.situacao.toLowerCase(),
                sre_source: sreName,
                categoria_principal: 'Pendente',
                score_relevancia: 0,
                processado_ia: false,
                documentos: lic.documentos.length > 0 ? lic.documentos : undefined,
                raw_data: {
                  titulo: lic.titulo,
                  instituicao: lic.instituicao,
                  termo_compromisso: lic.termo_compromisso,
                  prazo_propostas: lic.prazo_propostas,
                  local_entrega: lic.local_entrega,
                  endereco: lic.endereco,
                  email_contato: lic.email_contato,
                  telefone: lic.telefone,
                  observacoes: lic.observacoes,
                  link_google_drive: lic.link_google_drive,
                  url_fonte: url,
                },
              },
            });

            stats.licitacoes_novas++;

            // PROCESSAMENTO IA IMEDIATO
            try {
              await processarComIA(novaLicitacao.id);
              stats.licitacoes_ia_processadas++;
              console.log(`   🧠 IA: ${lic.numero_edital} processada`);
            } catch (error) {
              console.log(`   ⚠️  IA: Erro ao processar ${lic.numero_edital}`);
            }

            // Delay entre licitações
            await new Promise(resolve => setTimeout(resolve, 1000));

          } catch (error) {
            stats.erros++;
          }
        }

        stats.sres_processados++;

        // Delay entre SREs (30 segundos)
        if (i < sres.length - 1) {
          console.log(`   ⏸️  Aguardando 30s antes do próximo SRE...\n`);
          await new Promise(resolve => setTimeout(resolve, 30000));
        }

      } catch (error) {
        console.log(`   ❌ Erro ao processar SRE: ${error instanceof Error ? error.message : 'Desconhecido'}`);
        stats.erros++;
      }
    }

    // 3. PROCESSAR LICITAÇÕES PENDENTES DE IA
    console.log('\n🧠 ETAPA 3: Processando licitações pendentes de IA...\n');
    
    const pendentes = await prisma.licitacoes.findMany({
      where: { processado_ia: false },
      take: 100, // Processar até 100 pendentes
    });

    console.log(`   Encontradas ${pendentes.length} licitações pendentes`);

    for (const lic of pendentes) {
      try {
        await processarComIA(lic.id);
        stats.licitacoes_ia_processadas++;
        console.log(`   ✅ Processada: ${lic.numero_edital}`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        stats.erros++;
      }
    }

    // 4. LIMPEZA DE DADOS ANTIGOS
    console.log('\n🗑️  ETAPA 4: Limpeza de dados antigos...\n');
    
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - 365); // 1 ano atrás

    const deletados = await prisma.licitacoes.deleteMany({
      where: {
        data_publicacao: {
          lt: dataLimite,
        },
        situacao: 'encerrado',
      },
    });

    console.log(`   🗑️  ${deletados.count} licitações antigas removidas\n`);

    // 5. RELATÓRIO FINAL
    stats.fim = new Date();
    const duracao = Math.floor((stats.fim.getTime() - stats.inicio.getTime()) / 1000);

    console.log(`
╔════════════════════════════════════════════════════════════╗
║                  RELATORIO FINAL                           ║
╚════════════════════════════════════════════════════════════╝

📊 Estatísticas:
   SREs processados:         ${stats.sres_processados}/${sres.length}
   Licitações encontradas:   ${stats.licitacoes_encontradas}
   Licitações novas:         ${stats.licitacoes_novas}
   Processadas por IA:       ${stats.licitacoes_ia_processadas}
   Erros:                    ${stats.erros}

⏱️  Tempo de execução:       ${Math.floor(duracao / 60)}min ${duracao % 60}s

✅ Conclusão:                ${stats.fim.toLocaleString('pt-BR')}
`);

    // 6. SALVAR LOG (futuro: salvar no banco)
    // await salvarLogExecucao(stats);

  } catch (error) {
    console.error('\n❌ ERRO FATAL:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar
dailyAutomation();
