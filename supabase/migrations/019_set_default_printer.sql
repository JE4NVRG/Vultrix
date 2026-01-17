-- =====================================================
-- RPC: SET DEFAULT PRINTER (ATOMIC)
-- =====================================================

-- Função para definir impressora padrão garantindo apenas 1 por usuário
CREATE OR REPLACE FUNCTION set_default_printer(p_printer_id UUID)
RETURNS VOID AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Buscar user_id da impressora
  SELECT user_id INTO v_user_id
  FROM printers
  WHERE id = p_printer_id;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Impressora não encontrada';
  END IF;

  -- Verificar se a impressora pertence ao usuário autenticado
  IF v_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Você não tem permissão para modificar esta impressora';
  END IF;

  -- Remover default de todas as impressoras do usuário
  UPDATE printers
  SET is_default = false
  WHERE user_id = v_user_id;

  -- Definir a nova impressora como padrão
  UPDATE printers
  SET is_default = true
  WHERE id = p_printer_id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentário
COMMENT ON FUNCTION set_default_printer IS 
  'Define uma impressora como padrão, removendo o flag das demais do usuário';

-- Grant execute para authenticated users
GRANT EXECUTE ON FUNCTION set_default_printer TO authenticated;
