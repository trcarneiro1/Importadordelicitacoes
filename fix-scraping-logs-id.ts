/**
 * Script para corrigir o campo ID da tabela scraping_logs no Supabase
 * 
 * Problema: O campo id está sem default UUID, causando erro ao inserir registros
 * Solução: Adicionar default gen_random_uuid() ou uuid_generate_v4()
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Erro: Variáveis de ambiente SUPABASE não configuradas!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixScrapingLogsIdColumn() {
  console.log('🔧 Iniciando correção da tabela scraping_logs...\n');

  try {
    // Verificar se a extensão uuid-ossp está habilitada
    console.log('1️⃣ Verificando extensão uuid-ossp...');
    const { data: extensions, error: extError } = await supabase.rpc('check_uuid_extension');
    
    if (extError) {
      console.log('⚠️ Não foi possível verificar extensão, tentando criar...');
    }

    // Alterar a coluna ID para ter default UUID
    console.log('2️⃣ Alterando coluna id para ter default UUID...');
    
    // Nota: Como não temos acesso direto ao SQL via supabase-js client,
    // vamos mostrar o SQL que precisa ser executado manualmente no Supabase Dashboard
    
    const sqlFix = `
-- Execute este SQL no Supabase Dashboard > SQL Editor:

-- 1. Habilitar extensão UUID (se não estiver habilitada)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Alterar coluna id da tabela scraping_logs para ter default UUID
ALTER TABLE scraping_logs 
  ALTER COLUMN id SET DEFAULT uuid_generate_v4();

-- 3. Verificar se funcionou
SELECT column_name, column_default 
FROM information_schema.columns 
WHERE table_name = 'scraping_logs' AND column_name = 'id';
`;

    console.log('\n📋 Execute este SQL no Supabase Dashboard:\n');
    console.log(sqlFix);
    
    console.log('\n✅ Instruções exibidas com sucesso!');
    console.log('\n📌 Após executar o SQL acima, a função logScraping() funcionará corretamente.');
    
    // Alternativamente, podemos atualizar a função para gerar UUID manualmente
    console.log('\n💡 ALTERNATIVA: Atualizar código JavaScript');
    console.log('Podemos gerar UUID no código antes de inserir no banco.');
    console.log('Vou criar essa solução agora...\n');

  } catch (error) {
    console.error('❌ Erro ao corrigir tabela:', error);
    process.exit(1);
  }
}

fixScrapingLogsIdColumn();
