-- Migration para atualizar tabela de vendas
-- Adicionar novos campos

ALTER TABLE sales 
ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1 NOT NULL,
ADD COLUMN IF NOT EXISTS sale_price NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS cost_price NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS profit NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'dinheiro';

-- Atualizar registros existentes se houver
UPDATE sales 
SET sale_price = valor_venda,
    cost_price = 0,
    profit = lucro_calculado
WHERE sale_price IS NULL;

-- Manter compatibilidade com campos antigos (criar views se necessário)
COMMENT ON COLUMN sales.valor_venda IS 'Campo legado - usar sale_price';
COMMENT ON COLUMN sales.lucro_calculado IS 'Campo legado - usar profit';
