-- =====================================================
-- MIGRATION 012: CUSTOS DE EMBALAGEM, ETIQUETA, ENVIO E EXTRAS POR VENDA
-- Estrutura flexível para custos adicionais linha a linha
-- =====================================================

-- 1) Cadastro de materiais (embalagem, etiqueta, fita, etc.)
CREATE TABLE IF NOT EXISTS material_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('embalagem','etiqueta','fita','outro')),
  unit_cost NUMERIC NOT NULL,
  unit TEXT DEFAULT 'un',
  active BOOLEAN DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_material_items_user ON material_items(user_id);
CREATE INDEX IF NOT EXISTS idx_material_items_active ON material_items(user_id, active);
CREATE INDEX IF NOT EXISTS idx_material_items_type ON material_items(user_id, type);

ALTER TABLE material_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own material items"
  ON material_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own material items"
  ON material_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own material items"
  ON material_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own material items"
  ON material_items FOR DELETE
  USING (auth.uid() = user_id);

-- 2) Custos adicionais por venda (linha a linha)
CREATE TABLE IF NOT EXISTS sale_cost_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,

  material_id UUID REFERENCES material_items(id) ON DELETE SET NULL,
  description TEXT NOT NULL DEFAULT '',
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit_cost NUMERIC NOT NULL DEFAULT 0,
  total_cost NUMERIC NOT NULL DEFAULT 0,

  type TEXT NOT NULL CHECK (type IN ('embalagem','etiqueta','envio','taxa','outro'))
);

CREATE INDEX IF NOT EXISTS idx_sale_cost_items_sale ON sale_cost_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_cost_items_user ON sale_cost_items(user_id);
CREATE INDEX IF NOT EXISTS idx_sale_cost_items_type ON sale_cost_items(user_id, type);

ALTER TABLE sale_cost_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sale cost items"
  ON sale_cost_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sale cost items"
  ON sale_cost_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sale cost items"
  ON sale_cost_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sale cost items"
  ON sale_cost_items FOR DELETE
  USING (auth.uid() = user_id);

-- 3) View de resumo de custos adicionais por venda (ajuda no frontend)
CREATE OR REPLACE VIEW sale_costs_summary AS
SELECT
  sci.sale_id,
  sci.user_id,
  COALESCE(SUM(sci.total_cost), 0) AS extra_costs,
  COUNT(*) AS items_count
FROM sale_cost_items sci
GROUP BY sci.sale_id, sci.user_id;

COMMENT ON TABLE material_items IS 'Materiais de embalagem/etiqueta/fita com custo unitário';
COMMENT ON TABLE sale_cost_items IS 'Custos adicionais por venda (embalagem, etiqueta, envio, etc.)';
COMMENT ON VIEW sale_costs_summary IS 'Soma de custos extras por venda para recalcular lucro no app';
