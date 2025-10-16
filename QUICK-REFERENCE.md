# 🎯 QUICK REFERENCE - Fase 3

## ⚡ 30 segundos para entender

```
✅ Antes: 7 licitações por SRE (1 página)
✅ Depois: 21-30 licitações por SRE (3 páginas)
✅ Total: ~1,300-1,500 licitações (antes era ~330)
✅ Dashboard: Mostra qual SRE, página, tempo, erros em TEMPO REAL
```

---

## 🚀 Como Testar em 2 Minutos

```powershell
# Terminal 1
npm run dev

# Browser
http://localhost:3000/automation/monitoring
# Clique em: 🚀 Iniciar Scraping Detalhado
# Veja os logs chegando em tempo real
```

---

## 📊 O Que Você Verá

```
┌────────────────────────────────────────────────────────┐
│ 📊 Monitoramento Detalhado de Scraping                │
│                                                        │
│ 🚀 Iniciar Scraping Detalhado                         │
│                                                        │
│ ┌─────────┬─────────────┬──────────┬───────┐          │
│ │ 234     │ 15/47       │ 287      │ 2     │          │
│ │ Logs    │ SREs        │ Licit.   │ Erros │          │
│ └─────────┴─────────────┴──────────┴───────┘          │
│                                                        │
│ ┌────────────────────────────────────────────────┐   │
│ │ 🎯 Metropolitana A (#1)                10:23  │   │
│ │ [starting] Iniciando scraping                  │   │
│ │                                                │   │
│ │ 📄 Página 1/3 | 8 licit. | 1240ms            │   │
│ ├────────────────────────────────────────────────┤   │
│ │ 📄 Metropolitana A - Página 2/3                │   │
│ │ [page_processing] Processando...              │   │
│ │ 📄 Página 2/3 | 6 licit. | 980ms             │   │
│ ├────────────────────────────────────────────────┤   │
│ │ 🎉 Metropolitana A                     10:27  │   │
│ │ [completed] Scraping concluído                │   │
│ │ 19 licitações em 3.32s                       │   │
│ └────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────┘
```

---

## 🔑 Arquivos Principais

### Lógica de Scraping
📁 `lib/scrapers/orchestrator-with-logs.ts` (229 linhas)
- Itera 3 páginas por SRE
- Loga cada página
- Rate limiting automático

### Gerenciador de Logs
📁 `lib/scraping-logs.ts` (124 linhas)
- Session-based in-memory store
- Auto-persistência no banco
- Limpeza automática

### APIs
📁 `app/api/scrape-with-logs/route.ts` - POST para iniciar
📁 `app/api/scraping-logs/route.ts` - GET para polling

### Dashboard
📁 `app/automation/monitoring/page.tsx` - UI em tempo real

---

## 🎛️ Configurações

### Aumentar/Diminuir Páginas
Edite `orchestrator-with-logs.ts`:
```typescript
const maxPages = 3;  // Mude para 2, 4, 5, etc
```

### Mudar Velocidade
No dashboard (dropdown):
```
Atualizar a cada: [500ms] [1s ✓] [2s] [5s]
```

### Aumentar Velocidade de Scraping (⚠️)
Edite `orchestrator-with-logs.ts`:
```typescript
await sleep(1000);  // Diminua para 500
await sleep(2000);  // Diminua para 1000
```

---

## 📈 Performance

| Métrica | Valor |
|---------|-------|
| SREs | 47 |
| Páginas por SRE | 3 |
| Total de requisições | 141 |
| Tempo entre páginas | 1s |
| Tempo entre SREs | 2s |
| Tempo total estimado | 2.5-3 min |
| Licitações esperadas | 1,300-1,500 |

---

## ✅ Checklist de Funcionamento

```
[ ] npm run build ✓ (sem erros)
[ ] Dashboard abre em http://localhost:3000/automation/monitoring
[ ] Botão "🚀 Iniciar" disponível
[ ] Clique inicia scraping
[ ] Logs aparecem em tempo real
[ ] Contadores aumentam
[ ] Auto-scroll funciona
[ ] Após ~160s termina
[ ] Total > 1000 licitações
[ ] Banco recebeu dados
```

---

## 🐛 Rápido Fix

| Problema | Solução |
|----------|---------|
| Logs vazios | Aumentar updateInterval para 5s |
| Sem dados | Verificar `.env.local` |
| Erros muitos | Normal para SREs offline, continua |
| Demora muito | Esperado - 2.5min para 141 requisições |
| Não persiste | Verificar conexão Supabase |

---

## 🔗 Links Úteis

**Local:**
- Dashboard: http://localhost:3000/automation/monitoring
- Health: http://localhost:3000/api/health

**Staging (depois de push):**
- GitHub: https://github.com/trcarneiro1/Importadordelicitacoes
- Commit: `89307e3` (multi-page + logs)

**Documentação:**
- Guia completo: `FASE-3-COMPLETA.md`
- Testes: `docs/TESTE-MULTI-PAGE-SCRAPING.md`
- Arquitetura: `docs/FASE-3-MULTI-PAGE-SCRAPING.md`

---

## 💡 Como Funciona

```
1. Você clica em "🚀 Iniciar Scraping Detalhado"
   ↓
2. Frontend faz POST /api/scrape-with-logs
   ↓
3. Backend retorna session_id (ex: "abc-123-def")
   ↓
4. Frontend começa polling GET /api/scraping-logs?session_id=abc-123-def
   ↓
5. Backend processa 47 × 3 = 141 páginas
   ↓
6. Cada página gera 1 log que vai para in-memory store
   ↓
7. Frontend busca logs a cada 1s e renderiza
   ↓
8. Você vê tudo em tempo real no dashboard! 🎉
```

---

## 🎓 Aprenda Mais

**Por que 3 páginas?**
- Você pediu: "Pegue pelo menos 3 páginas de cada uma"
- Resultado: 3x mais dados coletados

**Por que polling?**
- Simples de implementar em Next.js
- Funciona em qualquer navegador
- Pode ser WebSocket depois

**Por que 1s e 2s de delay?**
- Respeita rate limits dos servidores
- Evita sobrecarregar as SREs
- Bom vizinho na internet

---

## 🚀 Próximos Passos (Opcional)

- [ ] Implementar WebSocket para logs mais eficientes
- [ ] Adicionar cache de resultados
- [ ] Webhooks quando scraping termina
- [ ] Email com resumo de resultados
- [ ] Gráfico de licitações por SRE
- [ ] Export para CSV

---

**Versão**: 3.0  
**Build**: ✅ OK  
**Deploy**: ✅ GitHub Push  
**Status**: 🟢 Production Ready

---

**Abra http://localhost:3000/automation/monitoring e divirta-se! 🎉**
