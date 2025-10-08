-- =====================================================
-- SCHEMA: SREs (Superintendências Regionais de Ensino)
-- Data: 06/10/2025
-- Descrição: 47 SREs de Minas Gerais com URLs de licitações
-- =====================================================

-- Tabela principal de SREs
CREATE TABLE IF NOT EXISTS sres (
  id SERIAL PRIMARY KEY,
  codigo INTEGER UNIQUE NOT NULL,
  nome VARCHAR(100) NOT NULL,
  municipio VARCHAR(100),
  url_base TEXT NOT NULL,
  url_licitacoes TEXT NOT NULL,
  urls_adicionais TEXT[],              -- Links múltiplos (ex: Curvelo, Teófilo Otoni)
  tipo_cms VARCHAR(50),                -- 'joomla', 'wordpress', 'google-docs', 'custom'
  ativo BOOLEAN DEFAULT true,
  ultima_coleta TIMESTAMP,
  proxima_coleta TIMESTAMP,
  taxa_sucesso DECIMAL(5,2) DEFAULT 0, -- % de sucesso nas últimas 30 coletas
  notas TEXT,                          -- Observações sobre a SRE
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_sres_codigo ON sres(codigo);
CREATE INDEX IF NOT EXISTS idx_sres_ativo ON sres(ativo);
CREATE INDEX IF NOT EXISTS idx_sres_municipio ON sres(municipio);
CREATE INDEX IF NOT EXISTS idx_sres_proxima_coleta ON sres(proxima_coleta);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_sres_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sres_updated_at
  BEFORE UPDATE ON sres
  FOR EACH ROW
  EXECUTE FUNCTION update_sres_updated_at();

-- Comentários
COMMENT ON TABLE sres IS 'Superintendências Regionais de Ensino de Minas Gerais';
COMMENT ON COLUMN sres.codigo IS 'Código identificador da SRE (1-47)';
COMMENT ON COLUMN sres.tipo_cms IS 'Tipo de CMS: joomla, wordpress, google-docs, custom';
COMMENT ON COLUMN sres.urls_adicionais IS 'Links adicionais quando a SRE tem múltiplas páginas de licitação';
COMMENT ON COLUMN sres.taxa_sucesso IS 'Porcentagem de sucesso nas últimas 30 tentativas de scraping';

-- =====================================================
-- DADOS: Popular com 47 SREs
-- =====================================================

INSERT INTO sres (codigo, nome, municipio, url_base, url_licitacoes, tipo_cms, notas) VALUES
(1, 'Metropolitana A', 'Belo Horizonte', 'https://sremetropa.educacao.mg.gov.br/', 'https://sremetropa.educacao.mg.gov.br/licitacoes', 'joomla', NULL),
(2, 'Metropolitana B', 'Belo Horizonte', 'https://sremetropb.educacao.mg.gov.br/', 'https://sremetropb.educacao.mg.gov.br/licitacoes', 'joomla', NULL),
(3, 'Metropolitana C', 'Belo Horizonte', 'https://sremetropc.educacao.mg.gov.br/', 'https://sremetropc.educacao.mg.gov.br/licitacoes', 'joomla', NULL),
(4, 'Almenara', 'Almenara', 'https://srealmenara.educacao.mg.gov.br/', 'https://srealmenara.educacao.mg.gov.br/licitacoes', 'joomla', NULL),
(5, 'Araçuaí', 'Araçuaí', 'https://srearacuai.educacao.mg.gov.br/', 'https://srearacuai.educacao.mg.gov.br/index.php/licitacoes', 'joomla', NULL),
(6, 'Barbacena', 'Barbacena', 'https://srebarbacena.educacao.mg.gov.br/', 'https://srebarbacena.educacao.mg.gov.br/licitacoes', 'joomla', NULL),
(7, 'Campo Belo', 'Campo Belo', 'https://srecampobelo.educacao.mg.gov.br/', 'https://srecampobelo.educacao.mg.gov.br/index.php/licitacoes', 'joomla', NULL),
(8, 'Carangola', 'Carangola', 'https://srecarangola.educacao.mg.gov.br/', 'https://srecarangola.educacao.mg.gov.br/licitacoes', 'joomla', NULL),
(9, 'Caratinga', 'Caratinga', 'https://srecaratinga.educacao.mg.gov.br/', 'https://srecaratinga.educacao.mg.gov.br/index.php/licitacoes', 'joomla', NULL),
(10, 'Caxambu', 'Caxambu', 'https://srecaxambu.educacao.mg.gov.br/', 'https://srecaxambu.educacao.mg.gov.br/aquisicao-simplificada/', 'joomla', 'URL diferente: aquisicao-simplificada'),
(11, 'Conselheiro Lafaiete', 'Conselheiro Lafaiete', 'https://srelafaiete.educacao.mg.gov.br/', 'https://srelafaiete.educacao.mg.gov.br/licitacoes', 'joomla', NULL),
(12, 'Coronel Fabriciano', 'Coronel Fabriciano', 'https://srecelfabriciano.educacao.mg.gov.br/', 'https://srecelfabriciano.educacao.mg.gov.br/index.php/licitacoes', 'joomla', NULL),
(13, 'Curvelo', 'Curvelo', 'https://srecurvelo.educacao.mg.gov.br/', 'https://srecurvelo.educacao.mg.gov.br/index.php/licitacoes/aquisicao-simplificada-kit-escolar-2025', 'joomla', 'Múltiplas páginas de licitação'),
(14, 'Diamantina', 'Diamantina', 'https://srediamantina.educacao.mg.gov.br/', 'https://srediamantina.educacao.mg.gov.br/index.php/licitacoes/aquisicao-de-mobiliario-e-equipamento', 'joomla', 'Múltiplas páginas por tipo'),
(15, 'Divinópolis', 'Divinópolis', 'https://sredivinopolis.educacao.mg.gov.br/', 'https://sredivinopolis.educacao.mg.gov.br/licitacoes/pdde/custeio', 'joomla', 'PDDE separado: custeio/capital'),
(16, 'Governador Valadares', 'Governador Valadares', 'https://sregvaladares.educacao.mg.gov.br/', 'https://sregvaladares.educacao.mg.gov.br/index.php/licitacoes/licitacoes?start=30', 'joomla', 'Paginação com start parameter'),
(17, 'Guanhães', 'Guanhães', 'https://sreguanhaes.educacao.mg.gov.br/', 'https://sreguanhaes.educacao.mg.gov.br/index.php/licitacoes', 'joomla', NULL),
(18, 'Itajubá', 'Itajubá', 'https://sreitajuba.educacao.mg.gov.br/', 'https://sreitajuba.educacao.mg.gov.br/index.php/licitacoes/aquisicao-simplificada', 'joomla', NULL),
(19, 'Ituiutaba', 'Ituiutaba', 'https://sreituiutaba.educacao.mg.gov.br/', 'https://sreituiutaba.educacao.mg.gov.br/index.php/licitacoes/alienacao', 'joomla', NULL),
(20, 'Janaúba', 'Janaúba', 'https://srejanauba.educacao.mg.gov.br/', 'https://srejanauba.educacao.mg.gov.br/index.php/licitacoes', 'joomla', NULL),
(21, 'Januária', 'Januária', 'https://srejanuaria.educacao.mg.gov.br/', 'https://srejanuaria.educacao.mg.gov.br/index.php/licitacoes/aquisicao-simplificada-chamada-publica-processo-de-contratacao-de-obra', 'joomla', NULL),
(22, 'Juiz de Fora', 'Juiz de Fora', 'https://srejuizdefora.educacao.mg.gov.br/', 'https://docs.google.com/document/d/1ZCe7hGYg9JeOeaSFADSQvaZecLuPhVS4lEL07wvA7iQ/edit?tab=t.6a777q57lw15', 'google-docs', 'ATENÇÃO: Usa Google Docs'),
(23, 'Leopoldina', 'Leopoldina', 'https://sreleopoldina.educacao.mg.gov.br/', 'https://sreleopoldina.educacao.mg.gov.br/licitacoes', 'joomla', NULL),
(24, 'Manhuaçu', 'Manhuaçu', 'https://sremanhuacu.educacao.mg.gov.br/', 'https://sremanhuacu.educacao.mg.gov.br/index.php/licitacoes', 'joomla', NULL),
(25, 'Monte Carmelo', 'Monte Carmelo', 'https://sremontecarmelo.educacao.mg.gov.br/', 'https://sremontecarmelo.educacao.mg.gov.br/index.php/licitacoes', 'joomla', NULL),
(26, 'Muriaé', 'Muriaé', 'https://sremuriae.educacao.mg.gov.br/', 'https://sremuriae.educacao.mg.gov.br/licitacoes', 'joomla', NULL),
(27, 'Nova Era', 'Nova Era', 'https://srenovaera.educacao.mg.gov.br/', 'https://srenovaera.educacao.mg.gov.br/aquisicao-simplificada/', 'joomla', NULL),
(28, 'Ouro Preto', 'Ouro Preto', 'https://sreouropreto.educacao.mg.gov.br/', 'https://sreouropreto.educacao.mg.gov.br/licitacoes', 'joomla', NULL),
(29, 'Pará de Minas', 'Pará de Minas', 'https://sreparademinas.educacao.mg.gov.br/', 'https://sreparademinas.educacao.mg.gov.br/licitacoes/chamada-publica/chamada-publica-individual-2025', 'joomla', NULL),
(30, 'Paracatu', 'Paracatu', 'https://sreparacatu.educacao.mg.gov.br/', 'https://sreparacatu.educacao.mg.gov.br/index.php/licitacoes', 'joomla', NULL),
(31, 'Passos', 'Passos', 'https://srepassos.educacao.mg.gov.br/', 'https://srepassos.educacao.mg.gov.br/index.php/licitacoes', 'joomla', NULL),
(32, 'Patos de Minas', 'Patos de Minas', 'https://srepatosdeminas.educacao.mg.gov.br/', 'https://srepatosdeminas.educacao.mg.gov.br/index.php/licitacoes', 'joomla', NULL),
(33, 'Patrocínio', 'Patrocínio', 'https://srepatrocinio.educacao.mg.gov.br', 'https://srepatrocinio.educacao.mg.gov.br/index.php/licitacoes', 'joomla', 'URL sem trailing slash'),
(34, 'Pirapora', 'Pirapora', 'https://srepirapora.educacao.mg.gov.br/', 'https://srepirapora.educacao.mg.gov.br/index.php/licitacoes/aquisicao-simplificada', 'joomla', NULL),
(35, 'Poços de Caldas', 'Poços de Caldas', 'https://srepocoscaldas.educacao.mg.gov.br/', 'https://srepocoscaldas.educacao.mg.gov.br/index.php/licitacoes', 'joomla', NULL),
(36, 'Ponte Nova', 'Ponte Nova', 'https://srepontenova.educacao.mg.gov.br/', 'https://srepontenova.educacao.mg.gov.br/index.php/licitacoes/licitacoes-sre-ponte-nova', 'joomla', NULL),
(37, 'Pouso Alegre', 'Pouso Alegre', 'https://srepousoalegre.educacao.mg.gov.br/', 'https://srepousoalegre.educacao.mg.gov.br/index.php/aquisicao-simplificada/editais-licitacao-por-municipio-2025', 'joomla', NULL),
(38, 'São João D''el Rei', 'São João D''el Rei', 'https://sresjdelrei.educacao.mg.gov.br/', 'https://sresjdelrei.educacao.mg.gov.br/index.php/licitacoes', 'joomla', NULL),
(39, 'São Sebastião do Paraíso', 'São Sebastião do Paraíso', 'https://sressparaiso.educacao.mg.gov.br/', 'https://sressparaiso.educacao.mg.gov.br/index.php/licitacoes', 'joomla', NULL),
(40, 'Sete Lagoas', 'Sete Lagoas', 'https://sresetelagoas.educacao.mg.gov.br/', 'https://sresetelagoas.educacao.mg.gov.br/licitacoes', 'joomla', NULL),
(41, 'Teófilo Otoni', 'Teófilo Otoni', 'https://sreteofilootoni.educacao.mg.gov.br/', 'https://sreteofilootoni.educacao.mg.gov.br/licitacoes/aquisicao-simplificada/', 'joomla', 'ATENÇÃO: Tem Google Sheets também'),
(42, 'Uberaba', 'Uberaba', 'https://sreuberaba.educacao.mg.gov.br/', 'https://sreuberaba.educacao.mg.gov.br/index.php/licitacoes', 'joomla', NULL),
(43, 'Uberlândia', 'Uberlândia', 'https://sreuberlandia.educacao.mg.gov.br/', 'https://sreuberlandia.educacao.mg.gov.br/aviso-de-publicacao/', 'joomla', NULL),
(44, 'Unaí', 'Unaí', 'https://sreunai.educacao.mg.gov.br/', 'https://sreunai.educacao.mg.gov.br/index.php/licitacoes', 'joomla', NULL),
(45, 'Varginha', 'Varginha', 'https://srevarginha.educacao.mg.gov.br/', 'https://srevarginha.educacao.mg.gov.br/index.php/licitacoes', 'joomla', NULL)
ON CONFLICT (codigo) DO NOTHING;

-- Adicionar URLs adicionais para SREs com múltiplas páginas
UPDATE sres SET urls_adicionais = ARRAY[
  'https://srecurvelo.educacao.mg.gov.br/index.php/licitacoes/apoio-educacional',
  'https://srecurvelo.educacao.mg.gov.br/index.php/licitacoes/custeio',
  'https://srecurvelo.educacao.mg.gov.br/index.php/licitacoes/emenda-parlamentar',
  'https://srecurvelo.educacao.mg.gov.br/index.php/licitacoes/mobiliario-e-equipamentos',
  'https://srecurvelo.educacao.mg.gov.br/index.php/licitacoes/projetos-atividades'
] WHERE codigo = 13;

UPDATE sres SET urls_adicionais = ARRAY[
  'https://srediamantina.educacao.mg.gov.br/index.php/licitacoes/aquisicao-simplificada',
  'https://srediamantina.educacao.mg.gov.br/index.php/licitacoes/manutencao-e-custeio',
  'https://srediamantina.educacao.mg.gov.br/index.php/licitacoes/projetos'
] WHERE codigo = 14;

UPDATE sres SET urls_adicionais = ARRAY[
  'https://sredivinopolis.educacao.mg.gov.br/licitacoes/pdde/capital',
  'https://sredivinopolis.educacao.mg.gov.br/licitacoes/aquisicao-simplificada'
] WHERE codigo = 15;

UPDATE sres SET urls_adicionais = ARRAY[
  'https://sregvaladares.educacao.mg.gov.br/index.php/licitacoes/aquisicao-simplificada'
] WHERE codigo = 16;

UPDATE sres SET urls_adicionais = ARRAY[
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vRlJruUoJuEpvpTLkV-z-Xu6exkN7sRsU0IGh4gIqdJyHOZ3i6j6jeQ7GjVq8vw1OAdi3mXHjeZi34n/pubhtml?widget=true&headers=false',
  'https://sreteofilootoni.educacao.mg.gov.br/licitacoes/kits-escolares/'
] WHERE codigo = 41;

-- View: SREs ativas para scraping
CREATE OR REPLACE VIEW sres_ativas_scraping AS
SELECT 
  s.codigo,
  s.nome,
  s.municipio,
  s.url_licitacoes,
  s.urls_adicionais,
  s.tipo_cms,
  s.ultima_coleta,
  s.taxa_sucesso,
  CASE 
    WHEN s.ultima_coleta IS NULL THEN true
    WHEN s.ultima_coleta < NOW() - INTERVAL '1 day' THEN true
    ELSE false
  END AS precisa_coletar
FROM sres s
WHERE s.ativo = true
ORDER BY 
  CASE WHEN s.ultima_coleta IS NULL THEN 0 ELSE 1 END,
  s.ultima_coleta ASC NULLS FIRST;

COMMENT ON VIEW sres_ativas_scraping IS 'SREs ativas que precisam de coleta (não coletadas ou > 24h)';

-- =====================================================
-- QUERIES ÚTEIS
-- =====================================================

-- Listar todas as SREs ativas
-- SELECT * FROM sres WHERE ativo = true ORDER BY codigo;

-- SREs que precisam de coleta
-- SELECT * FROM sres_ativas_scraping WHERE precisa_coletar = true;

-- Estatísticas de coleta
-- SELECT 
--   COUNT(*) as total_sres,
--   COUNT(*) FILTER (WHERE ativo = true) as ativas,
--   COUNT(*) FILTER (WHERE ultima_coleta IS NOT NULL) as ja_coletadas,
--   AVG(taxa_sucesso) FILTER (WHERE taxa_sucesso > 0) as taxa_sucesso_media
-- FROM sres;
