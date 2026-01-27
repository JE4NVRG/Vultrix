'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'

type AuthContextType = {
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Função para limpar sessão inválida
  const clearInvalidSession = async () => {
    console.warn('🔄 Sessão inválida detectada, limpando...')
    try {
      await supabase.auth.signOut({ scope: 'local' })
    } catch (e) {
      // Ignorar erros ao fazer logout
    }
    setUser(null)
    setLoading(false)
  }

  useEffect(() => {
    // Check active session
    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        if (error) {
          console.error('Erro ao obter sessão:', error.message)
          // Se o erro for de refresh token inválido, limpar sessão
          if (error.message?.includes('Refresh Token') || 
              error.message?.includes('refresh_token') ||
              error.message?.includes('Invalid')) {
            clearInvalidSession()
            return
          }
        }
        setUser(session?.user ?? null)
        setLoading(false)
      })
      .catch((err) => {
        console.error('Erro crítico na sessão:', err)
        clearInvalidSession()
      })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('🔐 Auth event:', event)
        
        // Se o token foi invalidado ou expirou
        if (event === 'TOKEN_REFRESHED') {
          console.log('✅ Token atualizado com sucesso')
        }
        
        if (event === 'SIGNED_OUT') {
          setUser(null)
        } else {
          setUser(session?.user ?? null)
        }
        
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
    } catch (e) {
      console.error('Erro ao fazer logout:', e)
    }
    setUser(null)
    window.location.href = '/login'
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
