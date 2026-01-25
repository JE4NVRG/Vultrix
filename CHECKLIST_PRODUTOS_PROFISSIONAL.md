# ✅ CHECKLIST - Implementação Sistema de Produtos Profissional

## 📋 FASE 1 - Infraestrutura Base
- [x] Criar parser .3mf (`lib/utils/parse3mf.ts`)
- [x] Instalar JSZip
- [x] Hook useUserCostSettings já existe
- [ ] Criar hook useFilaments (lista filamentos)
- [ ] Criar hook usePrinters (pega watts da impressora)

## 📋 FASE 2 - Interface UX (3 Modos)
- [ ] **Modo .3mf (Importação)**
  - [ ] Upload com drag & drop
  - [ ] Preview do projeto extraído
  - [ ] Lista de materiais detectados
  - [ ] Mapeamento material → filamento
  - [ ] Botão "criar filamento na hora" inline
  - [ ] Preview de custos em tempo real
  
- [ ] **Modo Rápido**
  - [ ] Form simplificado (nome, tempo, peso, filamento)
  - [ ] Seletor de filamento único
  - [ ] Preview de custo instantâneo
  
- [ ] **Modo Manual (Avançado)**
  - [ ] Todos os campos disponíveis
  - [ ] Suporte multi-filamento
  - [ ] Overrides de custo
  - [ ] Campos avançados

## 📋 FASE 3 - Cálculos e Validações
- [ ] Calcular custo material (soma de todos filamentos)
- [ ] Calcular custo energia (tempo × watts × kWh)
- [ ] Calcular preço mínimo (custo × 1.2)
- [ ] Calcular preço sugerido (custo × (1 + margem%))
- [ ] Validações inline
- [ ] Preview em tempo real

## 📋 FASE 4 - Persistência
- [ ] Salvar produto no Supabase
- [ ] Salvar breakdown de materiais (tabela product_filaments?)
- [ ] Atualizar estoque de filamentos
- [ ] Feedback de sucesso com resumo

## 📋 FASE 5 - Listagem e Gerenciamento
- [ ] Grid de produtos cadastrados
- [ ] Cards com info resumida
- [ ] Ações: editar, duplicar, excluir
- [ ] Toggle ativo/desativado
- [ ] Filtros e busca

## 📋 FASE 6 - Features Opcionais
- [ ] Registrar primeira impressão ao cadastrar
- [ ] Exportar catálogo (PDF/CSV)
- [ ] Importação em lote
- [ ] Templates de produtos
- [ ] Histórico de preços

---

## 🔄 STATUS ATUAL
**Etapa:** FASE 2 - Implementando interface dos 3 modos
**Progresso:** 30%

**Próximos passos:**
1. Completar modal com os 3 modos
2. Implementar modo .3mf com mapeamento
3. Implementar modo rápido
4. Implementar modo manual
5. Integrar cálculos em tempo real

---

## 📁 Arquivos a Criar/Modificar

### Criados:
- ✅ `lib/utils/parse3mf.ts` - Parser de arquivos .3mf
- ⏳ `app/dashboard/produtos/page.tsx` - Interface principal (em andamento)

### A Criar:
- `lib/hooks/useFilaments.ts` - Hook para listar filamentos
- `lib/hooks/usePrinters.ts` - Hook para pegar impressora padrão
- `components/ProductWizard.tsx` (opcional - separar lógica)

### A Modificar:
- `app/dashboard/produtos/page.tsx` - Completar implementação

---

## 🎯 Critérios de Sucesso

✅ **Must Have (MVP):**
- Upload .3mf e extração automática de dados
- Mapeamento de materiais para filamentos cadastrados
- Cálculo automático de custos (material + energia)
- Sugestão de preço mínimo e recomendado
- Salvar produto no banco
- Listagem de produtos cadastrados

🌟 **Nice to Have:**
- Criar filamento inline durante mapeamento
- Drag & drop para upload
- Preview de thumbnail do .3mf
- Registrar primeira impressão
- Editar produtos existentes

🚀 **Future:**
- Importação em lote
- Templates
- Histórico de versões
- Integração com vendas
