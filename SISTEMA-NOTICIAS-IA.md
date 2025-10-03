# 🤖 SISTEMA DE CATEGORIZAÇÃO INTELIGENTE DE NOTÍCIAS
**Data**: 01/10/2025  
**Versão**: 1.0 - MVP Completo  
**Objetivo**: Coletar, categorizar e analisar TODAS as notícias das SREs com IA

---

## 🎯 VISÃO GERAL

### Problema Identificado
As SREs de Minas Gerais publicam muito mais do que apenas licitações. Seus portais contêm:
- ✅ Licitações e compras públicas
- ✅ Processos seletivos (professores, diretores)
- ✅ Editais de RH (ATL, ATD, cadastro reserva)
- ✅ Avisos administrativos
- ✅ Programas educacionais (Trilhas de Futuro)
- ✅ Eventos e comemorações
- ✅ Resultados e publicações

### Solução Desenvolvida
Sistema completo de **coleta + categorização automática com IA** que:
1. 🕷️ **Raspa TODAS as notícias** dos portais (não só licitações)
2. 🤖 **Categoriza automaticamente** usando NLP/IA local
3. 🏷️ **Extrai entidades** (datas, valores, processos, pessoas)
4. 📊 **Gera insights** (prioridade, relevância, ações recomendadas)
5. 💾 **Armazena estruturado** no PostgreSQL/Supabase

---

## 📦 COMPONENTES IMPLEMENTADOS

### 1. **Parser Universal de Notícias** 
📂 `lib/scrapers/news-parser.ts`

**Funcionalidades**:
- Extrai notícias de páginas Joomla (padrão das SREs)
- Suporta paginação automática (1-N páginas por SRE)
- Extrai: título, conteúdo, data, documentos, links externos
- Detecta PDFs, editais no Google Drive, documentos anexos
- Categorização básica por palavras-chave

**Exemplo de Uso**:
```typescript
import { parseNewsFromSRE } from '@/lib/scrapers/news-parser';

const result = await parseNewsFromSRE(
  'https://srebarbacena.educacao.mg.gov.br/',
  3 // 3 páginas
);

console.log(`${result.noticias.length} notícias coletadas`);
```

**Campos Extraídos**:
```typescript
{
  titulo: "Edital de Licitação nº 01/2025",
  conteudo: "Pregão Eletrônico para aquisição...",
  resumo: "Pregão Eletrônico para aquisição...",
  data_publicacao: Date,
  categoria_original: "Licitações",
  url: "https://...",
  documentos: [
    { nome: "Edital", url: "https://...", tipo: "PDF" }
  ],
  links_externos: ["https://portal.gov.br"],
  raw_html: "<div>...</div>"
}
```

---

### 2. **Categorizador Inteligente com IA**
📂 `lib/ai/categorizer.ts`

**Funcionalidades**:
- **Categorização automática** em 8 categorias principais
- **Extração de entidades** (Named Entity Recognition - NER)
- **Análise de sentimento** (positivo/neutro/negativo)
- **Detecção de prioridade** (alta/média/baixa)
- **Cálculo de relevância** (score 0-100)
- **Geração de insights** (resumo, palavras-chave, ações recomendadas)

**Categorias Detectadas**:
1. **Licitações e Compras** (pregão, concorrência, dispensa)
2. **Processos Seletivos** (concursos, convocações, inscrições)
3. **Editais de RH** (ATL, ATD, cadastro de reserva)
4. **Avisos Administrativos** (suspensões, retificações, alertas)
5. **Programas Educacionais** (Trilhas de Futuro, bolsas)
6. **Eventos e Comemorações**
7. **Resultados e Publicações**
8. **Outros**

**Entidades Extraídas**:
```typescript
{
  datas_importantes: ["01/10/2025", "15/10/2025"],
  valores_financeiros: ["R$ 10.000,00", "R$ 50.000,00"],
  pessoas: ["João Silva", "Maria Santos"],
  instituicoes: ["E.E. João XXIII", "SRE Barbacena"],
  locais: ["Barbacena", "Juiz de Fora"],
  processos: ["Edital nº 01/2025", "Processo 12345"]
}
```

**Exemplo de Uso**:
```typescript
import { categorizarNoticias } from '@/lib/ai/categorizer';

const resultado = await categorizarNoticias(noticias);

console.log(`${resultado.noticias_categorizadas.length} notícias categorizadas`);
console.log('Categorias:', resultado.estatisticas.por_categoria);
console.log('Prioridades:', resultado.estatisticas.por_prioridade);
```

**Saída Exemplo**:
```typescript
{
  titulo: "Edital de Licitação nº 01/2025",
  categoria_ia: "Licitações e Compras",
  subcategoria_ia: "Pregão Eletrônico",
  tags_ia: ["licitação", "pregão", "eletrônico", "material-escolar"],
  entidades: {
    processos: ["Edital nº 01/2025"],
    valores_financeiros: ["R$ 50.000,00"],
    datas_importantes: ["15/10/2025"]
  },
  sentimento: "neutro",
  prioridade: "alta",
  relevancia_score: 85,
  resumo_ia: "Pregão eletrônico para aquisição de materiais escolares",
  palavras_chave_ia: ["licitação", "pregão", "edital", "material"],
  acoes_recomendadas: [
    "Verificar se há interesse em participar",
    "Atentar para prazos de edital"
  ]
}
```

---

### 3. **Schema do Banco de Dados**
📂 `lib/supabase/schema-noticias.sql`

**Tabela Principal**: `noticias`

**Campos**:
- 📝 Conteúdo: `titulo`, `conteudo`, `resumo`, `raw_html`
- 🏷️ Categorização: `categoria_ia`, `subcategoria_ia`, `tags_ia[]`
- 🤖 IA: `entidades_extraidas` (JSONB), `sentimento`, `prioridade`, `relevancia_score`
- 📊 Insights: `resumo_ia`, `palavras_chave_ia[]`, `acoes_recomendadas[]`
- 📎 Anexos: `documentos` (JSONB), `links_externos[]`
- 📅 Datas: `data_publicacao`, `data_coleta`, `created_at`, `updated_at`

**Índices para Performance**:
- SRE source (busca por regional)
- Categoria IA (filtro por tipo)
- Prioridade (notícias urgentes)
- Data de publicação (ordem cronológica)
- Relevância score (mais importantes primeiro)
- **Full-text search** (busca no título + conteúdo)
- Tags (GIN index para arrays)
- Entidades (GIN index para JSONB)

**Views Automáticas**:
- `noticias_alta_prioridade` - Notícias urgentes dos últimos 30 dias
- `noticias_stats_por_sre` - Estatísticas por SRE
- `noticias_tendencias` - Tendências por categoria (últimos 6 meses)
- `noticias_tags_populares` - Tags mais usadas (últimos 90 dias)

**Functions SQL**:
- `buscar_noticias(termo, limite)` - Busca full-text em português
- `buscar_por_tags(tags[], limite)` - Busca por múltiplas tags

---

### 4. **API Endpoint de Scraping**
📂 `app/api/scrape-news/route.ts`

**GET /api/scrape-news**

**Parâmetros**:
- `count` - Número de SREs para processar (padrão: 5)
- `sre` - Processar apenas uma SRE específica (ex: "barbacena")
- `pages` - Número de páginas de notícias por SRE (padrão: 3)

**Exemplos**:
```bash
# Coletar de 5 SREs (3 páginas cada)
curl "http://localhost:3001/api/scrape-news?count=5"

# Coletar apenas SRE Barbacena (5 páginas)
curl "http://localhost:3001/api/scrape-news?sre=barbacena&pages=5"

# Coletar de 10 SREs (1 página cada)
curl "http://localhost:3001/api/scrape-news?count=10&pages=1"
```

**POST /api/scrape-news**

**Body**:
```json
{
  "sres": ["barbacena", "uba", "jdefora"],
  "pages": 5
}
```

**Resposta Exemplo**:
```json
{
  "success": true,
  "resumo": {
    "sres_processadas": 5,
    "noticias_coletadas": 89,
    "noticias_categorizadas": 89,
    "noticias_salvas_banco": 85,
    "tempo_total_ms": 32450,
    "media_por_sre_ms": 6490
  },
  "estatisticas": {
    "por_categoria": {
      "Licitações e Compras": 12,
      "Processos Seletivos": 25,
      "Editais de RH": 18,
      "Avisos Administrativos": 15,
      "Programas Educacionais": 10,
      "Eventos": 5,
      "Resultados": 4
    },
    "por_prioridade": {
      "alta": 20,
      "media": 45,
      "baixa": 24
    }
  },
  "detalhes_por_sre": [
    {
      "sre": "srebarbacena.educacao.mg.gov.br",
      "success": true,
      "noticias_coletadas": 18,
      "noticias_categorizadas": 18,
      "noticias_salvas": 17,
      "categorias": { "Licitações e Compras": 3, ... },
      "tempo_processamento_ms": 5420
    }
  ]
}
```

---

### 5. **Interface de Queries**
📂 `lib/supabase/queries.ts`

**Funções Disponíveis**:

```typescript
// Inserir notícias (com upsert para evitar duplicatas)
await insertNoticias(noticias);

// Buscar todas (limite padrão: 100)
const todas = await getAllNoticias(100);

// Buscar por SRE
const deUma = await getNoticiasBySRE('srebarbacena.educacao.mg.gov.br', 50);

// Buscar por categoria
const licitacoes = await getNoticiasByCategoria('Licitações e Compras', 50);

// Buscar por prioridade
const urgentes = await getNoticiasByPrioridade('alta', 50);

// Busca full-text
const busca = await searchNoticias('pregão eletrônico', 50);

// Buscar por tags
const comTags = await getNoticiasByTags(['licitação', 'pregão'], 50);

// Estatísticas por SRE
const stats = await getNoticiasStats();

// Tags populares
const tags = await getTagsPopulares(30);

// Buscar por ID
const noticia = await getNoticiaById('uuid-aqui');
```

---

## 🚀 COMO USAR O SISTEMA

### Passo 1: Criar Tabela no Supabase

1. Acesse o Supabase Dashboard
2. Vá em SQL Editor
3. Cole e execute o conteúdo de `lib/supabase/schema-noticias.sql`
4. Aguarde criação de tabela, índices, views e functions

### Passo 2: Testar Coleta de Notícias

```bash
# Testar com 1 SRE (Barbacena)
curl "http://localhost:3001/api/scrape-news?sre=barbacena&pages=2"

# Coletar de 3 SREs
curl "http://localhost:3001/api/scrape-news?count=3&pages=3"
```

### Passo 3: Verificar Dados no Banco

```sql
-- Ver todas as notícias
SELECT titulo, categoria_ia, prioridade, relevancia_score 
FROM noticias 
ORDER BY relevancia_score DESC 
LIMIT 20;

-- Estatísticas por categoria
SELECT categoria_ia, COUNT(*) as total
FROM noticias
GROUP BY categoria_ia
ORDER BY total DESC;

-- Notícias de alta prioridade
SELECT * FROM noticias_alta_prioridade;

-- Tags mais populares
SELECT * FROM noticias_tags_populares;
```

### Passo 4: Criar Dashboard de Notícias

```typescript
// app/noticias/page.tsx
import { getAllNoticias, getNoticiasStats } from '@/lib/supabase/queries';

export default async function NoticiasPage() {
  const noticias = await getAllNoticias(50);
  const stats = await getNoticiasStats();

  return (
    <div>
      {/* Filtros por categoria */}
      {/* Timeline de eventos */}
      {/* Nuvem de palavras-chave */}
      {/* Lista de notícias */}
    </div>
  );
}
```

---

## 📊 INSIGHTS E ANÁLISES POSSÍVEIS

### 1. **Análise por Categoria**
- Quais tipos de notícias são mais frequentes?
- Qual SRE publica mais licitações?
- Tendências de processos seletivos por mês

### 2. **Análise de Prioridade**
- Quantas notícias urgentes por semana?
- Quais SREs têm mais avisos de alta prioridade?
- Alertas automáticos para novas notícias urgentes

### 3. **Análise de Entidades**
- Valores financeiros totais em licitações
- Instituições mais mencionadas
- Datas importantes próximas (deadlines)

### 4. **Análise de Sentimento**
- Proporção de notícias positivas/negativas
- Identificar problemas recorrentes

### 5. **Análise de Tendências**
- Aumento de processos seletivos em determinado período
- Sazonalidade de licitações (mais em Q1/Q2?)
- Programas educacionais em expansão

### 6. **Busca Inteligente**
- Buscar por "pregão + material escolar"
- Buscar por "ATL + matemática"
- Buscar por "edital + 2025"

---

## 🎨 DASHBOARD SUGERIDO (Próximo Passo)

### Estrutura da Página `/noticias`

```
┌─────────────────────────────────────────────────┐
│  📰 CENTRAL DE NOTÍCIAS DAS SREs                │
├─────────────────────────────────────────────────┤
│  🔍 Busca: [_____________________] [Buscar]     │
│                                                 │
│  📊 Filtros:                                    │
│  ┌─────────┐ ┌──────────┐ ┌──────────┐        │
│  │Categoria│ │Prioridade│ │    SRE   │        │
│  └─────────┘ └──────────┘ └──────────┘        │
├─────────────────────────────────────────────────┤
│  📈 ESTATÍSTICAS                                │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐       │
│  │ 1234 │  │  89  │  │  45  │  │  12  │       │
│  │Total │  │Alta  │  │Média │  │Baixa │       │
│  └──────┘  └──────┘  └──────┘  └──────┘       │
├─────────────────────────────────────────────────┤
│  📊 GRÁFICOS                                    │
│  ┌─────────────────┐  ┌──────────────────┐    │
│  │ Por Categoria   │  │ Tendência Mensal │    │
│  │  [Gráfico Pizza]│  │  [Gráfico Linha] │    │
│  └─────────────────┘  └──────────────────┘    │
├─────────────────────────────────────────────────┤
│  🏷️ TAGS POPULARES                             │
│  [licitação] [pregão] [ATL] [professor]        │
│  [edital] [resultado] [processo-seletivo]      │
├─────────────────────────────────────────────────┤
│  📰 LISTA DE NOTÍCIAS                           │
│  ┌─────────────────────────────────────────┐   │
│  │ 🔴 [ALTA] Edital de Licitação nº 01...  │   │
│  │ 📅 01/10/2025 | 🏷️ Licitações | ⭐ 85  │   │
│  ├─────────────────────────────────────────┤   │
│  │ 🟡 [MED] Processo Seletivo Professor... │   │
│  │ 📅 30/09/2025 | 🏷️ RH | ⭐ 70          │   │
│  └─────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

---

## 🔮 POSSÍVEIS EVOLUÇÕES FUTURAS

### Fase 1 - IA Mais Avançada
- **Integração com OpenAI/Anthropic** para categorização mais precisa
- **Resumos automáticos** mais elaborados
- **Extração de perguntas frequentes** dos editais
- **Tradução para outras línguas** (se necessário)

### Fase 2 - Notificações Inteligentes
- **Email alerts** para notícias de alta prioridade
- **Filtros personalizados** por usuário
- **Notificações push** via webhook/Telegram
- **Digest semanal** com resumo das notícias

### Fase 3 - Análises Avançadas
- **Comparação temporal** (este mês vs mês passado)
- **Previsão de tendências** (ML)
- **Análise de correlação** (licitações x processos seletivos)
- **Benchmark entre SREs** (qual publica mais?)

### Fase 4 - Automação Total
- **Coleta automática diária** (cron job)
- **Re-categorização periódica** (melhoria contínua)
- **Detecção de anomalias** (ex: SRE parou de publicar)
- **Limpeza automática** de notícias antigas

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

- [x] Parser universal de notícias (Joomla)
- [x] Categorizador com IA (NLP local)
- [x] Schema do banco de dados completo
- [x] API endpoint GET /api/scrape-news
- [x] API endpoint POST /api/scrape-news
- [x] Interface de queries (CRUD)
- [x] Índices de performance
- [x] Views automáticas
- [x] Functions SQL para busca
- [ ] Dashboard de notícias (próximo)
- [ ] Filtros interativos
- [ ] Gráficos de análise
- [ ] Busca full-text no frontend
- [ ] Sistema de notificações

---

## 📚 ARQUIVOS CRIADOS

1. `lib/scrapers/news-parser.ts` (280 linhas)
2. `lib/ai/categorizer.ts` (590 linhas)
3. `lib/supabase/schema-noticias.sql` (300 linhas)
4. `app/api/scrape-news/route.ts` (280 linhas)
5. `lib/supabase/queries.ts` (adicionado 120 linhas)

**Total**: ~1.570 linhas de código novo

---

## 🎉 CONCLUSÃO

O sistema de categorização inteligente está **100% implementado** e pronto para uso! 

**Próximos passos recomendados**:
1. ✅ Criar tabela no Supabase
2. ✅ Testar coleta de notícias
3. ✅ Verificar categorização
4. 🔄 Criar dashboard visual (próximo)
5. 🔄 Implementar sistema de alertas

**Benefícios para o cliente**:
- 📊 **Visão completa** de todas as notícias das SREs
- 🤖 **Categorização automática** (sem trabalho manual)
- 🔍 **Busca inteligente** por conteúdo, tags, entidades
- ⚡ **Alertas de prioridade** para ações urgentes
- 📈 **Análise de tendências** para tomada de decisão

---

**Última atualização**: 01/10/2025  
**Versão do Sistema**: 1.0 - MVP Completo  
**Status**: ✅ Pronto para Testes
