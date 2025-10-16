import { prisma } from '@/lib/prisma/client';
import { addAILog, createAISession } from '@/lib/ai-logs';
import { enrichLicitacao } from '@/lib/agents/enrichment-agent';

export interface AIProcessingLogWithStats {
  session_id: string;
  total_licitacoes: number;
  licitacoes_processadas: number;
  licitacoes_com_erro: number;
  tempo_total_ms: number;
  tempo_medio_por_licita_ms: number;
}

/**
 * Processa todas as licitações pendentes com IA, com logging detalhado
 * Similar a scrapeAllSREsWithLogs mas para processamento IA
 */
export async function processAllLicitacoesWithLogs(
  sessionId: string
): Promise<AIProcessingLogWithStats> {
  const startTime = Date.now();
  let processadas = 0;
  let comErro = 0;

  try {
    // Log: Iniciando processamento
    addAILog(sessionId, {
      sre_name: 'Sistema',
      status: 'starting',
      message: 'Iniciando processamento de licitações com IA',
    });

    console.log(`\n🤖 Iniciando processamento IA - Session: ${sessionId}`);

    // Buscar licitações não processadas
    const licitacoesPendentes = await prisma.licitacoes.findMany({
      where: {
        processado_ia: false,
      },
      select: {
        id: true,
        numero_edital: true,
        objeto: true,
        raw_data: true,
        sre_source: true,
        regional: true,
        created_at: true,
      },
      take: 1000, // Limite de 1000 por sessão
    });

    const totalLicitacoes = licitacoesPendentes.length;

    addAILog(sessionId, {
      sre_name: 'Sistema',
      status: 'in_progress',
      message: `Encontradas ${totalLicitacoes} licitações pendentes para processamento`,
    });

    console.log(`📋 Total de licitações pendentes: ${totalLicitacoes}`);

    // Processar cada licitação
    for (let i = 0; i < licitacoesPendentes.length; i++) {
      const licita = licitacoesPendentes[i];
      const licIndex = i + 1;
      const licStartTime = Date.now();

      try {
        // Log: Começando processamento desta licitação
        addAILog(sessionId, {
          licitacao_id: licita.id,
          licitacao_titulo: licita.numero_edital || `Licitação ${licIndex}/${totalLicitacoes}`,
          sre_name: licita.regional || 'Desconhecida',
          status: 'processing',
          message: `[${licIndex}/${totalLicitacoes}] Processando licitação ${licita.numero_edital}`,
        });

        console.log(
          `\n[${licIndex}/${totalLicitacoes}] 🔄 Processando: ${licita.numero_edital}`
        );

        // Chamar o agente de enriquecimento
        const enriched = await enrichLicitacao(licita as any);

        if (enriched) {
          const processTime = Date.now() - licStartTime;

          // Salvar dados enriquecidos
          await prisma.licitacoes.update({
            where: { id: licita.id },
            data: {
              itens_detalhados: enriched as any,
              categoria_principal: enriched.categoria_principal,
              municipio_escola: enriched.municipio_escola,
              escola: enriched.escola,
              processado_ia: true,
              processado_ia_at: new Date(),
            },
          });

          // Log: Sucesso
          addAILog(sessionId, {
            licitacao_id: licita.id,
            licitacao_titulo: licita.numero_edital || `Licitação ${licIndex}/${totalLicitacoes}`,
            sre_name: licita.regional || 'Desconhecida',
            status: 'success',
            message: `✅ Processada com sucesso - ${enriched.categoria_principal || 'Sem categoria'}`,
            category: enriched.categoria_principal || undefined,
            priority: enriched.complexidade || undefined,
            confidence: enriched.score_relevancia || undefined,
            processing_time_ms: processTime,
          });

          processadas++;
          console.log(
            `✅ [${licIndex}/${totalLicitacoes}] Concluída em ${processTime}ms - Categoria: ${enriched.categoria_principal}`
          );

          // Pequeno delay para não sobrecarregar a API
          await new Promise((resolve) => setTimeout(resolve, 500));
        } else {
          throw new Error('Enriquecimento retornou dados vazios');
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        const processTime = Date.now() - licStartTime;

        // Log: Erro
        addAILog(sessionId, {
          licitacao_id: licita.id,
          licitacao_titulo: licita.numero_edital || `Licitação ${licIndex}/${totalLicitacoes}`,
          sre_name: licita.regional || 'Desconhecida',
          status: 'error',
          message: `❌ Erro ao processar`,
          error_message: errorMsg,
          processing_time_ms: processTime,
        });

        comErro++;
        console.error(
          `❌ [${licIndex}/${totalLicitacoes}] Erro: ${errorMsg}`
        );

        // Continuar com a próxima licitação
      }
    }

    const totalTime = Date.now() - startTime;
    const tempoMedio = totalLicitacoes > 0 ? totalTime / processadas : 0;

    // Log: Conclusão
    addAILog(sessionId, {
      sre_name: 'Sistema',
      status: 'completed',
      message: `✨ Processamento concluído - ${processadas} sucesso, ${comErro} erros em ${(totalTime / 1000).toFixed(1)}s`,
      processing_time_ms: totalTime,
    });

    console.log(`\n${'='.repeat(70)}`);
    console.log(`✨ Processamento IA Concluído`);
    console.log(`  ├─ Total de licitações: ${totalLicitacoes}`);
    console.log(`  ├─ Processadas com sucesso: ${processadas}`);
    console.log(`  ├─ Com erro: ${comErro}`);
    console.log(`  ├─ Tempo total: ${(totalTime / 1000).toFixed(1)}s`);
    console.log(`  └─ Tempo médio: ${tempoMedio.toFixed(0)}ms por licitação`);
    console.log(`${'='.repeat(70)}\n`);

    return {
      session_id: sessionId,
      total_licitacoes: totalLicitacoes,
      licitacoes_processadas: processadas,
      licitacoes_com_erro: comErro,
      tempo_total_ms: totalTime,
      tempo_medio_por_licita_ms: tempoMedio,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);

    addAILog(sessionId, {
      sre_name: 'Sistema',
      status: 'error',
      message: `❌ Erro fatal no processamento IA`,
      error_message: errorMsg,
    });

    console.error('Erro fatal no processamento IA:', errorMsg);
    throw error;
  }
}

/**
 * Processa apenas licitações de uma SRE específica
 */
export async function processLicitacoesBySREWithLogs(
  sessionId: string,
  sreCode: number
): Promise<AIProcessingLogWithStats> {
  const startTime = Date.now();
  let processadas = 0;
  let comErro = 0;

  try {
    addAILog(sessionId, {
      sre_name: `SRE #${sreCode}`,
      status: 'starting',
      message: `Iniciando processamento de licitações da SRE #${sreCode}`,
    });

    // Buscar licitações não processadas dessa SRE
    const licitacoesPendentes = await prisma.licitacoes.findMany({
      where: {
        processado_ia: false,
        sre_code: sreCode,
      },
      select: {
        id: true,
        numero_edital: true,
        objeto: true,
        raw_data: true,
        sre_source: true,
        regional: true,
        created_at: true,
      },
      take: 100,
    });

    const totalLicitacoes = licitacoesPendentes.length;

    addAILog(sessionId, {
      sre_name: `SRE #${sreCode}`,
      status: 'in_progress',
      message: `Encontradas ${totalLicitacoes} licitações da SRE para processamento`,
    });

    // Processar cada licitação
    for (let i = 0; i < licitacoesPendentes.length; i++) {
      const licita = licitacoesPendentes[i];
      const licStartTime = Date.now();

      try {
        const enriched = await enrichLicitacao(licita as any);

        if (enriched) {
          const processTime = Date.now() - licStartTime;

          await prisma.licitacoes.update({
            where: { id: licita.id },
            data: {
              itens_detalhados: enriched as any,
              categoria_principal: enriched.categoria_principal,
              municipio_escola: enriched.municipio_escola,
              escola: enriched.escola,
              processado_ia: true,
              processado_ia_at: new Date(),
            },
          });

          addAILog(sessionId, {
            licitacao_id: licita.id,
            licitacao_titulo: licita.numero_edital || 'Sem título',
            sre_name: `SRE #${sreCode}`,
            status: 'success',
            message: `✅ ${enriched.categoria_principal}`,
            category: enriched.categoria_principal || undefined,
            processing_time_ms: processTime,
          });

          processadas++;
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        const processTime = Date.now() - licStartTime;

        addAILog(sessionId, {
          licitacao_id: licita.id,
          licitacao_titulo: licita.numero_edital || 'Sem título',
          sre_name: `SRE #${sreCode}`,
          status: 'error',
          message: `❌ Erro: ${errorMsg}`,
          error_message: errorMsg,
          processing_time_ms: processTime,
        });

        comErro++;
      }
    }

    const totalTime = Date.now() - startTime;
    const tempoMedio = totalLicitacoes > 0 ? totalTime / processadas : 0;

    addAILog(sessionId, {
      sre_name: `SRE #${sreCode}`,
      status: 'completed',
      message: `✨ SRE concluída - ${processadas}/${totalLicitacoes} processadas`,
      processing_time_ms: totalTime,
    });

    return {
      session_id: sessionId,
      total_licitacoes: totalLicitacoes,
      licitacoes_processadas: processadas,
      licitacoes_com_erro: comErro,
      tempo_total_ms: totalTime,
      tempo_medio_por_licita_ms: tempoMedio,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);

    addAILog(sessionId, {
      sre_name: `SRE #${sreCode}`,
      status: 'error',
      message: `❌ Erro fatal`,
      error_message: errorMsg,
    });

    throw error;
  }
}
