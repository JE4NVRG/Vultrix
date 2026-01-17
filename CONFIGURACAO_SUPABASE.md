# 🔧 Como Configurar o Supabase

## Passo 1: Acessar o Supabase

1. Acesse: **https://supabase.com**
2. Faça login ou crie uma conta gratuita
3. Clique em **"New Project"**

## Passo 2: Criar o Projeto

Preencha os dados:
- **Name**: `vultrix3d` (ou o nome que preferir)
- **Database Password**: Crie uma senha forte (ANOTE ela!)
- **Region**: Escolha o mais próximo (ex: South America)
- Clique em **"Create new project"**

⏱️ Aguarde 1-2 minutos enquanto o projeto é criado...

## Passo 3: Pegar as Credenciais

Quando o projeto estiver pronto:

1. No menu lateral, clique em: **⚙️ Project Settings**
2. Depois clique em: **🔐 API**
3. Você verá 2 informações importantes:

### 📋 Copie estes valores:

**Project URL:**
```
https://seu-projeto-id.supabase.co
```

**anon/public key:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ey... (uma key muito longa)
```

## Passo 4: Atualizar o .env

Abra o arquivo `.env` na raiz do projeto e substitua:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ey...sua-key-aqui
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key-aqui
```

⚠️ **IMPORTANTE:** 
- Cole os valores REAIS, não deixe "your-project-url"!
- Se alterar o `.env`, sempre reinicie o servidor (Ctrl+C e depois `npm run dev`)

## Passo 5: Criar as Tabelas do Banco

1. No Supabase Dashboard, clique em: **📊 SQL Editor**
2. Clique em **"New query"**
3. Copie TODO o conteúdo do arquivo: `supabase/migrations/001_initial_schema.sql`
4. Cole no editor SQL
5. Clique em **"Run"** (▶️)

Você verá: ✅ Success. No rows returned

## Passo 6: Criar seu Primeiro Usuário

1. No menu lateral, clique em: **👤 Authentication**
2. Clique em **"Add user"** → **"Create new user"**
3. Preencha:
   - **Email**: seu@email.com
   - **Password**: Uma senha forte (ANOTE!)
4. Clique em **"Create user"**

## Passo 7: Reiniciar o Servidor

No terminal, pare o servidor (Ctrl+C) e inicie novamente:

```bash
npm run dev
```

Agora acesse: http://localhost:3000

## ✅ Testando

1. Acesse: http://localhost:3000/login
2. Faça login com o usuário que você criou
3. Você será redirecionado para: http://localhost:3000/dashboard
4. Clique em **"Filamentos"** e adicione um filamento de teste

## 🔍 Verificando se está funcionando

Se você conseguir:
- ✅ Fazer login
- ✅ Ver o dashboard
- ✅ Adicionar um filamento
- ✅ Ver o filamento na listagem

**Tudo está funcionando perfeitamente! 🎉**

---

## 📸 Onde encontrar cada coisa no Supabase:

**API Credentials:**
```
Dashboard → Project Settings (⚙️) → API (🔐)
```

**SQL Editor:**
```
Dashboard → SQL Editor (📊)
```

**Authentication:**
```
Dashboard → Authentication (👤) → Users
```

**Database Tables:**
```
Dashboard → Table Editor (📋)
```

---

## ⚠️ Problemas Comuns

### Erro: "Invalid supabaseUrl"
- ✅ Verifique se copiou a URL completa (com https://)
- ✅ Verifique se não tem espaços antes/depois
- ✅ Verifique se salvou o arquivo .env

### Erro: "Invalid API key"
- ✅ Use a chave "anon/public", NÃO a "service_role"
- ✅ Copie a chave INTEIRA (é bem longa!)
- ✅ Reinicie o servidor depois de alterar o .env

### Erro ao fazer login: "Invalid credentials"
- ✅ Verifique se criou o usuário no Supabase
- ✅ Use o email/senha corretos
- ✅ Aguarde alguns segundos após criar o usuário

---

## 🆘 Precisa de Ajuda?

Se algo não funcionar:

1. Verifique o terminal - as mensagens de erro são bem claras
2. Verifique o console do navegador (F12)
3. Confirme que o arquivo .env.local está na raiz do projeto
4. Reinicie o servidor após qualquer alteração no .env

---

**Pronto! Agora você tem o Supabase configurado e funcionando! 🚀**
