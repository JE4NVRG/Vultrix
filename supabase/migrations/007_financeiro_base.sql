-- =====================================================
-- MIGRATION 007: FINANCEIRO BASE
-- Aportes de Capital + Categorias Dinâmicas
-- =====================================================

-- 1. TABELA: expense_categories
-- Categorias dinâmicas de despesas
CREATE TABLE IF NOT EXISTS expense_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  cor TEXT DEFAULT '#6B7280', -- Cor para UI
  icone TEXT DEFAULT 'package', -- Nome do ícone Lucide
  ativo BOOLEAN DEFAULT true,
  UNIQUE(user_id, nome)
);

CREATE INDEX idx_expense_categories_user ON expense_categories(user_id);
CREATE INDEX idx_expense_categories_ativo ON expense_categories(user_id, ativo);

-- 2. TABELA: capital_contributions (Aportes)
-- Registra aportes de capital que não são vendas
CREATE TABLE IF NOT EXISTS capital_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  valor NUMERIC(10,2) NOT NULL CHECK (valor > 0),
  origem TEXT NOT NULL CHECK (origem IN ('pessoal', 'investimento', 'emprestimo', 'outro')),
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  observacao TEXT,
  comprovante_url TEXT -- Para upload futuro
);

CREATE INDEX idx_capital_contributions_user ON capital_contributions(user_id);
CREATE INDEX idx_capital_contributions_data ON capital_contributions(user_id, data DESC);

-- 3. ADICIONAR coluna category_id na tabela expenses
ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES expense_categories(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category_id);

-- 4. MIGRAR categorias existentes para expense_categories
-- Criar categorias padrão baseadas nas categorias antigas
INSERT INTO expense_categories (user_id, nome, descricao, cor, icone)
SELECT DISTINCT 
  e.user_id,
  e.categoria,
  'Categoria migrada automaticamente',
  CASE e.categoria
    WHEN 'material' THEN '#3B82F6'
    WHEN 'energia' THEN '#F59E0B'
    WHEN 'manutencao' THEN '#EF4444'
    WHEN 'marketing' THEN '#8B5CF6'
    WHEN 'equipamento' THEN '#10B981'
    ELSE '#6B7280'
  END,
  CASE e.categoria
    WHEN 'material' THEN 'package'
    WHEN 'energia' THEN 'zap'
    WHEN 'manutencao' THEN 'wrench'
    WHEN 'marketing' THEN 'megaphone'
    WHEN 'equipamento' THEN 'printer'
    ELSE 'circle'
  END
FROM expenses e
WHERE e.categoria IS NOT NULL
ON CONFLICT (user_id, nome) DO NOTHING;

-- Atualizar expenses com category_id
UPDATE expenses e
SET category_id = ec.id
FROM expense_categories ec
WHERE e.user_id = ec.user_id 
  AND e.categoria = ec.nome
  AND e.category_id IS NULL;

-- 5. ROW LEVEL SECURITY

-- expense_categories
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own categories"
  ON expense_categories FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own categories"
  ON expense_categories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories"
  ON expense_categories FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own categories"
  ON expense_categories FOR DELETE
  USING (auth.uid() = user_id);

-- capital_contributions
ALTER TABLE capital_contributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own contributions"
  ON capital_contributions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own contributions"
  ON capital_contributions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own contributions"
  ON capital_contributions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own contributions"
  ON capital_contributions FOR DELETE
  USING (auth.uid() = user_id);

-- 6. FUNÇÃO: Calcular saldo total (receitas + aportes - despesas)
CREATE OR REPLACE FUNCTION calculate_balance(p_user_id UUID, p_data_inicio DATE DEFAULT NULL, p_data_fim DATE DEFAULT NULL)
RETURNS TABLE (
  total_vendas NUMERIC,
  total_aportes NUMERIC,
  total_despesas NUMERIC,
  saldo_final NUMERIC,
  receita_liquida NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(s.valor_venda), 0) as total_vendas,
    COALESCE(SUM(cc.valor), 0) as total_aportes,
    COALESCE(SUM(e.valor), 0) as total_despesas,
    COALESCE(SUM(s.valor_venda), 0) + COALESCE(SUM(cc.valor), 0) - COALESCE(SUM(e.valor), 0) as saldo_final,
    COALESCE(SUM(s.valor_venda), 0) - COALESCE(SUM(e.valor), 0) as receita_liquida
  FROM (SELECT p_user_id as uid) u
  LEFT JOIN sales s ON s.user_id = u.uid 
    AND (p_data_inicio IS NULL OR s.data >= p_data_inicio)
    AND (p_data_fim IS NULL OR s.data <= p_data_fim)
  LEFT JOIN capital_contributions cc ON cc.user_id = u.uid
    AND (p_data_inicio IS NULL OR cc.data >= p_data_inicio)
    AND (p_data_fim IS NULL OR cc.data <= p_data_fim)
  LEFT JOIN expenses e ON e.user_id = u.uid
    AND (p_data_inicio IS NULL OR e.data >= p_data_inicio)
    AND (p_data_fim IS NULL OR e.data <= p_data_fim);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. FUNÇÃO: Estatísticas de categorias
CREATE OR REPLACE FUNCTION category_expenses_summary(p_user_id UUID, p_data_inicio DATE DEFAULT NULL, p_data_fim DATE DEFAULT NULL)
RETURNS TABLE (
  category_id UUID,
  category_name TEXT,
  category_color TEXT,
  total_gasto NUMERIC,
  quantidade_despesas BIGINT,
  percentual NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH totals AS (
    SELECT 
      ec.id,
      ec.nome,
      ec.cor,
      COALESCE(SUM(e.valor), 0) as total,
      COUNT(e.id) as qtd
    FROM expense_categories ec
    LEFT JOIN expenses e ON e.category_id = ec.id
      AND (p_data_inicio IS NULL OR e.data >= p_data_inicio)
      AND (p_data_fim IS NULL OR e.data <= p_data_fim)
    WHERE ec.user_id = p_user_id AND ec.ativo = true
    GROUP BY ec.id, ec.nome, ec.cor
  ),
  grand_total AS (
    SELECT COALESCE(SUM(total), 0) as gt FROM totals
  )
  SELECT 
    t.id,
    t.nome,
    t.cor,
    t.total,
    t.qtd,
    CASE 
      WHEN gt.gt > 0 THEN ROUND((t.total / gt.gt) * 100, 2)
      ELSE 0
    END as percentual
  FROM totals t
  CROSS JOIN grand_total gt
  ORDER BY t.total DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. COMENTÁRIOS
COMMENT ON TABLE expense_categories IS 'Categorias dinâmicas de despesas por usuário';
COMMENT ON TABLE capital_contributions IS 'Aportes de capital que não são vendas';
COMMENT ON FUNCTION calculate_balance IS 'Calcula saldo considerando vendas, aportes e despesas';
COMMENT ON FUNCTION category_expenses_summary IS 'Resumo de gastos por categoria';

-- 9. POPULAR categorias padrão para usuários existentes (opcional)
-- Descomente se quiser criar categorias padrão para todos
/*
INSERT INTO expense_categories (user_id, nome, descricao, cor, icone)
SELECT 
  u.id,
  c.nome,
  c.descricao,
  c.cor,
  c.icone
FROM auth.users u
CROSS JOIN (
  VALUES 
    ('Material', 'Filamentos e materiais de impressão', '#3B82F6', 'package'),
    ('Energia', 'Contas de luz e energia elétrica', '#F59E0B', 'zap'),
    ('Manutenção', 'Reparos e manutenção de equipamentos', '#EF4444', 'wrench'),
    ('Marketing', 'Publicidade e divulgação', '#8B5CF6', 'megaphone'),
    ('Equipamento', 'Compra de impressoras e ferramentas', '#10B981', 'printer')
) c(nome, descricao, cor, icone)
ON CONFLICT (user_id, nome) DO NOTHING;
*/
