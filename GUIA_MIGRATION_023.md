# 🚀 GUIA DE APLICAÇÃO - MIGRATION 023

## 📋 PRÉ-REQUISITOS

Antes de aplicar esta migration, certifique-se de ter aplicado as migrations anteriores:

```sql
-- Verificar quais migrations já foram aplicadas
SELECT * FROM _migrations ORDER BY executed_at DESC;
```

Se faltam migrations 020, 021, 022, aplique-as primeiro!

---

## 🎯 O QUE ESTA MIGRATION FAZ?

A migration `023_products_complete_system.sql` cria o sistema completo de produtos com:

### 1️⃣ **Tabela `product_filaments`**

- Liga produtos a múltiplos filamentos (multi-cor)
- Armazena peso individual por material/slot
- Necessária para produtos multi-material

### 2️⃣ **Expansão da tabela `products`**

- `metadata` (JSONB): Configurações de fatiamento (layer_height, infill, temperaturas, etc.)
- `embalagem_cost` (NUMERIC): Custo de embalagem
- `etiqueta_cost` (NUMERIC): Custo de etiqueta
- `marketplace_fee_percent` (NUMERIC): Taxa do marketplace (%)
- `source_file_name` (TEXT): Nome do arquivo original (.gcode ou .3mf)
- `source_file_type` (TEXT): Tipo do arquivo ('gcode' ou '3mf')
- `slicer_name` (TEXT): Nome do fatiador usado
- `slicer_version` (TEXT): Versão do fatiador

### 3️⃣ **Tabela `filament_consumption_logs`**

- Registra consumo de filamento em produção/vendas
- Atualiza automaticamente `filaments.peso_atual` via trigger
- Histórico completo de uso

### 4️⃣ **Storage Bucket `product-files`**

- Armazena arquivos .gcode e .3mf originais
- Limite de 50MB por arquivo
- RLS configurado para auth.uid()

### 5️⃣ **Função PostgreSQL `calculate_product_total_cost()`**

- Calcula custo total com breakdown detalhado
- Retorna JSON com:
  - `material_cost`: Soma de todos os materiais
  - `energy_cost`: Custo de energia (tempo × kWh)
  - `packaging_cost`: Custo de embalagem
  - `label_cost`: Custo de etiqueta
  - `marketplace_fee`: Taxa do marketplace sobre preço de venda
  - `total_cost`: Soma de todos os custos
  - `suggested_price`: Preço com margem aplicada
  - `profit_margin`: Lucro líquido

---

## 🛠️ PASSOS PARA APLICAR

### 1️⃣ **Abra o Supabase Dashboard**

```
https://supabase.com/dashboard/project/SEU_PROJECT_ID
```

### 2️⃣ **Vá em "SQL Editor"**

No menu lateral: **SQL Editor** → **New Query**

### 3️⃣ **Copie TODO o conteúdo do arquivo**

Abra o arquivo:

```
supabase/migrations/023_products_complete_system.sql
```

Copie TODO o conteúdo (Ctrl+A → Ctrl+C)

### 4️⃣ **Cole no SQL Editor e Execute**

- Cole o código no editor
- Clique em **"Run"** (ou F5)
- Aguarde a execução (pode levar ~10 segundos)

### 5️⃣ **Verifique se Executou com Sucesso**

Você deve ver:

```
✅ Success. No rows returned
```

Se houver erro, leia a mensagem e corrija antes de continuar.

### 6️⃣ **Verifique as Tabelas Criadas**

No Supabase Dashboard, vá em **"Table Editor"** e confirme que existem:

- ✅ `product_filaments`
- ✅ `filament_consumption_logs`
- ✅ Coluna `metadata` em `products`
- ✅ Colunas `embalagem_cost`, `etiqueta_cost`, etc. em `products`

### 7️⃣ **Verifique o Storage Bucket**

Vá em **"Storage"** e confirme que existe:

- ✅ Bucket `product-files` (público para leitura, privado para escrita)

---

## ✅ VALIDAÇÃO PÓS-MIGRATION

Execute estas queries para validar:

### 1️⃣ Testar função de cálculo de custo

```sql
SELECT calculate_product_total_cost(
  material_cost := 50.0,
  energy_cost := 10.0,
  packaging_cost := 5.0,
  label_cost := 2.0,
  selling_price := 150.0,
  marketplace_fee_percent := 15.0,
  margin_percent := 50.0
);
```

**Resultado esperado:**

```json
{
  "material_cost": 50.0,
  "energy_cost": 10.0,
  "packaging_cost": 5.0,
  "label_cost": 2.0,
  "marketplace_fee": 22.5,
  "total_cost": 89.5,
  "suggested_price": 179.0,
  "profit_margin": 60.5
}
```

### 2️⃣ Testar RLS de product_filaments

```sql
-- Deve retornar apenas do usuário autenticado
SELECT * FROM product_filaments;
```

### 3️⃣ Testar inserção multi-material

```sql
-- Substitua os IDs reais
INSERT INTO product_filaments (user_id, product_id, filament_id, slot_index, peso_gramas)
VALUES
  (auth.uid(), 'SEU_PRODUCT_ID', 'SEU_FILAMENT_ID_1', 1, 25.5),
  (auth.uid(), 'SEU_PRODUCT_ID', 'SEU_FILAMENT_ID_2', 2, 18.3);
```

---

## 🔥 PRÓXIMOS PASSOS

Após aplicar a migration com sucesso:

### 1️⃣ **Testar upload de .gcode**

- Vá em `/dashboard/produtos`
- Clique em "Novo Produto"
- Faça upload de um arquivo .gcode exportado do Bambu Studio
- Verifique se detecta múltiplos materiais corretamente

### 2️⃣ **Testar multi-material**

- Para cada material detectado, selecione um filamento da sua base
- Edite os pesos se necessário
- Salve o produto

### 3️⃣ **Verificar banco de dados**

```sql
-- Ver produtos criados
SELECT * FROM products ORDER BY created_at DESC LIMIT 5;

-- Ver breakdown de materiais
SELECT
  pf.*,
  p.nome as produto_nome,
  f.nome as filamento_nome
FROM product_filaments pf
JOIN products p ON p.id = pf.product_id
JOIN filaments f ON f.id = pf.filament_id
ORDER BY pf.created_at DESC;
```

### 4️⃣ **Criar uma venda e testar consumo**

```sql
-- Verificar se criou log de consumo
SELECT * FROM filament_consumption_logs ORDER BY created_at DESC;

-- Verificar se atualizou peso do filamento
SELECT nome, peso_inicial, peso_atual, (peso_inicial - peso_atual) as consumido
FROM filaments
WHERE peso_atual < peso_inicial;
```

---

## ⚠️ TROUBLESHOOTING

### ❌ Erro: "relation 'product_filaments' already exists"

**Solução:** Você já aplicou esta migration. Não precisa aplicar novamente.

### ❌ Erro: "column 'active' does not exist in table 'filaments'"

**Solução:** Aplique a migration 020 primeiro:

```sql
ALTER TABLE filaments ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;
```

### ❌ Erro: "bucket 'product-files' already exists"

**Solução:** Remova a parte de criação do bucket da migration ou ignore o erro.

### ❌ Erro: "function calculate_product_total_cost already exists"

**Solução:** Adicione `OR REPLACE` na definição da função ou remova a função antes:

```sql
DROP FUNCTION IF EXISTS calculate_product_total_cost(NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC);
```

---

## 📞 SUPORTE

Se encontrar problemas:

1. **Leia os erros do SQL Editor** - eles são bem descritivos
2. **Verifique se aplicou migrations anteriores** (020, 021, 022)
3. **Verifique permissões RLS** - deve estar autenticado como usuário
4. **Consulte a documentação do Supabase** sobre Storage e RLS

---

## 🎉 PRONTO!

Após aplicar esta migration, seu sistema terá:

- ✅ Suporte completo a multi-material/multi-cor
- ✅ Upload de .gcode e .3mf com parsing robusto
- ✅ Breakdown detalhado de custos (material + energia + embalagem + marketplace)
- ✅ Rastreamento automático de consumo de filamento
- ✅ Storage de arquivos originais
- ✅ Metadata de fatiamento (layer height, infill, temps, etc.)
- ✅ Função PostgreSQL para cálculo de preços

**Aproveite o sistema profissional de gestão de produtos 3D! 🚀**
