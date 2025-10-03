# 📋 Importador de Licitações e Notícias - SREs MG# Importador de Licitações - POCThis is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).



# 📋 Importador de Licitações e Notícias - SREs MG

Sistema inteligente de coleta, categorização e análise de **licitações** e **notícias** das Superintendências Regionais de Ensino de Minas Gerais.

---

## 🎯 Funcionalidades

### 🏛️ **Sistema de Licitações**
- ✅ Coleta automática de licitações de 47 SREs
- ✅ Parsing específico para portais Joomla
- ✅ Dashboard visual com gráficos e estatísticas
- ✅ Filtros avançados (SRE, modalidade, situação, valor)
- ✅ Página de detalhes completa por licitação
- ✅ Armazenamento em PostgreSQL (Supabase)

### 📰 **Sistema de Notícias com IA** (NOVO!)
- 🤖 **Categorização Inteligente**: 8 categorias automáticas
  - Licitações e Compras
  - Processos Seletivos
  - Editais de RH
  - Avisos Administrativos
  - Programas Educacionais
  - Eventos
  - Resultados



---Sistema de coleta automatizada de licitações públicas das Superintendências Regionais de Ensino (SREs) de Minas Gerais.## Getting Started



## 🎯 Funcionalidades



### 🏛️ **Sistema de Licitações**## 🎯 Sobre o ProjetoFirst, run the development server:

- ✅ Coleta automática de licitações de 47 SREs

- ✅ Parsing específico para portais Joomla

- ✅ Dashboard visual com gráficos e estatísticas

- ✅ Filtros avançados (SRE, modalidade, situação, valor)Este é um **Proof of Concept (POC)** que demonstra a viabilidade técnica de coletar e centralizar informações sobre licitações públicas de 47 SREs do estado de Minas Gerais.```bash

- ✅ Página de detalhes completa por licitação

- ✅ Armazenamento em PostgreSQL (Supabase)npm run dev



### 📰 **Sistema de Notícias com IA** (NOVO!)### Funcionalidades do POC# or

- 🤖 **Categorização Inteligente**: 8 categorias automáticas

  - Licitações e Comprasyarn dev

  - Processos Seletivos

  - Editais de RH- ✅ Coleta automatizada de dados de portais SRE# or

  - Avisos Administrativos

  - Programas Educacionais- ✅ Armazenamento estruturado em PostgreSQL (Supabase)pnpm dev

  - Eventos

  - Resultados- ✅ Dashboard web para visualização# or

  - Outros

- ✅ API REST para integraçãobun dev

- 🧠 **Análise com IA/NLP Local**:

  - Extração de entidades (datas, valores, processos, pessoas, instituições)- ✅ Logs de execução e monitoramento```

  - Análise de sentimento (positivo/neutro/negativo)

  - Detecção de prioridade (alta/média/baixa)

  - Score de relevância (0-100)

  - Resumo automático## 🛠️ Stack TecnológicoOpen [http://localhost:3000](http://localhost:3000) with your browser to see the result.

  - Palavras-chave extraídas

  - Ações recomendadas



- 📊 **Dashboard Visual**:- **Frontend/Backend**: Next.js 15 (App Router) + TypeScriptYou can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

  - 4 cards de estatísticas

  - 2 gráficos interativos (categorias + SREs)- **Database**: PostgreSQL via Supabase

  - Busca full-text em português

  - Filtros por categoria, prioridade e SRE- **Web Scraping**: Cheerio + AxiosThis project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

  - Lista de notícias com badges e tags

  - Ordenação por relevância/data/prioridade- **Styling**: Tailwind CSS



- 🔍 **Página de Detalhes**:- **Deploy**: Vercel (recomendado)## Learn More

  - Resumo inteligente gerado por IA

  - Conteúdo completo formatado

  - Ações recomendadas personalizadas

  - Entidades extraídas organizadas## 📋 Pré-requisitosTo learn more about Next.js, take a look at the following resources:

  - Palavras-chave e tags

  - Documentos anexos (PDFs, Google Drive)

  - Links relacionados

- Node.js 18+ e npm- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.

---

- Conta no Supabase (gratuita)- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

## 🚀 Início Rápido

- Git (opcional)

### **1. Instalação**

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

```bash

# Clone o repositório## 🚀 Configuração Rápida

git clone <seu-repositorio>

cd Importadordelicitacoes## Deploy on Vercel



# Instale dependências### 1. Instalar Dependências

npm install

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

# Configure variáveis de ambiente

copy .env.example .env.local```bash

# Edite .env.local com suas credenciais do Supabase

```npm installCheck out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.



### **2. Configure o Supabase**```



1. Acesse [supabase.com](https://supabase.com/dashboard)### 2. Configurar Supabase

2. Crie um novo projeto (ou use existente)

3. Vá em **SQL Editor** → **New Query**1. Crie uma conta gratuita em [supabase.com](https://supabase.com)

4. Execute os schemas:2. Crie um novo projeto

   - `lib/supabase/schema-licitacoes.sql` (licitações)3. Vá em **Project Settings > API** e copie:

   - `lib/supabase/schema-noticias.sql` (notícias)   - Project URL

   - anon/public key

### **3. Inicie o Servidor**   - service_role key (Settings > API > service_role)



```bash### 3. Configurar Variáveis de Ambiente

npm run dev

# Acesse: http://localhost:3001Renomeie `.env.local.example` para `.env.local` e preencha:

```

```env

### **4. Valide o Sistema**NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co

NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon

```powershellSUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role

# Execute o script de validação```

.\validar-sistema.ps1

```### 4. Criar Tabelas no Supabase



### **5. Colete Dados**1. No Supabase, acesse **SQL Editor**

2. Copie todo o conteúdo de `lib/supabase/schema.sql`

```powershell3. Cole no editor e execute (**Run**)

# Coletar licitações (3 SREs)

curl "http://localhost:3001/api/scrape-specific?count=3"Isso criará:

- Tabela `licitacoes` (dados coletados)

# Coletar notícias com IA (1 SRE)- Tabela `scraping_logs` (histórico de execuções)

curl "http://localhost:3001/api/scrape-news?sre=barbacena&pages=2"- Índices para performance

```- Policies RLS básicas



### **6. Acesse os Dashboards**### 5. Executar o Projeto



- **Licitações**: http://localhost:3001/dashboard```bash

- **Notícias**: http://localhost:3001/noticiasnpm run dev

```

---

Acesse: http://localhost:3001

## 📁 Estrutura do Projeto

## 🤖 Scripts de Automação

```

Importadordelicitacoes/Este projeto inclui **scripts PowerShell** para automatizar tarefas comuns:

├── app/

│   ├── api/### 🚀 Setup Automatizado

│   │   ├── licitacoes/          # APIs de licitações```powershell

│   │   ├── noticias/            # APIs de notícias.\setup.ps1

│   │   ├── scrape-specific/     # Coleta de licitações```

│   │   └── scrape-news/         # Coleta de notíciasConfigura todo o projeto automaticamente.

│   ├── dashboard/               # Dashboard de licitações

│   ├── noticias/                # Dashboard de notícias### 🎬 Demo Automatizada

│   │   └── [id]/                # Detalhes de notícia```powershell

│   └── page.tsx                 # Redireciona para /dashboard.\demo.ps1

├── lib/```

│   ├── scrapers/Executa demo completa: inicia servidor, testa API, coleta dados, abre navegador.

│   │   ├── specific-parser.ts   # Parser de licitações

│   │   └── news-parser.ts       # Parser de notícias (NOVO)### 🔍 Verificação do Sistema

│   ├── ai/```powershell

│   │   └── categorizer.ts       # Categorizador IA/NLP (NOVO).\check.ps1

│   └── supabase/```

│       ├── client.ts            # Cliente SupabaseVerifica se tudo está configurado corretamente.

│       ├── queries.ts           # Queries do banco

│       ├── schema-licitacoes.sql### 🔍 Coleta Automatizada

│       └── schema-noticias.sql  # Schema notícias (NOVO)```powershell

├── SREs.txt                     # Lista de 47 SREs# Coletar 3 SREs

├── .env.example                 # Exemplo de configuração.\scrape.ps1

├── validar-sistema.ps1          # Script de validação (NOVO)

└── DOCUMENTACAO/# Coletar 5 SREs

    ├── INICIO-RAPIDO-NOTICIAS.md.\scrape.ps1 -Count 5

    ├── COMO-TESTAR-NOTICIAS.md

    ├── SISTEMA-NOTICIAS-IA.md# SRE específica

    └── RESPOSTA-SISTEMA-IA.md.\scrape.ps1 -SRE "metropa"

``````



---📚 **Documentação completa**: Ver `SCRIPTS.md`



## 🛠️ Tecnologias## 📖 Como Usar o POC



- **Framework**: Next.js 15.5.4 (App Router)### Interface Web

- **Runtime**: Node.js

- **Database**: PostgreSQL (Supabase)1. **Página Inicial** (/)

- **UI**: React + Tailwind CSS   - Visão geral do sistema

- **Charts**: Recharts   - Acesso ao Dashboard e Coleta

- **Icons**: Lucide React

- **Scraping**: Cheerio + Axios2. **Coletar Dados** (/scrape)

- **IA/NLP**: Implementação local (sem APIs externas)   - Escolha quantas SREs coletar (1-47)

   - Clique em "Iniciar Coleta"

---   - Aguarde o processamento (2s por SRE)

   - Visualize resultados em tempo real

## 📊 Dados Coletados

3. **Dashboard** (/dashboard)

### Licitações (18 campos):   - Visualize licitações coletadas

- Número do edital   - Estatísticas gerais

- Modalidade   - Filtros por SRE

- Objeto

- Valor estimado### API Endpoints

- Data de publicação

- Data de abertura#### GET /api/scrape

- SituaçãoInicia coleta de dados

- Categoria

- SRE origem```bash

# Coletar primeiras 3 SREs

### Notícias (30+ campos):curl http://localhost:3001/api/scrape?count=3

- Título, conteúdo, resumo

- Categoria IA (8 tipos)# Coletar SRE específica

- Subcategoria IAcurl http://localhost:3001/api/scrape?sre=metropa

- Tags automáticas```

- Entidades extraídas (datas, valores, processos, pessoas, instituições, locais)

- Sentimento (positivo/neutro/negativo)#### GET /api/licitacoes

- Prioridade (alta/média/baixa)Lista licitações coletadas

- Score de relevância (0-100)

- Resumo IA```bash

- Palavras-chave IA# Todas as licitações

- Ações recomendadascurl http://localhost:3001/api/licitacoes

- Documentos anexos

- Links externos# Por SRE específica

curl http://localhost:3001/api/licitacoes?sre=SRE+metropa

---```



## 🧪 Testes#### GET /api/logs

Histórico de coletas

### Licitações:

```powershell```bash

# Teste rápido (3 SREs)curl http://localhost:3001/api/logs

curl "http://localhost:3001/api/scrape-specific?count=3"```



# Coleta completa (47 SREs)## 🔍 Arquitetura do POC

curl "http://localhost:3001/api/scrape-specific?count=47"

``````

/app

### Notícias:  /api

```powershell    /scrape       → Endpoint de coleta

# Teste rápido (1 SRE)    /licitacoes   → Consulta de dados

curl "http://localhost:3001/api/scrape-news?sre=barbacena&pages=2"    /logs         → Logs de execução

  /dashboard      → Interface de visualização

# Múltiplas SREs  /scrape         → Interface de coleta

curl "http://localhost:3001/api/scrape-news?count=5&pages=1"  page.tsx        → Homepage



# SREs específicas (POST)/lib

curl -X POST "http://localhost:3001/api/scrape-news" `  /scrapers

  -H "Content-Type: application/json" `    sre-scraper.ts → Lógica de web scraping

  -d '{\"sres\": [\"barbacena\", \"uba\"], \"pages\": 2}'    sre-urls.ts    → Lista de 47 SREs

```  /supabase

    client.ts      → Cliente Supabase

### Validação Completa:    queries.ts     → Operações de banco

```powershell    schema.sql     → Schema do banco

.\validar-sistema.ps1

```SREs.txt          → URLs originais

```

---

## ⚠️ Limitações do POC

## 📚 Documentação

Este é um **Proof of Concept** com limitações intencionais:

### Guias de Início:

- **[Início Rápido - Notícias](INICIO-RAPIDO-NOTICIAS.md)** - 3 passos para começar1. **Scraping Genérico**: 

- **[Como Testar - Notícias](COMO-TESTAR-NOTICIAS.md)** - 10 testes completos   - Parser básico que funciona melhor com alguns portais

   - Cada SRE pode ter estrutura HTML diferente

### Arquitetura:   - Produção requer parsers específicos por SRE

- **[Sistema de Notícias IA](SISTEMA-NOTICIAS-IA.md)** - Documentação técnica completa

- **[Resposta Sistema IA](RESPOSTA-SISTEMA-IA.md)** - Explicação detalhada2. **Rate Limiting Simples**:

   - Delay fixo de 2s entre requisições

### Scripts:   - Não há retry automático

- **`test-noticias.ps1`** - Testes automatizados   - Sem controle de concorrência

- **`validar-sistema.ps1`** - Validação do setup

3. **Validação Mínima**:

---   - Dados são salvos "as-is"

   - Pouca normalização

## 🔧 Comandos Úteis   - Campos opcionais



```bash4. **Sem Autenticação**:

# Desenvolvimento   - Endpoints públicos

npm run dev              # Inicia servidor (port 3001)   - Sem controle de acesso

npm run build            # Build de produção   - Supabase RLS configurado como público

npm start                # Inicia servidor de produção

## 🎨 Melhorias Sugeridas para Produção

# Validação

.\validar-sistema.ps1    # Valida configuração completa### Scraping Avançado

- [ ] Parser específico por SRE após análise manual

# Testes- [ ] Detecção de mudanças nos portais

.\test-noticias.ps1      # Testa coleta de notícias- [ ] OCR para PDFs de editais

```- [ ] Puppeteer para sites com JavaScript



---### Performance

- [ ] Queue system (Bull/BullMQ) para processamento assíncrono

## 🎨 Capturas de Tela- [ ] Caching com Redis

- [ ] Scraping paralelo controlado

### Dashboard de Licitações- [ ] Incremental updates (apenas novos editais)

- Gráficos de barras e pizza

- Filtros avançados### Monitoramento

- Lista de licitações clicável- [ ] Alertas de falha via email/Slack

- Navegação para notícias- [ ] Métricas de sucesso por SRE

- [ ] Dashboard de saúde do sistema

### Dashboard de Notícias (NOVO!)- [ ] Logs estruturados (Datadog/Sentry)

- 4 cards de estatísticas

- Gráfico por categoria (8 tipos)### Dados

- Gráfico por SRE (Top 10)- [ ] Validação rigorosa com Zod

- Busca full-text- [ ] Normalização de datas/valores

- Filtros dinâmicos- [ ] Detecção de duplicatas

- Lista com badges de prioridade- [ ] Histórico de alterações



### Detalhes de Notícia (NOVO!)### Segurança

- Resumo inteligente (IA)- [ ] Autenticação (NextAuth.js)

- Badges de categoria e prioridade- [ ] API Keys para endpoints

- Score de relevância- [ ] RLS policies adequadas

- Entidades extraídas organizadas- [ ] Rate limiting por usuário

- Ações recomendadas

- Documentos anexos## 📊 Estrutura do Banco de Dados

- Links relacionados

### Tabela: licitacoes

---```sql

id                UUID (PK)

## 🚀 Próximos Passossre_source        VARCHAR(100)   -- Nome da SRE

numero_edital     VARCHAR(50)    -- Número do edital

### Curto Prazo:modalidade        VARCHAR(50)    -- Pregão, Concorrência, etc.

- [ ] Coleta automática diária (cron jobs)objeto            TEXT           -- Descrição

- [ ] Sistema de alertas por emailvalor_estimado    DECIMAL        -- Valor em R$

- [ ] Exportação de relatórios (PDF/Excel)data_publicacao   DATE

- [ ] Busca avançada com filtros combinadosdata_abertura     TIMESTAMP

situacao          VARCHAR(50)    -- Aberto, Encerrado, etc.

### Médio Prazo:documentos        JSONB          -- URLs de documentos

- [ ] Dashboard unificado (licitações + notícias)raw_data          JSONB          -- Dados brutos coletados

- [ ] Análise de tendências temporaiscreated_at        TIMESTAMP

- [ ] Comparação entre SREsupdated_at        TIMESTAMP

- [ ] API pública REST```



### Longo Prazo:### Tabela: scraping_logs

- [ ] Machine Learning para previsões```sql

- [ ] Integração com outros sistemasid              UUID (PK)

- [ ] Mobile app (React Native)sre_source      VARCHAR(100)

- [ ] Sistema de notificações pushstatus          VARCHAR(50)     -- success, error, in_progress

records_found   INTEGER

---error_message   TEXT

started_at      TIMESTAMP

## 🐛 Troubleshootingcompleted_at    TIMESTAMP

```

### Erro: "Connection refused"

**Solução:** Inicie o servidor com `npm run dev`## 🐛 Troubleshooting



### Erro: "Table does not exist"### Erro: "Missing Supabase environment variables"

**Solução:** Execute os schemas SQL no Supabase- Verifique se `.env.local` existe e está preenchido

- Reinicie o servidor (`npm run dev`)

### Dashboard vazio

**Solução:** Execute coleta de dados primeiro### Nenhuma licitação coletada

- Portais SRE podem estar offline

### Erro de autenticação- HTML pode ter mudado (parser genérico)

**Solução:** Verifique credenciais em `.env.local`- Confira logs em `/api/logs`



**Documentação completa:** `COMO-TESTAR-NOTICIAS.md`### Erro de conexão com Supabase

- Verifique credenciais em `.env.local`

---- Confirme que schema SQL foi executado

- Teste conexão no Supabase Dashboard

## 📊 Estatísticas do Projeto

## 📝 Lista de SREs

- **Linhas de código**: ~8.000+

- **APIs**: 8 endpointsO sistema monitora 47 SREs:

- **Dashboards**: 3 (home, licitações, notícias)- Metropolitana A, B, C

- **Páginas**: 5+ (incluindo detalhes)- Almenara, Araçuaí, Barbacena, Belo Horizonte

- **Componentes**: 15+- Carangola, Caratinga, Caxambu, Conselheiro Lafaiete

- **SREs cobertas**: 47- E mais 37...

- **Categorias IA**: 8

- **Tipos de entidades**: 6Ver lista completa em `lib/scrapers/sre-urls.ts` ou `SREs.txt`.



---## 🤝 Apresentação para Cliente



## 📝 Licença### Pontos-Chave



Este projeto foi desenvolvido para fins educacionais e administrativos, focado na coleta e análise de dados públicos das SREs de Minas Gerais.1. **Viabilidade Técnica**: ✅ POC demonstra que é possível coletar dados

2. **Escalabilidade**: Sistema preparado para crescer (Next.js + Supabase)

---3. **Manutenibilidade**: Código TypeScript, bem estruturado

4. **Custo-benefício**: Stack gratuita no início (Vercel + Supabase free tier)

## 🤝 Contribuindo

### Demo Script

Contribuições são bem-vindas! Sinta-se à vontade para:

- Reportar bugs1. Mostrar homepage explicando conceito

- Sugerir novas funcionalidades2. Executar coleta de 2-3 SREs na página /scrape

- Melhorar a documentação3. Visualizar resultados no dashboard

- Enviar pull requests4. Mostrar API endpoints funcionando

5. Apresentar código limpo e documentado

---

### Próximos Passos Sugeridos

## 📧 Contato

1. **Fase 2**: Análise detalhada de 5-10 SREs prioritárias

Para dúvidas ou sugestões, abra uma issue no repositório.2. **Fase 3**: Parsers específicos para SREs analisadas

3. **Fase 4**: Sistema de alertas e notificações

---4. **Fase 5**: Integração com sistemas do cliente



**Desenvolvido com ❤️ para facilitar o acesso a informações públicas das SREs de Minas Gerais**---

## 🤖 Integração OpenRouter (IA Avançada)

### O Que É?

Sistema híbrido de categorização usando **LLMs reais** (GPT-4, Claude, Gemini) via OpenRouter com fallback para NLP local.

### Recursos:
- ✅ **+100 modelos LLM** disponíveis
- ✅ **Cache automático** (economia 30-50%)
- ✅ **Fallback inteligente** (3 níveis: OpenRouter → Cache → NLP Local)
- ✅ **Tracking completo** (custos, tokens, performance)
- ✅ **Sincronização automática** via SQL triggers

### Custo:
- 💰 **GPT-4o Mini** (recomendado): $0.38 / 1.000 notícias
- 💰 **Claude 3 Haiku**: $0.61 / 1.000 notícias
- 💰 **Llama 3.1 70B**: $0.57 / 1.000 notícias

### Quick Start:
```bash
# 1. Executar schema SQL no Supabase
lib/supabase/schema-openrouter.sql

# 2. Configurar .env.local
OPENROUTER_API_KEY=sk-or-v1-sua-chave
OPENROUTER_DEFAULT_MODEL=openai/gpt-4o-mini
OPENROUTER_FALLBACK_TO_LOCAL=true

# 3. Adicionar créditos ($5-10)
https://openrouter.ai/credits

# 4. Testar
curl "http://localhost:3001/api/scrape-news?sre=barbacena&pages=1"
```

### Documentação Completa:
- 📚 **Quick Start**: `docs/QUICK-START-OPENROUTER.md`
- 📊 **Custos e Modelos**: `docs/OPENROUTER-CUSTOS.md`
- 📋 **Resumo**: `docs/RESUMO-INTEGRACAO-OPENROUTER.md`

---

## 📄 Licença



---Este é um projeto de demonstração (POC). Direitos e licença a definir com o cliente.



## ✅ Status do Projeto## 👨‍💻 Suporte



- ✅ Sistema de Licitações: **100% Operacional**Para dúvidas sobre este POC, consulte:

- ✅ Sistema de Notícias com IA: **100% Operacional**- Documentação do Next.js: https://nextjs.org/docs

- ✅ Dashboards Visuais: **100% Operacional**- Documentação do Supabase: https://supabase.com/docs

- ✅ Documentação: **Completa**- `.github/copilot-instructions.md` para contexto técnico

- 🔄 Testes em Produção: **Em Andamento**

---

**Última atualização**: 1 de outubro de 2025

**Versão**: 1.0.0 (POC)  
**Data**: Outubro 2025
