# 🔐 Como Obter a DATABASE_URL do Supabase

## Opção 1: Via Dashboard Supabase (Recomendado)

1. **Acesse seu projeto:**
   - URL: https://supabase.com/dashboard/project/inyrnjdefirzgamnmufi/settings/database

2. **Na seção "Connection String":**
   - Clique na aba **"URI"**
   - Você verá algo como:
   ```
   postgresql://postgres.inyrnjdefirzgamnmufi:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
   ```

3. **Revele a senha:**
   - Clique no botão de "olho" para revelar `[YOUR-PASSWORD]`
   - Copie a URI completa

4. **Cole no `.env.local`:**
   ```bash
   DATABASE_URL="postgresql://postgres.inyrnjdefirzgamnmufi:SUA_SENHA_AQUI@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
   ```

## Opção 2: Via Configurações do Projeto

1. Acesse: **Settings → Database**
2. Role até **"Connection Info"**
3. A senha está em **"Database Password"** (clique para revelar)
4. Monte a URL manualmente:
   ```
   postgresql://postgres.inyrnjdefirzgamnmufi:[SENHA]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
   ```

## ⚠️ Importante

- **Nunca comite** o arquivo `.env.local` no Git (já está no `.gitignore`)
- Use **connection pooling** (`pgbouncer=true`) para melhor performance
- A porta **6543** é para pooling (recomendado), **5432** é conexão direta

## 🚀 Após Configurar

Execute o setup automático:
```powershell
npm run prisma:setup
```

Isso vai:
- ✅ Testar conexão com Supabase
- ✅ Adicionar coluna `licitacoes_coletadas` em `scraping_logs`
- ✅ Corrigir URLs das 47 SREs
- ✅ Criar índices otimizados
- ✅ Validar estado do banco

Depois:
```powershell
npm run prisma:generate    # Gera tipos TypeScript
npm run prisma:studio      # Abre interface visual do banco
```
