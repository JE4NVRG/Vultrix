-- =====================================================
-- MIGRATION 008: FILAMENTOS PROFISSIONAL
-- Marcas dinâmicas + Visual + Upload de imagens
-- =====================================================

-- 1. TABELA: filament_brands
-- Marcas de filamento por usuário
CREATE TABLE IF NOT EXISTS filament_brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  website TEXT,
  logo_url TEXT,
  UNIQUE(user_id, name)
);

CREATE INDEX idx_filament_brands_user ON filament_brands(user_id);
CREATE INDEX idx_filament_brands_name ON filament_brands(user_id, name);

-- 2. ATUALIZAR tabela filaments
-- Adicionar campos visuais e relação com marca
ALTER TABLE filaments 
ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES filament_brands(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS color_name TEXT,
ADD COLUMN IF NOT EXISTS color_hex TEXT DEFAULT '#808080',
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT;

CREATE INDEX IF NOT EXISTS idx_filaments_brand ON filaments(brand_id);
CREATE INDEX IF NOT EXISTS idx_filaments_color ON filaments(user_id, color_hex);

-- 3. MIGRAR marcas existentes para filament_brands
-- Extrair marcas únicas dos filamentos existentes
INSERT INTO filament_brands (user_id, name)
SELECT DISTINCT 
  f.user_id,
  f.marca
FROM filaments f
WHERE f.marca IS NOT NULL AND f.marca != ''
ON CONFLICT (user_id, name) DO NOTHING;

-- Atualizar filaments com brand_id
UPDATE filaments f
SET brand_id = fb.id
FROM filament_brands fb
WHERE f.user_id = fb.user_id 
  AND f.marca = fb.name
  AND f.brand_id IS NULL;

-- 4. STORAGE: Bucket para imagens de filamentos
-- Criar bucket público para imagens
INSERT INTO storage.buckets (id, name, public)
VALUES ('filament-images', 'filament-images', true)
ON CONFLICT (id) DO NOTHING;

-- 5. ROW LEVEL SECURITY

-- filament_brands
ALTER TABLE filament_brands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own brands"
  ON filament_brands FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own brands"
  ON filament_brands FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own brands"
  ON filament_brands FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own brands"
  ON filament_brands FOR DELETE
  USING (auth.uid() = user_id);

-- Storage policies para filament-images
CREATE POLICY "Users can upload own filament images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'filament-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Anyone can view filament images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'filament-images');

CREATE POLICY "Users can update own filament images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'filament-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own filament images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'filament-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- 6. FUNÇÃO: Estatísticas de filamentos por marca
CREATE OR REPLACE FUNCTION filaments_by_brand_summary(p_user_id UUID)
RETURNS TABLE (
  brand_id UUID,
  brand_name TEXT,
  total_filamentos BIGINT,
  estoque_total NUMERIC,
  custo_total NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    fb.id,
    fb.name,
    COUNT(f.id) as total_filamentos,
    COALESCE(SUM(f.peso_atual), 0) as estoque_total,
    COALESCE(SUM(f.custo_por_kg * f.peso_atual), 0) as custo_total
  FROM filament_brands fb
  LEFT JOIN filaments f ON f.brand_id = fb.id
  WHERE fb.user_id = p_user_id
  GROUP BY fb.id, fb.name
  ORDER BY total_filamentos DESC, fb.name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. FUNÇÃO: Filamentos com baixo estoque
CREATE OR REPLACE FUNCTION low_stock_filaments(p_user_id UUID, p_threshold NUMERIC DEFAULT 200)
RETURNS TABLE (
  id UUID,
  nome TEXT,
  marca TEXT,
  color_name TEXT,
  color_hex TEXT,
  peso_atual NUMERIC,
  custo_por_kg NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.id,
    f.nome,
    COALESCE(fb.name, f.marca) as marca,
    f.color_name,
    f.color_hex,
    f.peso_atual,
    f.custo_por_kg
  FROM filaments f
  LEFT JOIN filament_brands fb ON f.brand_id = fb.id
  WHERE f.user_id = p_user_id 
    AND f.peso_atual < p_threshold
  ORDER BY f.peso_atual ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. VIEW: Filamentos com informações completas
CREATE OR REPLACE VIEW filaments_complete AS
SELECT 
  f.id,
  f.user_id,
  f.nome,
  f.marca as legacy_marca, -- Campo antigo
  fb.name as brand_name,
  fb.website as brand_website,
  fb.logo_url as brand_logo,
  f.brand_id,
  f.tipo,
  f.peso_atual,
  f.custo_por_kg,
  f.color_name,
  f.color_hex,
  f.image_url,
  f.notes,
  f.created_at,
  -- Campos calculados
  (f.peso_atual * f.custo_por_kg) as valor_total_estoque,
  CASE 
    WHEN f.peso_atual < 200 THEN 'low'
    WHEN f.peso_atual < 500 THEN 'medium'
    ELSE 'high'
  END as stock_level
FROM filaments f
LEFT JOIN filament_brands fb ON f.brand_id = fb.id;

-- 9. TRIGGERS: Manter consistência

-- Trigger para popular color_name automaticamente se vazio
CREATE OR REPLACE FUNCTION auto_populate_color_name()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.color_name IS NULL OR NEW.color_name = '' THEN
    NEW.color_name := CASE 
      WHEN NEW.color_hex = '#FF0000' THEN 'Vermelho'
      WHEN NEW.color_hex = '#00FF00' THEN 'Verde'
      WHEN NEW.color_hex = '#0000FF' THEN 'Azul'
      WHEN NEW.color_hex = '#FFFF00' THEN 'Amarelo'
      WHEN NEW.color_hex = '#FFFFFF' THEN 'Branco'
      WHEN NEW.color_hex = '#000000' THEN 'Preto'
      ELSE 'Personalizado'
    END;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_color_name
  BEFORE INSERT OR UPDATE ON filaments
  FOR EACH ROW
  EXECUTE FUNCTION auto_populate_color_name();

-- 10. COMENTÁRIOS
COMMENT ON TABLE filament_brands IS 'Marcas de filamento gerenciadas por usuário';
COMMENT ON COLUMN filaments.brand_id IS 'Referência à marca do filamento';
COMMENT ON COLUMN filaments.color_hex IS 'Código hexadecimal da cor (#RRGGBB)';
COMMENT ON COLUMN filaments.image_url IS 'URL da imagem no Supabase Storage';
COMMENT ON FUNCTION filaments_by_brand_summary IS 'Estatísticas agrupadas por marca';
COMMENT ON FUNCTION low_stock_filaments IS 'Filamentos com estoque abaixo do threshold';
COMMENT ON VIEW filaments_complete IS 'View com dados completos de filamentos e marcas';

-- 11. POPULAR marcas padrão (opcional, descomente se desejar)
/*
INSERT INTO filament_brands (user_id, name, website)
SELECT 
  u.id,
  b.name,
  b.website
FROM auth.users u
CROSS JOIN (
  VALUES 
    ('Creality', 'https://www.creality.com'),
    ('eSUN', 'https://www.esun3d.com'),
    ('Prusament', 'https://prusament.com'),
    ('Polymaker', 'https://www.polymaker.com'),
    ('ColorFabb', 'https://colorfabb.com'),
    ('3DFila', NULL),
    ('SUNLU', 'https://www.sunlu.com'),
    ('Overture', NULL)
) b(name, website)
ON CONFLICT (user_id, name) DO NOTHING;
*/
