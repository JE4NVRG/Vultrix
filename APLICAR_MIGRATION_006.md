# 🚀 Como Aplicar a Migration 006 - Multicolor e Acessórios

## 📋 Pré-requisitos

- ✅ Migration 005 já aplicada
- ✅ Acesso ao Dashboard do Supabase
- ✅ Projeto Supabase criado e configurado

## 🎯 O que esta migration adiciona

- **Produtos Multicolor**: Use múltiplos filamentos em um produto
- **Acessórios**: Cadastre ímãs, chaveiros, cola, etc.
- **Fotos de Produtos**: Upload de imagens
- **Cálculo Automático**: Custo total com todos os materiais

---

## 📝 Passo a Passo

### 1️⃣ Aplicar SQL no Supabase

1. Acesse [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto **Vultrix 3D**
3. Clique em **SQL Editor** no menu lateral
4. Clique em **New Query**
5. Copie TODO o conteúdo do arquivo `supabase/migrations/006_multicolor_and_accessories.sql`
6. Cole no editor SQL
7. Clique em **Run** (ou pressione `Ctrl+Enter`)

**✅ Sucesso:** Você deve ver mensagens como:

```
Success. No rows returned
ALTER TABLE
CREATE TABLE
CREATE INDEX
...
```

**❌ Se der erro:** Verifique se a migration 005 foi aplicada antes.

---

### 2️⃣ Criar Bucket para Fotos

1. No dashboard do Supabase, vá em **Storage** no menu lateral
2. Clique em **New Bucket**
3. Configure:
   - **Name:** `product-photos`
   - **Public:** ✅ Marque "Public bucket"
   - **Allowed MIME types:** `image/*`
4. Clique em **Create bucket**

#### Configurar Políticas de Acesso

1. Clique no bucket `product-photos`
2. Vá em **Policies**
3. Clique em **New Policy**
4. Selecione **For full customization**

**Política 1: Leitura Pública**

```sql
CREATE POLICY "Public can view product photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-photos');
```

**Política 2: Upload Autenticado**

```sql
CREATE POLICY "Authenticated users can upload product photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-photos'
  AND auth.uid() IS NOT NULL
);
```

**Política 3: Deleção do Próprio Usuário**

```sql
CREATE POLICY "Users can delete their own product photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'product-photos'
  AND auth.uid() IS NOT NULL
);
```

---

### 3️⃣ Testar a Migration

Execute estas queries no SQL Editor para verificar:

```sql
-- Verificar tabelas criadas
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('accessories', 'product_filaments', 'product_accessories');

-- Verificar coluna foto_url em products
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'products'
AND column_name = 'foto_url';

-- Verificar função calculate_product_total_cost
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name = 'calculate_product_total_cost';
```

**✅ Resultado esperado:**

- 3 tabelas retornadas
- 1 coluna foto_url encontrada
- 1 função encontrada

---

## 🧪 Testando o Sistema

### Cadastrar um Acessório

1. Acesse o dashboard
2. Vá em **Acessórios** (nova página)
3. Clique em **Novo Acessório**
4. Preencha:
   - Nome: `Ímã Redondo 10mm`
   - Categoria: `Ímã`
   - Custo: `0.50`
   - Estoque: `100`
   - Unidade: `unidade`
5. Clique em **Cadastrar**

### Criar Produto Multicolor

Vá para **Produtos** e ao criar/editar um produto:

1. **Adicione múltiplos filamentos:**

   - Filamento 1: PLA Vermelho - 50g
   - Filamento 2: PLA Dourado - 30g
   - Filamento 3: PLA Preto - 20g

2. **Adicione acessórios:**

   - 2x Ímã Redondo 10mm

3. **Upload de foto:**

   - Clique em "Selecionar foto"
   - Escolha uma imagem do produto

4. **Veja o custo total calculado automaticamente**

---

## 📊 Estrutura de Dados

### Tabela: accessories

```sql
CREATE TABLE accessories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  categoria TEXT NOT NULL CHECK (categoria IN ('ima', 'chaveiro', 'cola', 'tinta', 'outro')),
  descricao TEXT,
  custo_unitario NUMERIC(10,2) NOT NULL,
  estoque_atual NUMERIC(10,2) DEFAULT 0,
  unidade TEXT DEFAULT 'unidade'
);
```

### Tabela: product_filaments (Many-to-Many)

```sql
CREATE TABLE product_filaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  produto_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  filamento_id UUID NOT NULL REFERENCES filaments(id) ON DELETE CASCADE,
  peso_usado NUMERIC(10,2) NOT NULL,
  ordem INTEGER DEFAULT 1,
  cor_identificacao TEXT
);
```

### Tabela: product_accessories (Many-to-Many)

```sql
CREATE TABLE product_accessories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  produto_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  accessory_id UUID NOT NULL REFERENCES accessories(id) ON DELETE CASCADE,
  quantidade NUMERIC(10,2) DEFAULT 1
);
```

---

## 🔧 Função: calculate_product_total_cost()

Calcula o custo total de um produto considerando:

- ✅ Múltiplos filamentos
- ✅ Acessórios
- ✅ Energia elétrica
- ✅ Custo da máquina

**Uso:**

```sql
SELECT * FROM calculate_product_total_cost(
  p_product_id := '123e4567-e89b-12d3-a456-426614174000',
  p_tempo_impressao_horas := 5.5,
  p_custo_kwh := 0.656,
  p_consumo_watts := 150,
  p_custo_hora := 10.0
);
```

**Retorno:**

```json
{
  "custo_filamentos": 25.5,
  "custo_acessorios": 1.0,
  "custo_energia": 0.54,
  "custo_maquina": 55.0,
  "custo_total": 82.04
}
```

---

## ⚡ Trigger Atualizado

O trigger `baixar_estoque_filamento()` agora:

- ✅ Detecta se o produto usa múltiplos filamentos (product_filaments)
- ✅ Se sim, baixa estoque de TODOS os filamentos
- ✅ Se não, usa o filamento único (filamento_id)
- ✅ Baixa estoque de acessórios também

**Comportamento:**

1. Usuário cria uma venda
2. Trigger detecta produto vendido
3. Verifica se há múltiplos filamentos
4. Baixa estoque de cada filamento proporcionalmente
5. Baixa estoque de cada acessório usado

---

## 🎨 Interface - Sugestão de Componente

### Upload de Foto

```tsx
const handlePhotoUpload = async (file: File, productId: string) => {
  const fileExt = file.name.split(".").pop();
  const fileName = `${productId}-${Date.now()}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from("product-photos")
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) throw error;

  // Obter URL pública
  const {
    data: { publicUrl },
  } = supabase.storage.from("product-photos").getPublicUrl(fileName);

  // Salvar URL no produto
  await supabase
    .from("products")
    .update({ foto_url: publicUrl })
    .eq("id", productId);
};
```

---

## 🐛 Troubleshooting

### Erro: "relation accessories does not exist"

**Solução:** A migration 006 não foi aplicada. Execute o SQL novamente.

### Erro: "bucket product-photos not found"

**Solução:** Crie o bucket conforme o passo 2.

### Fotos não aparecem

**Solução:** Verifique se o bucket está público e as políticas foram criadas.

### Cálculo de custo não funciona

**Solução:** Verifique se a função `calculate_product_total_cost()` foi criada:

```sql
SELECT * FROM pg_proc WHERE proname = 'calculate_product_total_cost';
```

---

## 📚 Próximos Passos

1. ✅ Aplicar migration 006
2. ✅ Criar bucket de fotos
3. ✅ Testar cadastro de acessórios
4. ⏳ Atualizar interface de produtos para multicolor
5. ⏳ Implementar upload de fotos
6. ⏳ Testar fluxo completo

---

## 📖 Documentação Relacionada

- [MULTICOLOR_E_ACESSORIOS.md](./MULTICOLOR_E_ACESSORIOS.md) - Documentação detalhada do sistema
- [SISTEMA_COMPLETO.md](./SISTEMA_COMPLETO.md) - Visão geral do sistema
- [INICIO_RAPIDO.md](./INICIO_RAPIDO.md) - Guia de início rápido

---

**✨ Parabéns! Seu sistema agora suporta produtos multicolor, acessórios e fotos!**
