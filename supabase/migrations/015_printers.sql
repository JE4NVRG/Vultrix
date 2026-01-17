-- =====================================================
-- MIGRATION 015: CADASTRO DE IMPRESSORAS (FASE 1)
-- Suporta multiplas impressoras por usuario com defaults de energia/custo
-- =====================================================

CREATE TABLE IF NOT EXISTS printers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  name TEXT NOT NULL,
  brand TEXT,
  model TEXT,
  notes TEXT,

  power_watts_default NUMERIC DEFAULT 200,
  kwh_cost_override NUMERIC,
  machine_hour_cost_override NUMERIC,

  is_default BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_printers_user ON printers(user_id);
CREATE INDEX IF NOT EXISTS idx_printers_active ON printers(user_id, active);
CREATE UNIQUE INDEX IF NOT EXISTS idx_printers_user_default ON printers(user_id) WHERE is_default;

ALTER TABLE printers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own printers" ON printers;
CREATE POLICY "Users can view own printers"
  ON printers FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own printers" ON printers;
CREATE POLICY "Users can insert own printers"
  ON printers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own printers" ON printers;
CREATE POLICY "Users can update own printers"
  ON printers FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own printers" ON printers;
CREATE POLICY "Users can delete own printers"
  ON printers FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger to keep updated_at fresh
CREATE OR REPLACE FUNCTION set_printers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trig_printers_updated_at ON printers;
CREATE TRIGGER trig_printers_updated_at
BEFORE UPDATE ON printers
FOR EACH ROW EXECUTE FUNCTION set_printers_updated_at();

COMMENT ON TABLE printers IS 'Impressoras do usuario, com dados de energia e custo por hora';
COMMENT ON COLUMN printers.power_watts_default IS 'Consumo padrao em watts para calculo de energia';
COMMENT ON COLUMN printers.kwh_cost_override IS 'Custo kWh especifico desta impressora (opcional)';
COMMENT ON COLUMN printers.machine_hour_cost_override IS 'Custo/hora especifico desta impressora (opcional)';
COMMENT ON COLUMN printers.is_default IS 'Marca a impressora padrao do usuario';
