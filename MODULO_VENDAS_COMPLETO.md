# 📊 Módulo de Vendas - Vultrix 3D

## 🎯 Visão Geral

O Módulo de Vendas é responsável pelo registro, controle e análise das vendas de produtos impressos em 3D. Ele calcula automaticamente o lucro de cada venda e prepara a base para futuras integrações com controle de estoque de filamentos.

## 🗄️ Estrutura do Banco de Dados

### Tabela: `sales`

```sql
CREATE TABLE sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    produto_id UUID REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 1 NOT NULL,
    sale_price NUMERIC(10, 2) NOT NULL,
    cost_price NUMERIC(10, 2) NOT NULL,
    profit NUMERIC(10, 2) NOT NULL,
    payment_method TEXT DEFAULT 'dinheiro',
    data DATE NOT NULL,
    cliente TEXT,
    -- Campos legados para compatibilidade
    valor_venda NUMERIC(10, 2) NOT NULL,
    lucro_calculado NUMERIC(10, 2) NOT NULL
);
```

### Campos

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | Identificador único da venda |
| `created_at` | TIMESTAMP | Data/hora de criação do registro |
| `user_id` | UUID | Referência ao usuário (vendedor) |
| `produto_id` | UUID | Referência ao produto vendido |
| `quantity` | INTEGER | Quantidade de itens vendidos |
| `sale_price` | NUMERIC | Preço unitário de venda |
| `cost_price` | NUMERIC | Custo unitário de produção |
| `profit` | NUMERIC | Lucro total da venda |
| `payment_method` | TEXT | Método de pagamento |
| `data` | DATE | Data da venda |
| `cliente` | TEXT | Nome do cliente (opcional) |

### Relacionamentos

- **products**: Cada venda está associada a um produto
- **auth.users**: Cada venda pertence a um usuário

### Índices

```sql
CREATE INDEX idx_sales_user_id ON sales(user_id);
CREATE INDEX idx_sales_produto_id ON sales(produto_id);
CREATE INDEX idx_sales_data ON sales(data);
CREATE INDEX idx_sales_created_at ON sales(created_at);
```

## 🔐 Segurança (RLS)

Row Level Security (RLS) está habilitado com as seguintes políticas:

- **SELECT**: Usuários podem visualizar apenas suas próprias vendas
- **INSERT**: Usuários podem criar vendas apenas para si mesmos
- **UPDATE**: Usuários podem atualizar apenas suas próprias vendas
- **DELETE**: Usuários podem deletar apenas suas próprias vendas

## 💡 Funcionalidades

### 1. Registro de Vendas

- Seleção do produto a partir da lista de produtos cadastrados
- Definição de quantidade
- Ajuste de preço de venda (permite descontos/acréscimos)
- Seleção do método de pagamento
- Registro de data da venda
- Cadastro opcional do nome do cliente

### 2. Cálculo Automático de Lucro

```typescript
const costPrice = product.custo_total * quantity
const salePrice = formData.sale_price * quantity
const profit = salePrice - costPrice
```

O sistema calcula automaticamente:
- **Custo Total**: Custo unitário × Quantidade
- **Valor Total da Venda**: Preço unitário × Quantidade
- **Lucro**: Valor de Venda - Custo Total

### 3. Dashboard de Estatísticas

Cards informativos exibem:
- **Total de Vendas**: Quantidade total de vendas realizadas
- **Lucro Total**: Soma de todos os lucros
- **Vendas Hoje**: Quantidade de vendas do dia atual

### 4. Métodos de Pagamento

- Dinheiro
- PIX
- Cartão de Crédito
- Cartão de Débito
- Transferência Bancária

### 5. Listagem de Vendas

Tabela completa mostrando:
- Produto vendido
- Quantidade
- Valor unitário
- Valor total
- Lucro
- Método de pagamento
- Data da venda
- Cliente
- Ações (Editar/Excluir)

### 6. Edição e Exclusão

- Editar vendas existentes
- Excluir vendas (com confirmação)
- Recalcular lucro automaticamente ao editar

## 🎨 Interface (UI/UX)

### Design System
- **Tema**: Dark premium
- **Cores principais**:
  - Background: `vultrix-dark` (#0a0a0a)
  - Borders: `vultrix-gray` (#1a1a1a)
  - Accent: `vultrix-accent` (cyan/azul)
  - Text: White e `vultrix-light`

### Componentes
- Cards estatísticos animados
- Tabela responsiva
- Modal para cadastro/edição
- Preview de cálculos em tempo real
- Indicadores coloridos de lucro (verde/vermelho)

### Animações
- Framer Motion para transições suaves
- AnimatePresence para modal
- Hover effects nos botões e linhas da tabela

## 🚀 Uso

### Registrar uma Venda

1. Clique no botão "Nova Venda"
2. Selecione o produto
3. Defina a quantidade
4. Ajuste o preço se necessário
5. Escolha o método de pagamento
6. Selecione a data
7. Opcionalmente, informe o nome do cliente
8. Clique em "Registrar Venda"

### Editar uma Venda

1. Clique no ícone de editar (✏️) na linha da venda
2. Modifique os campos desejados
3. Clique em "Atualizar"

### Excluir uma Venda

1. Clique no ícone de lixeira (🗑️) na linha da venda
2. Confirme a exclusão

## 📊 Queries Úteis

### Total de Vendas por Período

```typescript
const { data } = await supabase
  .from('sales')
  .select('*')
  .eq('user_id', userId)
  .gte('data', startDate)
  .lte('data', endDate)
```

### Produtos Mais Vendidos

```typescript
const { data } = await supabase
  .from('sales')
  .select('produto_id, products(nome), quantity')
  .eq('user_id', userId)
  .order('quantity', { ascending: false })
```

### Lucro Total do Mês

```typescript
const { data } = await supabase
  .from('sales')
  .select('profit')
  .eq('user_id', userId)
  .gte('data', startOfMonth)
  .lte('data', endOfMonth)

const totalProfit = data?.reduce((acc, sale) => acc + sale.profit, 0)
```

## 🔮 Funcionalidades Futuras

### 1. Baixa Automática de Filamento
Quando uma venda for registrada:
```typescript
// Reduzir peso_atual do filamento usado no produto
await supabase
  .from('filaments')
  .update({ 
    peso_atual: peso_atual - (peso_usado * quantity) 
  })
  .eq('id', filamento_id)
```

### 2. Relatórios Avançados
- Gráficos de vendas por período
- Análise de métodos de pagamento mais utilizados
- Ranking de produtos mais lucrativos
- Previsão de vendas

### 3. Controle de Clientes
- Cadastro completo de clientes
- Histórico de compras por cliente
- Programa de fidelidade

### 4. Notas Fiscais
- Geração de recibos
- Integração com sistemas fiscais
- Exportação de dados para contabilidade

## 🐛 Troubleshooting

### Erro ao carregar vendas
- Verificar se o usuário está autenticado
- Confirmar se as policies de RLS estão corretas
- Verificar logs do Supabase

### Cálculo de lucro incorreto
- Verificar se o produto tem custo_total definido
- Confirmar valores de sale_price e quantity
- Verificar fórmula: `profit = (sale_price * quantity) - (cost_price * quantity)`

### Produto não aparece na lista
- Verificar se o produto está ativo
- Confirmar se pertence ao usuário logado
- Verificar se existe na tabela products

## 📝 Changelog

### v1.0.0 (2026-01-14)
- ✅ Criação da tabela `sales` com todos os campos
- ✅ Implementação do cálculo automático de lucro
- ✅ Interface completa de vendas
- ✅ Dashboard com estatísticas
- ✅ CRUD completo de vendas
- ✅ Validações e tratamento de erros
- ✅ RLS e políticas de segurança
- ✅ Preparação para integração com filamentos

## 🤝 Integração com Outros Módulos

### Produtos
- Busca preço de venda padrão
- Usa custo_total para cálculo de lucro
- Futuro: Controlar status (vendido/disponível)

### Filamentos
- Futuro: Baixar peso_atual ao vender
- Futuro: Alertas de estoque baixo
- Futuro: Sugestão de reposição

### Dashboard Principal
- Futuro: Gráficos de desempenho
- Futuro: Métricas consolidadas
- Futuro: Comparativos mensais

---

**Desenvolvido para Vultrix 3D** 🚀
Sistema completo de gestão para impressão 3D
