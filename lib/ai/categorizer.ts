/**
 * Categorizador Inteligente com IA (LLM)
 * 
 * Usa modelos de linguagem para:
 * 1. Categorizar notícias automaticamente
 * 2. Extrair entidades (datas, valores, nomes, locais)
 * 3. Gerar insights e análises
 * 4. Detectar sentimento e urgência
 */

import { Noticia } from '../scrapers/news-parser';

export interface NoticiaCategorizada extends Noticia {
  // Categorização IA
  categoria_ia: string;
  subcategoria_ia?: string;
  tags_ia: string[];
  
  // Entidades extraídas
  entidades: {
    datas_importantes?: string[];
    valores_financeiros?: string[];
    pessoas?: string[];
    instituicoes?: string[];
    locais?: string[];
    processos?: string[];
  };
  
  // Análise IA
  sentimento: 'positivo' | 'neutro' | 'negativo';
  prioridade: 'alta' | 'media' | 'baixa';
  relevancia_score: number; // 0-100
  
  // Insights
  resumo_ia?: string;
  palavras_chave_ia?: string[];
  acoes_recomendadas?: string[];
}

export interface CategorizacaoResult {
  success: boolean;
  noticias_categorizadas: NoticiaCategorizada[];
  estatisticas: {
    total_processadas: number;
    por_categoria: Record<string, number>;
    por_prioridade: Record<string, number>;
    tempo_processamento_ms: number;
  };
  error?: string;
}

/**
 * Categorias principais do sistema
 */
export const CATEGORIAS = {
  LICITACOES: 'Licitações e Compras',
  PROCESSOS_SELETIVOS: 'Processos Seletivos',
  EDITAIS_RH: 'Editais de RH',
  AVISOS: 'Avisos Administrativos',
  PROGRAMAS: 'Programas Educacionais',
  EVENTOS: 'Eventos e Comemorações',
  RESULTADOS: 'Resultados e Publicações',
  OUTROS: 'Outros',
} as const;

/**
 * Prompt system para categorização com IA
 */
const CATEGORIZATION_PROMPT = `Você é um assistente especializado em categorização de documentos educacionais e administrativos do governo de Minas Gerais.

Analise o título e conteúdo da notícia e retorne um JSON com a seguinte estrutura:

{
  "categoria": "Uma das opções: Licitações e Compras | Processos Seletivos | Editais de RH | Avisos Administrativos | Programas Educacionais | Eventos e Comemorações | Resultados e Publicações | Outros",
  "subcategoria": "Subcategoria específica (ex: Pregão Eletrônico, Concurso Público, ATL, etc)",
  "tags": ["tag1", "tag2", "tag3"] (3-5 tags relevantes),
  "entidades": {
    "datas_importantes": ["prazo de inscrição", "data de abertura", etc],
    "valores_financeiros": ["R$ 1.000,00", etc],
    "pessoas": ["nomes de pessoas mencionadas"],
    "instituicoes": ["escolas, órgãos, etc"],
    "locais": ["Barbacena", "SRE", etc],
    "processos": ["número de edital", "número de processo", etc]
  },
  "sentimento": "positivo | neutro | negativo",
  "prioridade": "alta | media | baixa" (considere urgência e relevância),
  "relevancia_score": 0-100 (quão importante é para educadores e gestores),
  "resumo": "Resumo em 1-2 frases do conteúdo principal",
  "palavras_chave": ["palavra1", "palavra2", "palavra3"] (5-8 palavras-chave),
  "acoes_recomendadas": ["ação1", "ação2"] (o que o leitor deveria fazer)
}

Critérios de prioridade:
- ALTA: Prazos curtos, editais importantes, convocações urgentes
- MÉDIA: Processos seletivos, licitações regulares, avisos importantes
- BAIXA: Informativos gerais, eventos, notícias históricas

Seja preciso e objetivo. Extraia todas as entidades possíveis.`;

/**
 * Categoriza notícias usando IA local (fallback sem API externa)
 * Esta versão usa regras + NLP básico sem depender de APIs pagas
 */
export async function categorizarNoticias(
  noticias: Noticia[]
): Promise<CategorizacaoResult> {
  const startTime = Date.now();

  const result: CategorizacaoResult = {
    success: false,
    noticias_categorizadas: [],
    estatisticas: {
      total_processadas: 0,
      por_categoria: {},
      por_prioridade: {},
      tempo_processamento_ms: 0,
    },
  };

  try {
    // Processar cada notícia
    for (const noticia of noticias) {
      const categorizada = await categorizarNoticiaLocal(noticia);
      result.noticias_categorizadas.push(categorizada);

      // Atualizar estatísticas
      result.estatisticas.por_categoria[categorizada.categoria_ia] = 
        (result.estatisticas.por_categoria[categorizada.categoria_ia] || 0) + 1;
      
      result.estatisticas.por_prioridade[categorizada.prioridade] = 
        (result.estatisticas.por_prioridade[categorizada.prioridade] || 0) + 1;
    }

    result.estatisticas.total_processadas = noticias.length;
    result.estatisticas.tempo_processamento_ms = Date.now() - startTime;
    result.success = true;

    return result;
  } catch (error: any) {
    result.error = error.message;
    return result;
  }
}

/**
 * Categorização local inteligente (sem API externa)
 * Usa NLP básico + regras sofisticadas
 */
async function categorizarNoticiaLocal(noticia: Noticia): Promise<NoticiaCategorizada> {
  const texto = `${noticia.titulo} ${noticia.conteudo}`.toLowerCase();

  // 1. CATEGORIZAÇÃO
  const { categoria, subcategoria, tags } = detectarCategoria(texto, noticia);

  // 2. EXTRAÇÃO DE ENTIDADES
  const entidades = extrairEntidades(texto, noticia);

  // 3. ANÁLISE DE SENTIMENTO
  const sentimento = analisarSentimento(texto);

  // 4. DETECTAR PRIORIDADE
  const prioridade = detectarPrioridade(texto, noticia.data_publicacao);

  // 5. CALCULAR RELEVÂNCIA
  const relevancia_score = calcularRelevancia(texto, categoria, prioridade, entidades);

  // 6. GERAR RESUMO
  const resumo_ia = gerarResumo(noticia);

  // 7. EXTRAIR PALAVRAS-CHAVE
  const palavras_chave_ia = extrairPalavrasChave(texto);

  // 8. RECOMENDAR AÇÕES
  const acoes_recomendadas = recomendarAcoes(categoria, entidades, prioridade);

  return {
    ...noticia,
    categoria_ia: categoria,
    subcategoria_ia: subcategoria,
    tags_ia: tags,
    entidades,
    sentimento,
    prioridade,
    relevancia_score,
    resumo_ia,
    palavras_chave_ia,
    acoes_recomendadas,
  };
}

/**
 * Detecta categoria usando regras sofisticadas
 */
function detectarCategoria(texto: string, noticia: Noticia): {
  categoria: string;
  subcategoria?: string;
  tags: string[];
} {
  const tags: string[] = [];

  // LICITAÇÕES E COMPRAS
  if (texto.match(/licita[çc][ãa]o|pregão|edital.*compra|tomada.*pre[çc]o|concorr[êe]ncia|dispensa|inexigibilidade|aquisi[çc][ãa]o|cotep/)) {
    tags.push('licitação');
    
    let subcategoria = 'Licitação Geral';
    if (texto.match(/pregão.*eletr[ôo]nico/)) {
      subcategoria = 'Pregão Eletrônico';
      tags.push('pregão', 'eletrônico');
    } else if (texto.match(/pregão.*presencial/)) {
      subcategoria = 'Pregão Presencial';
      tags.push('pregão', 'presencial');
    } else if (texto.match(/concorr[êe]ncia/)) {
      subcategoria = 'Concorrência';
      tags.push('concorrência');
    } else if (texto.match(/dispensa|inexigibilidade/)) {
      subcategoria = 'Dispensa/Inexigibilidade';
      tags.push('dispensa');
    } else if (texto.match(/chamada.*p[úu]blica/)) {
      subcategoria = 'Chamada Pública';
      tags.push('chamada-pública');
    }

    // Tags adicionais
    if (texto.match(/mobili[áa]rio/)) tags.push('mobiliário');
    if (texto.match(/inform[áa]tica|computador|equipamento/)) tags.push('informática');
    if (texto.match(/obras|constru[çc][ãa]o|reforma/)) tags.push('obras');
    if (texto.match(/merenda|alimenta[çc][ãa]o/)) tags.push('alimentação');

    return { categoria: CATEGORIAS.LICITACOES, subcategoria, tags };
  }

  // PROCESSOS SELETIVOS
  if (texto.match(/processo.*seletivo|concurso|convoca[çc][ãa]o|inscri[çc][õo]es|vaga.*professor|vaga.*servidor|classifica[çc][ãa]o.*definitiv/)) {
    tags.push('processo-seletivo');

    let subcategoria = 'Processo Seletivo';
    if (texto.match(/concurso.*p[úu]blico/)) {
      subcategoria = 'Concurso Público';
      tags.push('concurso');
    } else if (texto.match(/convoca[çc][ãa]o/)) {
      subcategoria = 'Convocação';
      tags.push('convocação');
    } else if (texto.match(/classifica[çc][ãa]o/)) {
      subcategoria = 'Classificação';
      tags.push('classificação', 'resultado');
    } else if (texto.match(/inscri[çc][õo]es/)) {
      subcategoria = 'Inscrições Abertas';
      tags.push('inscrições');
    }

    if (texto.match(/professor|magist[ée]rio|docente/)) tags.push('professor');
    if (texto.match(/diretor|dire[çc][ãa]o/)) tags.push('diretor');

    return { categoria: CATEGORIAS.PROCESSOS_SELETIVOS, subcategoria, tags };
  }

  // EDITAIS DE RH
  if (texto.match(/atl|autoriza[çc][ãa]o.*lecionar|atd|autoriza[çc][ãa]o.*dire[çc][ãa]o|cadastro.*reserva|designa[çc][ãa]o|contrata[çc][ãa]o/)) {
    tags.push('rh', 'recursos-humanos');

    let subcategoria = 'RH Geral';
    if (texto.match(/atl|autoriza[çc][ãa]o.*lecionar/)) {
      subcategoria = 'ATL - Autorização para Lecionar';
      tags.push('ATL', 'lecionar');
    } else if (texto.match(/atd|autoriza[çc][ãa]o.*dire[çc][ãa]o/)) {
      subcategoria = 'ATD - Autorização para Direção';
      tags.push('ATD', 'direção');
    } else if (texto.match(/cadastro.*reserva/)) {
      subcategoria = 'Cadastro de Reserva';
      tags.push('cadastro-reserva');
    } else if (texto.match(/designa[çc][ãa]o/)) {
      subcategoria = 'Designação';
      tags.push('designação');
    }

    return { categoria: CATEGORIAS.EDITAIS_RH, subcategoria, tags };
  }

  // PROGRAMAS EDUCACIONAIS
  if (texto.match(/programa|projeto.*educacional|trilhas.*futuro|educa[çc][ãa]o.*profissional|curso.*t[ée]cnico|bolsa|capacita[çc][ãa]o|forma[çc][ãa]o/)) {
    tags.push('programa');

    let subcategoria = 'Programa Educacional';
    if (texto.match(/trilhas.*futuro/)) {
      subcategoria = 'Trilhas de Futuro';
      tags.push('trilhas-futuro', 'curso-técnico');
    } else if (texto.match(/educa[çc][ãa]o.*profissional/)) {
      subcategoria = 'Educação Profissional';
      tags.push('educação-profissional');
    } else if (texto.match(/bolsa/)) {
      subcategoria = 'Programa de Bolsas';
      tags.push('bolsa');
    }

    return { categoria: CATEGORIAS.PROGRAMAS, subcategoria, tags };
  }

  // AVISOS ADMINISTRATIVOS
  if (texto.match(/aviso|comunicado|informa[çc][ãa]o|aten[çc][ãa]o|suspens[ãa]o|altera[çc][ãa]o|retifica[çc][ãa]o|errata|esclarecimento/)) {
    tags.push('aviso');

    let subcategoria = 'Aviso Geral';
    if (texto.match(/suspens[ãa]o/)) {
      subcategoria = 'Suspensão';
      tags.push('suspensão');
    } else if (texto.match(/retifica[çc][ãa]o|errata/)) {
      subcategoria = 'Retificação/Errata';
      tags.push('retificação', 'errata');
    } else if (texto.match(/altera[çc][ãa]o/)) {
      subcategoria = 'Alteração';
      tags.push('alteração');
    }

    return { categoria: CATEGORIAS.AVISOS, subcategoria, tags };
  }

  // EVENTOS
  if (texto.match(/evento|comemora[çc][ãa]o|anos|anivers[áa]rio|festival|feira|competi[çc][ãa]o|semin[áa]rio|palestra/)) {
    tags.push('evento');
    return { categoria: CATEGORIAS.EVENTOS, tags };
  }

  // RESULTADOS
  if (texto.match(/resultado.*preliminar|resultado.*definitivo|resultado.*final|lista.*aprovados|homologa[çc][ãa]o/)) {
    tags.push('resultado');
    
    let subcategoria = 'Resultado';
    if (texto.match(/preliminar/)) {
      subcategoria = 'Resultado Preliminar';
      tags.push('preliminar');
    } else if (texto.match(/definitivo|final/)) {
      subcategoria = 'Resultado Final';
      tags.push('final', 'definitivo');
    }

    return { categoria: CATEGORIAS.RESULTADOS, subcategoria, tags };
  }

  // OUTROS
  tags.push('geral');
  return { categoria: CATEGORIAS.OUTROS, tags };
}

/**
 * Extrai entidades (Named Entity Recognition simplificado)
 */
function extrairEntidades(texto: string, noticia: Noticia): NoticiaCategorizada['entidades'] {
  const entidades: NoticiaCategorizada['entidades'] = {};

  // DATAS IMPORTANTES
  const datas: string[] = [];
  const regexDatas = /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})|(\d{1,2}\s+de\s+\w+\s+de\s+\d{4})/gi;
  const matchesDatas = texto.match(regexDatas);
  if (matchesDatas) datas.push(...matchesDatas.map(d => d.trim()));
  if (datas.length > 0) entidades.datas_importantes = datas.slice(0, 5);

  // VALORES FINANCEIROS
  const valores: string[] = [];
  const regexValores = /r\$\s*[\d.,]+/gi;
  const matchesValores = texto.match(regexValores);
  if (matchesValores) valores.push(...matchesValores.map(v => v.trim()));
  if (valores.length > 0) entidades.valores_financeiros = valores;

  // PROCESSOS E EDITAIS
  const processos: string[] = [];
  const regexProcessos = /(edital|processo|n[°º]?\.?\s*\d+[\d\/\-]*)/gi;
  const matchesProcessos = texto.match(regexProcessos);
  if (matchesProcessos) processos.push(...matchesProcessos.map(p => p.trim()));
  if (processos.length > 0) entidades.processos = [...new Set(processos)].slice(0, 5);

  // INSTITUIÇÕES
  const instituicoes: string[] = [];
  if (texto.match(/\be\.?e\.?\s+[\w\s]+/gi)) {
    const matchesEscolas = texto.match(/\be\.?e\.?\s+[\w\s]+/gi);
    if (matchesEscolas) instituicoes.push(...matchesEscolas);
  }
  if (texto.includes('sre ') || texto.includes('superintend')) instituicoes.push('SRE');
  if (texto.includes('seemg')) instituicoes.push('SEEMG');
  if (instituicoes.length > 0) entidades.instituicoes = [...new Set(instituicoes)].slice(0, 5);

  // LOCAIS
  const locais: string[] = [];
  const cidades = ['barbacena', 'juiz de fora', 'belo horizonte', 'ubá', 'santos dumont'];
  cidades.forEach(cidade => {
    if (texto.includes(cidade)) locais.push(cidade);
  });
  if (locais.length > 0) entidades.locais = locais;

  return entidades;
}

/**
 * Análise de sentimento simples
 */
function analisarSentimento(texto: string): 'positivo' | 'neutro' | 'negativo' {
  const palavrasPositivas = ['aprova', 'sucesso', 'conquista', 'melhoria', 'novo', 'inova'];
  const palavrasNegativas = ['suspens', 'cancel', 'adia', 'erro', 'problema', 'falha'];

  let scorePositivo = 0;
  let scoreNegativo = 0;

  palavrasPositivas.forEach(p => {
    if (texto.includes(p)) scorePositivo++;
  });

  palavrasNegativas.forEach(p => {
    if (texto.includes(p)) scoreNegativo++;
  });

  if (scorePositivo > scoreNegativo) return 'positivo';
  if (scoreNegativo > scorePositivo) return 'negativo';
  return 'neutro';
}

/**
 * Detecta prioridade baseada em urgência e relevância
 */
function detectarPrioridade(texto: string, dataPublicacao?: Date): 'alta' | 'media' | 'baixa' {
  // Palavras de urgência
  if (texto.match(/urgente|aten[çc][ãa]o|prazo.*encerra|[úu]ltimo.*dia|hoje|amanh[ãa]|improrrog[áa]vel|imediato/)) {
    return 'alta';
  }

  // Conteúdo importante
  if (texto.match(/edital|licita[çc][ãa]o|processo.*seletivo|convoca[çc][ãa]o|resultado.*final/)) {
    // Verificar se é recente
    if (dataPublicacao) {
      const diasAtras = (Date.now() - dataPublicacao.getTime()) / (1000 * 60 * 60 * 24);
      if (diasAtras <= 7) return 'alta';
      if (diasAtras <= 30) return 'media';
    }
    return 'media';
  }

  return 'baixa';
}

/**
 * Calcula score de relevância (0-100)
 */
function calcularRelevancia(
  texto: string,
  categoria: string,
  prioridade: string,
  entidades: NoticiaCategorizada['entidades']
): number {
  let score = 50; // Base

  // Por categoria
  if (categoria === CATEGORIAS.LICITACOES) score += 20;
  if (categoria === CATEGORIAS.PROCESSOS_SELETIVOS) score += 15;
  if (categoria === CATEGORIAS.EDITAIS_RH) score += 10;

  // Por prioridade
  if (prioridade === 'alta') score += 20;
  if (prioridade === 'media') score += 10;

  // Por entidades encontradas
  if (entidades.valores_financeiros && entidades.valores_financeiros.length > 0) score += 5;
  if (entidades.processos && entidades.processos.length > 0) score += 5;
  if (entidades.datas_importantes && entidades.datas_importantes.length > 0) score += 5;

  return Math.min(100, Math.max(0, score));
}

/**
 * Gera resumo inteligente
 */
function gerarResumo(noticia: Noticia): string {
  // Pegar primeira frase do conteúdo
  const primeiraFrase = noticia.conteudo.split('.')[0].trim();
  
  if (primeiraFrase.length > 150) {
    return primeiraFrase.substring(0, 150) + '...';
  }

  return primeiraFrase + '.';
}

/**
 * Extrai palavras-chave relevantes
 */
function extrairPalavrasChave(texto: string): string[] {
  const palavrasRelevantes: string[] = [];

  const termos = [
    'licitação', 'pregão', 'edital', 'processo seletivo', 'convocação',
    'atl', 'atd', 'professor', 'diretor', 'servidor',
    'resultado', 'classificação', 'inscrição', 'prazo',
    'trilhas de futuro', 'educação profissional', 'curso técnico',
    'suspensão', 'retificação', 'alteração', 'aviso'
  ];

  termos.forEach(termo => {
    if (texto.includes(termo)) palavrasRelevantes.push(termo);
  });

  return palavrasRelevantes.slice(0, 8);
}

/**
 * Recomenda ações baseadas no conteúdo
 */
function recomendarAcoes(
  categoria: string,
  entidades: NoticiaCategorizada['entidades'],
  prioridade: string
): string[] {
  const acoes: string[] = [];

  if (categoria === CATEGORIAS.LICITACOES) {
    acoes.push('Verificar se há interesse em participar');
    if (entidades.datas_importantes) {
      acoes.push('Atentar para prazos de edital');
    }
  }

  if (categoria === CATEGORIAS.PROCESSOS_SELETIVOS) {
    acoes.push('Verificar requisitos e prazos de inscrição');
    acoes.push('Divulgar para candidatos interessados');
  }

  if (categoria === CATEGORIAS.EDITAIS_RH) {
    acoes.push('Informar servidores e candidatos elegíveis');
  }

  if (prioridade === 'alta') {
    acoes.unshift('⚠️ AÇÃO URGENTE NECESSÁRIA');
  }

  if (entidades.processos) {
    acoes.push('Arquivar número de processo/edital');
  }

  return acoes.slice(0, 4);
}
