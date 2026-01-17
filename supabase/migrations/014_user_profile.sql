-- =====================================================
-- MIGRATION 014: PERFIL DO USUARIO (FASE 1 ONBOARDING MAKER)
-- Identidade + defaults operacionais
-- =====================================================

CREATE TABLE IF NOT EXISTS user_profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  display_name TEXT,
  handle TEXT,
  whatsapp TEXT,
  city TEXT,
  logo_url TEXT,

  currency TEXT DEFAULT 'BRL',
  timezone TEXT DEFAULT 'America/Sao_Paulo',

  default_profit_margin_percent NUMERIC DEFAULT 50,
  default_include_packaging BOOLEAN DEFAULT true,
  default_include_label BOOLEAN DEFAULT true,
  default_include_shipping BOOLEAN DEFAULT false,
  default_kwh_cost NUMERIC DEFAULT 0.95,

  profile_completed BOOLEAN DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_user_profile_user ON user_profile(user_id);

-- Adicionar coluna profile_completed se não existir (para migrações incrementais)
ALTER TABLE user_profile ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT false;

ALTER TABLE user_profile ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON user_profile;
CREATE POLICY "Users can view own profile"
  ON user_profile FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own profile" ON user_profile;
CREATE POLICY "Users can insert own profile"
  ON user_profile FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON user_profile;
CREATE POLICY "Users can update own profile"
  ON user_profile FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own profile" ON user_profile;
CREATE POLICY "Users can delete own profile"
  ON user_profile FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger to keep updated_at fresh
CREATE OR REPLACE FUNCTION set_user_profile_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trig_user_profile_updated_at ON user_profile;
CREATE TRIGGER trig_user_profile_updated_at
BEFORE UPDATE ON user_profile
FOR EACH ROW EXECUTE FUNCTION set_user_profile_updated_at();

COMMENT ON TABLE user_profile IS 'Perfil do maker + defaults operacionais (onboarding Fase 1)';
COMMENT ON COLUMN user_profile.default_profit_margin_percent IS 'Margem padrao (%)';
COMMENT ON COLUMN user_profile.default_include_packaging IS 'Incluir embalagem por padrao nas vendas';
COMMENT ON COLUMN user_profile.default_include_label IS 'Incluir etiqueta por padrao nas vendas';
COMMENT ON COLUMN user_profile.default_include_shipping IS 'Incluir envio por padrao nas vendas';
COMMENT ON COLUMN user_profile.default_kwh_cost IS 'Custo kWh padrao para calculo de energia';
COMMENT ON COLUMN user_profile.profile_completed IS 'Indica se o usuario completou o onboarding basico';

-- Função para criar perfil automaticamente após signup
CREATE OR REPLACE FUNCTION handle_new_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profile (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar perfil automaticamente
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user_profile();
