/**
 * SCRIPT DE SCRAPING COMPLETO - Versão Melhorada
 * 
 * Importa licitações com MUITO MAIS DADOS:
 * - Lista todas as URLs de licitações de um SRE
 * - Entra em cada página individual
 * - Extrai dados completos (não só descrição curta)
 * - Salva no banco com todos os campos preenchidos
 * 
 * Uso: npx tsx scripts/scrape-enhanced.ts <SRE_URL>
 * Exemplo: npx tsx scripts/scrape-enhanced.ts https://sremetropa.educacao.mg.gov.br/licitacoes
 */

import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { parseListaLicitacoes, parseIndividualLicitacao } from '../lib/scrapers/enhanced-parser';

// Carregar variáveis de ambiente
config({ path: '.env.local' });

const prisma = new PrismaClient();

interface ScrapingStats {
  total_urls: number;
  processadas: number;
  sucesso: number;
  erros: number;
  duplicadas: number;
}

async function scrapeEnhanced(sreBaseUrl: string) {
  const stats: ScrapingStats = {
    total_urls: 0,
    processadas: 0,
    sucesso: 0,
    erros: 0,
    duplicadas: 0,
  };

  try {
    console.log('🚀 SCRAPING ENHANCED - Iniciando...\n');
    console.log(`📍 SRE: ${sreBaseUrl}\n`);

    // 1. Buscar lista de URLs de licitações
    console.log('📋 Etapa 1: Buscando lista de licitações...');
    const urls = await parseListaLicitacoes(sreBaseUrl);
    stats.total_urls = urls.length;

    if (urls.length === 0) {
      console.log('⚠️  Nenhuma licitação encontrada na lista.');
      return;
    }

    console.log(`✅ Encontradas ${urls.length} licitações\n`);

    // 2. Processar cada URL individualmente
    console.log('📄 Etapa 2: Processando cada licitação...\n');

    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      stats.processadas++;

      console.log(`\n[${i + 1}/${urls.length}] Processando: ${url}`);

      try {
        // Parse da página individual
        const result = await parseIndividualLicitacao(url);

        if (!result.success || !result.licitacao) {
          console.log(`  ⚠️  Falha ao parsear (${result.error})`);
          stats.erros++;
          continue;
        }

        const lic = result.licitacao;

        // Verificar se já existe (evitar duplicatas)
        const jaExiste = await prisma.licitacoes.findFirst({
          where: {
            OR: [
              { numero_edital: lic.numero_edital },
              { raw_data: { path: ['url_fonte'], equals: url } },
            ],
          },
        });

        if (jaExiste) {
          console.log(`  ℹ️  Já existe no banco: ${lic.numero_edital}`);
          stats.duplicadas++;
          continue;
        }

        // Extrair nome do SRE da URL
        const sreName = new URL(sreBaseUrl).hostname.replace('.educacao.mg.gov.br', '');

        // Salvar no banco
        await prisma.licitacoes.create({
          data: {
            numero_edital: lic.numero_edital,
            modalidade: lic.modalidade || 'Aquisição Simplificada',
            objeto: lic.objeto,
            valor_estimado: lic.valor_estimado || null,
            data_publicacao: lic.data_publicacao || new Date(),
            data_abertura: lic.data_abertura || null,
            situacao: lic.situacao.toLowerCase(),
            sre_source: sreName,
            categoria_principal: lic.modalidade || 'Obras e Serviços',
            score_relevancia: 0.75,
            documentos: lic.documentos.length > 0 ? lic.documentos : undefined,
            raw_data: {
              titulo: lic.titulo,
              instituicao: lic.instituicao,
              termo_compromisso: lic.termo_compromisso,
              prazo_propostas: lic.prazo_propostas,
              local_entrega: lic.local_entrega,
              endereco: lic.endereco,
              email_contato: lic.email_contato,
              telefone: lic.telefone,
              observacoes: lic.observacoes,
              link_google_drive: lic.link_google_drive,
              url_fonte: url,
              raw_html: lic.raw_html.substring(0, 5000), // Limitar tamanho
            },
          },
        });

        console.log(`  ✅ Salva: ${lic.numero_edital}`);
        console.log(`     Objeto: ${lic.objeto.substring(0, 60)}...`);
        if (lic.instituicao) console.log(`     Instituição: ${lic.instituicao}`);
        if (lic.prazo_propostas) console.log(`     Prazo: ${lic.prazo_propostas}`);
        if (lic.email_contato) console.log(`     Email: ${lic.email_contato}`);
        if (lic.link_google_drive) console.log(`     Drive: ${lic.link_google_drive}`);

        stats.sucesso++;

        // Delay para não sobrecarregar o servidor
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (error) {
        console.log(`  ❌ Erro ao processar: ${error instanceof Error ? error.message : 'Desconhecido'}`);
        stats.erros++;
      }
    }

    // 3. Relatório final
    console.log('\n\n📊 RELATÓRIO FINAL');
    console.log('═'.repeat(50));
    console.log(`Total de URLs encontradas:  ${stats.total_urls}`);
    console.log(`Processadas:                ${stats.processadas}`);
    console.log(`✅ Salvas com sucesso:      ${stats.sucesso}`);
    console.log(`ℹ️  Duplicadas (ignoradas):  ${stats.duplicadas}`);
    console.log(`❌ Erros:                   ${stats.erros}`);
    console.log('═'.repeat(50));

    const taxa_sucesso = ((stats.sucesso / stats.total_urls) * 100).toFixed(1);
    console.log(`\n🎯 Taxa de sucesso: ${taxa_sucesso}%\n`);

  } catch (error) {
    console.error('\n❌ ERRO FATAL:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar
const sreUrl = process.argv[2] || 'https://sremetropa.educacao.mg.gov.br/licitacoes';

console.log(`
╔════════════════════════════════════════════════════════════╗
║  SCRAPER ENHANCED - Importador de Licitações v2.0         ║
║  Captura dados COMPLETOS de cada licitação                 ║
╚════════════════════════════════════════════════════════════╝
`);

scrapeEnhanced(sreUrl);
