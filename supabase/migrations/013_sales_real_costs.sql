-- =====================================================
-- MIGRATION 013: CAMPOS REAIS DE IMPRESSAO NA TABELA SALES
-- Peso real, tempo real, custos detalhados e lucro liquido
-- =====================================================

ALTER TABLE sales
ADD COLUMN IF NOT EXISTS filament_id UUID REFERENCES filaments(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS weight_grams NUMERIC,
ADD COLUMN IF NOT EXISTS print_time_hours NUMERIC,
ADD COLUMN IF NOT EXISTS machine_cost NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS material_cost NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS extras_cost NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_cost NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS net_profit NUMERIC DEFAULT 0;

COMMENT ON COLUMN sales.filament_id IS 'Filamento realmente usado na venda';
COMMENT ON COLUMN sales.weight_grams IS 'Peso real consumido (gramas)';
COMMENT ON COLUMN sales.print_time_hours IS 'Tempo real de impressao (horas)';
COMMENT ON COLUMN sales.machine_cost IS 'Custo de maquina para a venda';
COMMENT ON COLUMN sales.material_cost IS 'Custo de material real para a venda';
COMMENT ON COLUMN sales.extras_cost IS 'Custos extras (embalagem/envio/etc.) da venda';
COMMENT ON COLUMN sales.total_cost IS 'Custo total real da venda';
COMMENT ON COLUMN sales.net_profit IS 'Lucro liquido (receita - custo total)';
