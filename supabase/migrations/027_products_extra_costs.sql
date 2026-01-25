-- =====================================================
-- MIGRATION 027: COLUNAS EXTRAS DE CUSTO PARA PRODUTOS
-- Adiciona campos de embalagem, etiqueta, marketplace e preço manual
-- =====================================================

-- Adicionar colunas de custos extras (se não existirem)
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS embalagem_cost NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS etiqueta_cost NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS frete_cost NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS marketplace_fee_percent NUMERIC(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS antecipacao_fee_percent NUMERIC(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS preco_venda_manual NUMERIC(10,2) NULL,
ADD COLUMN IF NOT EXISTS quantidade_unidades INTEGER DEFAULT 1;

-- Comentários
COMMENT ON COLUMN products.embalagem_cost IS 'Custo de embalagem por unidade (R$)';
COMMENT ON COLUMN products.etiqueta_cost IS 'Custo de etiqueta/adesivo por unidade (R$)';
COMMENT ON COLUMN products.frete_cost IS 'Custo de frete (R$)';
COMMENT ON COLUMN products.marketplace_fee_percent IS 'Taxa do marketplace (%)';
COMMENT ON COLUMN products.antecipacao_fee_percent IS 'Taxa de antecipação (%)';
COMMENT ON COLUMN products.preco_venda_manual IS 'Preço de venda definido manualmente (R$)';
COMMENT ON COLUMN products.quantidade_unidades IS 'Quantidade de unidades no plate';
