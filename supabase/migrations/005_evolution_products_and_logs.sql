-- Migration para evolução do sistema Vultrix 3D
-- Adiciona funcionalidades de controle de estoque e logs

-- 1. Adicionar campo filamento_id e status à tabela products se não existir
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS filamento_id UUID REFERENCES filaments(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'desativado'));

-- 2. Criar tabela de logs de consumo de filamento
CREATE TABLE IF NOT EXISTS filament_consumption_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    filamento_id UUID REFERENCES filaments(id) ON DELETE CASCADE NOT NULL,
    produto_id UUID REFERENCES products(id) ON DELETE SET NULL,
    sale_id UUID REFERENCES sales(id) ON DELETE SET NULL,
    quantidade_consumida NUMERIC(10, 2) NOT NULL,
    peso_anterior NUMERIC(10, 2) NOT NULL,
    peso_posterior NUMERIC(10, 2) NOT NULL,
    operacao TEXT NOT NULL CHECK (operacao IN ('venda', 'teste', 'ajuste')),
    observacao TEXT
);

-- 3. Criar tabela de configurações do usuário
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    custo_kwh NUMERIC(10, 4) DEFAULT 0.95 NOT NULL, -- Custo por kWh em R$
    consumo_impressora_watts NUMERIC(10, 2) DEFAULT 200 NOT NULL, -- Consumo médio da impressora em watts
    custo_hora_maquina NUMERIC(10, 2) DEFAULT 5.00 NOT NULL, -- Custo/hora incluindo depreciação
    margem_lucro_padrao NUMERIC(5, 2) DEFAULT 50.00 NOT NULL -- Margem padrão em %
);

-- 4. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_filament_logs_filamento_id ON filament_consumption_logs(filamento_id);
CREATE INDEX IF NOT EXISTS idx_filament_logs_produto_id ON filament_consumption_logs(produto_id);
CREATE INDEX IF NOT EXISTS idx_filament_logs_user_id ON filament_consumption_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_products_filamento_id ON products(filamento_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);

-- 5. Habilitar RLS nas novas tabelas
ALTER TABLE filament_consumption_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- 6. Criar policies para filament_consumption_logs
CREATE POLICY "Users can view own logs" ON filament_consumption_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own logs" ON filament_consumption_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 7. Criar policies para user_settings
CREATE POLICY "Users can view own settings" ON user_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" ON user_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" ON user_settings
    FOR UPDATE USING (auth.uid() = user_id);

-- 8. Criar função para calcular custo de impressão
CREATE OR REPLACE FUNCTION calculate_print_cost(
    peso_gramas NUMERIC,
    custo_por_kg NUMERIC,
    tempo_horas NUMERIC,
    custo_kwh NUMERIC,
    consumo_watts NUMERIC,
    custo_hora NUMERIC
)
RETURNS TABLE(
    custo_material NUMERIC,
    custo_energia NUMERIC,
    custo_maquina NUMERIC,
    custo_total NUMERIC
) AS $$
BEGIN
    RETURN QUERY SELECT
        ROUND((peso_gramas / 1000.0) * custo_por_kg, 2) as custo_material,
        ROUND((tempo_horas * (consumo_watts / 1000.0) * custo_kwh), 2) as custo_energia,
        ROUND(tempo_horas * custo_hora, 2) as custo_maquina,
        ROUND(
            (peso_gramas / 1000.0) * custo_por_kg + 
            (tempo_horas * (consumo_watts / 1000.0) * custo_kwh) + 
            (tempo_horas * custo_hora),
            2
        ) as custo_total;
END;
$$ LANGUAGE plpgsql;

-- 9. Criar função para baixa automática de estoque
CREATE OR REPLACE FUNCTION baixar_estoque_filamento()
RETURNS TRIGGER AS $$
DECLARE
    v_produto RECORD;
    v_filamento RECORD;
    v_peso_consumido NUMERIC;
BEGIN
    -- Buscar informações do produto
    SELECT * INTO v_produto FROM products WHERE id = NEW.produto_id;
    
    IF v_produto.filamento_id IS NULL THEN
        RAISE NOTICE 'Produto sem filamento associado. Venda registrada sem baixa de estoque.';
        RETURN NEW;
    END IF;
    
    -- Calcular peso consumido
    v_peso_consumido := v_produto.peso_usado * NEW.quantity;
    
    -- Buscar filamento atual
    SELECT * INTO v_filamento FROM filaments WHERE id = v_produto.filamento_id;
    
    -- Verificar se há estoque suficiente
    IF v_filamento.peso_atual < v_peso_consumido THEN
        RAISE EXCEPTION 'Estoque insuficiente! Disponível: %g, Necessário: %g', 
            v_filamento.peso_atual, v_peso_consumido;
    END IF;
    
    -- Atualizar estoque do filamento
    UPDATE filaments 
    SET peso_atual = peso_atual - v_peso_consumido
    WHERE id = v_produto.filamento_id;
    
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
        v_produto.filamento_id,
        NEW.produto_id,
        NEW.id,
        v_peso_consumido,
        v_filamento.peso_atual,
        v_filamento.peso_atual - v_peso_consumido,
        'venda',
        'Baixa automática - Venda #' || NEW.id
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Criar trigger para baixa automática
DROP TRIGGER IF EXISTS trigger_baixar_estoque ON sales;
CREATE TRIGGER trigger_baixar_estoque
    AFTER INSERT ON sales
    FOR EACH ROW
    EXECUTE FUNCTION baixar_estoque_filamento();

-- 11. Comentários para documentação
COMMENT ON TABLE filament_consumption_logs IS 'Registro histórico de consumo de filamentos';
COMMENT ON TABLE user_settings IS 'Configurações personalizadas por usuário';
COMMENT ON FUNCTION calculate_print_cost IS 'Calcula custo detalhado de impressão 3D';
COMMENT ON FUNCTION baixar_estoque_filamento IS 'Função automática para baixa de estoque ao registrar venda';
COMMENT ON COLUMN products.filamento_id IS 'Filamento utilizado na impressão deste produto';
COMMENT ON COLUMN products.status IS 'Status do produto (ativo/desativado)';
