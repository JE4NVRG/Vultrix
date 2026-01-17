# ⚠️ SOLUÇÃO - Erro 400 no Login

## Problema
O Supabase está bloqueando o login porque a confirmação de email está ativada.

## Solução: Desabilitar Confirmação de Email (Desenvolvimento)

### Passo 1: Acessar Configurações do Supabase

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto **Vultrix3D**
3. No menu lateral, clique em: **⚙️ Authentication**
4. Depois clique em: **Providers**

### Passo 2: Configurar Email Provider

1. Na lista de providers, clique em **Email**
2. Você verá as opções de configuração
3. **DESATIVE** a opção:
   ```
   ☐ Enable email confirmations
   ```
4. Clique em **Save** (Salvar)

### Passo 3: Testar

1. Volte para: http://localhost:3000/login
2. Clique em "Criar conta"
3. Preencha email e senha
4. O login deve funcionar imediatamente!

---

## Alternativa: Confirmar Email Manualmente (se preferir manter a confirmação ativa)

Se você quiser manter a confirmação de email ativa:

1. Após criar a conta, vá para:
   **Authentication → Users**
2. Encontre o usuário criado
3. Clique nos 3 pontinhos (...) ao lado do usuário
4. Selecione **"Confirm email"**
5. Agora o usuário pode fazer login

---

## ✅ Configuração Recomendada para Desenvolvimento

**Durante o desenvolvimento, recomendo desabilitar:**
- ✅ Email confirmations (confirmação de email)
- ✅ Email change confirmations (confirmação de mudança de email)

**Isso permite:**
- Criar usuários rapidamente para testes
- Login imediato sem precisar verificar email
- Desenvolvimento mais ágil

**Em produção, você pode reativar essas proteções!**

---

## 🔍 Verificando se funcionou

Após desabilitar a confirmação:

1. Tente criar uma nova conta
2. Você deve ver: "Conta criada com sucesso!"
3. Deve redirecionar automaticamente para /dashboard
4. ✅ Se chegou no dashboard = FUNCIONOU!

---

## 📝 Notas Importantes

- Esta configuração é APENAS para desenvolvimento
- Em produção, reative as confirmações de email
- Você pode usar serviços como SendGrid ou Mailgun para emails reais
- O Supabase tem limite de emails gratuitos

---

## 🆘 Ainda não funcionou?

Se ainda der erro 400:

1. Verifique o console do navegador (F12)
2. Veja a mensagem de erro exata
3. Verifique se as credenciais do .env estão corretas
4. Tente limpar o cache: Delete a pasta `.next` e reinicie o servidor
