// ===============================================
// Cliente OpenRouter para análise com LLMs
// ===============================================
// Integração com modelos: GPT-4, Claude, Gemini, etc
// ===============================================

interface OpenRouterResponse {
  id: string;
  model: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface AnaliseIA {
  categoria: string;
  subcategoria?: string;
  tags: string[];
  entidades: {
    datas_importantes?: string[];
    valores_financeiros?: string[];
    pessoas?: string[];
    instituicoes?: string[];
    locais?: string[];
    processos?: string[];
  };
  sentimento: 'positivo' | 'neutro' | 'negativo';
  prioridade: 'alta' | 'media' | 'baixa';
  relevancia: number;
  resumo: string;
  palavras_chave: string[];
  acoes_recomendadas: string[];
  justificativa?: string;
}

interface AnaliseSalva extends AnaliseIA {
  modelo: string;
  tokens_prompt: number;
  tokens_completion: number;
  tokens_total: number;
  custo_usd: number;
  tempo_processamento_ms: number;
}

export class OpenRouterClient {
  private apiKey: string;
  private baseUrl = 'https://openrouter.ai/api/v1';
  private defaultModel: string;
  private fallbackToLocal: boolean;

  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY || '';
    this.defaultModel = process.env.OPENROUTER_DEFAULT_MODEL || 'openai/gpt-4o-mini';
    this.fallbackToLocal = process.env.OPENROUTER_FALLBACK_TO_LOCAL !== 'false';
  }

  /**
   * Verifica se o cliente está configurado
   */
  isConfigured(): boolean {
    return this.apiKey.length > 0;
  }

  /**
   * Prompt otimizado para categorização de notícias das SREs
   */
  private buildPrompt(titulo: string, conteudo: string, sreSource: string): string {
    return `Você é um especialista em análise de documentos governamentais da área de educação em Minas Gerais.

Analise a seguinte notícia da ${sreSource.replace('.educacao.mg.gov.br', '').toUpperCase()} e retorne uma análise estruturada em JSON.

**NOTÍCIA:**
Título: ${titulo}
Conteúdo: ${conteudo.substring(0, 3000)} ${conteudo.length > 3000 ? '...' : ''}

**INSTRUÇÕES:**
1. Categorize em UMA das 8 categorias:
   - "Licitações e Compras" (pregões, licitações, compras)
   - "Processos Seletivos" (ATL, ATD, contratações temporárias)
   - "Editais de RH" (diretores, vice-diretores, especialistas)
   - "Avisos Administrativos" (suspensões, retificações, cancelamentos)
   - "Programas Educacionais" (projetos pedagógicos, capacitações)
   - "Eventos" (palestras, seminários, encontros)
   - "Resultados" (homologações, divulgações de resultados)
   - "Outros" (demais assuntos)

2. Extraia entidades importantes (datas, valores R$, pessoas, instituições, locais, números de processos/editais)

3. Analise sentimento (positivo/neutro/negativo)

4. Determine prioridade (alta/média/baixa) baseado em:
   - Alta: prazos urgentes, suspensões, resultados importantes
   - Média: processos em andamento, avisos gerais
   - Baixa: informações complementares

5. Calcule relevância (0-100) baseado em:
   - Impacto na comunidade escolar
   - Urgência temporal
   - Importância administrativa

6. Gere resumo objetivo (1-2 frases)

7. Extraia 5-8 palavras-chave relevantes

8. Sugira 2-4 ações recomendadas práticas

**FORMATO DE SAÍDA (JSON válido):**
{
  "categoria": "Processos Seletivos",
  "subcategoria": "ATL - Professor de Matemática",
  "tags": ["processo seletivo", "professor", "matemática", "temporário"],
  "entidades": {
    "datas_importantes": ["01/12/2025", "15/12/2025"],
    "valores_financeiros": ["R$ 3.500,00"],
    "pessoas": ["João Silva"],
    "instituicoes": ["E.E. João XXIII", "SRE Barbacena"],
    "locais": ["Barbacena", "Santos Dumont"],
    "processos": ["Edital PS/SEEMG nº 04/2024", "Processo SEI 1234567"]
  },
  "sentimento": "neutro",
  "prioridade": "alta",
  "relevancia": 85,
  "resumo": "Processo seletivo para contratação de professor temporário de Matemática com inscrições até 15/12/2025.",
  "palavras_chave": ["processo seletivo", "professor", "matemática", "ATL", "contratação", "temporário", "prazo", "inscrição"],
  "acoes_recomendadas": [
    "Verificar requisitos no edital completo",
    "Preparar documentação necessária",
    "Atentar para o prazo de inscrição: 15/12/2025",
    "Acompanhar publicações de resultados"
  ],
  "justificativa": "Classificado como alta prioridade devido ao prazo curto de inscrição e impacto direto na comunidade escolar."
}

**IMPORTANTE:** Retorne APENAS o JSON válido, sem texto adicional antes ou depois.`;
  }

  /**
   * Calcular custo aproximado baseado em tokens
   */
  private calcularCusto(modelo: string, tokens: number): number {
    // Custos aproximados por 1M tokens (valores de referência OpenRouter)
    const custos: Record<string, { input: number; output: number }> = {
      'openai/gpt-4o': { input: 2.50, output: 10.00 },
      'openai/gpt-4o-mini': { input: 0.15, output: 0.60 },
      'anthropic/claude-3.5-sonnet': { input: 3.00, output: 15.00 },
      'anthropic/claude-3-haiku': { input: 0.25, output: 1.25 },
      'google/gemini-pro-1.5': { input: 1.25, output: 5.00 },
      'meta-llama/llama-3.1-70b-instruct': { input: 0.52, output: 0.75 },
    };

    const custo = custos[modelo] || custos['openai/gpt-4o-mini'];
    // Estimativa: 60% prompt, 40% completion
    const custoTotal = (tokens * 0.6 * custo.input + tokens * 0.4 * custo.output) / 1_000_000;
    return parseFloat(custoTotal.toFixed(6));
  }

  /**
   * Analisar notícia com IA via OpenRouter
   */
  async analisarNoticia(
    titulo: string,
    conteudo: string,
    sreSource: string,
    modelo?: string
  ): Promise<AnaliseSalva> {
    const startTime = Date.now();
    const modeloUsado = modelo || this.defaultModel;

    try {
      const prompt = this.buildPrompt(titulo, conteudo, sreSource);

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://importador-licitacoes.vercel.app',
          'X-Title': 'Importador de Notícias SREs-MG',
        },
        body: JSON.stringify({
          model: modeloUsado,
          messages: [
            {
              role: 'system',
              content: 'Você é um assistente especializado em análise de documentos governamentais da área de educação. Retorne sempre JSON válido.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.3, // Baixa para análises mais consistentes
          max_tokens: 1500,
          response_format: { type: 'json_object' }, // Força resposta JSON
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `OpenRouter API error: ${response.status} - ${JSON.stringify(errorData)}`
        );
      }

      const data: OpenRouterResponse = await response.json();
      const tempoProcessamento = Date.now() - startTime;

      // Extrair JSON da resposta
      const contentText = data.choices[0]?.message?.content || '{}';
      let analise: AnaliseIA;

      try {
        // Tentar parsear JSON limpo
        analise = JSON.parse(contentText);
      } catch (parseError) {
        // Tentar extrair JSON de markdown code block
        const jsonMatch = contentText.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch) {
          analise = JSON.parse(jsonMatch[1]);
        } else {
          throw new Error('Resposta da IA não é um JSON válido');
        }
      }

      // Validar campos obrigatórios
      if (!analise.categoria || !analise.tags || !analise.resumo) {
        throw new Error('Resposta da IA incompleta (faltam campos obrigatórios)');
      }

      // Calcular custo
      const tokens = data.usage.total_tokens;
      const custo = this.calcularCusto(modeloUsado, tokens);

      return {
        ...analise,
        modelo: modeloUsado,
        tokens_prompt: data.usage.prompt_tokens,
        tokens_completion: data.usage.completion_tokens,
        tokens_total: tokens,
        custo_usd: custo,
        tempo_processamento_ms: tempoProcessamento,
      };
    } catch (error) {
      console.error('Erro ao analisar com OpenRouter:', error);
      throw error;
    }
  }

  /**
   * Analisar múltiplas notícias em lote
   */
  async analisarLote(
    noticias: Array<{ id: string; titulo: string; conteudo: string; sreSource: string }>,
    modelo?: string
  ): Promise<Array<{ id: string; analise: AnaliseSalva | null; erro?: string }>> {
    const resultados: Array<{ id: string; analise: AnaliseSalva | null; erro?: string }> = [];

    for (const noticia of noticias) {
      try {
        const analise = await this.analisarNoticia(
          noticia.titulo,
          noticia.conteudo,
          noticia.sreSource,
          modelo
        );
        resultados.push({ id: noticia.id, analise });

        // Rate limiting: aguardar 500ms entre requisições
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        resultados.push({
          id: noticia.id,
          analise: null,
          erro: errorMessage,
        });
      }
    }

    return resultados;
  }

  /**
   * Obter modelos disponíveis
   */
  getModelosDisponiveis(): Array<{ id: string; nome: string; custo: string }> {
    return [
      {
        id: 'openai/gpt-4o',
        nome: 'GPT-4o (mais preciso)',
        custo: 'Médio-Alto',
      },
      {
        id: 'openai/gpt-4o-mini',
        nome: 'GPT-4o Mini (recomendado)',
        custo: 'Baixo',
      },
      {
        id: 'anthropic/claude-3.5-sonnet',
        nome: 'Claude 3.5 Sonnet (excelente)',
        custo: 'Alto',
      },
      {
        id: 'anthropic/claude-3-haiku',
        nome: 'Claude 3 Haiku (rápido)',
        custo: 'Baixo',
      },
      {
        id: 'google/gemini-pro-1.5',
        nome: 'Gemini Pro 1.5 (balanceado)',
        custo: 'Médio',
      },
      {
        id: 'meta-llama/llama-3.1-70b-instruct',
        nome: 'Llama 3.1 70B (open source)',
        custo: 'Baixo',
      },
    ];
  }
}

// Exportar instância singleton
export const openRouterClient = new OpenRouterClient();
