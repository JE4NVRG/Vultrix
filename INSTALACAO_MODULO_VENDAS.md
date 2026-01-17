# 🚀 Guia de Instalação - Módulo de Vendas

## ✅ Status da Implementação

O Módulo de Vendas foi **implementado com sucesso** e está pronto para uso!

## 📋 O que foi implementado

### 1. Banco de Dados
- ✅ Migration `004_complete_sales.sql` criada
- ✅ Tabela `sales` com todos os campos necessários
- ✅ Índices para otimização de performance
- ✅ Políticas de Row Level Security (RLS)

### 2. Interface
- ✅ Página `/dashboard/vendas` totalmente funcional
- ✅ Dashboard com 3 cards de estatísticas
- ✅ Listagem completa de vendas
- ✅ Modal para registro/edição de vendas
- ✅ Preview de cálculo em tempo real
- ✅ Design dark premium mantido

### 3. Funcionalidades
- ✅ Registro de vendas com cálculo automático de lucro
- ✅ Relacionamento com produtos cadastrados
- ✅ Seleção de método de pagamento
- ✅ Campo opcional para cliente
- ✅ Edição de vendas existentes
- ✅ Exclusão com confirmação
- ✅ Estatísticas em tempo real

## 🔧 Instalação no Supabase

### Opção 1: Via Dashboard do Supabase (Recomendado)

1. Acesse o [Dashboard do Supabase](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá em **SQL Editor**
4. Clique em **New Query**
5. Cole o conteúdo do arquivo `supabase/migrations/004_complete_sales.sql`
6. Clique em **Run** (ou pressione `Ctrl + Enter`)

### Opção 2: Via CLI do Supabase

```powershell
# Se tiver o Supabase CLI instalado
supabase db push

# Ou aplicar migration específica
supabase migration up --include-dirs supabase/migrations
```

### Opção 3: Aplicar SQL Manualmente

Execute o seguinte SQL no seu banco de dados:

```sql
-- Adicionar novos campos
ALTER TABLE sales 
ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1 NOT NULL,
ADD COLUMN IF NOT EXISTS sale_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS cost_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS profit NUMERIC(10, 2) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'dinheiro';

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_sales_user_id ON sales(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_produto_id ON sales(produto_id);
CREATE INDEX IF NOT EXISTS idx_sales_data ON sales(data);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);
```

## 🎯 Como Usar

### 1. Acessar o Módulo

Abra seu navegador e acesse:
```
http://localhost:3001/dashboard/vendas
```

### 2. Registrar uma Venda

1. Clique no botão **"Nova Venda"**
2. Selecione um **produto** da lista (certifique-se de ter produtos cadastrados)
3. Defina a **quantidade**
4. Ajuste o **preço de venda** se necessário
5. Escolha o **método de pagamento**
6. Selecione a **data da venda**
7. Opcionalmente, informe o **nome do cliente**
8. Clique em **"Registrar Venda"**

### 3. Visualizar Estatísticas

No topo da página você verá 3 cards com:
- **Total de Vendas**: Quantidade total de vendas realizadas
- **Lucro Total**: Soma de todos os lucros (em R$)
- **Vendas Hoje**: Quantidade de vendas realizadas hoje

### 4. Gerenciar Vendas

Na tabela de vendas você pode:
- **Visualizar** todas as vendas com detalhes
- **Editar** uma venda clicando no ícone de lápis (✏️)
- **Excluir** uma venda clicando no ícone de lixeira (🗑️)

## 🔍 Cálculo Automático de Lucro

O sistema calcula automaticamente:

```
Custo Total = custo_total_do_produto × quantidade
Valor Total da Venda = preço_unitário × quantidade
Lucro = Valor da Venda - Custo Total
```

### Exemplo:

- **Produto**: Chaveiro personalizado
- **Custo do produto**: R$ 5,00
- **Preço de venda**: R$ 15,00
- **Quantidade**: 3 unidades

**Cálculo:**
- Custo Total: R$ 5,00 × 3 = R$ 15,00
- Valor da Venda: R$ 15,00 × 3 = R$ 45,00
- **Lucro: R$ 45,00 - R$ 15,00 = R$ 30,00** ✅

## 🎨 Layout

O módulo mantém o design premium dark do sistema:
- Background escuro (#0a0a0a)
- Borders sutis (#1a1a1a)
- Accent color cyan
- Animações suaves com Framer Motion
- Cards com glassmorphism
- Hover effects interativos

## ⚠️ Pré-requisitos

Antes de usar o módulo de vendas, certifique-se de ter:

1. ✅ Supabase configurado (tabelas criadas)
2. ✅ Autenticação funcionando
3. ✅ Pelo menos um **produto cadastrado** em `/dashboard/produtos`

## 🔮 Próximos Passos

### Funcionalidades Futuras

1. **Baixa Automática de Filamento**
   - Ao registrar venda, reduzir automaticamente o peso do filamento usado
   
2. **Relatórios Avançados**
   - Gráficos de vendas por período
   - Análise de produtos mais vendidos
   - Comparativo mensal de lucros

3. **Gestão de Clientes**
   - Cadastro completo de clientes
   - Histórico de compras por cliente

4. **Notas Fiscais**
   - Geração de recibos
   - Exportação para contabilidade

## 🐛 Troubleshooting

### Erro: "Nenhuma venda cadastrada"

**Causa**: Não há vendas registradas ainda.
**Solução**: Clique em "Nova Venda" para registrar a primeira.

### Erro: Produtos não aparecem na lista

**Causa**: Não há produtos cadastrados.
**Solução**: 
1. Acesse `/dashboard/produtos`
2. Cadastre pelo menos um produto
3. Retorne para `/dashboard/vendas`

### Erro na conexão com Supabase

**Causa**: Variáveis de ambiente não configuradas.
**Solução**: 
1. Verifique o arquivo `.env`
2. Confirme as variáveis:
   ```
   NEXT_PUBLIC_SUPABASE_URL=sua_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave
   ```

### Erro ao salvar venda

**Causa**: Migrations não aplicadas ou RLS não configurado.
**Solução**: 
1. Execute a migration `004_complete_sales.sql`
2. Verifique se o RLS está ativo
3. Confira se as policies existem

## 📊 Estrutura de Arquivos

```
Vultrix3D/
├── app/
│   └── dashboard/
│       └── vendas/
│           └── page.tsx          # Página principal de vendas
├── supabase/
│   └── migrations/
│       └── 004_complete_sales.sql # Migration da tabela sales
├── types/
│   └── database.ts               # Tipos TypeScript
├── lib/
│   └── supabase/
│       └── client.ts             # Cliente Supabase
└── MODULO_VENDAS_COMPLETO.md     # Documentação completa
```

## ✨ Recursos Implementados

- [x] Tabela sales no Supabase
- [x] Cálculo automático de lucro
- [x] Interface dark premium
- [x] Dashboard com estatísticas
- [x] CRUD completo de vendas
- [x] Validações de formulário
- [x] Preview de cálculo em tempo real
- [x] Integração com produtos
- [x] RLS e segurança
- [x] Responsividade
- [x] Animações suaves
- [x] Tratamento de erros

## 🎉 Pronto para Uso!

O Módulo de Vendas está **100% funcional** e pronto para ser utilizado!

**Acesse agora**: [http://localhost:3001/dashboard/vendas](http://localhost:3001/dashboard/vendas)

---

Para mais detalhes técnicos, consulte [MODULO_VENDAS_COMPLETO.md](MODULO_VENDAS_COMPLETO.md)

**Desenvolvido para Vultrix 3D** 🚀
