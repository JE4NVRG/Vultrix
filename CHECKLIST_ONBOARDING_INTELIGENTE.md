# 🎯 Checklist de Teste - Sistema de Onboarding Inteligente

## 📋 Componentes Implementados

### ✅ Migration 018

- [x] Coluna `onboarding_dismissed` adicionada em `user_settings`
- [x] Trigger para garantir default `false`
- [x] Migration idempotente (IF NOT EXISTS)

### ✅ Hook `useOnboardingStatus`

- [x] Retorna `hasProfile` (baseado em `display_name` preenchido)
- [x] Retorna `hasPrinter` (existe pelo menos 1 impressora)
- [x] Retorna `isComplete` (ambos completos)
- [x] Retorna `isDismissed` (flag de user_settings)
- [x] Retorna `displayName` e `avatarUrl` para header
- [x] Função `dismiss()` que persiste no banco

### ✅ Dashboard - Welcome Header

- [x] Avatar do usuário (foto ou iniciais com gradiente)
- [x] Nome de boas-vindas personalizado
- [x] Fallback "Complete seu perfil" se não tiver nome
- [x] Status online (bolinha verde)
- [x] Botão rápido para completar perfil (se não tiver nome)

### ✅ Dashboard - Banner Inteligente

- [x] Só aparece se `!isComplete && !isDismissed`
- [x] Progresso visual (0/2, 1/2, 2/2)
- [x] Checklist com ícones (✓ verde ou ○ cinza)
- [x] Botões condicionais:
  - Mostra "Configurar Perfil" se `!hasProfile`
  - Mostra "Cadastrar Impressora" se `!hasPrinter`
  - Mostra "Tudo pronto!" se ambos completos
- [x] Botão X que persiste dismiss no banco
- [x] Design melhorado (gradiente amber/orange)

---

## 🧪 Cenários de Teste

### Cenário 1: Novo Usuário (Nada Configurado)

**Status:** `hasProfile: false, hasPrinter: false, isDismissed: false`

**Comportamento Esperado:**

- ✅ Header mostra "Bem-vindo de volta! 👋"
- ✅ Iniciais mostram "?" no avatar
- ✅ Botão "Completar Perfil" visível no header
- ✅ Banner visível com progresso "0/2"
- ✅ Ambos checkboxes desmarcados (○)
- ✅ Ambos botões visíveis: "Configurar Perfil" (destaque) e "Cadastrar Impressora"

**Passos:**

1. Faça logout e crie uma conta nova
2. Verifique o dashboard após login
3. Confirme que banner e header aparecem corretamente

---

### Cenário 2: Perfil Configurado, Sem Impressora

**Status:** `hasProfile: true, hasPrinter: false, isDismissed: false`

**Comportamento Esperado:**

- ✅ Header mostra "Bem-vindo de volta, [Nome]! 👋"
- ✅ Avatar mostra foto (se tiver) ou iniciais do nome
- ✅ Botão "Completar Perfil" NÃO aparece no header
- ✅ Banner visível com progresso "1/2"
- ✅ Checkbox "Perfil configurado" marcado (✓ verde)
- ✅ Checkbox "Impressora cadastrada" desmarcado (○)
- ✅ Apenas botão "Cadastrar Impressora" visível (com destaque)

**Passos:**

1. Vá em `/dashboard/perfil`
2. Preencha nome, cidade, etc. e salve
3. Volte ao dashboard e verifique

---

### Cenário 3: Impressora Cadastrada, Sem Perfil

**Status:** `hasProfile: false, hasPrinter: true, isDismissed: false`

**Comportamento Esperado:**

- ✅ Header mostra "Bem-vindo de volta! 👋" (sem nome)
- ✅ Avatar mostra "?"
- ✅ Botão "Completar Perfil" visível no header
- ✅ Banner visível com progresso "1/2"
- ✅ Checkbox "Perfil configurado" desmarcado (○)
- ✅ Checkbox "Impressora cadastrada" marcado (✓ verde)
- ✅ Apenas botão "Configurar Perfil" visível (com destaque)

**Passos:**

1. Cadastre uma impressora em `/dashboard/impressoras`
2. Não preencha o perfil
3. Verifique o dashboard

---

### Cenário 4: Tudo Completo, Banner Não Dispensado

**Status:** `hasProfile: true, hasPrinter: true, isDismissed: false`

**Comportamento Esperado:**

- ✅ Header mostra nome e avatar corretos
- ✅ Banner visível com progresso "2/2"
- ✅ Ambos checkboxes marcados (✓ verde)
- ✅ Mensagem: "Tudo pronto! Você pode dispensar este banner."
- ✅ Botões de ação não aparecem

**Passos:**

1. Configure perfil completo
2. Cadastre pelo menos 1 impressora
3. Verifique que banner ainda aparece mas com mensagem de sucesso

---

### Cenário 5: Banner Dispensado Manualmente

**Status:** `isComplete: false, isDismissed: true`

**Comportamento Esperado:**

- ✅ Header continua normal
- ✅ Banner NÃO aparece (mesmo que faltam coisas)
- ✅ Persiste após reload da página

**Passos:**

1. Com banner visível, clique no X
2. Recarregue a página (F5)
3. Verifique que banner não reaparece
4. No Supabase SQL Editor, confirme:
   ```sql
   SELECT onboarding_dismissed FROM user_settings WHERE user_id = 'seu-id';
   ```
   Deve retornar `true`

---

### Cenário 6: Tudo Completo e Dispensado

**Status:** `isComplete: true, isDismissed: true`

**Comportamento Esperado:**

- ✅ Header mostra nome e avatar
- ✅ Banner NÃO aparece
- ✅ Dashboard limpo e profissional

**Passos:**

1. Complete perfil e impressora
2. Dispense o banner clicando no X
3. Recarregue a página
4. Banner deve sumir permanentemente

---

## 🔍 Testes de Integração

### Teste 1: Avatar Upload

1. ✅ Faça upload de uma foto no perfil
2. ✅ Volte ao dashboard
3. ✅ Avatar deve mostrar a foto no header

### Teste 2: Alteração de Nome

1. ✅ Mude o nome no perfil
2. ✅ Volte ao dashboard
3. ✅ Mensagem de boas-vindas deve atualizar

### Teste 3: Exclusão de Impressora

1. ✅ Exclua todas as impressoras
2. ✅ Volte ao dashboard
3. ✅ Banner deve reaparecer (se não foi dispensado)
4. ✅ Checkbox "Impressora cadastrada" deve ficar desmarcado

### Teste 4: Limpar Perfil

1. ✅ Limpe o campo `display_name` no perfil
2. ✅ Volte ao dashboard
3. ✅ Header deve mostrar "Bem-vindo de volta!" (genérico)
4. ✅ Avatar deve mostrar "?"

---

## 🐛 Verificações de Edge Cases

### Edge Case 1: Usuário sem `user_settings`

- ✅ Hook deve criar entrada automaticamente no primeiro acesso
- ✅ Não deve quebrar a UI (loading state correto)

### Edge Case 2: Usuário com perfil parcial

- ✅ Se `display_name` vazio → considera sem perfil
- ✅ Se `logo_url` vazio mas `display_name` preenchido → considera com perfil (avatar com iniciais)

### Edge Case 3: Loading States

- ✅ Durante carregamento, não mostrar banner "piscando"
- ✅ Skeleton ou spinner no header durante loading
- ✅ Evitar flash de conteúdo incorreto (FOUC)

### Edge Case 4: Erro no Supabase

- ✅ Se hook falhar, não quebrar dashboard
- ✅ Banner não aparece em caso de erro (fallback seguro)
- ✅ Console.error registra problema

---

## 📊 Queries de Verificação (Supabase SQL Editor)

### Ver status de um usuário específico:

```sql
SELECT
  up.display_name,
  up.logo_url,
  us.onboarding_dismissed,
  COUNT(p.id) as total_impressoras
FROM user_profile up
LEFT JOIN user_settings us ON us.user_id = up.user_id
LEFT JOIN printers p ON p.user_id = up.user_id
WHERE up.user_id = 'SEU_USER_ID_AQUI'
GROUP BY up.display_name, up.logo_url, us.onboarding_dismissed;
```

### Resetar onboarding para testes:

```sql
UPDATE user_settings
SET onboarding_dismissed = false
WHERE user_id = 'SEU_USER_ID_AQUI';
```

### Limpar perfil para testes:

```sql
UPDATE user_profile
SET display_name = NULL, logo_url = NULL
WHERE user_id = 'SEU_USER_ID_AQUI';
```

---

## ✅ Checklist Final de Aprovação

Antes de mergear o PR, confirme:

- [ ] Migration 018 aplicada com sucesso no Supabase
- [ ] Hook `useOnboardingStatus` retorna todos os campos esperados
- [ ] Header renderiza corretamente em todos os cenários
- [ ] Banner só aparece quando apropriado (`!isComplete && !isDismissed`)
- [ ] Progresso (0/2, 1/2, 2/2) está correto
- [ ] Checkboxes refletem estado real
- [ ] Botões condicionais aparecem nos momentos certos
- [ ] Dismiss persiste no banco e sobrevive a reload
- [ ] Sem erros no console do navegador
- [ ] Sem erros no Supabase Logs
- [ ] Performance: carregamento não trava a página
- [ ] Mobile: layout responsivo funciona bem
- [ ] Acessibilidade: botões têm títulos/labels corretos

---

## 🚀 Próximos Passos (Futuro)

- [ ] Adicionar tutorial interativo no primeiro acesso
- [ ] Notificações quando perfil/impressora estão incompletos
- [ ] Dashboard de progresso mais detalhado (configurações avançadas)
- [ ] Gamificação: badges por completar onboarding
- [ ] Email de boas-vindas com checklist

---

**Criado em:** 17/01/2026  
**Autor:** Jean Varg (@JE4NVRG)  
**Versão:** 1.0
