# 🚀 Início Rápido - Sistema de Notícias com IA

## ⚡ 3 Passos para Começar

### **Passo 1: Criar Tabela no Supabase** (2 minutos)

1. Acesse seu projeto Supabase:
   ```
   https://supabase.com/dashboard/project/SEU_PROJETO/editor
   ```

2. Vá em **SQL Editor** → **New Query**

3. Copie TODO o conteúdo do arquivo:
   ```
   lib/supabase/schema-noticias.sql
   ```

4. Cole no editor SQL e clique em **RUN** (▶️)

5. ✅ Você verá mensagens de sucesso:
   - Table "noticias" created
   - Index created (9x)
   - View created (4x)
   - Function created (2x)
   - Trigger created (1x)

---

### **Passo 2: Coletar Primeira Notícia** (30 segundos)

Abra o PowerShell e execute:

```powershell
curl "http://localhost:3001/api/scrape-news?sre=barbacena&pages=2"
```

**✅ Resultado esperado:**
```json
{
  "success": true,
  "resumo": {
    "sres_processadas": 1,
    "noticias_coletadas": 36,
    "noticias_categorizadas": 36,
    "noticias_salvas_banco": 36,
    "tempo_total_ms": 25340
  },
  "estatisticas": {
    "por_categoria": {
      "Processos Seletivos": 15,
      "Editais de RH": 8,
      "Avisos Administrativos": 7,
      "Programas Educacionais": 4,
      "Licitações e Compras": 2
    },
    "por_prioridade": {
      "alta": 12,
      "media": 18,
      "baixa": 6
    }
  }
}
```

---

### **Passo 3: Ver Dashboard** (instantâneo)

Abra no navegador:
```
http://localhost:3001/noticias
```

**✅ Você verá:**
- 📊 4 cards de estatísticas
- 📈 2 gráficos (categorias + SREs)
- 📰 Lista de 36 notícias categorizadas
- 🔍 Busca e filtros funcionando

**Clique em qualquer notícia** → Abre página de detalhes completa com:
- 🧠 Resumo IA
- 📝 Conteúdo completo
- 💡 Ações recomendadas
- 🏷️ Tags e palavras-chave
- 📊 Entidades extraídas (datas, valores, processos, pessoas)

---

## 🎯 Comandos Úteis

### Coletar 3 SREs aleatórias (2 min):
```powershell
curl "http://localhost:3001/api/scrape-news?count=3&pages=1"
```

### Coletar SREs específicas:
```powershell
curl -X POST "http://localhost:3001/api/scrape-news" `
  -H "Content-Type: application/json" `
  -d '{\"sres\": [\"barbacena\", \"uba\", \"conselheirolafaiete\"], \"pages\": 2}'
```

### Coletar TODAS as 47 SREs (15-20 min):
```powershell
curl "http://localhost:3001/api/scrape-news?count=47&pages=2"
```

### Verificar dados no banco (via Supabase SQL Editor):
```sql
-- Ver total de notícias
SELECT COUNT(*) FROM noticias;

-- Ver últimas notícias
SELECT titulo, categoria_ia, prioridade, data_publicacao 
FROM noticias 
ORDER BY data_publicacao DESC 
LIMIT 10;

-- Contar por categoria
SELECT categoria_ia, COUNT(*) as total 
FROM noticias 
GROUP BY categoria_ia 
ORDER BY total DESC;

-- Ver notícias de alta prioridade
SELECT * FROM noticias_alta_prioridade;
```

---

## 🎨 Navegação do Sistema

```
Dashboard Licitações (/)
  ↓ [Botão "📰 Central de Notícias (IA)"]
  ↓
Central de Notícias (/noticias)
  ├─ Busca full-text
  ├─ Filtros (categoria, prioridade, SRE)
  ├─ 4 cards de estatísticas
  ├─ 2 gráficos
  └─ Lista de notícias
      ↓ [Click em qualquer notícia]
      ↓
Detalhes da Notícia (/noticias/{id})
  ├─ Resumo IA
  ├─ Conteúdo completo
  ├─ Ações recomendadas
  ├─ Palavras-chave IA
  ├─ Entidades extraídas
  ├─ Documentos anexos
  └─ [Botão "← Voltar para notícias"]
```

---

## 🔧 Solução de Problemas Rápida

### ❌ Erro: "Table noticias does not exist"
**Solução:** Execute o Passo 1 (criar tabela no Supabase)

### ❌ Dashboard vazio
**Solução:** Execute o Passo 2 (coletar notícias primeiro)

### ❌ Erro ao coletar
**Solução:** 
1. Verifique se o servidor está rodando: `npm run dev`
2. Verifique `.env.local` com credenciais do Supabase

### ❌ "Connection refused"
**Solução:** Inicie o servidor Next.js:
```bash
npm run dev
# Aguarde "Ready on http://localhost:3001"
```

---

## 📚 Documentação Completa

- **Guia de Testes Detalhado**: `COMO-TESTAR-NOTICIAS.md`
- **Arquitetura do Sistema**: `SISTEMA-NOTICIAS-IA.md`
- **Resposta Original**: `RESPOSTA-SISTEMA-IA.md`

---

## ✅ Checklist Mínimo

Antes de usar o sistema, certifique-se:

- [ ] Servidor Next.js rodando (`npm run dev`)
- [ ] Tabela `noticias` criada no Supabase
- [ ] Pelo menos 1 coleta realizada
- [ ] Dashboard `/noticias` abrindo
- [ ] Click em notícia funciona

**Tudo OK? Sistema pronto! 🎉**

---

## 🚀 Próximos Passos (Opcional)

1. **Coleta Diária Automática**:
   - Configure Vercel Cron ou GitHub Actions
   - Rode `curl "http://localhost:3001/api/scrape-news?count=47&pages=1"` diariamente

2. **Alertas de Alta Prioridade**:
   - Integre com Resend (email)
   - Ou webhook para Slack/Discord

3. **Análise Temporal**:
   - View `noticias_tendencias` já está pronta
   - Crie gráfico de linha mostrando evolução mensal

4. **Busca Avançada**:
   - Use `buscar_noticias()` function
   - Implementar autocomplete de tags

5. **Exportação**:
   - PDF com notícias filtradas
   - Excel com estatísticas

---

**Tempo total para começar: ~3 minutos** ⚡
