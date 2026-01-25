-- =====================================================
-- MIGRATION 020: CORRIGIR COLUNAS FALTANTES
-- Adiciona colunas que estavam faltando no schema
-- =====================================================

-- 1. Adicionar coluna 'active' na tabela filaments
ALTER TABLE filaments 
ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_filaments_active ON filaments(user_id, active);

-- 2. Adicionar colunas faltantes em user_profile
ALTER TABLE user_profile 
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS default_machine_hour_cost NUMERIC DEFAULT 15.00;

-- 3. Migrar display_name para name se existir
UPDATE user_profile 
SET name = display_name 
WHERE name IS NULL AND display_name IS NOT NULL;

-- 4. Comentários para documentação
COMMENT ON COLUMN filaments.active IS 'Indica se o filamento está ativo e disponível para uso';
COMMENT ON COLUMN user_profile.name IS 'Nome do usuário ou empresa (migrado de display_name)';
COMMENT ON COLUMN user_profile.default_machine_hour_cost IS 'Custo padrão por hora de máquina em BRL';
