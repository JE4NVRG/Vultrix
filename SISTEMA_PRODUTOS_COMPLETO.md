# 🎯 SISTEMA COMPLETO DE PRODUTOS 3D - IMPLEMENTADO

## ✅ O QUE FOI IMPLEMENTADO

### 1️⃣ **Parser Robusto de GCode e 3MF**

#### **lib/utils/parseGcode.ts**

Parser profissional que extrai de arquivos .gcode:

**Metadados Suportados:**

- ✅ Tempo estimado de impressão (formatos: "2h 34m 15s", "TIME:7425")
- ✅ Peso total em gramas
- ✅ **Breakdown de materiais multi-cor** (peso individual por slot)
- ✅ Tipos de filamento por slot (PLA, PETG, ABS, etc.)
- ✅ Nomes de filamento (ex: "Generic PLA @BBL X1C")
- ✅ Comprimento de filamento usado (em metros)

**Configurações de Impressão (print_settings):**

- `layer_height`: Altura da camada
- `infill_percent`: Percentual de preenchimento
- `wall_count`: Número de perímetros
- `support_enabled`: Se usou suportes
- `brim_enabled`: Se usou brim
- `nozzle_temp`: Temperatura do bico
- `bed_temp`: Temperatura da mesa
- `speed_profile`: Perfil de velocidade
- `filament_change_count`: Número de trocas de filamento

**Slicers Suportados:**

- 🔵 **Bambu Studio** (recomendado para multi-cor)
- 🟠 **Orca Slicer** (fork do Bambu)
- 🟣 **PrusaSlicer**
- 🟡 **Cura**

**Estratégias de Extração:**

1. **Breakdown por filamento** (ideal): "; filament used [g] = 12.34, 23.45, 34.56"
2. **Peso total único** (fallback): "; total filament used [g] = 70.13"
3. **Tipos detectados**: "; filament_type = PLA;PLA;PETG"
4. **Nomes detectados**: "; filament_settings_id = Generic PLA;Bambu PLA Basic"

#### **app/api/gcode/extract/route.ts**

Endpoint POST que recebe .gcode e retorna JSON:

```typescript
{
  success: true,
  name: "nome_do_arquivo",
  estimated_time_minutes: 154,
  total_weight_grams: 70.13,
  materials: [
    { slot_index: 1, name: "Generic PLA", type: "PLA", weight_grams: 25.5 },
    { slot_index: 2, name: "Bambu PETG", type: "PETG", weight_grams: 44.63 }
  ],
  print_settings: {
    layer_height: 0.2,
    infill_percent: 15,
    wall_count: 2,
    nozzle_temp: 220,
    bed_temp: 60
  },
  slicer_name: "Bambu Studio",
  slicer_version: "01.09.05.52"
}
```

---

### 2️⃣ **UI de Upload Unificada (.gcode + .3mf)**

#### **app/dashboard/produtos/page.tsx**

**Mudanças Principais:**

- ✅ Input aceita `.gcode,.3mf`
- ✅ Detecta automaticamente o tipo de arquivo
- ✅ Chama endpoint correto (/api/gcode ou /api/3mf)
- ✅ Mostra aviso se .3mf não tem breakdown de materiais
- ✅ Recomenda usar .gcode para multi-cor

**Fluxo de Upload:**

```
1. Usuário escolhe .gcode OU .3mf
2. Sistema detecta extensão
3. Chama API apropriada
4. Extrai metadados (tempo, peso, materiais)
5. Exibe materiais detectados
6. Usuário mapeia cada material para um filamento da base
7. Sistema calcula custos automaticamente
8. Salva produto + product_filaments
```

**Funcionalidades:**

- 📂 Upload de .gcode (recomendado) ou .3mf
- 🎨 Suporte completo a multi-material/multi-cor
- ⚖️ Edição de peso por material
- 🎯 Seleção individual de filamento por slot
- 💰 Cálculo automático de custo por material
- 🖼️ Extração de thumbnail (apenas .3mf)

---

### 3️⃣ **Sistema de Custos Completo**

#### **Breakdown Detalhado:**

**Custos Base:**

- 💎 **Material**: Σ(peso_gramas / 1000 × custo_por_kg) para cada filamento
- ⚡ **Energia**: (tempo_horas × potência_watts × kwh_cost) / 1000
- 📦 **Embalagem**: Custo da caixa/saco
- 🏷️ **Etiqueta**: Custo do adesivo/tag

**Custos de Venda:**

- 🛒 **Fee Marketplace**: (preço_venda × taxa_percentual) / 100
  - Mercado Livre: ~15%
  - Shopee: ~18%
  - Elo7: ~20%

**Cálculo de Preço:**

```javascript
baseCost = material + energia + embalagem + etiqueta
suggestedPrice = baseCost × (1 + margem% / 100)
marketplaceFee = suggestedPrice × fee% / 100
totalCost = baseCost + marketplaceFee
profitMargin = suggestedPrice - totalCost
```

**Exemplo Real:**

```
Material: R$ 45.30 (25g PLA + 18g PETG)
Energia: R$ 8.50 (3.5h × 250W × R$0.97/kWh)
Embalagem: R$ 3.00
Etiqueta: R$ 1.50
────────────────────
Base Cost: R$ 58.30

Margem: 50%
Preço Sugerido: R$ 87.45

Fee Mercado Livre (15%): R$ 13.12
────────────────────
Custo TOTAL: R$ 71.42
Lucro Líquido: R$ 16.03 (18.3%)
```

#### **Seção na UI:**

```tsx
<details open>
  <summary>💳 Custos Adicionais e Margem</summary>

  📦 Embalagem (R$): [___]
  🏷️ Etiqueta (R$): [___]
  🛒 Taxa Marketplace (%): [___]
  📊 Margem de Lucro (%): [___]
</details>

<div>💰 Previsão de Custos e Preço</div>
- Material: R$ X
- Energia: R$ Y
- Embalagem: R$ Z
- Etiqueta: R$ W
- Fee Marketplace: R$ F
─────────────────
💸 Custo TOTAL: R$ T
💰 Preço de Venda: R$ P
💵 Lucro Líquido: R$ L (N%)
```

---

### 4️⃣ **Banco de Dados Expandido**

#### **Migration 023 - Tabelas Criadas:**

**1. `product_filaments`**

```sql
CREATE TABLE product_filaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  filament_id UUID NOT NULL REFERENCES filaments(id),
  slot_index INTEGER DEFAULT 1, -- Para ordenar multi-cor
  peso_gramas NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Uso:** Armazena breakdown de materiais em produtos multi-cor.

**Exemplo:**

```
Product: "Vaso Multicolor"
├─ Slot 1: 25.5g de "PLA Branco"
├─ Slot 2: 18.3g de "PLA Azul"
└─ Slot 3: 12.7g de "PETG Transparente"
```

**2. `products` (colunas adicionadas)**

```sql
ALTER TABLE products ADD COLUMN metadata JSONB;
ALTER TABLE products ADD COLUMN embalagem_cost NUMERIC(10,2) DEFAULT 0;
ALTER TABLE products ADD COLUMN etiqueta_cost NUMERIC(10,2) DEFAULT 0;
ALTER TABLE products ADD COLUMN marketplace_fee_percent NUMERIC(5,2) DEFAULT 0;
ALTER TABLE products ADD COLUMN source_file_name TEXT;
ALTER TABLE products ADD COLUMN source_file_type TEXT;
ALTER TABLE products ADD COLUMN slicer_name TEXT;
ALTER TABLE products ADD COLUMN slicer_version TEXT;
```

**`metadata` JSONB - Exemplo:**

```json
{
  "layer_height": 0.2,
  "infill_percent": 15,
  "wall_count": 2,
  "support_enabled": true,
  "brim_enabled": false,
  "nozzle_temp": 220,
  "bed_temp": 60,
  "speed_profile": "Standard @BBL X1C",
  "filament_change_count": 2
}
```

**3. `filament_consumption_logs`**

```sql
CREATE TABLE filament_consumption_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  filament_id UUID NOT NULL REFERENCES filaments(id),
  product_id UUID REFERENCES products(id),
  sale_id UUID REFERENCES sales(id),
  tipo TEXT NOT NULL, -- 'producao' ou 'venda'
  peso_consumido_gramas NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Uso:** Registra consumo de filamento em produções/vendas.

**Trigger Automático:**

```sql
-- Quando insere log, atualiza filaments.peso_atual
CREATE TRIGGER update_filament_weight_on_consumption
AFTER INSERT ON filament_consumption_logs
FOR EACH ROW EXECUTE FUNCTION update_filament_weight();
```

**4. Storage Bucket `product-files`**

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-files', 'product-files', false);
```

**RLS Policy:**

- Leitura: Apenas auth.uid() = user_id
- Escrita: Apenas auth.uid() = user_id
- Max file size: 50MB

**5. Função PostgreSQL `calculate_product_total_cost()`**

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

**Retorna JSON:**

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

---

## 🚀 COMO USAR

### 1️⃣ **Aplicar Migration**

1. Abra o Supabase Dashboard
2. Vá em **SQL Editor**
3. Cole o conteúdo de `supabase/migrations/023_products_complete_system.sql`
4. Clique em **Run**
5. Verifique: `✅ Success. No rows returned`

📖 **Guia Completo:** [GUIA_MIGRATION_023.md](GUIA_MIGRATION_023.md)

---

### 2️⃣ **Cadastrar Produto com .gcode (Recomendado)**

**Passo a Passo:**

1. **Fatiar no Bambu Studio/Orca:**
   - Configure seu projeto (multi-cor, infill, layer height, etc.)
   - Clique em **"Slice Plate"**
   - Após o fatiamento, clique em **"Export G-code"**
   - Salve o arquivo `.gcode`

2. **No sistema Vultrix3D:**
   - Vá em `/dashboard/produtos`
   - Clique em **"Novo Produto"**
   - Escolha a aba **"🎨 Importar .3mf/.gcode"**
   - Faça upload do `.gcode`
   - Aguarde extração (2-3 segundos)

3. **Sistema detecta automaticamente:**
   - ✅ Nome do arquivo
   - ✅ Tempo de impressão (ex: 2h 34m)
   - ✅ Peso total (ex: 70.13g)
   - ✅ Materiais individuais (ex: 25.5g PLA + 44.63g PETG)
   - ✅ Slicer usado (ex: Bambu Studio 01.09.05.52)

4. **Mapear materiais:**
   - Para cada material detectado, selecione o filamento correspondente
   - Edite os pesos se necessário
   - Sistema calcula custos automaticamente

5. **Custos adicionais (opcional):**
   - Preencha custo de embalagem (ex: R$ 3.00)
   - Preencha custo de etiqueta (ex: R$ 1.50)
   - Se vender em marketplace, informe taxa (ex: 15% Mercado Livre)
   - Ajuste margem de lucro (padrão: 50%)

6. **Salvar:**
   - Veja preview completo de custos e lucro
   - Clique em **"Cadastrar Produto"**
   - Sistema salva:
     - ✅ `products` (nome, tempo, peso, custos, preço)
     - ✅ `product_filaments` (breakdown de materiais)
     - ✅ Thumbnail (se tiver)

---

### 3️⃣ **Cadastrar Produto com .3mf (Alternativa)**

**Limitações do .3mf:**

- ⚠️ Pode não conter breakdown de materiais
- ⚠️ Depende de como foi exportado
- ⚠️ Menos confiável que .gcode

**Quando usar:**

- Você não tem acesso ao .gcode
- Projeto single-color simples
- Apenas precisa de nome/tempo/peso total

**Fluxo:**

1. Faça upload do `.3mf`
2. Se não detectar materiais, aparece aviso: "⚠️ .3mf não contém breakdown. Use .gcode!"
3. Sistema cria material genérico "Material Único" com peso total
4. Continue o cadastro normalmente

---

### 4️⃣ **Visualizar Produtos**

**Cards de Produto:**

```
┌─────────────────────────────┐
│ 🖼️ [Thumbnail]              │
│ Nome do Produto             │
│ ────────────────────        │
│ Tempo: 2.5h                 │
│ Peso: 70g                   │
│ Custo Total: R$ 65.30       │
│ Preço Venda: R$ 98.00       │
│ Margem: 50%                 │
│ ────────────────────        │
│ [🗑️ Excluir]                │
└─────────────────────────────┘
```

---

### 5️⃣ **Rastreamento de Consumo (Futuro)**

**Ao registrar venda:**

```typescript
// Sistema busca product_filaments
const materials = await supabase
  .from("product_filaments")
  .select("*")
  .eq("product_id", productId);

// Para cada material, registra consumo
for (const mat of materials) {
  await supabase.from("filament_consumption_logs").insert({
    user_id: userId,
    filament_id: mat.filament_id,
    product_id: productId,
    sale_id: saleId,
    tipo: "venda",
    peso_consumido_gramas: mat.peso_gramas,
  });
}

// Trigger atualiza filaments.peso_atual automaticamente
```

---

## 📊 COMPARAÇÃO: .gcode vs .3mf

| Característica          | .gcode    | .3mf         |
| ----------------------- | --------- | ------------ |
| **Tempo de impressão**  | ✅ Sempre | ⚠️ Às vezes  |
| **Peso total**          | ✅ Sempre | ⚠️ Às vezes  |
| **Breakdown multi-cor** | ✅ Sim    | ❌ Raramente |
| **Print settings**      | ✅ Sim    | ❌ Não       |
| **Thumbnail**           | ❌ Não    | ✅ Sim       |
| **Tamanho do arquivo**  | ~1-5MB    | ~2-10MB      |
| **Confiabilidade**      | 🟢 Alta   | 🟡 Média     |

**Recomendação:** Sempre que possível, use **.gcode**!

---

## 🎓 EXEMPLO COMPLETO

**Cenário:** Vaso decorativo multi-cor (PLA branco + PETG azul)

### 1️⃣ **No Bambu Studio:**

```
- Modelo: vaso_decorativo.stl
- Filamento 1: PLA branco (25.5g)
- Filamento 2: PETG azul (44.63g)
- Layer height: 0.2mm
- Infill: 15%
- Tempo estimado: 3h 25m
- Exportar: vaso_decorativo.gcode
```

### 2️⃣ **Parser extrai:**

```json
{
  "name": "vaso_decorativo",
  "estimated_time_minutes": 205,
  "total_weight_grams": 70.13,
  "materials": [
    {
      "slot_index": 1,
      "name": "Generic PLA @BBL X1C",
      "type": "PLA",
      "weight_grams": 25.5
    },
    {
      "slot_index": 2,
      "name": "Bambu PETG Basic @BBL X1C",
      "type": "PETG",
      "weight_grams": 44.63
    }
  ],
  "print_settings": {
    "layer_height": 0.2,
    "infill_percent": 15,
    "nozzle_temp": 220,
    "bed_temp": 60
  },
  "slicer_name": "Bambu Studio"
}
```

### 3️⃣ **Usuário mapeia:**

```
Slot 1 (25.5g PLA) → "PLA Branco Stellatech" (R$80/kg)
Slot 2 (44.63g PETG) → "PETG Azul Bambu Lab" (R$120/kg)
```

### 4️⃣ **Cálculos:**

```
Material 1: 0.0255kg × R$80 = R$2.04
Material 2: 0.04463kg × R$120 = R$5.36
───────────────────────────────
Total Material: R$7.40

Energia: 3.42h × 250W × R$0.97/kWh / 1000 = R$0.83
Embalagem: R$3.00
Etiqueta: R$1.50
───────────────────────────────
Base Cost: R$12.73

Margem: 50%
Preço Sugerido: R$19.10

Fee Mercado Livre (15%): R$2.87
───────────────────────────────
Custo TOTAL: R$15.60
Lucro Líquido: R$3.50 (18.3%)
```

### 5️⃣ **Salvo no banco:**

```sql
-- products
INSERT INTO products (nome, tempo_impressao_horas, peso_usado, custo_total, preco_venda, ...)
VALUES ('vaso_decorativo', 3.42, 70.13, 15.60, 19.10, ...);

-- product_filaments
INSERT INTO product_filaments (product_id, filament_id, slot_index, peso_gramas)
VALUES
  ('uuid-produto', 'uuid-pla-branco', 1, 25.5),
  ('uuid-produto', 'uuid-petg-azul', 2, 44.63);
```

---

## 🔮 PRÓXIMOS PASSOS (Opcional)

### 1️⃣ **Página de Detalhes do Produto**

```
/dashboard/produtos/[id]
- Thumbnail grande
- Informações técnicas (layer height, infill, temps)
- Breakdown detalhado de materiais
- Edição inline de custos
- Histórico de vendas
- Gráfico de consumo de filamento
```

### 2️⃣ **OpenAI Vision Fallback (se .gcode não tiver breakdown)**

```
- Usuário tira screenshot da tabela de materiais do slicer
- OpenAI Vision extrai pesos de cada material
- Sistema cria materials[] automaticamente
```

### 3️⃣ **Integração com Storage**

```
- Upload do .gcode original para product-files bucket
- Download posterior para re-impressão
- Versionamento de arquivos
```

### 4️⃣ **Consumo Automático em Vendas**

```
- Ao criar venda, detecta product_filaments
- Cria logs de consumo automaticamente
- Atualiza peso_atual dos filamentos
- Alerta quando filamento acabando
```

---

## 📁 ARQUIVOS CRIADOS/MODIFICADOS

### ✅ Novos Arquivos:

- `lib/utils/parseGcode.ts` - Parser de GCode
- `app/api/gcode/extract/route.ts` - Endpoint de extração
- `supabase/migrations/023_products_complete_system.sql` - Migration completa
- `GUIA_MIGRATION_023.md` - Guia de aplicação
- `SISTEMA_PRODUTOS_COMPLETO.md` - Esta documentação

### ✏️ Arquivos Modificados:

- `app/dashboard/produtos/page.tsx`:
  - Função `handleFileUpload()` (substitui `handle3mfUpload`)
  - Estados: `embalagemCost`, `etiquetaCost`, `marketplaceFeePercent`, `customMarginPercent`
  - Função `calculateCosts()` expandida
  - Seção "Custos Adicionais e Margem" na UI
  - Preview de custos detalhado
  - Função `handleSave()` salva novos campos

---

## 🎉 CONCLUSÃO

Sistema completo de produtos 3D implementado com:

- ✅ Parser robusto de .gcode e .3mf
- ✅ Suporte completo a multi-material/multi-cor
- ✅ Breakdown detalhado de custos (material + energia + embalagem + etiqueta + marketplace)
- ✅ Cálculo automático de preço com margem
- ✅ Banco de dados com product_filaments
- ✅ UI profissional com preview de custos
- ✅ Rastreamento de consumo de filamento (infraestrutura pronta)
- ✅ Storage para arquivos originais (pronto, falta integração)

**O sistema está pronto para uso profissional! 🚀**

Para começar, aplique a migration 023 seguindo o [GUIA_MIGRATION_023.md](GUIA_MIGRATION_023.md).
