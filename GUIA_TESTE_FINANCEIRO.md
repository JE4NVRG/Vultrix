# 🧪 GUIA RÁPIDO DE TESTE - FINANCEIRO BASE

## Passo 1: Aplicar Migration ⚠️

1. Acesse: https://supabase.com/dashboard/project/YOUR_PROJECT/sql
2. Cole o código de `supabase/migrations/007_financeiro_base.sql`
3. Clique em **RUN** (canto inferior direito)
4. Aguarde mensagem de sucesso: "Success. No rows returned"

---

## Passo 2: Testar Categorias

### Acessar: `/dashboard/categorias`

**Criar 5 categorias:**

1. **Matéria-Prima**
   - Cor: Verde (#10B981)
   - Ícone: Package
2. **Marketing**
   - Cor: Roxo (#8B5CF6)
   - Ícone: Megaphone
3. **Transporte**
   - Cor: Azul (#3B82F6)
   - Ícone: Truck
4. **Manutenção**
   - Cor: Laranja (#F97316)
   - Ícone: Wrench
5. **Energia**
   - Cor: Amarelo (#F59E0B)
   - Ícone: Zap

**Testar:**

- ✅ Criar categoria
- ✅ Editar nome inline
- ✅ Mudar cor
- ✅ Mudar ícone
- ✅ Desativar categoria
- ✅ Reativar categoria

---

## Passo 3: Testar Despesas

### Acessar: `/dashboard/despesas`

**Criar 3 despesas:**

1. **Filamento PLA 1kg**
   - Categoria: Matéria-Prima
   - Valor: R$ 85,00
   - Data: Hoje
2. **Anúncios Facebook**
   - Categoria: Marketing
   - Valor: R$ 150,00
   - Data: Hoje
3. **Frete Correios**
   - Categoria: Transporte
   - Valor: R$ 25,00
   - Data: Hoje

**Verificar:**

- ✅ Dropdown só mostra categorias ativas
- ✅ Badges coloridos aparecem corretamente
- ✅ Ícones corretos ao lado das categorias
- ✅ Total gasto: R$ 260,00
- ✅ Link "Gerenciar Categorias" funciona

---

## Passo 4: Testar Aportes

### Acessar: `/dashboard/aportes`

**Criar 3 aportes:**

1. **Capital Inicial**
   - Origem: Pessoal
   - Valor: R$ 5.000,00
   - Data: Início do mês
   - Obs: "Investimento inicial"
2. **Investidor Anjo**
   - Origem: Investimento
   - Valor: R$ 10.000,00
   - Data: Hoje
   - Obs: "Investidor João Silva"
3. **Empréstimo Banco**
   - Origem: Empréstimo
   - Valor: R$ 3.000,00
   - Data: Hoje
   - Obs: "Banco XYZ - 12x"

**Verificar:**

- ✅ Total aportado: R$ 18.000,00
- ✅ Cards por origem:
  - Pessoal: R$ 5.000,00
  - Investimento: R$ 10.000,00
  - Empréstimo: R$ 3.000,00
  - Outro: R$ 0,00
- ✅ Ícones e cores diferenciados
- ✅ Listagem ordenada por data

---

## Passo 5: Testar Dashboard

### Acessar: `/dashboard`

**Verificar Cards Principais:**

1. **Saldo Final** (azul, ícone porquinho)
   - Fórmula: Vendas + Aportes - Despesas
   - Deve mostrar: (suas vendas) + R$ 18.000,00 - R$ 260,00
2. **Receita Líquida** (verde, ícone cifrão)
   - Fórmula: Vendas - Despesas
   - Deve mostrar: (suas vendas) - R$ 260,00
   - **SEM incluir aportes**
3. **Total Aportes** (roxo, ícone carteira)
   - Deve mostrar: R$ 18.000,00
4. **Total Despesas** (vermelho, ícone tendência)
   - Deve mostrar: R$ 260,00

**Importante:**

- ⚠️ Saldo Final ≠ Receita Líquida
- ⚠️ Receita Líquida = apenas operação (vendas - despesas)
- ⚠️ Saldo Final = caixa total (inclui aportes)

---

## Passo 6: Teste Completo de Fluxo

### Cenário: Você recebeu investimento e quer usar para comprar materiais

1. **Registrar o investimento**:

   - `/dashboard/aportes` → Novo Aporte
   - Origem: Investimento
   - Valor: R$ 5.000,00

2. **Comprar materiais**:

   - `/dashboard/despesas` → Nova Despesa
   - Categoria: Matéria-Prima
   - Valor: R$ 2.000,00

3. **Verificar dashboard**:
   - Saldo Final aumentou R$ 3.000,00 (5k - 2k)
   - Receita Líquida diminuiu R$ 2.000,00 (apenas despesa)
   - Total Aportes aumentou R$ 5.000,00
   - Total Despesas aumentou R$ 2.000,00

---

## 🐛 Troubleshooting

### Erro: "relation expense_categories does not exist"

**Solução:** Você não aplicou a migration 007. Volte ao Passo 1.

### Categorias não aparecem no dropdown de despesas

**Solução:**

1. Verifique se criou categorias em `/dashboard/categorias`
2. Verifique se estão ATIVAS (toggle verde)
3. Recarregue a página de despesas

### Dashboard mostra valores zerados

**Solução:**

1. Verifique se está logado com o usuário correto
2. Crie pelo menos 1 venda em `/dashboard/vendas`
3. Crie pelo menos 1 aporte
4. Crie pelo menos 1 despesa

### RLS Error: "new row violates row-level security policy"

**Solução:**

1. Verifique se está logado
2. Reaplique a migration 007 (pode ter falhado)
3. Verifique no Supabase se as policies estão ativas

---

## ✅ Checklist Final

Marque após testar cada item:

### Categorias

- [ ] Criar categoria
- [ ] Editar categoria
- [ ] Mudar cor
- [ ] Mudar ícone
- [ ] Desativar categoria
- [ ] Categoria desativada não aparece em despesas

### Despesas

- [ ] Criar despesa com categoria
- [ ] Badge colorido aparece
- [ ] Ícone correto aparece
- [ ] Total gasto correto
- [ ] Link para categorias funciona

### Aportes

- [ ] Criar aporte pessoal
- [ ] Criar aporte investimento
- [ ] Criar aporte empréstimo
- [ ] Totais por origem corretos
- [ ] Total geral correto

### Dashboard

- [ ] Saldo Final = Vendas + Aportes - Despesas
- [ ] Receita Líquida = Vendas - Despesas
- [ ] Total Aportes correto
- [ ] Total Despesas correto
- [ ] Cores e ícones corretos

---

## 🎉 Teste Completo!

Se todos os itens acima funcionaram, a **FASE 1 - FINANCEIRO BASE** está 100% operacional!

**Próximo passo:** Adicionar os links no menu lateral do dashboard para facilitar acesso.

---

_Guia de Teste - Vultrix 3D © 2024_
