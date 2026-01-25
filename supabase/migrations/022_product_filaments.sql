-- =====================================================
-- MIGRATION 022: GARANTIR TABELA PRODUCT_FILAMENTS
-- Cria tabela se não existir para suportar multi-material
-- =====================================================

-- Criar tabela de filamentos usados em cada produto (many-to-many)
CREATE TABLE IF NOT EXISTS product_filaments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
    filament_id UUID REFERENCES filaments(id) ON DELETE CASCADE NOT NULL,
    peso_gramas NUMERIC(10, 2) NOT NULL, -- gramas deste filamento
    ordem INTEGER DEFAULT 1, -- ordem de uso (para multicores)
    cor_identificacao TEXT, -- opcional: "base", "detalhes", etc
    UNIQUE(product_id, filament_id)
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_product_filaments_product_id ON product_filaments(product_id);
CREATE INDEX IF NOT EXISTS idx_product_filaments_filament_id ON product_filaments(filament_id);

-- Habilitar RLS
ALTER TABLE product_filaments ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can view own product_filaments" ON product_filaments;
CREATE POLICY "Users can view own product_filaments" ON product_filaments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM products 
            WHERE products.id = product_filaments.product_id 
            AND products.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert own product_filaments" ON product_filaments;
CREATE POLICY "Users can insert own product_filaments" ON product_filaments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM products 
            WHERE products.id = product_filaments.product_id 
            AND products.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update own product_filaments" ON product_filaments;
CREATE POLICY "Users can update own product_filaments" ON product_filaments
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM products 
            WHERE products.id = product_filaments.product_id 
            AND products.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can delete own product_filaments" ON product_filaments;
CREATE POLICY "Users can delete own product_filaments" ON product_filaments
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM products 
            WHERE products.id = product_filaments.product_id 
            AND products.user_id = auth.uid()
        )
    );
