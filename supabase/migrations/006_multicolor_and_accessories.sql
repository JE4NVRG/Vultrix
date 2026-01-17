-- Migration 006: Suporte a produtos multicores, acessórios e fotos
-- Permite produtos com múltiplos filamentos e materiais extras

-- 1. Adicionar campo foto_url em products
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS foto_url TEXT;

-- 2. Criar tabela de acessórios (ímãs, chaveiros, etc)
CREATE TABLE IF NOT EXISTS accessories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    nome TEXT NOT NULL,
    categoria TEXT NOT NULL, -- 'ima', 'chaveiro', 'cola', 'tinta', 'outro'
    descricao TEXT,
    custo_unitario NUMERIC(10, 2) NOT NULL,
    estoque_atual INTEGER DEFAULT 0,
    unidade TEXT DEFAULT 'unidade' -- 'unidade', 'grama', 'ml', etc
);

-- 3. Criar tabela de filamentos usados em cada produto (many-to-many)
CREATE TABLE IF NOT EXISTS product_filaments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
    filament_id UUID REFERENCES filaments(id) ON DELETE CASCADE NOT NULL,
    peso_usado NUMERIC(10, 2) NOT NULL, -- gramas deste filamento
    ordem INTEGER DEFAULT 1, -- ordem de uso (para multicores)
    cor_identificacao TEXT, -- opcional: "base", "detalhes", etc
    UNIQUE(product_id, filament_id)
);

-- 4. Criar tabela de acessórios usados em cada produto (many-to-many)
CREATE TABLE IF NOT EXISTS product_accessories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
    accessory_id UUID REFERENCES accessories(id) ON DELETE CASCADE NOT NULL,
    quantidade NUMERIC(10, 2) NOT NULL, -- quantidade necessária
    UNIQUE(product_id, accessory_id)
);

-- 5. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_accessories_user_id ON accessories(user_id);
CREATE INDEX IF NOT EXISTS idx_accessories_categoria ON accessories(categoria);
CREATE INDEX IF NOT EXISTS idx_product_filaments_product_id ON product_filaments(product_id);
CREATE INDEX IF NOT EXISTS idx_product_filaments_filament_id ON product_filaments(filament_id);
CREATE INDEX IF NOT EXISTS idx_product_accessories_product_id ON product_accessories(product_id);
CREATE INDEX IF NOT EXISTS idx_product_accessories_accessory_id ON product_accessories(accessory_id);

-- 6. Habilitar RLS nas novas tabelas
ALTER TABLE accessories ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_filaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_accessories ENABLE ROW LEVEL SECURITY;

-- 7. Criar policies para accessories
CREATE POLICY "Users can view own accessories" ON accessories
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own accessories" ON accessories
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own accessories" ON accessories
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own accessories" ON accessories
    FOR DELETE USING (auth.uid() = user_id);

-- 8. Criar policies para product_filaments
CREATE POLICY "Users can view product filaments" ON product_filaments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM products 
            WHERE products.id = product_filaments.product_id 
            AND products.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert product filaments" ON product_filaments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM products 
            WHERE products.id = product_filaments.product_id 
            AND products.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update product filaments" ON product_filaments
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM products 
            WHERE products.id = product_filaments.product_id 
            AND products.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete product filaments" ON product_filaments
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM products 
            WHERE products.id = product_filaments.product_id 
            AND products.user_id = auth.uid()
        )
    );

-- 9. Criar policies para product_accessories
CREATE POLICY "Users can view product accessories" ON product_accessories
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM products 
            WHERE products.id = product_accessories.product_id 
            AND products.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert product accessories" ON product_accessories
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM products 
            WHERE products.id = product_accessories.product_id 
            AND products.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update product accessories" ON product_accessories
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM products 
            WHERE products.id = product_accessories.product_id 
            AND products.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete product accessories" ON product_accessories
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM products 
            WHERE products.id = product_accessories.product_id 
            AND products.user_id = auth.uid()
        )
    );

-- 10. Criar função para calcular custo total de produto multicolor
CREATE OR REPLACE FUNCTION calculate_product_total_cost(p_product_id UUID)
RETURNS TABLE(
    custo_filamentos NUMERIC,
    custo_acessorios NUMERIC,
    custo_energia NUMERIC,
    custo_total NUMERIC
) AS $$
DECLARE
    v_product RECORD;
    v_custo_filamentos NUMERIC := 0;
    v_custo_acessorios NUMERIC := 0;
    v_custo_energia NUMERIC := 0;
BEGIN
    -- Buscar produto
    SELECT * INTO v_product FROM products WHERE id = p_product_id;
    
    -- Calcular custo de filamentos
    SELECT COALESCE(SUM((pf.peso_usado / 1000.0) * f.custo_por_kg), 0)
    INTO v_custo_filamentos
    FROM product_filaments pf
    JOIN filaments f ON f.id = pf.filament_id
    WHERE pf.product_id = p_product_id;
    
    -- Calcular custo de acessórios
    SELECT COALESCE(SUM(pa.quantidade * a.custo_unitario), 0)
    INTO v_custo_acessorios
    FROM product_accessories pa
    JOIN accessories a ON a.id = pa.accessory_id
    WHERE pa.product_id = p_product_id;
    
    -- Custo de energia (já está no produto)
    v_custo_energia := COALESCE(v_product.custo_energia, 0);
    
    RETURN QUERY SELECT
        ROUND(v_custo_filamentos, 2) as custo_filamentos,
        ROUND(v_custo_acessorios, 2) as custo_acessorios,
        ROUND(v_custo_energia, 2) as custo_energia,
        ROUND(v_custo_filamentos + v_custo_acessorios + v_custo_energia, 2) as custo_total;
END;
$$ LANGUAGE plpgsql;

-- 11. Atualizar função de baixa de estoque para suportar múltiplos filamentos
CREATE OR REPLACE FUNCTION baixar_estoque_filamento()
RETURNS TRIGGER AS $$
DECLARE
    v_produto RECORD;
    v_filamento RECORD;
    v_peso_consumido NUMERIC;
    v_product_filament RECORD;
BEGIN
    -- Buscar informações do produto
    SELECT * INTO v_produto FROM products WHERE id = NEW.produto_id;
    
    -- Verificar se produto tem filamentos na tabela product_filaments
    IF EXISTS (SELECT 1 FROM product_filaments WHERE product_id = NEW.produto_id) THEN
        -- Produto multicolor - processar cada filamento
        FOR v_product_filament IN 
            SELECT pf.*, f.nome as filamento_nome
            FROM product_filaments pf
            JOIN filaments f ON f.id = pf.filament_id
            WHERE pf.product_id = NEW.produto_id
        LOOP
            -- Calcular peso consumido deste filamento
            v_peso_consumido := v_product_filament.peso_usado * NEW.quantity;
            
            -- Buscar filamento atual
            SELECT * INTO v_filamento FROM filaments WHERE id = v_product_filament.filament_id;
            
            -- Verificar se há estoque suficiente
            IF v_filamento.peso_atual < v_peso_consumido THEN
                RAISE EXCEPTION 'Estoque insuficiente do filamento %! Disponível: %g, Necessário: %g', 
                    v_product_filament.filamento_nome, v_filamento.peso_atual, v_peso_consumido;
            END IF;
            
            -- Atualizar estoque do filamento
            UPDATE filaments 
            SET peso_atual = peso_atual - v_peso_consumido
            WHERE id = v_product_filament.filament_id;
            
            -- Registrar log de consumo
            INSERT INTO filament_consumption_logs (
                user_id,
                filamento_id,
                produto_id,
                sale_id,
                quantidade_consumida,
                peso_anterior,
                peso_posterior,
                operacao,
                observacao
            ) VALUES (
                NEW.user_id,
                v_product_filament.filament_id,
                NEW.produto_id,
                NEW.id,
                v_peso_consumido,
                v_filamento.peso_atual,
                v_filamento.peso_atual - v_peso_consumido,
                'venda',
                'Baixa automática - Venda #' || NEW.id || ' - Filamento ' || v_product_filament.filamento_nome
            );
        END LOOP;
    ELSIF v_produto.filamento_id IS NOT NULL THEN
        -- Produto com filamento único (modo legado)
        v_peso_consumido := v_produto.peso_usado * NEW.quantity;
        
        SELECT * INTO v_filamento FROM filaments WHERE id = v_produto.filamento_id;
        
        IF v_filamento.peso_atual < v_peso_consumido THEN
            RAISE EXCEPTION 'Estoque insuficiente! Disponível: %g, Necessário: %g', 
                v_filamento.peso_atual, v_peso_consumido;
        END IF;
        
        UPDATE filaments 
        SET peso_atual = peso_atual - v_peso_consumido
        WHERE id = v_produto.filamento_id;
        
        INSERT INTO filament_consumption_logs (
            user_id,
            filamento_id,
            produto_id,
            sale_id,
            quantidade_consumida,
            peso_anterior,
            peso_posterior,
            operacao,
            observacao
        ) VALUES (
            NEW.user_id,
            v_produto.filamento_id,
            NEW.produto_id,
            NEW.id,
            v_peso_consumido,
            v_filamento.peso_atual,
            v_filamento.peso_atual - v_peso_consumido,
            'venda',
            'Baixa automática - Venda #' || NEW.id
        );
    ELSE
        RAISE NOTICE 'Produto sem filamento associado. Venda registrada sem baixa de estoque.';
    END IF;
    
    -- Baixar estoque de acessórios se houver
    FOR v_product_filament IN 
        SELECT pa.*, a.nome as acessorio_nome
        FROM product_accessories pa
        JOIN accessories a ON a.id = pa.accessory_id
        WHERE pa.product_id = NEW.produto_id
    LOOP
        UPDATE accessories
        SET estoque_atual = estoque_atual - (v_product_filament.quantidade * NEW.quantity)
        WHERE id = v_product_filament.accessory_id;
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 12. Comentários para documentação
COMMENT ON TABLE accessories IS 'Catálogo de acessórios e materiais extras (ímãs, chaveiros, cola, etc)';
COMMENT ON TABLE product_filaments IS 'Relacionamento many-to-many entre produtos e filamentos (produtos multicores)';
COMMENT ON TABLE product_accessories IS 'Relacionamento many-to-many entre produtos e acessórios';
COMMENT ON COLUMN products.foto_url IS 'URL da foto do produto (armazenada no Supabase Storage)';
COMMENT ON FUNCTION calculate_product_total_cost IS 'Calcula custo total de produto incluindo múltiplos filamentos e acessórios';
