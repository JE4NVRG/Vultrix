'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth/AuthProvider'

type FilamentoInfo = {
  id: string;
  nome: string;
  marca: string;
  custo_por_kg: number;
  peso_inicial: number;
  data_compra: string;
  cost_per_kg_with_shipping?: number;
  shipping_share_value?: number;
};

type DespesaInfo = {
  id: string;
  descricao: string;
  valor: number;
  data: string;
  categoria: string;
};

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
  const [filamentos, setFilamentos] = useState<FilamentoInfo[]>([])
  const [despesas, setDespesas] = useState<DespesaInfo[]>([])
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    if (user) {
      rodarDiagnostico()
    }
  }, [user])

  const rodarDiagnostico = async () => {
    if (!user) return;
    
    const erros: string[] = []
    
    // 1. Verificar variáveis de ambiente
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'NÃO DEFINIDA'
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'NÃO DEFINIDA'
    
    console.log('🔍 DIAGNÓSTICO INICIADO')
    console.log('📍 URL Supabase:', supabaseUrl)
    console.log('🔑 Key presente:', supabaseKey.substring(0, 20) + '...')
    console.log('👤 Usuário:', user.email)
    
    let conexaoOk = false
    let tabelasExistem = false

    // 2. Buscar filamentos do usuário
    try {
      const { data: filamentosData, error } = await supabase
        .from('filaments')
        .select('id, nome, marca, custo_por_kg, peso_inicial, data_compra, cost_per_kg_with_shipping, shipping_share_value')
        .eq('user_id', user.id)
        .order('data_compra', { ascending: false })

      if (error) {
        console.error('❌ Erro ao buscar filamentos:', error)
        erros.push(`Filamentos: ${error.message}`)
      } else {
        console.log(`✅ Filamentos encontrados: ${filamentosData?.length || 0}`)
        setFilamentos(filamentosData || [])
        conexaoOk = true
        tabelasExistem = true
      }
    } catch (err: any) {
      console.error('❌ Erro:', err)
      erros.push(`Erro: ${err.message}`)
    }

    // 3. Buscar despesas do usuário (categoria material)
    try {
      const { data: despesasData, error } = await supabase
        .from('expenses')
        .select('id, descricao, valor, data, categoria')
        .eq('user_id', user.id)
        .order('data', { ascending: false })

      if (error) {
        console.error('❌ Erro ao buscar despesas:', error)
        erros.push(`Despesas: ${error.message}`)
      } else {
        console.log(`✅ Despesas encontradas: ${despesasData?.length || 0}`)
        setDespesas(despesasData || [])
      }
    } catch (err: any) {
      console.error('❌ Erro:', err)
    }

    setDiagnostico({
      supabaseUrl,
      supabaseKey: supabaseKey.substring(0, 30) + '...',
      conexaoOk,
      tabelasExistem,
      usuarioAutenticado: !!user,
      erros
    })

    console.log('🏁 DIAGNÓSTICO FINALIZADO')
  }

  // Sincronizar filamentos com despesas
  const syncFilamentosParaDespesas = async () => {
    if (!user || filamentos.length === 0) {
      alert('Nenhum filamento para sincronizar')
      return
    }

    const confirmSync = confirm(
      `Criar despesas para ${filamentos.length} filamento(s)?\n\n` +
      `⚠️ Verifique se as despesas já não existem para evitar duplicatas.`
    )

    if (!confirmSync) return

    setSyncing(true)
    let created = 0

    for (const filamento of filamentos) {
      const pesoKg = (filamento.peso_inicial || 1000) / 1000
      const custoPorKg = filamento.cost_per_kg_with_shipping || filamento.custo_por_kg || 0
      const valorTotal = pesoKg * custoPorKg + (filamento.shipping_share_value || 0)

      if (valorTotal <= 0) continue

      const descricao = `Compra de filamento: ${filamento.nome} (${filamento.marca || 'Sem marca'}) - ${pesoKg.toFixed(2)}kg x R$${custoPorKg.toFixed(2)}/kg`

      try {
        const { error } = await supabase.from('expenses').insert({
          user_id: user.id,
          categoria: 'material',
          descricao: descricao,
          valor: valorTotal,
          data: filamento.data_compra,
          recorrente: false,
        })

        if (!error) created++
      } catch (err) {
        console.error('Erro ao criar despesa:', err)
      }
    }

    alert(`✅ ${created} despesa(s) criada(s)!`)
    setSyncing(false)
    rodarDiagnostico()
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
            <span>Usuário autenticado: {user?.email}</span>
          </div>
        </div>
      </div>

      {/* Filamentos Cadastrados */}
      <div className="bg-vultrix-dark border border-vultrix-gray rounded-xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">🧵 Filamentos Cadastrados ({filamentos.length})</h2>
          {filamentos.length > 0 && (
            <button
              onClick={syncFilamentosParaDespesas}
              disabled={syncing}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {syncing ? '⏳ Sincronizando...' : '💵 Sincronizar para Despesas'}
            </button>
          )}
        </div>
        {filamentos.length === 0 ? (
          <p className="text-vultrix-light/50">Nenhum filamento cadastrado</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-vultrix-light/50 border-b border-vultrix-gray">
                  <th className="pb-2">Nome</th>
                  <th className="pb-2">Marca</th>
                  <th className="pb-2">Custo/kg</th>
                  <th className="pb-2">Peso Inicial</th>
                  <th className="pb-2">Data Compra</th>
                  <th className="pb-2">Valor Total</th>
                </tr>
              </thead>
              <tbody>
                {filamentos.map((f) => {
                  const pesoKg = (f.peso_inicial || 1000) / 1000;
                  const custoPorKg = f.cost_per_kg_with_shipping || f.custo_por_kg || 0;
                  const valorTotal = pesoKg * custoPorKg + (f.shipping_share_value || 0);
                  return (
                    <tr key={f.id} className="border-b border-vultrix-gray/30">
                      <td className="py-2">{f.nome}</td>
                      <td className="py-2">{f.marca || 'Sem marca'}</td>
                      <td className="py-2">R$ {custoPorKg.toFixed(2)}</td>
                      <td className="py-2">{f.peso_inicial || 1000}g</td>
                      <td className="py-2">{new Date(f.data_compra).toLocaleDateString('pt-BR')}</td>
                      <td className="py-2 text-green-400 font-semibold">R$ {valorTotal.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="font-bold text-green-400">
                  <td colSpan={5} className="pt-4 text-right">Total em Filamentos:</td>
                  <td className="pt-4">
                    R$ {filamentos.reduce((sum, f) => {
                      const pesoKg = (f.peso_inicial || 1000) / 1000;
                      const custoPorKg = f.cost_per_kg_with_shipping || f.custo_por_kg || 0;
                      return sum + (pesoKg * custoPorKg) + (f.shipping_share_value || 0);
                    }, 0).toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Despesas (Material) */}
      <div className="bg-vultrix-dark border border-vultrix-gray rounded-xl p-6">
        <h2 className="text-xl font-bold mb-4">💸 Despesas Registradas ({despesas.length})</h2>
        {despesas.length === 0 ? (
          <p className="text-vultrix-light/50">Nenhuma despesa registrada</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-vultrix-light/50 border-b border-vultrix-gray">
                  <th className="pb-2">Descrição</th>
                  <th className="pb-2">Categoria</th>
                  <th className="pb-2">Data</th>
                  <th className="pb-2">Valor</th>
                </tr>
              </thead>
              <tbody>
                {despesas.slice(0, 10).map((d) => (
                  <tr key={d.id} className="border-b border-vultrix-gray/30">
                    <td className="py-2 max-w-md truncate">{d.descricao}</td>
                    <td className="py-2">
                      <span className={`px-2 py-1 rounded text-xs ${d.categoria === 'material' ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-500/20 text-gray-400'}`}>
                        {d.categoria}
                      </span>
                    </td>
                    <td className="py-2">{new Date(d.data).toLocaleDateString('pt-BR')}</td>
                    <td className="py-2 text-red-400 font-semibold">R$ {d.valor.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="font-bold text-red-400">
                  <td colSpan={3} className="pt-4 text-right">Total em Despesas:</td>
                  <td className="pt-4">
                    R$ {despesas.reduce((sum, d) => sum + d.valor, 0).toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
            {despesas.length > 10 && (
              <p className="text-vultrix-light/50 text-sm mt-2">Mostrando 10 de {despesas.length} despesas</p>
            )}
          </div>
        )}
      </div>

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

      {/* Botões de Ação */}
      <div className="flex gap-4">
        <button
          onClick={rodarDiagnostico}
          className="px-6 py-3 bg-vultrix-accent text-white rounded-lg font-semibold hover:bg-vultrix-accent/90 transition-colors"
        >
          🔄 Atualizar Diagnóstico
        </button>
        <button
          onClick={() => window.location.href = '/dashboard'}
          className="px-6 py-3 bg-vultrix-gray text-white rounded-lg font-semibold hover:bg-vultrix-light/10 transition-colors"
        >
          ← Voltar ao Dashboard
        </button>
      </div>
    </div>
  )
}
