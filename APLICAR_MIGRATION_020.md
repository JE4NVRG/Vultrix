# 🔧 APLICAR MIGRATION 020 - CORRIGIR COLUNAS FALTANTES

## ⚠️ ERRO ATUAL

O sistema está apresentando erros:

```
column filaments.active does not exist
column user_profile.name does not exist
column user_profile.default_machine_hour_cost does not exist
```

## 📋 SOLUÇÃO

Execute a migration `020_fix_missing_columns.sql` no Supabase.

## 🚀 PASSO A PASSO

### 1. Acessar o SQL Editor

1. Acesse: **https://supabase.com**
2. Selecione seu projeto **Vultrix3D**
3. No menu lateral, clique em: **📊 SQL Editor**
4. Clique em **"New query"**

### 2. Copiar a Migration

Abra o arquivo: `supabase/migrations/020_fix_missing_columns.sql`

**Copie TODO o conteúdo:**

```sql
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
```

### 3. Executar

1. Cole o código no editor SQL do Supabase
2. Clique em **"Run"** (▶️)
3. Aguarde a confirmação: ✅ **Success**

### 4. Verificar

Execute no SQL Editor para confirmar:

```sql
-- Verificar coluna active em filaments
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'filaments' AND column_name = 'active';

-- Verificar colunas em user_profile
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'user_profile'
AND column_name IN ('name', 'default_machine_hour_cost');
```

Deve retornar 3 linhas.

### 5. Reiniciar o Servidor

No terminal do VS Code:

1. Pare o servidor: **Ctrl+C**
2. Inicie novamente: `npm run dev`

## ✅ RESULTADO ESPERADO

Após aplicar a migration:

- ✅ Erros de coluna inexistente devem desaparecer
- ✅ Página de produtos carrega sem erros
- ✅ Listagem de filamentos funciona corretamente
- ✅ Perfil do usuário carrega todos os campos

## 📝 O QUE FOI CORRIGIDO

1. **filaments.active**: Coluna booleana para marcar filamentos ativos/inativos
2. **user_profile.name**: Nome do usuário (migrado de display_name)
3. **user_profile.default_machine_hour_cost**: Custo padrão da hora de máquina (R$ 15,00)

## 🔍 PRÓXIMO PASSO

Depois que os erros de banco forem corrigidos, vamos investigar por que a extração .3mf ainda retorna valores `null` para tempo e peso.
