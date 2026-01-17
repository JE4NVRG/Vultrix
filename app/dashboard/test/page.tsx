'use client'

import { useAuth } from '@/lib/auth/AuthProvider'

export default function TestPage() {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="text-white p-8">Carregando...</div>
  }

  return (
    <div className="text-white p-8">
      <h1 className="text-2xl font-bold mb-4">Teste de Autenticação</h1>
      {user ? (
        <div>
          <p className="text-green-500 mb-2">✅ Usuário autenticado!</p>
          <p>Email: {user.email}</p>
          <p>ID: {user.id}</p>
        </div>
      ) : (
        <p className="text-red-500">❌ Usuário não autenticado</p>
      )}
    </div>
  )
}
