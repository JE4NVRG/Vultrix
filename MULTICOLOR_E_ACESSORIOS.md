# 🎨 PRODUTOS MULTICORES E ACESSÓRIOS

## 🆕 NOVA FUNCIONALIDADE IMPLEMENTADA

Sistema agora suporta:

- ✅ **Produtos com múltiplos filamentos** (multicores)
- ✅ **Acessórios** (ímãs, chaveiros, cola, etc)
- ✅ **Fotos dos produtos**
- ✅ **Baixa automática de todos os materiais**

---

## 📊 O QUE MUDOU

### 🎨 Produtos Multicores

Antes você só podia ter **1 filamento por produto**.

Agora você pode ter **quantos filamentos quiser**!

**Exemplo:**

```
Produto: Miniatura de Dragão Vermelho e Dourado
├── PLA Vermelho: 80g
├── PLA Dourado: 20g
└── PLA Preto (detalhes): 5g
```

### 🔧 Acessórios

Adicione materiais extras aos produtos:

**Exemplo:**

```
Produto: Chaveiro Personalizado
├── PLA Azul: 15g
├── Argola de chaveiro: 1 unidade
└── Cola instantânea: 0.5ml
```

### 📸 Fotos

Cada produto pode ter uma foto para facilitar identificação.

---

## 🗄️ ESTRUTURA DO BANCO

### Nova Tabela: `accessories`

```sql
- id (UUID)
- user_id (UUID)
- nome (TEXT) - Ex: "Ímã 10mm", "Argola chaveiro"
- categoria (TEXT) - 'ima', 'chaveiro', 'cola', 'tinta', 'outro'
- descricao (TEXT)
- custo_unitario (NUMERIC)
- estoque_atual (INTEGER)
- unidade (TEXT) - 'unidade', 'grama', 'ml'
```

### Nova Tabela: `product_filaments`

```sql
- id (UUID)
- product_id (UUID)
- filament_id (UUID)
- peso_usado (NUMERIC) - gramas deste filamento
- ordem (INTEGER) - ordem de uso
- cor_identificacao (TEXT) - opcional: "base", "detalhes"
```

### Nova Tabela: `product_accessories`

```sql
- id (UUID)
- product_id (UUID)
- accessory_id (UUID)
- quantidade (NUMERIC) - quantidade necessária
```

### Campo Adicionado em `products`

```sql
- foto_url (TEXT) - URL da foto no Storage
```

---

## 🎯 COMO USAR

### 1️⃣ Cadastrar Acessórios

```
1. Crie uma página /dashboard/acessorios (ou adicione na calculadora)
2. Cadastre seus acessórios:
   - Nome: Ímã redondo 10mm
   - Categoria: Ímã
   - Custo: R$ 0.50
   - Estoque: 100 unidades
```

### 2️⃣ Criar Produto Multicolor

```
1. Vá em Produtos → Novo Produto
2. Adicione múltiplos filamentos:
   - PLA Vermelho: 80g
   - PLA Dourado: 20g
3. Adicione acessórios (se necessário):
   - Ímã 10mm: 2 unidades
4. Upload da foto do produto
5. Salvar
```

### 3️⃣ Registrar Venda

```
1. Venda normal em Vendas
2. Sistema automaticamente:
   ✅ Abate 80g do PLA Vermelho
   ✅ Abate 20g do PLA Dourado
   ✅ Abate 2 ímãs do estoque
   ✅ Registra tudo nos logs
```

---

## 🔄 FLUXO DE TRABALHO

### Produto Simples (1 cor)

```
Modo legado ainda funciona!
products.filamento_id → filaments
Compatível com sistema antigo
```

### Produto Multicolor (2+ cores)

```
products (sem filamento_id)
    ↓
product_filaments
    ├── filamento 1 (80g)
    ├── filamento 2 (20g)
    └── filamento 3 (5g)
```

### Produto com Acessórios

```
products
    ↓
product_filaments (filamentos)
    +
product_accessories (acessórios)
    ├── ímã (2 un)
    └── argola (1 un)
```

---

## 💰 CÁLCULO DE CUSTOS

### Nova Função: `calculate_product_total_cost()`

```sql
SELECT * FROM calculate_product_total_cost('product_id');

Retorna:
- custo_filamentos: Soma de todos os filamentos
- custo_acessorios: Soma de todos os acessórios
- custo_energia: Energia da impressão
- custo_total: TOTAL geral
```

### Exemplo

```
Produto: Miniatura Dragão Multicolor
├── PLA Vermelho (80g × R$120/kg) = R$ 9.60
├── PLA Dourado (20g × R$150/kg) = R$ 3.00
├── Ímã 10mm (2 × R$0.50) = R$ 1.00
├── Energia (3h × R$2/h) = R$ 6.00
└── TOTAL = R$ 19.60
```

---

## 📸 SISTEMA DE FOTOS

### Storage do Supabase

1. Criar bucket `product-photos` no Supabase
2. Configurar policies públicas para READ
3. Upload via interface

### Estrutura de URLs

```
https://<project>.supabase.co/storage/v1/object/public/product-photos/<user-id>/<product-id>.jpg
```

---

## 🚀 MIGRAÇÃO

### Aplicar Migration 006

```sql
-- No Supabase SQL Editor
-- Execute: supabase/migrations/006_multicolor_and_accessories.sql
```

### Produtos Antigos

- ✅ Produtos antigos continuam funcionando
- ✅ Podem migrar para multicolor quando quiser
- ✅ Campo `filamento_id` ainda é válido

### Migrar Produto Simples → Multicolor

```sql
-- 1. Inserir na tabela product_filaments
INSERT INTO product_filaments (product_id, filament_id, peso_usado, ordem)
VALUES ('product-id', 'filament-id', 100, 1);

-- 2. Remover filamento_id do produto (opcional)
UPDATE products SET filamento_id = NULL WHERE id = 'product-id';
```

---

## 🎨 INTERFACE SUGERIDA

### Página de Produtos (Atualizar)

```jsx
<div>
  {/* Foto do Produto */}
  {product.foto_url && <img src={product.foto_url} alt={product.nome} />}

  {/* Lista de Filamentos */}
  <h3>Filamentos Usados:</h3>
  <ul>
    {productFilaments.map((pf) => (
      <li>
        {pf.filamento.nome} - {pf.peso_usado}g
      </li>
    ))}
  </ul>

  {/* Lista de Acessórios */}
  {productAccessories.length > 0 && (
    <>
      <h3>Acessórios:</h3>
      <ul>
        {productAccessories.map((pa) => (
          <li>
            {pa.accessory.nome} - {pa.quantidade} {pa.accessory.unidade}
          </li>
        ))}
      </ul>
    </>
  )}

  {/* Custo Total */}
  <div>
    <strong>Custo Total:</strong> R$ {custoTotal}
  </div>
</div>
```

### Modal de Criação/Edição

```jsx
// Seção de Filamentos
<div>
  <h3>Filamentos</h3>
  <button onClick={addFilament}>+ Adicionar Filamento</button>

  {filaments.map((f, i) => (
    <div key={i}>
      <select value={f.filament_id}>
        {/* Lista de filamentos */}
      </select>
      <input
        type="number"
        placeholder="Peso (g)"
        value={f.peso_usado}
      />
      <input
        type="text"
        placeholder="Cor (ex: base, detalhes)"
        value={f.cor_identificacao}
      />
      <button onClick={() => removeFilament(i)}>Remover</button>
    </div>
  ))}
</div>

// Seção de Acessórios
<div>
  <h3>Acessórios</h3>
  <button onClick={addAccessory}>+ Adicionar Acessório</button>

  {accessories.map((a, i) => (
    <div key={i}>
      <select value={a.accessory_id}>
        {/* Lista de acessórios */}
      </select>
      <input
        type="number"
        placeholder="Quantidade"
        value={a.quantidade}
      />
      <button onClick={() => removeAccessory(i)}>Remover</button>
    </div>
  ))}
</div>

// Upload de Foto
<div>
  <h3>Foto do Produto</h3>
  <input type="file" accept="image/*" onChange={handleUpload} />
  {foto_url && <img src={foto_url} alt="Preview" />}
</div>
```

---

## 🔐 SEGURANÇA

### Políticas RLS

- ✅ Usuários só veem seus próprios acessórios
- ✅ Product_filaments segue o dono do produto
- ✅ Product_accessories segue o dono do produto
- ✅ Fotos são públicas após upload (READ only)

### Storage Policies

```sql
-- Criar bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-photos', 'product-photos', true);

-- Policy para upload (apenas donos)
CREATE POLICY "Users can upload own photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy para leitura (pública)
CREATE POLICY "Public photos access"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-photos');
```

---

## 📊 EXEMPLOS DE PRODUTOS

### Miniatura Multicolor

```
Nome: Dragão Vermelho e Dourado
Filamentos:
  - PLA Vermelho: 80g (corpo)
  - PLA Dourado: 20g (detalhes)
  - PLA Preto: 5g (olhos)
Acessórios:
  - Base redonda: 1 unidade
Foto: dragao-vermelho.jpg
Tempo: 8 horas
```

### Chaveiro Personalizado

```
Nome: Chaveiro Logo Empresa
Filamentos:
  - PLA Azul: 15g
Acessórios:
  - Argola chaveiro: 1 unidade
  - Cola instantânea: 0.5ml
Foto: chaveiro-logo.jpg
Tempo: 1 hora
```

### Enfeite com Ímã

```
Nome: Enfeite Geladeira Pokemon
Filamentos:
  - PLA Amarelo: 30g (corpo)
  - PLA Vermelho: 10g (bochecha)
  - PLA Preto: 5g (detalhes)
Acessórios:
  - Ímã 10mm: 2 unidades
Foto: pikachu.jpg
Tempo: 4 horas
```

---

## 🎯 VANTAGENS

### Antes (Sistema Simples)

```
❌ 1 cor por produto
❌ Sem acessórios
❌ Sem foto
❌ Custo aproximado
```

### Agora (Sistema Profissional)

```
✅ Múltiplas cores por produto
✅ Acessórios ilimitados
✅ Foto do produto
✅ Custo exato de tudo
✅ Baixa automática de tudo
✅ Logs detalhados
```

---

## 🚀 PRÓXIMOS PASSOS

### 1. Aplicar Migration

```bash
# No Supabase SQL Editor
# Executar: 006_multicolor_and_accessories.sql
```

### 2. Criar Storage Bucket

```bash
# No Supabase Dashboard
# Storage → New Bucket → "product-photos"
# Public: Yes
```

### 3. Atualizar Types

```bash
# Gerar novos types do Supabase
npx supabase gen types typescript --project-id <id> > types/database.ts
```

### 4. Criar Página de Acessórios

```bash
# app/dashboard/acessorios/page.tsx
```

### 5. Atualizar Página de Produtos

```bash
# Adicionar suporte a múltiplos filamentos
# Adicionar suporte a acessórios
# Adicionar upload de foto
```

---

## 💡 DICAS

### Organização de Filamentos

Use o campo `cor_identificacao`:

- "base" - Cor principal
- "detalhes" - Detalhes pequenos
- "suporte" - Material de suporte

### Categorias de Acessórios

- `ima` - Ímãs de diversos tamanhos
- `chaveiro` - Argolas, correntes
- `cola` - Colas e adesivos
- `tinta` - Tintas para pintura
- `outro` - Outros materiais

### Upload de Fotos

- Tamanho recomendado: 800x800px
- Formato: JPG ou PNG
- Peso máximo: 1MB
- Nome: usar ID do produto

---

## 📈 MÉTRICAS EXPANDIDAS

Agora o dashboard pode mostrar:

- 💰 Custo total de acessórios no mês
- 🎨 Filamento mais usado em multicores
- 🔧 Acessório mais consumido
- 📊 Produtos multicores vs simples

---

**🎨 Sistema agora é 100% profissional para produtos complexos!**

_Desenvolvido com 💜 para Vultrix 3D_
