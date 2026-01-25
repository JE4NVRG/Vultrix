-- =====================================================
-- MIGRATION 023: SISTEMA COMPLETO DE PRODUTOS COM MULTICOR
-- Suporte a multi-material, custos completos e metadados de fatiamento
-- =====================================================

-- ============================================================
-- PARTE 1: TABELA product_filaments (Multi-Material)
-- ============================================================

-- Dropar tabela antiga se existir (criada na migration 022 com estrutura diferente)
DROP TABLE IF EXISTS product_filaments CASCADE;

-- Recriar com estrutura atualizada
CREATE TABLE product_filaments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    filament_id UUID NOT NULL REFERENCES filaments(id) ON DELETE RESTRICT,
    slot_index INTEGER NULL, -- Slot AMS (1-4) se aplicável
    peso_gramas NUMERIC(10,2) NOT NULL CHECK (peso_gramas > 0),
    notes TEXT NULL,
    UNIQUE(product_id, filament_id, slot_index)
);

CREATE INDEX idx_product_filaments_product ON product_filaments(product_id);
CREATE INDEX idx_product_filaments_filament ON product_filaments(filament_id);

-- RLS para product_filaments
ALTER TABLE product_filaments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own product_filaments" ON product_filaments;
CREATE POLICY "Users view own product_filaments" ON product_filaments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM products p 
            WHERE p.id = product_filaments.product_id 
            AND p.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users insert own product_filaments" ON product_filaments;
CREATE POLICY "Users insert own product_filaments" ON product_filaments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM products p 
            WHERE p.id = product_filaments.product_id 
            AND p.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users update own product_filaments" ON product_filaments;
CREATE POLICY "Users update own product_filaments" ON product_filaments
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM products p 
            WHERE p.id = product_filaments.product_id 
            AND p.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users delete own product_filaments" ON product_filaments;
CREATE POLICY "Users delete own product_filaments" ON product_filaments
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM products p 
            WHERE p.id = product_filaments.product_id 
            AND p.user_id = auth.uid()
        )
    );

-- ============================================================
-- PARTE 2: EXPANDIR TABELA products (Custos + Metadados)
-- ============================================================

-- Garantir que filamento_id existe e é nullable (para suportar multi-material)
DO $$ 
BEGIN
    -- Adicionar coluna se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'filamento_id'
    ) THEN
        ALTER TABLE products ADD COLUMN filamento_id UUID REFERENCES filaments(id) ON DELETE SET NULL;
    END IF;
    
    -- Remover NOT NULL constraint se existir
    BEGIN
        ALTER TABLE products ALTER COLUMN filamento_id DROP NOT NULL;
    EXCEPTION
        WHEN OTHERS THEN NULL; -- Ignora erro se já for nullable
    END;
END $$;

-- Adicionar colunas de custos extras
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS embalagem_cost NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS etiqueta_cost NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS marketplace_fee_percent NUMERIC(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS marketplace_fixed_fee NUMERIC(10,2) DEFAULT 0;

-- Adicionar metadados técnicos do fatiamento
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS metadata JSONB NULL,
ADD COLUMN IF NOT EXISTS printer_id UUID NULL REFERENCES printers(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS source_file_name TEXT NULL,
ADD COLUMN IF NOT EXISTS source_file_type TEXT NULL CHECK (source_file_type IN ('gcode', '3mf', null)),
ADD COLUMN IF NOT EXISTS source_file_url TEXT NULL,
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT NULL;

-- Índices para queries comuns
CREATE INDEX IF NOT EXISTS idx_products_printer ON products(printer_id);
CREATE INDEX IF NOT EXISTS idx_products_source_type ON products(source_file_type);
CREATE INDEX IF NOT EXISTS idx_products_metadata ON products USING GIN (metadata);

-- ============================================================
-- PARTE 3: TABELA filament_consumption_logs (Rastreamento)
-- ============================================================

CREATE TABLE IF NOT EXISTS filament_consumption_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    filament_id UUID NOT NULL REFERENCES filaments(id) ON DELETE RESTRICT,
    product_id UUID NULL REFERENCES products(id) ON DELETE SET NULL,
    sale_id UUID NULL REFERENCES sales(id) ON DELETE SET NULL,
    tipo_movimentacao TEXT NOT NULL CHECK (tipo_movimentacao IN ('producao', 'venda', 'ajuste', 'devolucao')),
    quantidade_consumida NUMERIC(10,2) NOT NULL,
    peso_anterior NUMERIC(10,2) NOT NULL,
    peso_posterior NUMERIC(10,2) NOT NULL,
    observacao TEXT NULL
);

CREATE INDEX idx_filament_logs_user ON filament_consumption_logs(user_id);
CREATE INDEX idx_filament_logs_filament ON filament_consumption_logs(filament_id);
CREATE INDEX idx_filament_logs_product ON filament_consumption_logs(product_id);
CREATE INDEX idx_filament_logs_sale ON filament_consumption_logs(sale_id);
CREATE INDEX idx_filament_logs_created ON filament_consumption_logs(created_at DESC);

-- RLS para filament_consumption_logs
ALTER TABLE filament_consumption_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own logs" ON filament_consumption_logs;
CREATE POLICY "Users view own logs" ON filament_consumption_logs
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own logs" ON filament_consumption_logs;
CREATE POLICY "Users insert own logs" ON filament_consumption_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- PARTE 4: STORAGE BUCKET para arquivos de produtos
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'product-files',
    'product-files',
    false,
    52428800, -- 50MB
    ARRAY['text/plain', 'application/octet-stream', 'model/3mf']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies para product-files
CREATE POLICY "Users upload own product files" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'product-files' 
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users view own product files" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'product-files' 
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users delete own product files" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'product-files' 
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- ============================================================
-- PARTE 5: COMENTÁRIOS E DOCUMENTAÇÃO
-- ============================================================

COMMENT ON TABLE product_filaments IS 'Filamentos usados em cada produto (multi-material)';
COMMENT ON COLUMN product_filaments.slot_index IS 'Slot do AMS (1-4) ou ordem de uso';
COMMENT ON COLUMN product_filaments.peso_gramas IS 'Peso em gramas deste filamento no produto';

COMMENT ON TABLE filament_consumption_logs IS 'Histórico de consumo e movimentação de filamentos';
COMMENT ON COLUMN filament_consumption_logs.tipo_movimentacao IS 'Tipo: producao, venda, ajuste, devolucao';

COMMENT ON COLUMN products.metadata IS 'Metadados do fatiamento: layer_height, infill, supports, temps, etc (JSON)';
COMMENT ON COLUMN products.embalagem_cost IS 'Custo de embalagem por unidade (R$)';
COMMENT ON COLUMN products.etiqueta_cost IS 'Custo de etiqueta por unidade (R$)';
COMMENT ON COLUMN products.marketplace_fee_percent IS 'Taxa percentual do marketplace (ex: 13%)';
COMMENT ON COLUMN products.marketplace_fixed_fee IS 'Taxa fixa do marketplace (R$)';
COMMENT ON COLUMN products.source_file_type IS 'Tipo do arquivo fonte: gcode ou 3mf';
COMMENT ON COLUMN products.source_file_url IS 'URL do arquivo no Supabase Storage';

-- ============================================================
-- PARTE 6: FUNÇÃO HELPER para calcular custo total do produto
-- ============================================================

CREATE OR REPLACE FUNCTION calculate_product_total_cost(p_product_id UUID)
RETURNS TABLE (
    material_cost NUMERIC,
    energy_cost NUMERIC,
    packaging_cost NUMERIC,
    label_cost NUMERIC,
    marketplace_cost NUMERIC,
    total_cost NUMERIC
) AS $$
DECLARE
    v_material_cost NUMERIC := 0;
    v_energy_cost NUMERIC;
    v_packaging_cost NUMERIC;
    v_label_cost NUMERIC;
    v_marketplace_cost NUMERIC := 0;
    v_preco_venda NUMERIC;
    v_marketplace_fee_percent NUMERIC;
    v_marketplace_fixed_fee NUMERIC;
BEGIN
    -- Buscar dados do produto
    SELECT 
        p.custo_energia,
        COALESCE(p.embalagem_cost, 0),
        COALESCE(p.etiqueta_cost, 0),
        p.preco_venda,
        COALESCE(p.marketplace_fee_percent, 0),
        COALESCE(p.marketplace_fixed_fee, 0)
    INTO 
        v_energy_cost,
        v_packaging_cost,
        v_label_cost,
        v_preco_venda,
        v_marketplace_fee_percent,
        v_marketplace_fixed_fee
    FROM products p
    WHERE p.id = p_product_id;

    -- Calcular custo de materiais (soma de todos os filamentos)
    SELECT COALESCE(SUM((pf.peso_gramas / 1000.0) * f.custo_por_kg), 0)
    INTO v_material_cost
    FROM product_filaments pf
    JOIN filaments f ON f.id = pf.filament_id
    WHERE pf.product_id = p_product_id;

    -- Calcular taxa marketplace
    IF v_marketplace_fee_percent > 0 THEN
        v_marketplace_cost := (v_preco_venda * v_marketplace_fee_percent / 100.0);
    END IF;
    v_marketplace_cost := v_marketplace_cost + v_marketplace_fixed_fee;

    RETURN QUERY SELECT 
        v_material_cost,
        v_energy_cost,
        v_packaging_cost,
        v_label_cost,
        v_marketplace_cost,
        v_material_cost + v_energy_cost + v_packaging_cost + v_label_cost + v_marketplace_cost;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION calculate_product_total_cost IS 'Calcula todos os custos de um produto incluindo multi-material e taxas';
