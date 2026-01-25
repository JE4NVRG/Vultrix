# 📋 FASE 1 - Perfil do Usuário + Impressoras

Sistema implementado para onboarding maker com cadastro inteligente de impressoras.

## 🗄️ Migrations

Execute as migrations na ordem:

```bash
# No Supabase SQL Editor:
1. 014_user_profile.sql      # Perfil do usuário + trigger auto-criação
2. 015_printers.sql          # Tabela de impressoras
3. 016_printer_models.sql    # Catálogo de modelos
4. 016_seed_printer_models.sql  # 20 modelos pré-cadastrados
```

## 📊 Estrutura de Dados

### `user_profile`

- Identidade: display_name, handle, whatsapp, city, logo_url
- Defaults operacionais: default_kwh_cost, default_profit_margin_percent
- Toggles padrão: include_packaging, include_label, include_shipping
- Auto-criado via trigger após signup

### `printers`

- Dados: name, brand, model, notes
- Energia: power_watts_default, kwh_cost_override
- Custo: machine_hour_cost_override
- Flags: is_default (único por usuário), active
- Opcional: printer_model_id (FK para catálogo)

### `printer_models` (catálogo público)

- 20 modelos pré-cadastrados (Bambu Lab, Creality, Prusa, etc)
- Campos: brand, model, category, avg_watts, peak_watts, notes
- RLS: leitura pública para authenticated, modificação apenas service_role

## 🎨 Componentes Criados

### `ModelSelector`

- Busca typeahead em modelos do catálogo
- Autopreenche marca, modelo, watts, notas
- Dropdown com resultados filtrados

### `WattsEstimator`

- Modal com 4 estimativas rápidas:
  - FDM básica sem cama: 80W
  - FDM com cama aquecida: 150W
  - FDM high temp (ABS/ASA): 220W
  - Resina: 60W
- Aviso: "Recomendado medir com tomada medidora"

### Hook `usePrinterModels`

- Carrega catálogo do Supabase
- Função `searchModels(query)` para filtrar
- Fallback silencioso se tabela não existir

### Hook `useOnboardingStatus`

- Retorna: `{hasProfile, hasPrinter, profileCompleted}`
- Usado no banner do dashboard

## 🚀 Telas Implementadas

### `/dashboard/perfil`

- Bloco Identidade: nome, whatsapp, instagram, cidade, logo
- Bloco Defaults: kWh (tooltip), margem %, toggles embalagem/etiqueta/envio
- Ações: Salvar (marca profile_completed), Restaurar Padrões
- Toast de confirmação

### `/dashboard/impressoras`

- Lista em cards com badges (Padrão/Inativa)
- Form inline com:
  1. **Model Selector** (busca no catálogo)
  2. Campos manuais (name*, brand, model, watts*, overrides)
  3. **Watts Estimator** (botão "Não sei os watts")
  4. Notas, checkboxes (padrão/ativa)
- Ações: criar, editar, definir padrão, ativar/desativar, excluir
- Estado vazio com ícone e mensagem

### Dashboard com Banner

- Exibe quando não há impressora cadastrada
- CTAs: "Cadastrar Impressora" + "Configurar Perfil"
- Pode ser fechado (state local)

## 📝 Fluxo de Uso

### Novo Usuário

1. Faz login → trigger cria `user_profile` com defaults
2. Dashboard exibe banner de onboarding
3. Clica "Cadastrar Impressora"
4. Busca modelo no catálogo (ex: "Bambu A1")
5. Seleciona → autopreenche marca, modelo, 120W
6. Preenche nome personalizado: "A1 Mini - Sala"
7. Salva → banner desaparece

### Usuário sem dados de consumo

1. Abre "Nova Impressora"
2. Clica "Não sei os watts"
3. Seleciona "FDM com cama aquecida" → 150W preenchido
4. Vê aviso de estimativa
5. Salva (pode medir depois e editar)

### Cadastro Manual

- Se modelo não estiver no catálogo
- Preenche manualmente todos campos
- Funciona normalmente sem printer_model_id

## 🔒 Segurança

- RLS ativo em todas tabelas
- `user_profile`: user_id = auth.uid()
- `printers`: user_id = auth.uid()
- `printer_models`: SELECT público, modificação apenas service_role
- Validações: watts >0, margem 0-100, campos required

## 🧪 Checklist de Testes

- [ ] Trigger cria profile após signup
- [ ] Banner aparece quando sem impressora
- [ ] Busca de modelo funciona (typeahead)
- [ ] Seleção de modelo preenche campos
- [ ] "Não sei os watts" preenche estimativa
- [ ] Cadastro manual sem modelo funciona
- [ ] Apenas uma impressora fica como padrão
- [ ] Edição mantém printer_model_id
- [ ] Estado vazio exibe corretamente
- [ ] Banner some após cadastrar impressora
- [ ] Perfil salva e marca completed

## 🔄 Integração Futura (Fase 2)

- Calculadora de custos usa printer padrão
- Vendas usam custo real da impressora
- Dashboard mostra stats por impressora
- Relatórios filtram por impressora
- Template de produtos sugere impressora

## 📦 Fallbacks

- Se `printer_models` não existir: cadastro manual funciona
- Se erro ao carregar modelos: form segue normal
- Se usuário editar watts após sugestão: mantém override
- Se perfil não existir: usa defaults do schema

## 🎯 Próximos Passos

1. Rodar migrations no Supabase
2. Testar fluxo completo
3. Popular mais modelos se necessário
4. Integrar com módulo de vendas (Fase 2)
5. Adicionar upload de logo (storage)
