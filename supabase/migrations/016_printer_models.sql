-- =====================================================
-- MIGRATION 016: CATALOGO DE MODELOS DE IMPRESSORAS
-- Permite selecionar modelos pre-cadastrados com specs
-- =====================================================

-- 1) Tabela de modelos de impressoras
CREATE TABLE IF NOT EXISTS printer_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  category TEXT DEFAULT 'fdm' CHECK (category IN ('fdm', 'resin', 'other')),
  
  avg_watts NUMERIC,
  peak_watts NUMERIC,
  notes TEXT,
  source TEXT DEFAULT 'seed',
  active BOOLEAN DEFAULT true,

  UNIQUE(brand, model)
);

CREATE INDEX IF NOT EXISTS idx_printer_models_brand ON printer_models(brand);
CREATE INDEX IF NOT EXISTS idx_printer_models_active ON printer_models(active);
CREATE INDEX IF NOT EXISTS idx_printer_models_search ON printer_models(brand, model) WHERE active = true;

ALTER TABLE printer_models ENABLE ROW LEVEL SECURITY;

-- Leitura publica para usuarios autenticados
DROP POLICY IF EXISTS "Authenticated users can view printer models" ON printer_models;
CREATE POLICY "Authenticated users can view printer models"
  ON printer_models FOR SELECT
  TO authenticated
  USING (active = true);

-- Apenas service role pode modificar
DROP POLICY IF EXISTS "Only service role can modify printer models" ON printer_models;
CREATE POLICY "Only service role can modify printer models"
  ON printer_models FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 2) Trigger para updated_at
CREATE OR REPLACE FUNCTION set_printer_models_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trig_printer_models_updated_at ON printer_models;
CREATE TRIGGER trig_printer_models_updated_at
BEFORE UPDATE ON printer_models
FOR EACH ROW EXECUTE FUNCTION set_printer_models_updated_at();

-- 3) Alterar tabela printers para referenciar modelo
ALTER TABLE printers
ADD COLUMN IF NOT EXISTS printer_model_id UUID REFERENCES printer_models(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_printers_model ON printers(printer_model_id);

COMMENT ON TABLE printer_models IS 'Catalogo de modelos de impressoras 3D com especificacoes';
COMMENT ON COLUMN printer_models.avg_watts IS 'Consumo medio em watts durante impressao';
COMMENT ON COLUMN printer_models.peak_watts IS 'Consumo pico em watts (opcional)';
COMMENT ON COLUMN printers.printer_model_id IS 'Referencia ao modelo de impressora usado';
