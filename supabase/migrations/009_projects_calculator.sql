-- =====================================================
-- MIGRATION 009: CALCULADORA DE PROJETOS
-- =====================================================

-- 1) Tabela de projetos
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft'
);

CREATE INDEX IF NOT EXISTS idx_projects_user ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
  ON projects FOR DELETE
  USING (auth.uid() = user_id);

-- 2) Tabela de filamentos por projeto
CREATE TABLE IF NOT EXISTS project_filaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  filament_id UUID NOT NULL REFERENCES filaments(id) ON DELETE CASCADE,
  weight_grams NUMERIC NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_project_filaments_project ON project_filaments(project_id);
CREATE INDEX IF NOT EXISTS idx_project_filaments_filament ON project_filaments(filament_id);
CREATE INDEX IF NOT EXISTS idx_project_filaments_user ON project_filaments(user_id);

ALTER TABLE project_filaments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own project filaments"
  ON project_filaments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own project filaments"
  ON project_filaments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own project filaments"
  ON project_filaments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own project filaments"
  ON project_filaments FOR DELETE
  USING (auth.uid() = user_id);

-- 3) Tabela de custos adicionais do projeto
CREATE TABLE IF NOT EXISTS project_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  description TEXT,
  value NUMERIC NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_project_costs_project ON project_costs(project_id);
CREATE INDEX IF NOT EXISTS idx_project_costs_user ON project_costs(user_id);

ALTER TABLE project_costs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own project costs"
  ON project_costs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own project costs"
  ON project_costs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own project costs"
  ON project_costs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own project costs"
  ON project_costs FOR DELETE
  USING (auth.uid() = user_id);

-- 4) Atualizar products com vínculo a projetos e preços
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS preco_minimo NUMERIC,
  ADD COLUMN IF NOT EXISTS preco_sugerido NUMERIC,
  ADD COLUMN IF NOT EXISTS margem NUMERIC;

CREATE INDEX IF NOT EXISTS idx_products_project ON products(project_id);

-- Comentários
COMMENT ON TABLE projects IS 'Projetos de impressão com composição de filamentos e custos';
COMMENT ON TABLE project_filaments IS 'Filamentos associados a cada projeto e seus pesos';
COMMENT ON TABLE project_costs IS 'Custos extras associados ao projeto (energia, serviços, etc)';
COMMENT ON COLUMN project_filaments.weight_grams IS 'Peso utilizado do filamento em gramas';
COMMENT ON COLUMN project_costs.value IS 'Valor monetário do custo extra';
