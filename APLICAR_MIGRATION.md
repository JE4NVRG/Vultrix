# 🚀 INSTRUÇÕES PARA APLICAR MIGRATIONS NO SUPABASE

## ⚠️ IMPORTANTE: LEIA ANTES DE EXECUTAR

Esta migration adiciona funcionalidades críticas ao sistema:

- ✅ Baixa automática de estoque
- ✅ Logs de consumo de filamento
- ✅ Configurações de usuário
- ✅ Triggers e funções SQL

---

## 📋 PASSO A PASSO

### 1️⃣ Acessar Supabase Dashboard

1. Acesse: https://supabase.com/dashboard
2. Faça login na sua conta
3. Selecione o projeto **Vultrix 3D**

---

### 2️⃣ Abrir SQL Editor

1. No menu lateral, clique em **SQL Editor**
2. Clique em **+ New query**

---

### 3️⃣ Executar Migration 005

1. Abra o arquivo: `supabase/migrations/005_evolution_products_and_logs.sql`
2. Copie **TODO** o conteúdo do arquivo
3. Cole no SQL Editor do Supabase
4. Clique em **RUN** (ou pressione Ctrl+Enter)

---

### 4️⃣ Verificar Resultado

Você deve ver a mensagem: `Success. No rows returned`

Se houver erros, leia atentamente a mensagem. Os erros mais comuns são:

#### ❌ "relation already exists"

**Solução:** A tabela já existe. Você pode ignorar ou adicionar `IF NOT EXISTS` nas queries.

#### ❌ "column already exists"

**Solução:** O campo já foi criado. Pode ignorar, o sistema já tem as colunas.

#### ❌ "function already exists"

**Solução:** A função já existe. Use `CREATE OR REPLACE FUNCTION` em vez de `CREATE FUNCTION`.

#### ❌ "trigger already exists"

**Solução:** Use `DROP TRIGGER IF EXISTS` antes de criar.

---

## 🔍 VERIFICAR SE DEU CERTO

### Verificar Tabelas Criadas

Execute no SQL Editor:

```sql
-- Verificar se as tabelas existem
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('filament_consumption_logs', 'user_settings');
```

**Resultado esperado:** Deve retornar 2 linhas.

---

### Verificar Triggers

Execute no SQL Editor:

```sql
-- Verificar se o trigger existe
SELECT trigger_name, event_object_table, action_statement
FROM information_schema.triggers
WHERE trigger_name = 'trigger_baixar_estoque';
```

**Resultado esperado:** Deve retornar 1 linha com o trigger.

---

### Verificar Função

Execute no SQL Editor:

```sql
-- Verificar se a função existe
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('calculate_print_cost', 'baixar_estoque_filamento');
```

**Resultado esperado:** Deve retornar 2 linhas.

---

## 🧪 TESTAR O SISTEMA

### Teste 1: Criar Configurações de Usuário

Execute no SQL Editor (substitua `SEU_USER_ID` pelo seu ID de usuário):

```sql
-- Ver seu user_id
SELECT id, email FROM auth.users;

-- Criar configurações (use seu ID)
INSERT INTO user_settings (user_id)
VALUES ('SEU_USER_ID')
ON CONFLICT (user_id) DO NOTHING;

-- Verificar se criou
SELECT * FROM user_settings WHERE user_id = 'SEU_USER_ID';
```

---

### Teste 2: Função de Cálculo

Execute no SQL Editor:

```sql
-- Testar função de cálculo
SELECT * FROM calculate_print_cost(
    peso_gramas := 100,
    custo_por_kg := 120,
    tempo_horas := 2,
    custo_kwh := 0.95,
    consumo_watts := 200,
    custo_hora := 5
);
```

**Resultado esperado:**

```
custo_material: 12.00
custo_energia: 0.38
custo_maquina: 10.00
custo_total: 22.38
```

---

### Teste 3: Trigger de Baixa Automática

**⚠️ CUIDADO:** Este teste afeta dados reais. Faça apenas se tiver:

- Um filamento cadastrado
- Um produto vinculado a esse filamento

```sql
-- 1. Ver seus filamentos
SELECT id, nome, peso_atual FROM filaments WHERE user_id = 'SEU_USER_ID';

-- 2. Ver seus produtos
SELECT id, nome, filamento_id, peso_usado FROM products WHERE user_id = 'SEU_USER_ID';

-- 3. Registrar uma venda de TESTE (use IDs reais)
-- IMPORTANTE: Isso vai abater estoque de verdade!
INSERT INTO sales (
    user_id,
    produto_id,
    quantity,
    sale_price,
    cost_price,
    profit,
    data,
    valor_venda,
    lucro_calculado
) VALUES (
    'SEU_USER_ID',
    'ID_DO_PRODUTO',
    1, -- quantidade
    50.00, -- preço de venda
    20.00, -- custo
    30.00, -- lucro
    CURRENT_DATE,
    50.00,
    30.00
);

-- 4. Verificar se o estoque foi abatido
SELECT id, nome, peso_atual FROM filaments WHERE user_id = 'SEU_USER_ID';

-- 5. Verificar se o log foi criado
SELECT * FROM filament_consumption_logs WHERE user_id = 'SEU_USER_ID' ORDER BY created_at DESC LIMIT 1;
```

Se tudo funcionou:

- ✅ Estoque do filamento diminuiu
- ✅ Um log foi criado em `filament_consumption_logs`

---

## 🐛 TROUBLESHOOTING

### Problema: Migration falhou no meio

**Solução:** Execute as queries uma por uma:

1. Crie a tabela `filament_consumption_logs`
2. Crie a tabela `user_settings`
3. Crie as policies
4. Crie as funções
5. Crie o trigger

---

### Problema: Trigger não dispara

Execute:

```sql
-- Remover trigger antigo
DROP TRIGGER IF EXISTS trigger_baixar_estoque ON sales;

-- Recriar
CREATE TRIGGER trigger_baixar_estoque
    AFTER INSERT ON sales
    FOR EACH ROW
    EXECUTE FUNCTION baixar_estoque_filamento();
```

---

### Problema: Função com erro de sintaxe

Verifique se o delimitador `$$` está correto. Exemplo correto:

```sql
CREATE OR REPLACE FUNCTION nome_funcao()
RETURNS TRIGGER AS $$
BEGIN
    -- código aqui
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## ✅ CHECKLIST FINAL

Antes de usar o sistema em produção, verifique:

- [ ] Tabela `filament_consumption_logs` existe
- [ ] Tabela `user_settings` existe
- [ ] Campo `filamento_id` existe em `products`
- [ ] Campo `status` existe em `products`
- [ ] Função `calculate_print_cost` existe
- [ ] Função `baixar_estoque_filamento` existe
- [ ] Trigger `trigger_baixar_estoque` existe
- [ ] Policies de RLS estão ativas
- [ ] Teste de venda funcionou
- [ ] Log de consumo foi criado
- [ ] Estoque foi abatido corretamente

---

## 🎯 PRÓXIMOS PASSOS

Após aplicar a migration:

1. ✅ Acesse o sistema: `npm run dev`
2. ✅ Faça login
3. ✅ Cadastre um filamento
4. ✅ Use a calculadora para criar um produto
5. ✅ Registre uma venda
6. ✅ Veja o dashboard atualizado
7. ✅ Confira se o estoque foi abatido

---

## 📞 EM CASO DE DÚVIDAS

### Erro na Migration

- Copie a mensagem de erro completa
- Verifique a linha que falhou
- Execute queries individuais

### Trigger não funciona

- Verifique se a função existe: `SELECT * FROM pg_proc WHERE proname = 'baixar_estoque_filamento'`
- Verifique se o trigger existe: `SELECT * FROM pg_trigger WHERE tgname = 'trigger_baixar_estoque'`

### Dados inconsistentes

- Revise as queries de teste
- Use transações para testar: `BEGIN; ... ROLLBACK;`

---

## 🔐 SEGURANÇA

Todas as tabelas têm **Row Level Security (RLS)** ativo:

- ✅ Usuários só veem seus próprios dados
- ✅ Impossível acessar dados de outros usuários
- ✅ Policies validam user_id automaticamente

---

**🚀 Agora é só usar o sistema e crescer!**

_Desenvolvido com 💜 para Vultrix 3D_
