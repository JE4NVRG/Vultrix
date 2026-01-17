-- =====================================================
-- MIGRATION 010: VENDAS, FILAMENTOS DA VENDA E CAIXA
-- =====================================================

-- 1) Tabela de vendas
CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity NUMERIC NOT NULL,
  sale_price NUMERIC NOT NULL,
  total_sale NUMERIC NOT NULL,
  total_cost NUMERIC NOT NULL,
  profit NUMERIC NOT NULL,
  channel TEXT NOT NULL DEFAULT 'outro',
  payment_method TEXT,
  sale_date DATE NOT NULL DEFAULT current_date,
  customer TEXT
);

CREATE INDEX IF NOT EXISTS idx_sales_user ON sales(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_product ON sales(product_id);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(sale_date);

ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sales"
  ON sales FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sales"
  ON sales FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sales"
  ON sales FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sales"
  ON sales FOR DELETE
  USING (auth.uid() = user_id);

-- 2) Tabela de filamentos consumidos em cada venda
CREATE TABLE IF NOT EXISTS sale_filaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  filament_id UUID NOT NULL REFERENCES filaments(id) ON DELETE CASCADE,
  weight_grams NUMERIC NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sale_filaments_sale ON sale_filaments(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_filaments_filament ON sale_filaments(filament_id);
CREATE INDEX IF NOT EXISTS idx_sale_filaments_user ON sale_filaments(user_id);

ALTER TABLE sale_filaments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sale filaments"
  ON sale_filaments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sale filaments"
  ON sale_filaments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sale filaments"
  ON sale_filaments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sale filaments"
  ON sale_filaments FOR DELETE
  USING (auth.uid() = user_id);

-- 3) Tabela de fluxo de caixa
CREATE TABLE IF NOT EXISTS cashflow (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  reference_id UUID,
  value NUMERIC NOT NULL,
  date DATE NOT NULL DEFAULT current_date,
  description TEXT
);

CREATE INDEX IF NOT EXISTS idx_cashflow_user ON cashflow(user_id);
CREATE INDEX IF NOT EXISTS idx_cashflow_date ON cashflow(date);

ALTER TABLE cashflow ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own cashflow"
  ON cashflow FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cashflow"
  ON cashflow FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cashflow"
  ON cashflow FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cashflow"
  ON cashflow FOR DELETE
  USING (auth.uid() = user_id);

-- 4) Função para registrar venda com lucro, baixa de filamento e entrada no caixa
CREATE OR REPLACE FUNCTION register_sale(
  p_product_id UUID,
  p_quantity NUMERIC,
  p_sale_price NUMERIC,
  p_channel TEXT DEFAULT 'outro',
  p_payment_method TEXT DEFAULT NULL,
  p_sale_date DATE DEFAULT current_date,
  p_customer TEXT DEFAULT NULL,
  p_filaments JSONB DEFAULT '[]'::JSONB
)
RETURNS sales
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_cost_per_unit NUMERIC;
  v_total_sale NUMERIC;
  v_total_cost NUMERIC;
  v_profit NUMERIC;
  v_sale sales;
  v_item JSONB;
  v_filament_id UUID;
  v_weight NUMERIC;
  v_before NUMERIC;
  v_after NUMERIC;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Auth required';
  END IF;

  IF p_quantity IS NULL OR p_quantity <= 0 THEN
    RAISE EXCEPTION 'Quantity must be > 0';
  END IF;

  SELECT custo_total
  INTO v_cost_per_unit
  FROM products
  WHERE id = p_product_id AND user_id = v_user;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Produto não encontrado para este usuário';
  END IF;

  v_total_sale := p_quantity * p_sale_price;
  v_total_cost := p_quantity * COALESCE(v_cost_per_unit, 0);
  v_profit := v_total_sale - v_total_cost;

  INSERT INTO sales (
    user_id,
    product_id,
    quantity,
    sale_price,
    total_sale,
    total_cost,
    profit,
    channel,
    payment_method,
    sale_date,
    customer
  ) VALUES (
    v_user,
    p_product_id,
    p_quantity,
    p_sale_price,
    v_total_sale,
    v_total_cost,
    v_profit,
    COALESCE(p_channel, 'outro'),
    p_payment_method,
    COALESCE(p_sale_date, current_date),
    p_customer
  ) RETURNING * INTO v_sale;

  -- Entrada no caixa
  INSERT INTO cashflow (user_id, type, reference_id, value, date, description)
  VALUES (v_user, 'income', v_sale.id, v_total_sale, v_sale.sale_date, CONCAT('Venda do produto ', v_sale.product_id));

  -- Consumo de filamentos
  FOR v_item IN SELECT * FROM jsonb_array_elements(COALESCE(p_filaments, '[]'::jsonb)) LOOP
    v_filament_id := (v_item ->> 'filament_id')::uuid;
    v_weight := COALESCE((v_item ->> 'weight_grams')::numeric, 0);

    IF v_filament_id IS NULL OR v_weight <= 0 THEN
      CONTINUE;
    END IF;

    SELECT peso_atual INTO v_before FROM filaments WHERE id = v_filament_id AND user_id = v_user FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Filamento % não encontrado para este usuário', v_filament_id;
    END IF;

    UPDATE filaments
    SET peso_atual = GREATEST(peso_atual - v_weight, 0)
    WHERE id = v_filament_id AND user_id = v_user
    RETURNING peso_atual INTO v_after;

    INSERT INTO sale_filaments (user_id, sale_id, filament_id, weight_grams)
    VALUES (v_user, v_sale.id, v_filament_id, v_weight);

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
      v_user,
      v_filament_id,
      v_sale.product_id,
      v_sale.id,
      v_weight,
      v_before,
      v_after,
      'venda',
      'Baixa automática na venda'
    );
  END LOOP;

  RETURN v_sale;
END;
$$;

COMMENT ON FUNCTION register_sale IS 'Registra venda, calcula lucro, baixa estoque de filamentos e insere entrada no caixa.';
COMMENT ON TABLE sales IS 'Vendas com total, custo e lucro';
COMMENT ON TABLE sale_filaments IS 'Filamentos consumidos em cada venda';
COMMENT ON TABLE cashflow IS 'Fluxo de caixa (entradas/saídas)';
