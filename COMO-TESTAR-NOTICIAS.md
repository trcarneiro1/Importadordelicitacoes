# 🚀 Como Testar o Dashboard de Notícias com IA

## ✅ Pré-requisitos

1. **Criar tabela no Supabase**:
   ```bash
   # Acesse: https://supabase.com/dashboard/project/SEU_PROJETO/editor
   # Vá em SQL Editor > New Query
   # Cole o conteúdo de: lib/supabase/schema-noticias.sql
   # Execute o script (RUN)
   ```

2. **Servidor Next.js rodando**:
   ```bash
   npm run dev
   # Deve estar rodando em http://localhost:3001
   ```

---

## 🧪 Teste 1: Coletar Notícias de 1 SRE (Rápido - 30s)

### Via PowerShell:
```powershell
# Teste com SRE Barbacena (2 páginas)
curl "http://localhost:3001/api/scrape-news?sre=barbacena&pages=2"
```

### Via Navegador:
```
http://localhost:3001/api/scrape-news?sre=barbacena&pages=2
```

### ✅ Resultado Esperado:
- JSON com `success: true`
- `noticias_coletadas`: ~30-40 notícias
- `noticias_categorizadas`: ~30-40 (100%)
- `noticias_salvas_banco`: ~30-40
- `estatisticas.por_categoria`: 8 categorias distribuídas
- `estatisticas.por_prioridade`: alta/media/baixa
- `tempo_total_ms`: 15.000-30.000ms (15-30s)

---

## 🧪 Teste 2: Coletar Notícias de Múltiplas SREs (Médio - 2 min)

### Via PowerShell:
```powershell
# Teste com 3 SREs aleatórias (1 página cada)
curl "http://localhost:3001/api/scrape-news?count=3&pages=1"
```

### Via POST (específicas):
```powershell
curl -X POST "http://localhost:3001/api/scrape-news" `
  -H "Content-Type: application/json" `
  -d '{\"sres\": [\"barbacena\", \"uba\", \"conselheirolafaiete\"], \"pages\": 1}'
```

### ✅ Resultado Esperado:
- `sres_processadas`: 3
- `noticias_coletadas`: ~50-70 notícias
- `detalhes_por_sre`: Array com 3 itens
- Cada SRE com métricas individuais

---

## 🧪 Teste 3: Visualizar Dashboard (Frontend)

### 1. Acessar Dashboard:
```
http://localhost:3001/noticias
```

### ✅ O que você deve ver:

#### **Topo da Página:**
- ✅ Título: "Central de Notícias das SREs"
- ✅ Subtítulo: "Sistema inteligente de categorização com IA"
- ✅ Botão "Atualizar"

#### **Barra de Busca:**
- ✅ Campo de busca com placeholder
- ✅ Botão "Filtros" (com contador de filtros ativos)
- ✅ Ao clicar em Filtros: 3 dropdowns (Categoria, Prioridade, SRE)

#### **Cards de Estatísticas (4 cards):**
1. **Total de Notícias** (ícone azul)
2. **Alta Prioridade** (ícone vermelho)
3. **Média Prioridade** (ícone amarelo)
4. **Baixa Prioridade** (ícone cinza)

#### **Gráficos (2 gráficos lado a lado):**
1. **Notícias por Categoria** (barras horizontais)
   - 8 categorias: Licitações, Processos Seletivos, Editais RH, Avisos, Programas, Eventos, Resultados, Outros
   - Cada linha com nome + count + porcentagem + barra azul
   
2. **Notícias por SRE** (Top 10)
   - Ranking das SREs com mais notícias
   - Barras roxas/indigo

#### **Lista de Notícias:**
Cada card deve ter:
- ✅ **Badges no topo**: Prioridade (alta/média/baixa) + Categoria + Subcategoria
- ✅ **Sentimento**: Emoji (😊😐😟)
- ✅ **Score de Relevância**: Estrela amarela + número (0-100)
- ✅ **Título**: Grande, clicável, muda de cor no hover
- ✅ **Resumo IA**: Texto cinza, 2 linhas
- ✅ **Metadados**: Ícones com SRE + Data + Documentos
- ✅ **Tags**: Pills azuis (max 5 visíveis)
- ✅ **Ações Recomendadas**: Box amarelo com lista de bullets
- ✅ **Link Original**: "Ver notícia original" (azul)
- ✅ **Data Coleta**: "Coletado em..." (cinza, pequeno)

#### **Interações:**
- ✅ **Busca**: Digite palavras-chave → filtragem instantânea
- ✅ **Filtros**: Selecione categoria/prioridade/SRE → atualiza lista
- ✅ **Ordenação**: Dropdown "Ordenar por" (Relevância/Data/Prioridade)
- ✅ **Click em Card**: Redireciona para `/noticias/{id}`

---

## 🧪 Teste 4: Visualizar Detalhes de Notícia

### 1. No Dashboard, clique em qualquer notícia

### 2. Página de Detalhes:
```
http://localhost:3001/noticias/{id}
```

### ✅ O que você deve ver:

#### **Header:**
- ✅ Botão "← Voltar para notícias" (topo esquerda)
- ✅ Background branco fixo (sticky)

#### **Badges de Status:**
- ✅ Prioridade (grande, colorido)
- ✅ Categoria (colorido com borda)
- ✅ Subcategoria (cinza)
- ✅ Sentimento (emoji + texto)
- ✅ Score de Relevância (estrela + número)

#### **Título e Metadados:**
- ✅ Título gigante (4xl)
- ✅ SRE (com ícone de mapa)
- ✅ Data de publicação (formatada)
- ✅ Link "Ver original" (azul, externo)

#### **Layout 2 Colunas:**

**Coluna Esquerda (2/3 da largura):**

1. **Resumo Inteligente (IA):**
   - ✅ Box roxo/azul gradiente
   - ✅ Ícone de cérebro
   - ✅ Texto do resumo

2. **Conteúdo Completo:**
   - ✅ Box branco com sombra
   - ✅ Ícone de documento
   - ✅ Conteúdo HTML formatado (prose)

3. **Ações Recomendadas pela IA:**
   - ✅ Box amarelo
   - ✅ Ícone de alvo
   - ✅ Lista com checkmarks verdes

4. **Documentos Anexos:**
   - ✅ Lista de cards clicáveis
   - ✅ Cada um com ícone + nome + URL truncada
   - ✅ Hover muda background

**Coluna Direita (1/3 da largura - Sidebar):**

1. **Palavras-Chave (IA):**
   - ✅ Ícone Sparkles (estrelinhas)
   - ✅ Pills roxas arredondadas

2. **Tags:**
   - ✅ Pills azuis

3. **Entidades Extraídas (IA):**
   - ✅ Ícone de cérebro
   - ✅ Seções organizadas por tipo:
     - 📅 **Datas Importantes** (cinza)
     - 💰 **Valores** (verde)
     - 📋 **Processos** (azul, monospace)
     - 👤 **Pessoas** (roxo)
     - 🏢 **Instituições** (indigo)
     - 📍 **Locais** (teal)

4. **Links Relacionados:**
   - ✅ Até 5 links externos
   - ✅ Truncados com "..."
   - ✅ Azul com hover underline

5. **Info de Coleta:**
   - ✅ Box cinza no rodapé
   - ✅ Categoria original, data coleta, ID

---

## 🧪 Teste 5: Script PowerShell Automatizado

Execute o script de testes completo:

```powershell
cd H:\projetos\Importadordelicitacoes
.\test-noticias.ps1
```

### ✅ O script executa automaticamente:
1. Teste 1: 1 SRE (Barbacena, 2 páginas)
2. Teste 2: 3 SREs aleatórias (1 página cada)
3. Teste 3: POST com SREs específicas

**Output colorido mostrando:**
- ✅ Resumo da coleta
- ✅ Estatísticas por categoria
- ✅ Estatísticas por prioridade
- ✅ Detalhes de cada SRE
- ✅ Erros (se houver)

---

## 🧪 Teste 6: Validar Dados no Banco

### Via Supabase Dashboard:
```sql
-- Ver todas as notícias
SELECT * FROM noticias ORDER BY data_publicacao DESC LIMIT 10;

-- Contar por categoria
SELECT categoria_ia, COUNT(*) as total 
FROM noticias 
GROUP BY categoria_ia 
ORDER BY total DESC;

-- Ver notícias de alta prioridade
SELECT * FROM noticias_alta_prioridade;

-- Estatísticas por SRE
SELECT * FROM noticias_stats_por_sre;

-- Buscar notícia por termo
SELECT * FROM buscar_noticias('processo seletivo', 10);

-- Tags populares
SELECT * FROM noticias_tags_populares;
```

---

## 🧪 Teste 7: Testar Busca Full-Text

### No Dashboard:
1. Digite na barra de busca: **"processo seletivo"**
   - ✅ Deve filtrar notícias com esse termo no título/conteúdo/tags

2. Digite: **"edital"**
   - ✅ Deve mostrar editais de licitação e RH

3. Digite: **"suspensão"**
   - ✅ Deve mostrar avisos de suspensão

4. Limpe a busca
   - ✅ Deve voltar a mostrar todas

---

## 🧪 Teste 8: Testar Filtros Combinados

### No Dashboard:
1. Clique em **"Filtros"**
2. Selecione:
   - **Categoria**: Processos Seletivos
   - **Prioridade**: Alta
   - **SRE**: BARBACENA
3. ✅ Lista deve mostrar apenas notícias que atendem os 3 critérios
4. Badge no botão "Filtros" deve mostrar **(3)**

---

## 🧪 Teste 9: Testar Ordenação

### No Dashboard:
1. **Ordenar por: Relevância**
   - ✅ Notícias com score mais alto aparecem primeiro

2. **Ordenar por: Data**
   - ✅ Mais recentes primeiro

3. **Ordenar por: Prioridade**
   - ✅ Alta → Média → Baixa

---

## 🧪 Teste 10: Navegação entre Dashboard e Notícias

### A partir do Dashboard de Licitações:
```
http://localhost:3001/dashboard
```

1. ✅ Deve ter botão **"📰 Central de Notícias (IA)"** (roxo/indigo)
2. Clique no botão
3. ✅ Deve redirecionar para `/noticias`

### A partir da Central de Notícias:
1. Clique em qualquer notícia
2. ✅ Abre página de detalhes `/noticias/{id}`
3. Clique em **"← Voltar para notícias"**
4. ✅ Volta para `/noticias`

---

## 📊 Métricas de Sucesso

### Performance:
- ✅ Coleta de 1 SRE: **< 30 segundos**
- ✅ Coleta de 3 SREs: **< 2 minutos**
- ✅ Carregamento do dashboard: **< 2 segundos**
- ✅ Busca/filtros: **instantâneo** (< 100ms)

### Categorização IA:
- ✅ Taxa de categorização: **100%** (todas as notícias categorizadas)
- ✅ Precisão esperada: **85-95%** (categorias fazem sentido)
- ✅ Extração de entidades: **70-90%** (datas, valores, processos identificados)

### Qualidade dos Insights:
- ✅ Resumos IA: **coerentes** com o conteúdo
- ✅ Palavras-chave: **relevantes** para o tema
- ✅ Ações recomendadas: **práticas** e **acionáveis**
- ✅ Prioridade: **alinhada** com urgência real

---

## 🐛 Troubleshooting

### Problema: "Nenhuma notícia encontrada"
**Solução:**
1. Verifique se a tabela foi criada no Supabase
2. Execute o script de coleta antes: `curl "http://localhost:3001/api/scrape-news?sre=barbacena&pages=1"`
3. Verifique credenciais do Supabase em `.env.local`

### Problema: Erro ao categorizar
**Solução:**
1. Verifique logs do servidor: `npm run dev`
2. Erro comum: `categorizer.ts` não importado corretamente
3. Reinicie o servidor Next.js

### Problema: Dashboard vazio
**Solução:**
1. Abra DevTools (F12) → Console
2. Verifique erros de fetch
3. Teste API manualmente: `http://localhost:3001/api/noticias`

### Problema: Página de detalhes não carrega
**Solução:**
1. Verifique se o ID existe no banco
2. Teste API: `http://localhost:3001/api/noticias/{id}`
3. Verifique rota dynamic: `app/noticias/[id]/page.tsx`

---

## 🎉 Próximos Passos

Depois que tudo estiver funcionando:

1. **Coleta em Massa**:
   ```bash
   # Coletar TODAS as 47 SREs (vai demorar ~15-20 min)
   curl "http://localhost:3001/api/scrape-news?count=47&pages=2"
   ```

2. **Agendar Coleta Diária**:
   - Usar Vercel Cron Jobs
   - Ou GitHub Actions com schedule
   - Rodar todo dia às 6h da manhã

3. **Sistema de Alertas**:
   - Email para notícias de alta prioridade
   - Webhook para Slack/Discord
   - Notificações push

4. **Análise Avançada**:
   - Comparação mês a mês
   - Previsão de tendências
   - Relatórios PDF automáticos

5. **Integração com Licitações**:
   - Combinar dados de licitações + notícias
   - Dashboard unificado
   - Alertas cruzados

---

## 📚 Documentação Adicional

- **Arquitetura Completa**: `SISTEMA-NOTICIAS-IA.md`
- **Resposta Original**: `RESPOSTA-SISTEMA-IA.md`
- **Auditoria Funcionalidades**: `AUDITORIA-FUNCIONALIDADES.md`

---

## ✅ Checklist Final

Antes de considerar pronto, verifique:

- [ ] Tabela `noticias` criada no Supabase
- [ ] Script SQL executado sem erros
- [ ] Servidor Next.js rodando (port 3001)
- [ ] API `/api/scrape-news` responde
- [ ] API `/api/noticias` retorna dados
- [ ] Dashboard `/noticias` carrega
- [ ] Filtros funcionam
- [ ] Busca funciona
- [ ] Ordenação funciona
- [ ] Click em notícia abre detalhes
- [ ] Página de detalhes exibe todos os campos
- [ ] Entidades extraídas aparecem
- [ ] Ações recomendadas aparecem
- [ ] Tags e palavras-chave aparecem
- [ ] Botão no dashboard de licitações funciona
- [ ] Navegação entre páginas funciona

**Tudo certo? Sistema 100% operacional! 🎉**
