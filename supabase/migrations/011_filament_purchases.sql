-- =====================================================
-- MIGRATION 011: COMPRAS DE FILAMENTO COM FRETE RATEADO
-- Pedido + itens + rateio de frete por peso ou valor
-- =====================================================

-- 1) Pedido de compra (um pedido do site)
CREATE TABLE IF NOT EXISTS filament_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  supplier_name TEXT,
  supplier_url TEXT,
  invoice_number TEXT,
  purchase_date DATE NOT NULL DEFAULT current_date,

  subtotal NUMERIC NOT NULL DEFAULT 0,
  shipping_cost NUMERIC NOT NULL DEFAULT 0,
  discount NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,

  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_filament_purchases_user ON filament_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_filament_purchases_date ON filament_purchases(purchase_date);

ALTER TABLE filament_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own filament purchases"
  ON filament_purchases FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own filament purchases"
  ON filament_purchases FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own filament purchases"
  ON filament_purchases FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own filament purchases"
  ON filament_purchases FOR DELETE
  USING (auth.uid() = user_id);

-- 2) Itens do pedido (cada bobina / item comprado)
CREATE TABLE IF NOT EXISTS filament_purchase_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  purchase_id UUID NOT NULL REFERENCES filament_purchases(id) ON DELETE CASCADE,

  brand_id UUID REFERENCES filament_brands(id) ON DELETE SET NULL,
  tipo TEXT NOT NULL,
  color_name TEXT,
  color_hex TEXT DEFAULT '#808080',

  qty INT NOT NULL DEFAULT 1,
  weight_grams NUMERIC NOT NULL DEFAULT 1000,
  unit_price NUMERIC NOT NULL,

  shipping_allocated NUMERIC NOT NULL DEFAULT 0,
  unit_total_cost NUMERIC NOT NULL DEFAULT 0,

  filament_id UUID REFERENCES filaments(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_filament_purchase_items_purchase ON filament_purchase_items(purchase_id);
CREATE INDEX IF NOT EXISTS idx_filament_purchase_items_user ON filament_purchase_items(user_id);
CREATE INDEX IF NOT EXISTS idx_filament_purchase_items_brand ON filament_purchase_items(brand_id);

ALTER TABLE filament_purchase_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own filament purchase items"
  ON filament_purchase_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own filament purchase items"
  ON filament_purchase_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own filament purchase items"
  ON filament_purchase_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own filament purchase items"
  ON filament_purchase_items FOR DELETE
  USING (auth.uid() = user_id);

-- 3) Função para ratear frete e recalcular totais
CREATE OR REPLACE FUNCTION allocate_filament_shipping(
  p_purchase_id UUID,
  p_method TEXT DEFAULT 'weight' -- 'weight' ou 'value'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_purchase filament_purchases;
  v_total_weight NUMERIC;
  v_total_value NUMERIC;
  v_item RECORD;
  v_item_weight_total NUMERIC;
  v_item_value_total NUMERIC;
  v_ratio NUMERIC;
  v_shipping NUMERIC;
  v_subtotal NUMERIC;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Auth required';
  END IF;

  SELECT * INTO v_purchase
  FROM filament_purchases
  WHERE id = p_purchase_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Purchase not found';
  END IF;

  IF v_purchase.user_id <> v_user THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  SELECT COALESCE(SUM(weight_grams * qty), 0) INTO v_total_weight
  FROM filament_purchase_items
  WHERE purchase_id = p_purchase_id AND user_id = v_user;

  SELECT COALESCE(SUM(unit_price * qty), 0) INTO v_total_value
  FROM filament_purchase_items
  WHERE purchase_id = p_purchase_id AND user_id = v_user;

  SELECT COALESCE(SUM(unit_price * qty), 0) INTO v_subtotal
  FROM filament_purchase_items
  WHERE purchase_id = p_purchase_id AND user_id = v_user;

  v_shipping := COALESCE(v_purchase.shipping_cost, 0);

  FOR v_item IN
    SELECT id, qty, weight_grams, unit_price
    FROM filament_purchase_items
    WHERE purchase_id = p_purchase_id AND user_id = v_user
  LOOP
    v_item_weight_total := v_item.qty * v_item.weight_grams;
    v_item_value_total := v_item.qty * v_item.unit_price;

    IF p_method = 'value' THEN
      v_ratio := CASE WHEN v_total_value > 0 THEN v_item_value_total / v_total_value ELSE 0 END;
    ELSE
      v_ratio := CASE WHEN v_total_weight > 0 THEN v_item_weight_total / v_total_weight ELSE 0 END;
    END IF;

    UPDATE filament_purchase_items
    SET shipping_allocated = ROUND(v_shipping * v_ratio, 2),
        unit_total_cost = ROUND(
          CASE WHEN v_item.qty > 0 THEN (v_item.unit_price * v_item.qty + (v_shipping * v_ratio)) / v_item.qty ELSE v_item.unit_price END,
          2
        )
    WHERE id = v_item.id;
  END LOOP;

  UPDATE filament_purchases
  SET subtotal = ROUND(v_subtotal, 2),
      total = ROUND(v_subtotal + v_shipping - COALESCE(v_purchase.discount, 0), 2)
  WHERE id = p_purchase_id;
END;
$$;

COMMENT ON TABLE filament_purchases IS 'Pedidos de compra de filamentos com frete total e desconto';
COMMENT ON TABLE filament_purchase_items IS 'Itens do pedido de filamentos com rateio de frete';
COMMENT ON FUNCTION allocate_filament_shipping IS 'Rateia frete por peso ou valor e recalcula custo unitário';
