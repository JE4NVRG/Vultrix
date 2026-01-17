import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Validação básica para desenvolvimento
if (!supabaseUrl || !supabaseUrl.startsWith('http')) {
  console.error('⚠️  ERRO: Configure NEXT_PUBLIC_SUPABASE_URL no arquivo .env')
  console.error('📋 Acesse: https://supabase.com/dashboard/project/_/settings/api')
}

if (!supabaseAnonKey || supabaseAnonKey.length < 20) {
  console.error('⚠️  ERRO: Configure NEXT_PUBLIC_SUPABASE_ANON_KEY no arquivo .env')
  console.error('📋 Acesse: https://supabase.com/dashboard/project/_/settings/api')
}

// Criar cliente sem tipagem genérica para evitar problemas de inferência
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    db: {
      schema: 'public',
    },
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
)


