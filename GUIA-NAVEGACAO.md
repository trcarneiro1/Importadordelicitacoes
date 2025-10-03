# 🗺️ Guia Visual de Navegação

## Fluxo de Páginas do Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                    http://localhost:3001/                       │
│                   (REDIRECIONA AUTOMATICAMENTE)                 │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                   DASHBOARD DE LICITAÇÕES                       │
│                  http://localhost:3001/dashboard                │
├─────────────────────────────────────────────────────────────────┤
│  📊 4 Cards de Estatísticas:                                    │
│     • Total de Licitações                                       │
│     • Valor Total                                               │
│     • Licitações Abertas                                        │
│     • Valor Médio                                               │
│                                                                  │
│  📈 2 Gráficos:                                                 │
│     • Licitações por SRE (Barras)                              │
│     • Distribuição por Modalidade (Pizza)                       │
│                                                                  │
│  🎛️ Filtros:                                                    │
│     • SRE, Modalidade, Situação, Valor Min/Max                 │
│                                                                  │
│  📋 Tabela de Licitações:                                       │
│     • Clicável para ver detalhes                               │
│     • Ordenável por coluna                                      │
│                                                                  │
│  🔘 BOTÕES:                                                     │
│     [← Voltar]  [📰 Central de Notícias (IA)]                  │
└────────────────┬──────────────────────────────┬─────────────────┘
                 │                              │
       (Click na linha)              (Click no botão notícias)
                 │                              │
                 ↓                              ↓
┌─────────────────────────────┐    ┌───────────────────────────────┐
│   DETALHES DA LICITAÇÃO     │    │   CENTRAL DE NOTÍCIAS (IA)   │
│   /dashboard/[id]           │    │   /noticias                   │
├─────────────────────────────┤    ├───────────────────────────────┤
│  🎯 Informações Principais: │    │  🔍 BARRA DE BUSCA:          │
│     • Número do Edital      │    │     • Full-text search        │
│     • SRE                   │    │     • Placeholder instrutivo  │
│     • Modalidade            │    │                               │
│     • Valor Estimado        │    │  🎛️ FILTROS (expansível):    │
│     • Datas                 │    │     • Categoria (8 opções)    │
│     • Situação              │    │     • Prioridade (3 opções)   │
│                             │    │     • SRE (47 opções)         │
│  📝 Descrição Completa:     │    │     • Badge com contador      │
│     • Objeto detalhado      │    │                               │
│                             │    │  📊 4 CARDS ESTATÍSTICOS:    │
│  🔗 Metadados:              │    │     • Total Notícias          │
│     • Data de coleta        │    │     • Alta Prioridade 🔴      │
│     • Categoria             │    │     • Média Prioridade 🟡     │
│     • ID                    │    │     • Baixa Prioridade ⚪     │
│                             │    │                               │
│  🔘 BOTÃO:                  │    │  📈 2 GRÁFICOS:              │
│     [← Voltar p/ Dashboard] │    │     • Por Categoria (barras)  │
└─────────────────────────────┘    │     • Por SRE Top 10 (barras) │
                                    │                               │
                                    │  🔽 ORDENAÇÃO:               │
                                    │     • Relevância (padrão)     │
                                    │     • Data publicação         │
                                    │     • Prioridade              │
                                    │                               │
                                    │  📰 LISTA DE NOTÍCIAS:       │
                                    │     Cada card exibe:          │
                                    │     • Badges prioridade       │
                                    │     • Categoria + Sub         │
                                    │     • Sentimento (emoji)      │
                                    │     • Score relevância ⭐     │
                                    │     • Título (clicável)       │
                                    │     • Resumo IA               │
                                    │     • Metadados (SRE/data)    │
                                    │     • Tags (max 5)            │
                                    │     • Ações recomendadas 💡   │
                                    │     • Link original           │
                                    │                               │
                                    │  🔘 BOTÃO:                   │
                                    │     [🔄 Atualizar]            │
                                    └───────────┬───────────────────┘
                                                │
                                      (Click em qualquer notícia)
                                                │
                                                ↓
                                    ┌───────────────────────────────┐
                                    │   DETALHES DA NOTÍCIA        │
                                    │   /noticias/[id]              │
                                    ├───────────────────────────────┤
                                    │  ⬅️ [← Voltar p/ Notícias]   │
                                    │                               │
                                    │  🏷️ BADGES DE STATUS:        │
                                    │     • Prioridade (grande)     │
                                    │     • Categoria (colorido)    │
                                    │     • Subcategoria            │
                                    │     • Sentimento 😊😐😟       │
                                    │     • Score ⭐ /100           │
                                    │                               │
                                    │  📋 TÍTULO GRANDE             │
                                    │                               │
                                    │  📍 METADADOS:               │
                                    │     • SRE                     │
                                    │     • Data publicação         │
                                    │     • [🔗 Ver original]       │
                                    │                               │
                                    │  ┌─────────────────────────┐ │
                                    │  │ COLUNA PRINCIPAL (2/3)  │ │
                                    │  ├─────────────────────────┤ │
                                    │  │ 🧠 RESUMO IA:           │ │
                                    │  │    Box roxo gradiente   │ │
                                    │  │    Resumo inteligente   │ │
                                    │  │                         │ │
                                    │  │ 📝 CONTEÚDO COMPLETO:   │ │
                                    │  │    Box branco           │ │
                                    │  │    HTML formatado       │ │
                                    │  │                         │ │
                                    │  │ 💡 AÇÕES RECOMENDADAS:  │ │
                                    │  │    Box amarelo          │ │
                                    │  │    Lista com checks ✓   │ │
                                    │  │                         │ │
                                    │  │ 📎 DOCUMENTOS ANEXOS:   │ │
                                    │  │    Cards clicáveis      │ │
                                    │  │    PDFs, Google Drive   │ │
                                    │  └─────────────────────────┘ │
                                    │                               │
                                    │  ┌─────────────────────────┐ │
                                    │  │ SIDEBAR (1/3)           │ │
                                    │  ├─────────────────────────┤ │
                                    │  │ ✨ PALAVRAS-CHAVE IA:   │ │
                                    │  │    Pills roxas          │ │
                                    │  │                         │ │
                                    │  │ 🏷️ TAGS:               │ │
                                    │  │    Pills azuis          │ │
                                    │  │                         │ │
                                    │  │ 🧠 ENTIDADES IA:        │ │
                                    │  │    📅 Datas             │ │
                                    │  │    💰 Valores           │ │
                                    │  │    📋 Processos         │ │
                                    │  │    👤 Pessoas           │ │
                                    │  │    🏢 Instituições      │ │
                                    │  │    📍 Locais            │ │
                                    │  │                         │ │
                                    │  │ 🔗 LINKS RELACIONADOS:  │ │
                                    │  │    Max 5 links          │ │
                                    │  │                         │ │
                                    │  │ ℹ️ INFO DE COLETA:      │ │
                                    │  │    Categoria original   │ │
                                    │  │    Data coleta          │ │
                                    │  │    ID (UUID)            │ │
                                    │  └─────────────────────────┘ │
                                    └───────────────────────────────┘
```

---

## 🎨 Legenda de Cores

### Dashboard de Licitações:
- 🔵 **Azul**: Elementos principais, gráficos
- ⚪ **Branco**: Cards, backgrounds
- 🟦 **Azul Claro**: Gradiente de fundo

### Central de Notícias:
- 🔴 **Vermelho**: Alta prioridade, alertas
- 🟡 **Amarelo**: Média prioridade, ações recomendadas
- ⚪ **Cinza**: Baixa prioridade
- 🔵 **Azul**: Licitações e Compras
- 🟣 **Roxo**: Processos Seletivos, IA
- 🟢 **Verde**: Editais de RH
- 🟠 **Laranja**: Avisos
- 🔷 **Indigo**: Programas Educacionais
- 🩷 **Rosa**: Eventos
- 🔶 **Teal**: Resultados

---

## 🔗 URLs Completas

```
http://localhost:3001/                           → Redireciona para /dashboard
http://localhost:3001/dashboard                  → Dashboard de Licitações
http://localhost:3001/dashboard/[uuid]           → Detalhes de Licitação
http://localhost:3001/noticias                   → Central de Notícias
http://localhost:3001/noticias/[uuid]            → Detalhes de Notícia

http://localhost:3001/api/licitacoes             → GET todas licitações
http://localhost:3001/api/licitacoes/[id]        → GET licitação por ID
http://localhost:3001/api/scrape-specific        → POST coletar licitações

http://localhost:3001/api/noticias               → GET todas notícias
http://localhost:3001/api/noticias/[id]          → GET notícia por ID
http://localhost:3001/api/scrape-news            → GET/POST coletar notícias
```

---

## 📱 Interações do Usuário

### Dashboard de Licitações:
```
1. Filtrar por SRE        → Atualiza tabela
2. Filtrar por Modalidade → Atualiza tabela e gráficos
3. Filtrar por Valor      → Atualiza tabela
4. Click em linha         → Navega para /dashboard/[id]
5. Click em "Notícias"    → Navega para /noticias
6. Click em "Voltar"      → Navega para /
```

### Central de Notícias:
```
1. Digitar busca          → Filtra lista instantaneamente
2. Click em "Filtros"     → Expande/colapsa filtros
3. Selecionar categoria   → Filtra lista + badge counter
4. Selecionar prioridade  → Filtra lista + badge counter
5. Selecionar SRE         → Filtra lista + badge counter
6. Trocar ordenação       → Reordena lista
7. Click em notícia       → Navega para /noticias/[id]
8. Click em "Atualizar"   → Recarrega dados do banco
```

### Detalhes de Notícia:
```
1. Click em "Voltar"      → Navega para /noticias
2. Click em "Ver original"→ Abre URL SRE em nova aba
3. Click em documento     → Abre PDF/Drive em nova aba
4. Click em link externo  → Abre em nova aba
5. Scroll vertical        → Conteúdo completo
```

---

## 🎯 Elementos Visuais por Página

### Dashboard Licitações:
| Elemento | Quantidade | Tipo |
|----------|-----------|------|
| Cards estatísticos | 4 | Numérico |
| Gráficos | 2 | Barras + Pizza |
| Filtros | 5 | Dropdowns |
| Linhas de tabela | Variável | Clicáveis |
| Botões ação | 2 | Navegação |

### Central Notícias:
| Elemento | Quantidade | Tipo |
|----------|-----------|------|
| Barra busca | 1 | Input texto |
| Cards estatísticos | 4 | Numérico |
| Gráficos | 2 | Barras horizontais |
| Filtros | 3 | Dropdowns |
| Cards notícia | Variável | Clicáveis |
| Badges | 2-4 por card | Coloridos |
| Tags | 0-5 por card | Pills |
| Botões ação | 1 | Refresh |

### Detalhes Notícia:
| Elemento | Quantidade | Tipo |
|----------|-----------|------|
| Badges status | 4-5 | Topo |
| Título | 1 | H1 grande |
| Metadados | 3 | Com ícones |
| Box resumo IA | 1 | Gradiente |
| Box conteúdo | 1 | Branco |
| Box ações | 0-1 | Amarelo |
| Cards documentos | 0-N | Clicáveis |
| Pills palavras-chave | 0-8 | Roxas |
| Pills tags | 0-N | Azuis |
| Seções entidades | 0-6 | Coloridas |
| Links externos | 0-5 | Azuis |
| Botão voltar | 1 | Navegação |

---

## 🖱️ Estados Interativos

### Hover (Mouse sobre):
- ✨ Linhas de tabela → Background cinza claro
- ✨ Cards de notícia → Sombra aumenta
- ✨ Botões → Background muda
- ✨ Tags → Borda aparece
- ✨ Links → Underline aparece
- ✨ Documentos → Background cinza

### Active (Click):
- 🎯 Filtros ativos → Badge com contador
- 🎯 Busca ativa → Borda azul
- 🎯 Ordenação → Dropdown aberto

### Loading:
- ⏳ Dashboard → Spinner central + texto
- ⏳ API call → Spinner + "Carregando..."

### Empty State:
- 📭 Nenhuma notícia → Ícone grande + mensagem + sugestão

### Error State:
- ❌ Erro 404 → Ícone alerta + mensagem + botão voltar

---

## 🎨 Tipografia

### Fontes:
- **Sistema**: Sans-serif padrão do Next.js/Tailwind

### Tamanhos:
| Elemento | Tamanho | Peso |
|----------|---------|------|
| H1 (Título página) | 4xl (36px) | Bold |
| H2 (Seções) | 2xl (24px) | Bold |
| H3 (Subsections) | xl (20px) | Semibold |
| Título notícia (lista) | lg (18px) | Bold |
| Título notícia (detalhes) | 4xl (36px) | Bold |
| Corpo de texto | base (16px) | Normal |
| Metadados | sm (14px) | Normal |
| Badges | xs (12px) | Semibold |

---

## 📐 Layout Responsivo

### Desktop (> 1024px):
- ✅ Sidebar 1/3 + Conteúdo 2/3
- ✅ Gráficos lado a lado
- ✅ Filtros em linha
- ✅ Cards notícia com todas as informações

### Tablet (768px - 1024px):
- ✅ Layout compacto
- ✅ Gráficos empilhados
- ✅ Filtros colapsáveis

### Mobile (< 768px):
- ✅ Sidebar vira rodapé
- ✅ Cards notícia simplificados
- ✅ Gráficos verticais

---

## 🎭 Animações

### Transições:
- 🎬 Hover: `transition-all duration-200`
- 🎬 Modal open: `fade + slide`
- 🎬 Loading: `spinner rotate`
- 🎬 Cards entrada: `fade-in stagger`

### Efeitos:
- ✨ Barras dos gráficos crescem (500ms)
- ✨ Filtros expandem suavemente (300ms)
- ✨ Badges aparecem com fade (200ms)

---

**📍 Navegação otimizada para produtividade máxima!**
