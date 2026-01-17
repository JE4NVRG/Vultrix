-- Migration completa para o módulo de vendas
-- Adicionar todos os campos necessários à tabela sales

-- Adicionar novos campos se não existirem
ALTER TABLE sales 
ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1 NOT NULL,
ADD COLUMN IF NOT EXISTS sale_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS cost_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS profit NUMERIC(10, 2) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'dinheiro';

-- Atualizar registros existentes se houver
UPDATE sales 
SET 
    sale_price = COALESCE(valor_venda / NULLIF(quantity, 0), valor_venda),
    cost_price = 0,
    profit = COALESCE(lucro_calculado, 0)
WHERE sale_price = 0 OR sale_price IS NULL;

-- Adicionar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_sales_user_id ON sales(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_produto_id ON sales(produto_id);
CREATE INDEX IF NOT EXISTS idx_sales_data ON sales(data);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);

-- Adicionar comentários para documentação
COMMENT ON TABLE sales IS 'Tabela de vendas de produtos impressos em 3D';
COMMENT ON COLUMN sales.quantity IS 'Quantidade de itens vendidos';
COMMENT ON COLUMN sales.sale_price IS 'Preço unitário de venda';
COMMENT ON COLUMN sales.cost_price IS 'Custo unitário de produção';
COMMENT ON COLUMN sales.profit IS 'Lucro total da venda (sale_price * quantity - cost_price * quantity)';
COMMENT ON COLUMN sales.payment_method IS 'Método de pagamento utilizado';
COMMENT ON COLUMN sales.valor_venda IS 'LEGADO - Valor total da venda (usar sale_price * quantity)';
COMMENT ON COLUMN sales.lucro_calculado IS 'LEGADO - Lucro calculado (usar profit)';

-- Garantir que os policies de RLS existem
DO $$ 
BEGIN
    -- Verificar se as policies já existem antes de criar
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'sales' AND policyname = 'Users can view own sales'
    ) THEN
        CREATE POLICY "Users can view own sales" ON sales
            FOR SELECT USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'sales' AND policyname = 'Users can insert own sales'
    ) THEN
        CREATE POLICY "Users can insert own sales" ON sales
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'sales' AND policyname = 'Users can update own sales'
    ) THEN
        CREATE POLICY "Users can update own sales" ON sales
            FOR UPDATE USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'sales' AND policyname = 'Users can delete own sales'
    ) THEN
        CREATE POLICY "Users can delete own sales" ON sales
            FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;
