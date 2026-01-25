# 🖨️ Checklist de Teste - Sistema Inteligente de Impressoras

## 📋 Componentes Implementados

### ✅ Migration 019 - RPC set_default_printer

- [x] Função atomica que garante apenas 1 impressora padrão por usuário
- [x] Remove flag de todas antes de definir nova
- [x] Validação de permissão (usuário só altera suas próprias)
- [x] SECURITY DEFINER para execução privilegiada
- [x] Grant para authenticated users

### ✅ Página Impressoras - Nova UX

- [x] Lista em cards (grid responsivo)
- [x] Estado vazio com 3 CTAs (Modelo / Rápido / Manual)
- [x] Modal com 3 modos de cadastro
- [x] Integração com onboarding (refresh automático)
- [x] Ações: Editar, Duplicar, Ativar/Desativar, Definir padrão, Excluir

### ✅ Modo A: Escolher Modelo (Recomendado)

- [x] Campo de busca com typeahead
- [x] Mostra top 5 sugestões por padrão
- [x] Busca por marca ou modelo (min 2 chars)
- [x] Autopreenchimento: nome, marca, modelo, watts, printer_model_id
- [x] Confirmação visual com consumo sugerido
- [x] Salva em 2 cliques (selecionar + salvar)

### ✅ Modo B: Cadastro Rápido

- [x] 4 presets visuais:
  - FDM Básica (80W) - ícone CPU
  - FDM com Cama (150W) - ícone Flame
  - FDM High Temp (220W) - ícone Zap
  - Resina (60W) - ícone Droplet
- [x] Cada preset com gradiente único
- [x] Nome sugerido: "Minha {tipo}"
- [x] Permite ajustar watts antes de salvar
- [x] Salva em 2 cliques (preset + salvar)

### ✅ Modo C: Manual (Avançado)

- [x] Todos os campos: nome, marca, modelo, watts, notas
- [x] Checkboxes: padrão, ativa
- [x] Usado para edição de impressoras existentes
- [x] Validação de campos obrigatórios (nome + watts)

### ✅ Cards de Impressora

- [x] Destaque visual para impressora padrão (borda accent + estrela)
- [x] Badge de status (Ativa/Inativa)
- [x] Consumo em watts destacado
- [x] 5 ações inline:
  - Definir como padrão (só se não for)
  - Ativar/Desativar
  - Editar (ícone)
  - Duplicar (ícone)
  - Excluir (ícone)

---

## 🧪 Cenários de Teste

### Cenário 1: Primeira Impressora (Estado Vazio)

**Objetivo:** Verificar UX para novo usuário

**Passos:**

1. Acesse `/dashboard/impressoras` com conta sem impressoras
2. Verifique estado vazio:
   - Ícone grande de impressora
   - Mensagem "Nenhuma impressora cadastrada"
   - 3 botões visíveis:
     - "Escolher Modelo (Recomendado)" - destaque
     - "Cadastro Rápido"
     - "Manual"

**Esperado:**

- ✅ Layout centralizado e visual
- ✅ CTAs claros e diferenciados
- ✅ Sem mensagens de erro

---

### Cenário 2: Modo A - Escolher Modelo

**Objetivo:** Testar busca e seleção de modelo

**Passos:**

1. Clique em "Escolher Modelo"
2. Veja as 5 sugestões iniciais (sem digitar nada)
3. Digite "Bambu" no campo de busca
4. Selecione "Bambu Lab A1 Mini"
5. Verifique autopreenchimento:
   - Nome: "Bambu Lab A1 Mini"
   - Watts: (valor do modelo)
6. Marque "Definir como padrão" (deve vir marcado por padrão na primeira)
7. Clique em "Salvar Impressora"

**Esperado:**

- ✅ Busca filtra em tempo real
- ✅ Cards de modelo clicáveis
- ✅ Confirmação verde mostra modelo selecionado
- ✅ Impressora salva com printer_model_id preenchido
- ✅ Redireção para lista com nova impressora
- ✅ Banner de onboarding atualiza (se aplicável)

**SQL para verificar:**

```sql
SELECT name, brand, model, power_watts_default, printer_model_id, is_default
FROM printers WHERE user_id = 'seu-user-id';
```

---

### Cenário 3: Modo B - Cadastro Rápido (Preset FDM com Cama)

**Objetivo:** Testar presets visuais

**Passos:**

1. Clique "Nova Impressora" (no header)
2. Clique na aba "Rápido"
3. Veja os 4 cards de preset
4. Clique no card "FDM com Cama" (gradiente laranja/vermelho)
5. Verifique:
   - Nome sugerido: "Minha FDM com Cama"
   - Watts: 150
6. Ajuste nome para "Ender 3 V2"
7. Clique "Salvar Impressora"

**Esperado:**

- ✅ 4 cards com cores diferentes
- ✅ Cada card mostra ícone + nome + descrição + watts
- ✅ Autopreenchimento correto
- ✅ Permite editar antes de salvar
- ✅ Impressora salva sem printer_model_id (null)

---

### Cenário 4: Modo C - Manual (Campo Completo)

**Objetivo:** Testar formulário manual completo

**Passos:**

1. Clique "Nova Impressora"
2. Clique na aba "Manual"
3. Preencha:
   - Nome: "Creality CR-10"
   - Marca: "Creality"
   - Modelo: "CR-10"
   - Watts: 350
   - Notas: "Impressora grande, cama 300x300"
4. NÃO marque "Definir como padrão"
5. Deixe "Impressora ativa" marcado
6. Salve

**Esperado:**

- ✅ Todos os campos editáveis
- ✅ Textarea para notas funcional
- ✅ Checkboxes controlam is_default e active
- ✅ Impressora salva corretamente
- ✅ Não vira padrão (outra já é)

---

### Cenário 5: Editar Impressora Existente

**Objetivo:** Testar fluxo de edição

**Passos:**

1. Na lista, clique no ícone de "Editar" (lápis azul)
2. Modal abre no modo "Manual" (sem seletor de modo)
3. Altere nome para "{nome} - Modificada"
4. Altere watts para outro valor
5. Marque/desmarque "Impressora ativa"
6. Clique "Atualizar"

**Esperado:**

- ✅ Modal abre com dados preenchidos
- ✅ Modo "Manual" é forçado para edição
- ✅ Alterações salvas corretamente
- ✅ Lista atualiza sem reload manual

---

### Cenário 6: Definir Impressora como Padrão

**Objetivo:** Testar RPC set_default_printer

**Passos:**

1. Cadastre 2 impressoras (A e B)
2. Impressora A é padrão (estrela dourada preenchida)
3. No card da impressora B, clique "Padrão"
4. Aguarde atualização

**Esperado:**

- ✅ Impressora B ganha borda accent + estrela
- ✅ Impressora A perde borda accent + estrela
- ✅ Apenas 1 impressora tem is_default=true por vez

**SQL para validar:**

```sql
SELECT name, is_default FROM printers WHERE user_id = 'seu-user-id';
-- Deve ter exatamente 1 linha com is_default=true
```

---

### Cenário 7: Ativar/Desativar Impressora

**Objetivo:** Testar toggle de status

**Passos:**

1. Em uma impressora ativa, clique "Desativar"
2. Badge muda para vermelho "Inativa"
3. Botão muda para "Ativar"
4. Clique "Ativar"
5. Badge volta para verde "Ativa"

**Esperado:**

- ✅ Toggle funciona sem reload
- ✅ Badge atualiza cor e texto
- ✅ Botão atualiza ícone e texto
- ✅ Campo `active` no banco reflete mudança

---

### Cenário 8: Duplicar Impressora

**Objetivo:** Testar clonagem

**Passos:**

1. Clique no ícone verde de "Duplicar" (copy)
2. Nova impressora aparece com nome "{nome} (Cópia)"
3. Todos os campos copiados (watts, marca, modelo, notas)
4. is_default = false (nunca copia padrão)
5. active = true (sempre ativa)

**Esperado:**

- ✅ Nova impressora criada instantaneamente
- ✅ Lista atualiza automaticamente
- ✅ Não quebra constraint de is_default único

---

### Cenário 9: Excluir Impressora

**Objetivo:** Testar remoção

**Passos:**

1. Clique no ícone vermelho de "Excluir" (trash)
2. Confirme no alert "Tem certeza..."
3. Impressora removida da lista
4. Se era a última, estado vazio reaparece
5. Banner de onboarding atualiza (hasPrinter volta para false)

**Esperado:**

- ✅ Confirmação de exclusão aparece
- ✅ Impressora deletada do banco
- ✅ Lista atualiza
- ✅ Se última, mostra estado vazio
- ✅ Onboarding reflete mudança

---

### Cenário 10: Integração com Onboarding

**Objetivo:** Verificar banner e refresh

**Passos:**

1. Sem impressoras, vá ao `/dashboard`
2. Banner de onboarding mostra "0/2" ou "1/2"
3. Checkbox "Impressora cadastrada" desmarcado
4. Vá em `/dashboard/impressoras`
5. Cadastre qualquer impressora
6. Volte para `/dashboard`
7. Verifique banner atualizado

**Esperado:**

- ✅ Banner reflete estado atual
- ✅ Checkbox muda para ✓ verde "Impressora cadastrada"
- ✅ Progresso avança (1/2 ou 2/2)
- ✅ Se ambos completos, banner mostra "Tudo pronto!"

---

## 🐛 Edge Cases

### Edge Case 1: Busca sem Resultados

1. No modo "Escolher Modelo", digite "zzzzzz"
2. **Esperado:** Mensagem "Nenhum modelo encontrado"

### Edge Case 2: Salvar sem Nome

1. Qualquer modo, deixe nome vazio
2. Clique "Salvar"
3. **Esperado:** Alert "Preencha o nome e o consumo (watts) corretamente"

### Edge Case 3: Salvar com Watts Zero/Negativo

1. Coloque watts = 0 ou negativo
2. **Esperado:** Alert de validação impede salvar

### Edge Case 4: Primeira Impressora (Auto-Padrão)

1. Cadastre primeira impressora
2. **Esperado:** is_default = true automaticamente (checkbox já vem marcado)

### Edge Case 5: Excluir Impressora Padrão

1. Exclua a impressora que é padrão
2. **Esperado:** Nenhuma impressora fica como padrão (ok)
3. Ao criar próxima, usuário decide se quer como padrão

### Edge Case 6: Erro no RPC

1. Simule erro (desconecte internet)
2. Tente definir como padrão
3. **Esperado:** Alert "Erro ao definir impressora padrão" + console.error

---

## 📊 Queries de Verificação (Supabase SQL Editor)

### Ver impressoras de um usuário:

```sql
SELECT
  name,
  brand,
  model,
  power_watts_default,
  is_default,
  active,
  printer_model_id,
  created_at
FROM printers
WHERE user_id = 'SEU_USER_ID_AQUI'
ORDER BY is_default DESC, created_at ASC;
```

### Verificar constraint de impressora padrão:

```sql
SELECT user_id, COUNT(*) as total_default
FROM printers
WHERE is_default = true
GROUP BY user_id
HAVING COUNT(*) > 1;
-- Deve retornar 0 linhas (nenhum usuário com mais de 1 padrão)
```

### Ver modelos disponíveis:

```sql
SELECT id, brand, model, avg_watts
FROM printer_models
ORDER BY brand, model
LIMIT 20;
```

### Testar RPC manualmente:

```sql
-- Listar impressoras antes
SELECT name, is_default FROM printers WHERE user_id = auth.uid();

-- Definir uma como padrão
SELECT set_default_printer('PRINTER_ID_AQUI');

-- Listar impressoras depois
SELECT name, is_default FROM printers WHERE user_id = auth.uid();
-- Apenas a selecionada deve ter is_default=true
```

---

## 🚀 Métricas de Sucesso

### Tempo de Cadastro (Meta: < 10 segundos)

- **Modo A (Modelo):**
  - Abrir modal: 1s
  - Buscar modelo: 2s
  - Selecionar: 1s
  - Confirmar nome: 2s
  - Salvar: 1s
  - **Total: ~7s** ✅

- **Modo B (Rápido):**
  - Abrir modal: 1s
  - Selecionar preset: 1s
  - Ajustar nome: 2s
  - Salvar: 1s
  - **Total: ~5s** ✅

- **Modo C (Manual):**
  - Abrir modal: 1s
  - Preencher 4 campos: 8s
  - Salvar: 1s
  - **Total: ~10s** ✅

### Facilidade de Uso

- [ ] Estado vazio claro (3 opções distintas)
- [ ] Modo recomendado destacado visualmente
- [ ] Autopreenchimento funciona 100%
- [ ] Feedback visual em todas as ações
- [ ] Zero erros 500 no console

### Performance

- [ ] Lista carrega em < 500ms
- [ ] Busca de modelos responde em < 200ms
- [ ] Save completa em < 1s
- [ ] Sem travamentos na UI

---

## ✅ Checklist Final de Aprovação

Antes de mergear o PR:

- [ ] Migration 019 aplicada e RPC funcionando
- [ ] Estado vazio renderiza corretamente
- [ ] Modo A (Modelo) funciona com busca + autopreenchimento
- [ ] Modo B (Rápido) mostra 4 presets e permite salvar
- [ ] Modo C (Manual) aceita todos os campos
- [ ] Edição abre modal com dados preenchidos
- [ ] Definir como padrão usa RPC e garante unicidade
- [ ] Ativar/Desativar funciona
- [ ] Duplicar cria cópia correta
- [ ] Excluir remove e atualiza onboarding
- [ ] Cards mostram status correto (padrão, ativa)
- [ ] Integração com onboarding (refresh automático)
- [ ] Sem erros no console do navegador
- [ ] Sem erros no Supabase Logs
- [ ] Mobile: layout responsivo funciona
- [ ] Performance: sem lags perceptíveis

---

## 🔮 Melhorias Futuras

- [ ] Histórico de impressões por impressora
- [ ] Gráfico de consumo energético por impressora
- [ ] Importar modelos de API externa (Printables, Thingiverse)
- [ ] Template de impressoras (ex: "Copiar config da Ender 3")
- [ ] Notificação quando impressora ficar inativa por muito tempo
- [ ] Sugerir manutenção baseada em horas de uso

---

**Criado em:** 17/01/2026  
**Autor:** Jean Varg (@JE4NVRG)  
**Versão:** 1.0
