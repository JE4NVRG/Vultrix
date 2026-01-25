-- =====================================================
-- MIGRATION 021: ADICIONAR THUMBNAIL AOS PRODUTOS
-- Adiciona coluna para armazenar imagem do produto
-- =====================================================

-- Adicionar coluna thumbnail_url
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

COMMENT ON COLUMN products.thumbnail_url IS 'URL da imagem em miniatura do produto (base64 ou storage)';
