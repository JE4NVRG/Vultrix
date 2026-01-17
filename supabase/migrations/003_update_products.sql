-- Migration para atualizar tabela products
-- Adicionar campos de filamento e status

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS filamento_id UUID REFERENCES filaments(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'desativado'));

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_products_filamento_id ON products(filamento_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);

-- Comentários explicativos
COMMENT ON COLUMN products.filamento_id IS 'Referência ao filamento usado no produto';
COMMENT ON COLUMN products.status IS 'Status do produto: ativo ou desativado';
