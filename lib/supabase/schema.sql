-- Importador de Licitações - Database Schema
-- Run this in your Supabase SQL Editor

-- Table: licitacoes
CREATE TABLE IF NOT EXISTS licitacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sre_source VARCHAR(100) NOT NULL,
  numero_edital VARCHAR(50),
  modalidade VARCHAR(50),
  objeto TEXT,
  valor_estimado DECIMAL(15,2),
  data_publicacao DATE,
  data_abertura TIMESTAMP,
  situacao VARCHAR(50),
  documentos JSONB,
  raw_data JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_sre_source ON licitacoes(sre_source);
CREATE INDEX IF NOT EXISTS idx_data_publicacao ON licitacoes(data_publicacao DESC);
CREATE INDEX IF NOT EXISTS idx_situacao ON licitacoes(situacao);

-- Table: scraping_logs
CREATE TABLE IF NOT EXISTS scraping_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sre_source VARCHAR(100) NOT NULL,
  status VARCHAR(50) NOT NULL,
  records_found INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- Enable Row Level Security (optional - configure based on your needs)
ALTER TABLE licitacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraping_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all operations for now (adjust for production)
CREATE POLICY "Allow all operations" ON licitacoes FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON scraping_logs FOR ALL USING (true);
