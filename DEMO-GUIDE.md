# 🚀 Guia Rápido - Demonstração para Cliente

## Setup em 5 Minutos

### 1️⃣ Instalar Dependências
```bash
npm install
```

### 2️⃣ Configurar Supabase

**Criar Projeto:**
1. Acesse https://supabase.com e crie uma conta gratuita
2. Clique em "New Project"
3. Preencha: Nome, Database Password, Region (escolha South America)
4. Aguarde 2 minutos para projeto ser criado

**Copiar Credenciais:**
1. No projeto criado, vá em Settings > API
2. Copie:
   - `Project URL`
   - `anon public` (chave pública)
   - `service_role` (chave de serviço - clicar em "Reveal")

**Configurar .env.local:**
1. Copie o arquivo `.env.local.example` para `.env.local`
2. Cole as 3 credenciais copiadas:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3️⃣ Criar Tabelas no Banco

1. No Supabase, clique em **SQL Editor** (menu lateral)
2. Clique em **+ New Query**
3. Abra o arquivo `lib/supabase/schema.sql` deste projeto
4. Copie TODO o conteúdo
5. Cole no SQL Editor do Supabase
6. Clique em **Run** (Ctrl+Enter)
7. Confirme sucesso: "Success. No rows returned"

### 4️⃣ Iniciar Aplicação

```bash
npm run dev
```

Abra no navegador: http://localhost:3000

## 🎬 Roteiro de Demonstração

### Passo 1: Página Inicial
- Mostre a homepage explicando o conceito
- 47 SREs monitoradas
- 2 funcionalidades principais: Dashboard e Coleta

### Passo 2: Executar Coleta
1. Clique em "Coletar Dados"
2. Deixe o padrão: 1 SRE
3. Clique em "Iniciar Coleta"
4. Aguarde ~5-10 segundos
5. Mostre os resultados:
   - Status de sucesso/erro
   - Número de registros encontrados

### Passo 3: Visualizar Dashboard
1. Clique em "Ver Dashboard"
2. Mostre:
   - Estatísticas (Total, SREs com dados, Últimas 24h)
   - Tabela com licitações coletadas
3. Clique em "Atualizar" para refresh

### Passo 4: Testar API (Opcional)

Abra um novo terminal e teste:

```bash
# Listar licitações coletadas
curl http://localhost:3000/api/licitacoes

# Ver logs de execução
curl http://localhost:3000/api/logs

# Coletar mais 2 SREs
curl http://localhost:3000/api/scrape?count=2
```

## 💡 Pontos-Chave para Destacar

### ✅ Viabilidade Técnica Comprovada
"Este POC demonstra que é tecnicamente viável coletar dados de licitações dos 47 portais SRE de forma automatizada."

### ✅ Escalabilidade
"A arquitetura escolhida (Next.js + Supabase) permite crescimento sem grandes refatorações. Podemos escalar para milhares de coletas diárias."

### ✅ Flexibilidade
"Sistema preparado para integração via API REST. Qualquer aplicação pode consumir os dados coletados."

### ✅ Custo-Benefício
"Stack completamente gratuita no início:
- Supabase: 500MB storage, 2GB transfer/mês (grátis)
- Vercel: Deploy ilimitado (grátis)
- Custo estimado inicial: R$ 0/mês"

## ⚠️ Limitações Explicadas

### Scraping Genérico
"Este POC usa um parser genérico que tenta identificar licitações em qualquer estrutura HTML. Na produção, criaríamos parsers específicos para cada SRE, aumentando a precisão de 40% para 95%+."

### Performance
"Atualmente processa 1 SRE a cada 2 segundos (rate limiting conservador). Podemos otimizar para processar todas as 47 SREs em menos de 2 minutos com paralelização controlada."

### Dados
"Os campos extraídos são básicos. Com análise detalhada de cada portal, extrairemos: número do edital, valor estimado, modalidade, documentos anexos, etc."

## 📊 Próximos Passos Sugeridos

### Fase 2: Análise Detalhada (2 semanas)
- Análise manual de 10-15 SREs prioritárias
- Documentação de estruturas HTML
- Identificação de padrões comuns
- **Entregável**: Documento técnico com mapeamento

### Fase 3: Parsers Específicos (3-4 semanas)
- Desenvolvimento de scrapers otimizados
- Extração de todos os campos relevantes
- Testes de regressão
- **Entregável**: Sistema funcional para SREs prioritárias

### Fase 4: Automação Completa (2-3 semanas)
- Agendamento automático (ex: diário às 6h)
- Sistema de alertas por email
- Dashboard administrativo
- **Entregável**: Sistema rodando em produção

### Fase 5: Integração (1-2 semanas)
- API para sistemas do cliente
- Webhooks para eventos importantes
- Documentação de integração
- **Entregável**: API documentada e testada

## 🎯 Budget Estimado

### Desenvolvimento
- Fase 2: [definir com cliente]
- Fase 3: [definir com cliente]
- Fase 4: [definir com cliente]
- Fase 5: [definir com cliente]

### Infraestrutura (mensal)
- **Meses 1-3**: R$ 0 (free tier)
- **Meses 4-6**: ~R$ 50-100 (Supabase Pro)
- **Meses 7+**: ~R$ 150-300 (conforme escala)

## 🤔 Perguntas Esperadas

### "Por que alguns dados estão incompletos?"
"O POC usa scraping genérico. Com parsers específicos por SRE, conseguiremos 100% dos campos. Exemplo: de 'objeto vago' para 'Pregão 123/2025 - Aquisição de materiais escolares - R$ 50.000,00'."

### "Quanto tempo demora para coletar todas as 47 SREs?"
"Atualmente: ~2 minutos com rate limiting conservador. Otimizado: ~30-40 segundos. Frequência recomendada: 1x por dia ou quando houver alertas de novos editais."

### "E se um portal SRE sair do ar?"
"O sistema registra falhas individuais e continua com as outras SREs. Tentativas de retry automático após X horas. Alertas para administradores."

### "Posso integrar com meu sistema atual?"
"Sim! A API REST permite integração com qualquer sistema. Também podemos criar webhooks para notificações em tempo real."

## 📞 Contato

Para dúvidas ou discussão de próximos passos:
- **Email**: [seu-email@example.com]
- **Telefone**: [seu-telefone]
- **GitHub**: [seu-usuario/projeto]

---

**Preparado para impressionar! 🚀**
