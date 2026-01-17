'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth/AuthProvider'

export default function DiagnosticoPage() {
  const { user, loading: authLoading } = useAuth()
  const [diagnostico, setDiagnostico] = useState({
    supabaseUrl: '',
    supabaseKey: '',
    conexaoOk: false,
    tabelasExistem: false,
    usuarioAutenticado: false,
    erros: [] as string[]
  })

  useEffect(() => {
    rodarDiagnostico()
  }, [user])

  const rodarDiagnostico = async () => {
    const erros: string[] = []
    
    // 1. Verificar variáveis de ambiente
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'NÃO DEFINIDA'
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'NÃO DEFINIDA'
    
    console.log('🔍 DIAGNÓSTICO INICIADO')
    console.log('📍 URL Supabase:', supabaseUrl)
    console.log('🔑 Key presente:', supabaseKey.substring(0, 20) + '...')
    
    let conexaoOk = false
    let tabelasExistem = false

    // 2. Testar conexão com Supabase
    try {
      const { data, error } = await supabase.from('filaments').select('count').limit(1)
      
      if (error) {
        console.error('❌ Erro ao conectar tabela filaments:', error)
        erros.push(`Erro tabela filaments: ${error.message}`)
      } else {
        console.log('✅ Conexão com tabela filaments OK')
        conexaoOk = true
        tabelasExistem = true
      }
    } catch (err: any) {
      console.error('❌ Erro de conexão:', err)
      erros.push(`Erro de conexão: ${err.message}`)
    }

    // 3. Verificar outras tabelas
    try {
      const tabelas = ['products', 'sales', 'expenses']
      
      for (const tabela of tabelas) {
        const { error } = await supabase.from(tabela).select('count').limit(1)
        if (error) {
          console.error(`❌ Erro tabela ${tabela}:`, error)
          erros.push(`Tabela ${tabela}: ${error.message}`)
        } else {
          console.log(`✅ Tabela ${tabela} OK`)
        }
      }
    } catch (err: any) {
      console.error('❌ Erro ao verificar tabelas:', err)
      erros.push(`Erro tabelas: ${err.message}`)
    }

    // 4. Verificar autenticação
    const usuarioAutenticado = !!user
    if (user) {
      console.log('✅ Usuário autenticado:', user.email)
      console.log('📧 Email:', user.email)
      console.log('🆔 ID:', user.id)
    } else {
      console.log('❌ Usuário NÃO autenticado')
      erros.push('Usuário não autenticado')
    }

    // 5. Testar leitura de dados do usuário
    if (user) {
      try {
        const { data: filamentos, error } = await supabase
          .from('filaments')
          .select('*')
          .eq('user_id', user.id)
        
        if (error) {
          console.error('❌ Erro ao buscar filamentos do usuário:', error)
          erros.push(`Erro RLS filaments: ${error.message}`)
        } else {
          console.log(`✅ Filamentos do usuário: ${filamentos?.length || 0}`)
        }
      } catch (err: any) {
        console.error('❌ Erro ao testar RLS:', err)
        erros.push(`Erro RLS: ${err.message}`)
      }
    }

    setDiagnostico({
      supabaseUrl,
      supabaseKey: supabaseKey.substring(0, 30) + '...',
      conexaoOk,
      tabelasExistem,
      usuarioAutenticado,
      erros
    })

    console.log('🏁 DIAGNÓSTICO FINALIZADO')
  }

  if (authLoading) {
    return (
      <div className="p-8 text-white">
        <h1 className="text-2xl font-bold mb-4">🔍 Diagnóstico do Sistema</h1>
        <p>Verificando autenticação...</p>
      </div>
    )
  }

  return (
    <div className="p-8 text-white space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">🔍 Diagnóstico Completo</h1>
        <p className="text-vultrix-light/70">Verificação de todas as configurações</p>
      </div>

      {/* Status Geral */}
      <div className="bg-vultrix-dark border border-vultrix-gray rounded-xl p-6">
        <h2 className="text-xl font-bold mb-4">📊 Status Geral</h2>
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className={diagnostico.conexaoOk ? 'text-green-500' : 'text-red-500'}>
              {diagnostico.conexaoOk ? '✅' : '❌'}
            </span>
            <span>Conexão com Supabase</span>
          </div>
          <div className="flex items-center gap-3">
            <span className={diagnostico.tabelasExistem ? 'text-green-500' : 'text-red-500'}>
              {diagnostico.tabelasExistem ? '✅' : '❌'}
            </span>
            <span>Tabelas criadas</span>
          </div>
          <div className="flex items-center gap-3">
            <span className={diagnostico.usuarioAutenticado ? 'text-green-500' : 'text-red-500'}>
              {diagnostico.usuarioAutenticado ? '✅' : '❌'}
            </span>
            <span>Usuário autenticado</span>
          </div>
        </div>
      </div>

      {/* Configuração */}
      <div className="bg-vultrix-dark border border-vultrix-gray rounded-xl p-6">
        <h2 className="text-xl font-bold mb-4">⚙️ Configuração</h2>
        <div className="space-y-2 font-mono text-sm">
          <div>
            <span className="text-vultrix-light/50">URL:</span>
            <p className="text-vultrix-accent break-all">{diagnostico.supabaseUrl}</p>
          </div>
          <div>
            <span className="text-vultrix-light/50">Key:</span>
            <p className="text-vultrix-light/70 break-all">{diagnostico.supabaseKey}</p>
          </div>
        </div>
      </div>

      {/* Usuário */}
      {user && (
        <div className="bg-vultrix-dark border border-vultrix-gray rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4">👤 Usuário Atual</h2>
          <div className="space-y-2 font-mono text-sm">
            <div>
              <span className="text-vultrix-light/50">Email:</span>
              <p className="text-green-500">{user.email}</p>
            </div>
            <div>
              <span className="text-vultrix-light/50">ID:</span>
              <p className="text-vultrix-light/70 break-all">{user.id}</p>
            </div>
            <div>
              <span className="text-vultrix-light/50">Criado em:</span>
              <p className="text-vultrix-light/70">{new Date(user.created_at!).toLocaleString('pt-BR')}</p>
            </div>
          </div>
        </div>
      )}

      {/* Erros */}
      {diagnostico.erros.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4 text-red-500">⚠️ Erros Encontrados</h2>
          <ul className="space-y-2">
            {diagnostico.erros.map((erro, index) => (
              <li key={index} className="text-red-400 font-mono text-sm">
                • {erro}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Sucesso */}
      {diagnostico.erros.length === 0 && diagnostico.conexaoOk && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4 text-green-500">✅ Tudo OK!</h2>
          <p className="text-green-400">
            Sistema configurado corretamente. Todas as verificações passaram.
          </p>
        </div>
      )}

      {/* Botões de Ação */}
      <div className="flex gap-4">
        <button
          onClick={rodarDiagnostico}
          className="px-6 py-3 bg-vultrix-accent text-white rounded-lg font-semibold hover:bg-vultrix-accent/90 transition-colors"
        >
          🔄 Rodar Novamente
        </button>
        <button
          onClick={() => window.location.href = '/dashboard'}
          className="px-6 py-3 bg-vultrix-gray text-white rounded-lg font-semibold hover:bg-vultrix-light/10 transition-colors"
        >
          ← Voltar ao Dashboard
        </button>
      </div>

      {/* Console Info */}
      <div className="bg-vultrix-dark border border-vultrix-gray rounded-xl p-6">
        <h2 className="text-xl font-bold mb-4">💡 Dica</h2>
        <p className="text-vultrix-light/70">
          Abra o Console do navegador (F12) para ver logs detalhados de cada verificação.
        </p>
      </div>
    </div>
  )
}
