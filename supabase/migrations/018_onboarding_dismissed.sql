-- =====================================================
-- ADD ONBOARDING DISMISSED FLAG TO USER_SETTINGS
-- =====================================================

-- Adicionar coluna para controlar se usuário dispensou o banner de onboarding
ALTER TABLE user_settings 
  ADD COLUMN IF NOT EXISTS onboarding_dismissed BOOLEAN DEFAULT FALSE;

-- Comentário na coluna
COMMENT ON COLUMN user_settings.onboarding_dismissed IS 
  'Indica se o usuário dispensou manualmente o banner de onboarding';

-- Atualizar função para garantir valor default
CREATE OR REPLACE FUNCTION handle_new_user_settings()
RETURNS TRIGGER AS $$
BEGIN
  NEW.onboarding_dismissed := COALESCE(NEW.onboarding_dismissed, FALSE);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger existente se houver
DROP TRIGGER IF EXISTS set_user_settings_defaults ON user_settings;

-- Criar trigger para garantir defaults
CREATE TRIGGER set_user_settings_defaults
  BEFORE INSERT ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user_settings();
