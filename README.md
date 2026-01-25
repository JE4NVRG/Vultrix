# 🎨 Vultrix3D

<div align="center">

![Vultrix3D](https://img.shields.io/badge/Vultrix3D-Sistema_de_Gestão_3D-purple?style=for-the-badge)
[![Next.js](https://img.shields.io/badge/Next.js-15.1.4-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green?style=for-the-badge&logo=supabase)](https://supabase.com/)

**Sistema completo de gestão para negócios de impressão 3D**

[Documentação](#-documentação) • [Instalação](#-instalação) • [Features](#-funcionalidades) • [Roadmap](#-roadmap)

</div>

---

## 📋 Sobre o Projeto

**Vultrix3D** é um sistema profissional de gestão desenvolvido especificamente para empresas e makers do mercado de impressão 3D. Controle completo de filamentos, impressoras, vendas, custos operacionais e fluxo de caixa em uma única plataforma moderna e intuitiva.

### 🎯 Objetivos

- ✅ **Gestão Financeira Completa**: Receitas, despesas, aportes e categorização inteligente
- ✅ **Controle de Estoque Profissional**: Filamentos, acessórios, embalagens com rastreamento de lotes
- ✅ **Sistema de Vendas Integrado**: Cálculo automático de custos reais (material, energia, tempo)
- ✅ **Onboarding Maker**: Cadastro simplificado com catálogo de impressoras e estimativas
- ✅ **Calculadora de Projetos**: Orçamentos precisos baseados em parâmetros reais
- 🚧 **Dashboards Inteligentes**: Métricas, gráficos e insights de negócio

---

## 🚀 Tecnologias

### **Core Stack**

```json
{
  "frontend": "Next.js 15.1.4 (App Router)",
  "language": "TypeScript 5.0",
  "styling": "Tailwind CSS 3.4.1",
  "database": "Supabase (PostgreSQL)",
  "auth": "Supabase Auth",
  "storage": "Supabase Storage",
  "animation": "Framer Motion 12.x"
}
```

### **Arquitetura**

- **Server Components**: Renderização otimizada no servidor
- **Client Components**: Interatividade com React 19
- **RLS (Row Level Security)**: Segurança nativa no banco de dados
- **Migrations**: Versionamento completo do schema
- **Typed APIs**: Database types gerados automaticamente

---

## ✨ Funcionalidades

### 💰 **Módulo Financeiro**

- **Receitas e Despesas**: Categorização automática com tags
- **Aportes de Capital**: Controle de investimentos iniciais
- **Fluxo de Caixa**: Visão temporal com filtros por período
- **Categorias Customizáveis**: Organize suas transações
- **Integração com Vendas**: Receitas automáticas de impressões

### 🧵 **Gestão de Filamentos**

- **Estoque em Tempo Real**: Peso disponível por marca/cor/tipo
- **Compras com Frete**: Rateio automático de frete por peso ou valor
- **Multi-item**: Compre vários filamentos em um único pedido
- **Histórico de Preços**: Acompanhe oscilações de fornecedores
- **Marcas e Tipos**: PLA, ABS, PETG, TPU, Nylon e mais

### 🖨️ **Cadastro de Impressoras**

- **Catálogo Inteligente**: 20+ modelos pré-cadastrados (Bambu Lab, Creality, Prusa)
- **Busca por Modelo**: Typeahead search com preenchimento automático
- **Estimador de Consumo**: Sugestões de watts por tipo de impressora
- **Múltiplas Impressoras**: Gerencie seu parque de equipamentos
- **Impressora Padrão**: Defina qual usar por padrão nos cálculos

### 🛒 **Sistema de Vendas**

- **Custos Reais**: Material, energia, tempo de impressão
- **Custos Extras**: Embalagem, etiqueta, frete, acabamentos
- **Lucro Líquido**: Cálculo automático de margem real
- **Produtos Template**: Base de cálculo reutilizável
- **Integração com Estoque**: Baixa automática de filamento

### 📊 **Calculadora de Projetos**

- **Parâmetros Reais**: Peso, tempo, energia por kWh
- **Múltiplas Cores**: Suporte a impressões multicolor
- **Acessórios**: Adicione parafusos, ímãs, inserts
- **Orçamento Instantâneo**: Compartilhe com clientes

### 👤 **Perfil do Usuário**

- **Identidade**: Nome, WhatsApp, Instagram, cidade
- **Logo da Empresa**: Upload de imagem de perfil
- **Defaults Operacionais**: Custo kWh, margem de lucro padrão
- **Preferências**: Incluir embalagem/etiqueta/frete por padrão

---

## 📁 Estrutura do Projeto

```
Vultrix3D/
├── app/                          # Next.js App Router
│   ├── (public)/                 # Rotas públicas (landing page)
│   ├── dashboard/                # Área autenticada
│   │   ├── perfil/               # Perfil do usuário
│   │   ├── impressoras/          # Gestão de impressoras
│   │   ├── filamentos/           # Estoque de filamentos
│   │   ├── acessorios/           # Materiais extras
│   │   ├── vendas/               # Módulo de vendas
│   │   ├── calculadora/          # Orçamentos
│   │   ├── aportes/              # Aportes de capital
│   │   ├── despesas/             # Despesas operacionais
│   │   └── categorias/           # Categorias financeiras
│   └── login/                    # Autenticação
├── components/                   # Componentes reutilizáveis
│   ├── ModelSelector.tsx         # Busca de modelos de impressora
│   ├── WattsEstimator.tsx        # Estimador de consumo
│   ├── Navbar.tsx                # Navegação pública
│   └── Footer.tsx                # Rodapé
├── lib/                          # Utilitários e configs
│   ├── auth/                     # Context de autenticação
│   ├── supabase/                 # Clients do Supabase
│   ├── hooks/                    # Custom React hooks
│   └── api/                      # Server-side functions
├── supabase/                     # Database
│   └── migrations/               # Histórico de schema
│       ├── 001_initial_schema.sql
│       ├── 007_financeiro_base.sql
│       ├── 008_filamentos_profissional.sql
│       ├── 011_filament_purchases.sql
│       ├── 014_user_profile.sql
│       ├── 016_printer_models.sql
│       └── 017_storage_profile_images.sql
└── types/                        # TypeScript definitions
    └── database.ts               # Tipos gerados do Supabase
```

---

## 🛠️ Instalação

### **Pré-requisitos**

- **Node.js** 18.x ou superior
- **npm** ou **pnpm**
- **Conta no Supabase** (gratuita)
- **Git** instalado

### **1. Clone o Repositório**

```bash
git clone https://github.com/JE4NVRG/Vultrix.git
cd Vultrix
```

### **2. Instale as Dependências**

```bash
npm install
# ou
pnpm install
```

### **3. Configure o Supabase**

1. Crie um projeto em [supabase.com](https://supabase.com)
2. Copie a **URL** e **ANON KEY** do projeto
3. Crie um arquivo `.env.local` na raiz:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-aqui
```

### **4. Execute as Migrations**

Acesse o **SQL Editor** no Supabase Dashboard e execute os arquivos de `supabase/migrations/` na ordem numérica (001, 002, 003...).

**Dica**: Use o arquivo [CONFIGURACAO_SUPABASE.md](CONFIGURACAO_SUPABASE.md) para instruções detalhadas.

### **5. Rode o Projeto**

```bash
npm run dev
```

Acesse: **http://localhost:3000**

---

## 📚 Documentação

O projeto inclui documentação completa em português:

| Documento                                              | Descrição                       |
| ------------------------------------------------------ | ------------------------------- |
| [INICIO_RAPIDO.md](INICIO_RAPIDO.md)                   | Guia de primeiros passos        |
| [CONFIGURACAO_SUPABASE.md](CONFIGURACAO_SUPABASE.md)   | Setup do banco de dados         |
| [GUIA_AUTENTICACAO.md](GUIA_AUTENTICACAO.md)           | Sistema de login/logout         |
| [FASE1_ONBOARDING_MAKER.md](FASE1_ONBOARDING_MAKER.md) | Perfil + Impressoras            |
| [SISTEMA_COMPLETO.md](SISTEMA_COMPLETO.md)             | Visão geral da arquitetura      |
| [STATUS.md](STATUS.md)                                 | Estado atual do desenvolvimento |

---

## 🗺️ Roadmap

### ✅ **Fase 1 - MVP Funcional** (Concluído)

- [x] Sistema de autenticação
- [x] Módulo financeiro base
- [x] Gestão de filamentos profissional
- [x] Onboarding com perfil e impressoras
- [x] Catálogo inteligente de impressoras
- [x] Sistema de vendas com custos reais

### 🚧 **Fase 2 - Integração** (Em Progresso)

- [x] Calculadora integrada com impressoras
- [ ] Baixa automática de estoque em vendas
- [ ] Dashboard com métricas principais
- [ ] Gráficos de receita/despesa

### 🔮 **Fase 3 - Avançado** (Planejado)

- [ ] Sistema de orçamentos (enviar ao cliente)
- [ ] Histórico de projetos com fotos
- [ ] Relatórios PDF personalizados
- [ ] Multi-usuário (equipes)
- [ ] Integração com marketplaces (Mercado Livre, Shopee)
- [ ] App mobile (React Native)

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Siga os passos:

1. **Fork** o projeto
2. Crie uma **branch** para sua feature (`git checkout -b feature/MinhaFeature`)
3. **Commit** suas mudanças (`git commit -m 'Add: MinhaFeature'`)
4. **Push** para a branch (`git push origin feature/MinhaFeature`)
5. Abra um **Pull Request**

### **Padrão de Commits**

```
Add: Nova funcionalidade
Fix: Correção de bug
Update: Atualização de feature existente
Docs: Apenas documentação
Style: Formatação, lint
Refactor: Refatoração de código
```

---

## 📄 Licença

Este projeto está sob a licença **MIT**. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 👨‍💻 Autor

<div align="center">

**Jean Varg** ([@JE4NVRG](https://github.com/JE4NVRG))

Desenvolvido com 💜 por **Vultrix**

[GitHub](https://github.com/JE4NVRG) • [LinkedIn](#) • [Portfolio](#)

---

### ⭐ Se este projeto foi útil, deixe uma estrela!

</div>

---

## 🔗 Links Úteis

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Framer Motion](https://www.framer.com/motion/)

---

<div align="center">
  <sub>Construído para a comunidade maker brasileira 🇧🇷</sub>
</div>

Código fechado - Propriedade de Jean (Vultrix 3D)

---

## 📞 SUPORTE

### Documentação

Leia os guias na pasta raiz

### Issues

Reporte bugs ou sugira features

---

## 🏆 CRÉDITOS

- **Desenvolvedor:** Jean
- **Sistema:** Vultrix 3D
- **IA:** GitHub Copilot (Claude Sonnet 4.5)
- **Framework:** Next.js
- **Backend:** Supabase

---

## 🎯 MISSÃO

> "Transformar makers em empresários através de dados precisos e automação inteligente."

---

## 📈 STATUS

```
✅ Sistema 100% funcional
✅ Build otimizado
✅ Migrations completas
✅ Documentação completa
✅ Pronto para produção
```

---

## 🚀 COMECE AGORA

```bash
# 1. Clone
git clone <repo>

# 2. Instale
npm install

# 3. Configure
cp .env.example .env.local

# 4. Migrations
# Execute no Supabase

# 5. Rode
npm run dev
```

**Tempo: ~15 minutos → Sistema profissional funcionando!**

---

**Desenvolvido com 💜 para transformar impressão 3D em negócio sério.**

_Vultrix 3D - Onde dados encontram decisões._ 🚀
