# 🔧 APLICAR MIGRATIONS 020 e 021

## ⚠️ EXECUTAR ANTES DE TESTAR

Você precisa aplicar 2 migrations no Supabase:

### 1. Migration 020 - Colunas Faltantes

**Arquivo:** `supabase/migrations/020_fix_missing_columns.sql`

### 2. Migration 021 - Thumbnail de Produtos

**Arquivo:** `supabase/migrations/021_product_thumbnail.sql`

## 🚀 PASSO A PASSO

### Opção A: Via SQL Editor (Recomendado)

1. Acesse: **https://supabase.com**
2. Selecione seu projeto
3. **SQL Editor** → **New query**
4. Cole o conteúdo de `020_fix_missing_columns.sql`
5. **Run** (▶️)
6. Nova query → Cole `021_product_thumbnail.sql`
7. **Run** (▶️)

### Opção B: Copiar e Colar Diretamente

**Migration 020:**

```sql
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

**Migration 021:**

```sql
-- Adicionar coluna thumbnail_url
ALTER TABLE products
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

COMMENT ON COLUMN products.thumbnail_url IS 'URL da imagem em miniatura do produto (base64 ou storage)';
```

## ✅ VERIFICAR

Execute no SQL Editor:

```sql
-- Verificar colunas em filaments
SELECT column_name FROM information_schema.columns
WHERE table_name = 'filaments' AND column_name = 'active';

-- Verificar colunas em user_profile
SELECT column_name FROM information_schema.columns
WHERE table_name = 'user_profile'
AND column_name IN ('name', 'default_machine_hour_cost');

-- Verificar coluna em products
SELECT column_name FROM information_schema.columns
WHERE table_name = 'products' AND column_name = 'thumbnail_url';
```

Deve retornar 4 linhas (active, name, default_machine_hour_cost, thumbnail_url).

## 🎯 FUNCIONALIDADES IMPLEMENTADAS

### 1. Extração de Imagem do .3mf

- API agora extrai primeira imagem encontrada (thumbnail/cover/picture)
- Salva como base64 no campo `thumbnail_url`

### 2. Visualização de Produtos

- 🖼️ **Imagem do produto** (se disponível)
- 📊 **Dados completos**: tempo, peso, custos, margem
- 🗑️ **Botão Excluir** (com confirmação)

### 3. Multi-Material Completo

- ➕ **Adicionar materiais** manualmente no modo .3mf
- ✏️ **Editar peso** de cada material
- 🗑️ **Remover materiais** (mínimo 1)
- 💰 **Custo individual** por material
- 📋 **Resumo detalhado** no preview final

## 🔄 REINICIAR SERVIDOR

Após aplicar as migrations:

```bash
# Parar o servidor
Ctrl+C

# Iniciar novamente
npm run dev
```

## 📝 TESTE

1. **Upload .3mf**: Deve extrair imagem automaticamente
2. **Criar produto**: Imagem deve ser salva
3. **Ver listagem**: Card deve mostrar imagem + botão excluir
4. **Excluir**: Deve pedir confirmação e remover
5. **Multi-material**: Adicionar/remover materiais
