/**
 * Enrichment Agent - Agente de Enriquecimento com IA
 * 
 * Processa licitações brutas e extrai dados estruturados usando LLM:
 * - Escola beneficiada
 * - Município da escola
 * - Categorias e itens
 * - Score de relevância para fornecedores
 * - Resumo executivo
 */

import { prisma } from '../prisma/client';
import { getOpenRouterClient } from '../openrouter/client';

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

// Type for licitacao from database
type Licitacao = {
  id: string;
  objeto: string | null;
  raw_data: JsonValue;
  numero_edital: string | null;
  modalidade: string | null;
  regional: string | null;
  sre_source: string | null;
  created_at: Date;
};

// ===== TIPOS =====

interface EnrichedData {
  escola: string | null;
  municipio_escola: string | null;
  categoria_principal: string | null;
  categorias_secundarias: string[];
  itens_principais: string[];
  palavras_chave: string[];
  fornecedor_tipo: string | null;
  score_relevancia: number;
  resumo_executivo: string | null;
  complexidade: string | null;
  itens_detalhados: {
    categoria: string;
    descricao: string;
    quantidade?: string;
    unidade?: string;
  }[] | null;
  contato_responsavel: string | null;
  contato_email: string | null;
  contato_telefone: string | null;
}

interface AIResponse {
  escola: string;
  municipio_escola: string;
  categoria_principal: string;
  categorias_secundarias: string[];
  itens_principais: string[];
  palavras_chave: string[];
  fornecedor_tipo: string;
  score_relevancia: number;
  resumo_executivo: string;
  complexidade: string;
  itens_detalhados?: Array<{
    categoria: string;
    descricao: string;
    quantidade?: string;
    unidade?: string;
  }>;
  contato_responsavel?: string;
  contato_email?: string;
  contato_telefone?: string;
}

// ===== PROMPT ENGINEERING =====

function buildEnrichmentPrompt(licitacao: Licitacao): string {
  const objeto = licitacao.objeto || '';
  const rawText = (licitacao.raw_data as any)?.text || '';
  const numero = licitacao.numero_edital || 'Não informado';
  const modalidade = licitacao.modalidade || 'Não informado';
  const sre = licitacao.regional || licitacao.sre_source || '';

  return `
Você é um especialista em análise de licitações públicas brasileiras. Analise esta licitação do setor educacional de Minas Gerais e extraia dados estruturados.

DADOS DA LICITAÇÃO:
- Número: ${numero}
- Modalidade: ${modalidade}
- Órgão: ${sre}
- Objeto: ${objeto}
- Texto adicional: ${rawText.substring(0, 2000)}

INSTRUÇÕES:
1. Identifique a escola beneficiada (se houver)
2. Determine o município da escola (não confundir com município da SRE)
3. Classifique em categorias (alimentação, limpeza, materiais, obras, etc)
4. Extraia os principais itens/produtos a serem fornecidos
5. Avalie o score de relevância (0-100) considerando:
   - Valor do contrato
   - Clareza do edital
   - Frequência de licitações similares
   - Facilidade de fornecimento
6. Determine o tipo de fornecedor ideal (MEI, ME, EPP, Grande)
7. Avalie a complexidade (baixa/media/alta)
8. Crie um resumo executivo de 2-3 linhas
9. Extraia contatos se disponíveis

CATEGORIAS VÁLIDAS:
- alimentacao (merenda escolar, alimentos)
- limpeza (produtos de limpeza, higiene)
- materiais_escolares (cadernos, canetas, papel)
- materiais_escritorio (toner, papelaria administrativa)
- uniformes (roupas, calçados escolares)
- equipamentos (computadores, mobiliário)
- servicos_terceirizados (limpeza, vigilância, transporte)
- obras (reformas, construções)
- tecnologia (software, hardware, internet)
- manutencao (reparos, manutenção predial)
- outros

TIPO DE FORNECEDOR:
- MEI: Microempreendedor Individual (até R$ 81.000/ano)
- ME: Microempresa (até R$ 360.000/ano)
- EPP: Empresa de Pequeno Porte (até R$ 4.800.000/ano)
- Grande: Empresa grande ou consórcio

COMPLEXIDADE:
- baixa: Produto simples, entrega única, sem instalação
- media: Produtos múltiplos, entrega parcelada ou com serviço
- alta: Obras, serviços complexos, longo prazo

RETORNE JSON VÁLIDO no seguinte formato (sem comentários):
{
  "escola": "Nome completo da escola ou null",
  "municipio_escola": "Nome do município da escola ou null",
  "categoria_principal": "uma das categorias válidas",
  "categorias_secundarias": ["categoria2", "categoria3"],
  "itens_principais": ["item1", "item2", "item3"],
  "palavras_chave": ["palavra1", "palavra2", "palavra3", "palavra4"],
  "fornecedor_tipo": "MEI|ME|EPP|Grande",
  "score_relevancia": 75,
  "resumo_executivo": "Resumo objetivo em 2-3 linhas explicando o que será fornecido",
  "complexidade": "baixa|media|alta",
  "itens_detalhados": [
    {
      "categoria": "alimentacao",
      "descricao": "Arroz tipo 1",
      "quantidade": "500",
      "unidade": "kg"
    }
  ],
  "contato_responsavel": "Nome do responsável ou null",
  "contato_email": "email@exemplo.com ou null",
  "contato_telefone": "(31) 9999-9999 ou null"
}

IMPORTANTE:
- Sempre retorne JSON válido
- Use null para campos não encontrados
- Score entre 0-100 (seja realista)
- Palavras-chave devem ser relevantes para busca
- Itens principais: máximo 5 itens mais importantes
`;
}

// ===== FUNÇÕES PRINCIPAIS =====

/**
 * Enriquece uma única licitação com IA
 */
export async function enrichLicitacao(licitacao: Licitacao): Promise<EnrichedData> {
  const openrouter = getOpenRouterClient();

  try {
    console.log(`[Enrichment] Processing licitacao ${licitacao.id}...`);

    const prompt = buildEnrichmentPrompt(licitacao);
    
    const response = await openrouter.completeJSON<AIResponse>(prompt, {
      temperature: 0.3,
      max_tokens: 2000
    });

    // Normalizar dados
    const enrichedData: EnrichedData = {
      escola: response.escola || null,
      municipio_escola: response.municipio_escola || null,
      categoria_principal: response.categoria_principal || null,
      categorias_secundarias: response.categorias_secundarias || [],
      itens_principais: response.itens_principais || [],
      palavras_chave: response.palavras_chave || [],
      fornecedor_tipo: response.fornecedor_tipo || null,
      score_relevancia: Math.min(100, Math.max(0, response.score_relevancia || 50)),
      resumo_executivo: response.resumo_executivo || null,
      complexidade: response.complexidade || null,
      itens_detalhados: response.itens_detalhados || null,
      contato_responsavel: response.contato_responsavel || null,
      contato_email: response.contato_email || null,
      contato_telefone: response.contato_telefone || null
    };

    console.log(`[Enrichment] ✅ Processed: ${enrichedData.escola || 'N/A'} - ${enrichedData.categoria_principal}`);

    return enrichedData;

  } catch (error: any) {
    console.error(`[Enrichment] ❌ Error processing licitacao ${licitacao.id}:`, error.message);
    
    // Retornar dados vazios em caso de erro
    return {
      escola: null,
      municipio_escola: null,
      categoria_principal: 'outros',
      categorias_secundarias: [],
      itens_principais: [],
      palavras_chave: [],
      fornecedor_tipo: null,
      score_relevancia: 0,
      resumo_executivo: null,
      complexidade: null,
      itens_detalhados: null,
      contato_responsavel: null,
      contato_email: null,
      contato_telefone: null
    };
  }
}

/**
 * Salva dados enriquecidos no banco
 */
export async function saveLicitacaoEnriquecida(
  id: string,
  enrichedData: EnrichedData
): Promise<void> {
  try {
    // Prepare update data, handling JSON fields properly
    const updateData: any = {
      escola: enrichedData.escola,
      municipio_escola: enrichedData.municipio_escola,
      categoria_principal: enrichedData.categoria_principal,
      categorias_secundarias: enrichedData.categorias_secundarias,
      itens_principais: enrichedData.itens_principais,
      palavras_chave: enrichedData.palavras_chave,
      fornecedor_tipo: enrichedData.fornecedor_tipo,
      score_relevancia: enrichedData.score_relevancia,
      resumo_executivo: enrichedData.resumo_executivo,
      complexidade: enrichedData.complexidade,
      contato_responsavel: enrichedData.contato_responsavel,
      contato_email: enrichedData.contato_email,
      contato_telefone: enrichedData.contato_telefone,
      processado_ia: true,
      processado_ia_at: new Date()
    };

    // Handle JSON field - only set if not null
    if (enrichedData.itens_detalhados !== null) {
      updateData.itens_detalhados = enrichedData.itens_detalhados;
    }

    await prisma.licitacoes.update({
      where: { id },
      data: updateData
    });

    console.log(`[Enrichment] 💾 Saved enriched data for ${id}`);
  } catch (error: any) {
    console.error(`[Enrichment] ❌ Error saving enriched data:`, error.message);
    throw error;
  }
}

/**
 * Processa licitações pendentes em batch
 */
export async function processLicitacoesPendentes(limit: number = 50): Promise<{
  processed: number;
  success: number;
  failed: number;
  results: Array<{
    id: string;
    success: boolean;
    escola?: string;
    categoria?: string;
    error?: string;
  }>;
}> {
  console.log(`[Enrichment] 🚀 Starting batch processing (limit: ${limit})...`);

  // Buscar licitações pendentes
  const licitacoes = await prisma.licitacoes.findMany({
    where: {
      processado_ia: false,
      objeto: { not: null }
    },
    orderBy: { created_at: 'desc' },
    take: limit
  });

  console.log(`[Enrichment] Found ${licitacoes.length} pending licitacoes`);

  const results: Array<{
    id: string;
    success: boolean;
    escola?: string;
    categoria?: string;
    error?: string;
  }> = [];

  let success = 0;
  let failed = 0;

  for (const licitacao of licitacoes) {
    try {
      const enrichedData = await enrichLicitacao(licitacao as Licitacao);
      await saveLicitacaoEnriquecida(licitacao.id, enrichedData);

      results.push({
        id: licitacao.id,
        success: true,
        escola: enrichedData.escola || undefined,
        categoria: enrichedData.categoria_principal || undefined
      });

      success++;

      // Rate limiting: pequena pausa entre requests
      await new Promise(resolve => setTimeout(resolve, 500));

    } catch (error: any) {
      results.push({
        id: licitacao.id,
        success: false,
        error: error.message
      });
      failed++;
    }
  }

  console.log(`[Enrichment] ✨ Batch complete: ${success} success, ${failed} failed`);

  return {
    processed: licitacoes.length,
    success,
    failed,
    results
  };
}

/**
 * Busca licitações não processadas
 */
export async function getLicitacoesPendentes(limit: number = 50) {
  return prisma.licitacoes.findMany({
    where: {
      processado_ia: false,
      objeto: { not: null }
    },
    orderBy: { created_at: 'desc' },
    take: limit,
    select: {
      id: true,
      numero_edital: true,
      objeto: true,
      sre_source: true,
      created_at: true
    }
  });
}

/**
 * Estatísticas de processamento
 */
export async function getEnrichmentStats() {
  const total = await prisma.licitacoes.count();
  const processadas = await prisma.licitacoes.count({
    where: { processado_ia: true }
  });
  const pendentes = await prisma.licitacoes.count({
    where: { processado_ia: false, objeto: { not: null } }
  });

  const porCategoria = await prisma.licitacoes.groupBy({
    by: ['categoria_principal'],
    where: { processado_ia: true },
    _count: true
  });

  return {
    total,
    processadas,
    pendentes,
    taxa_processamento: total > 0 ? Math.round((processadas / total) * 100) : 0,
    por_categoria: porCategoria.map((c: any) => ({
      categoria: c.categoria_principal,
      count: c._count
    }))
  };
}
