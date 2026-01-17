'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth/AuthProvider'
import { Plus, Edit, Trash2, ShoppingCart, TrendingUp } from 'lucide-react'
import { format } from 'date-fns'

type Expense = {
  id: string
  categoria: string
  descricao: string
  valor: number
  data: string
  recorrente: boolean
}

const categorias = [
  'Filamento',
  'Ferramenta',
  'Mesa/Superfície',
  'Manutenção',
  'Energia',
  'Outros'
]

export default function ComprasPage() {
  const { user } = useAuth()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    categoria: 'Filamento',
    descricao: '',
    valor: '',
    data: format(new Date(), 'yyyy-MM-dd'),
    recorrente: false
  })

  useEffect(() => {
    loadExpenses()
  }, [user])

  const loadExpenses = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .order('data', { ascending: false })

      if (error) throw error
      setExpenses(data || [])
    } catch (error) {
      console.error('Erro ao carregar despesas:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      const data = {
        ...formData,
        valor: parseFloat(formData.valor),
        user_id: user.id
      }

      if (editingId) {
        const { error } = await supabase
          .from('expenses')
          .update(data)
          .eq('id', editingId)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('expenses')
          .insert(data)

        if (error) throw error
      }

      resetForm()
      loadExpenses()
    } catch (error) {
      console.error('Erro ao salvar despesa:', error)
      alert('Erro ao salvar despesa')
    }
  }

  const handleEdit = (expense: Expense) => {
    setEditingId(expense.id)
    setFormData({
      categoria: expense.categoria,
      descricao: expense.descricao,
      valor: expense.valor.toString(),
      data: expense.data,
      recorrente: expense.recorrente
    })
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta despesa?')) return

    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id)

      if (error) throw error
      loadExpenses()
    } catch (error) {
      console.error('Erro ao excluir despesa:', error)
      alert('Erro ao excluir despesa')
    }
  }

  const resetForm = () => {
    setFormData({
      categoria: 'Filamento',
      descricao: '',
      valor: '',
      data: format(new Date(), 'yyyy-MM-dd'),
      recorrente: false
    })
    setEditingId(null)
    setShowModal(false)
  }

  const totalGasto = expenses.reduce((acc, exp) => acc + exp.valor, 0)
  const gastoMensal = expenses.filter(exp => {
    const expDate = new Date(exp.data)
    const now = new Date()
    return expDate.getMonth() === now.getMonth() && expDate.getFullYear() === now.getFullYear()
  }).reduce((acc, exp) => acc + exp.valor, 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-vultrix-light/50">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Compras & Despesas
          </h1>
          <p className="text-vultrix-light/70">
            Controle seus gastos e investimentos
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-vultrix-accent text-white rounded-lg hover:bg-vultrix-accent/90 transition-colors"
        >
          <Plus size={20} />
          Adicionar Despesa
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-vultrix-dark border border-vultrix-gray rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <ShoppingCart className="text-vultrix-accent" size={24} />
            <h3 className="text-vultrix-light/70">Total Gasto</h3>
          </div>
          <p className="text-3xl font-bold text-white">
            R$ {totalGasto.toFixed(2)}
          </p>
        </div>

        <div className="bg-vultrix-dark border border-vultrix-gray rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="text-green-500" size={24} />
            <h3 className="text-vultrix-light/70">Este Mês</h3>
          </div>
          <p className="text-3xl font-bold text-white">
            R$ {gastoMensal.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Tabela de Despesas */}
      <div className="bg-vultrix-dark border border-vultrix-gray rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-vultrix-gray">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-vultrix-light/70 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-vultrix-light/70 uppercase tracking-wider">
                  Categoria
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-vultrix-light/70 uppercase tracking-wider">
                  Descrição
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-vultrix-light/70 uppercase tracking-wider">
                  Valor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-vultrix-light/70 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-vultrix-light/70 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-vultrix-gray">
              {expenses.map((expense) => (
                <tr key={expense.id} className="hover:bg-vultrix-gray/30 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                    {format(new Date(expense.data), 'dd/MM/yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-3 py-1 bg-vultrix-accent/10 text-vultrix-accent text-xs rounded-full">
                      {expense.categoria}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-vultrix-light/70">
                    {expense.descricao}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-white">
                    R$ {expense.valor.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {expense.recorrente ? (
                      <span className="text-yellow-500">Recorrente</span>
                    ) : (
                      <span className="text-vultrix-light/50">Única</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <button
                      onClick={() => handleEdit(expense)}
                      className="text-vultrix-light/70 hover:text-white mr-3"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(expense.id)}
                      className="text-red-500 hover:text-red-400"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {expenses.length === 0 && (
            <div className="text-center py-12">
              <ShoppingCart className="mx-auto text-vultrix-light/30 mb-4" size={48} />
              <p className="text-vultrix-light/50">Nenhuma despesa registrada</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-vultrix-dark border border-vultrix-gray rounded-xl p-8 max-w-md w-full"
          >
            <h2 className="text-2xl font-bold text-white mb-6">
              {editingId ? 'Editar Despesa' : 'Nova Despesa'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-vultrix-light mb-2">
                  Categoria
                </label>
                <select
                  value={formData.categoria}
                  onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                  className="w-full px-4 py-2 bg-vultrix-black border border-vultrix-gray rounded-lg text-white focus:outline-none focus:border-vultrix-accent"
                >
                  {categorias.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-vultrix-light mb-2">
                  Descrição
                </label>
                <input
                  type="text"
                  required
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  className="w-full px-4 py-2 bg-vultrix-black border border-vultrix-gray rounded-lg text-white focus:outline-none focus:border-vultrix-accent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-vultrix-light mb-2">
                  Valor (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.valor}
                  onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                  className="w-full px-4 py-2 bg-vultrix-black border border-vultrix-gray rounded-lg text-white focus:outline-none focus:border-vultrix-accent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-vultrix-light mb-2">
                  Data
                </label>
                <input
                  type="date"
                  required
                  value={formData.data}
                  onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                  className="w-full px-4 py-2 bg-vultrix-black border border-vultrix-gray rounded-lg text-white focus:outline-none focus:border-vultrix-accent"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="recorrente"
                  checked={formData.recorrente}
                  onChange={(e) => setFormData({ ...formData, recorrente: e.target.checked })}
                  className="w-4 h-4 rounded border-vultrix-gray bg-vultrix-black text-vultrix-accent focus:ring-vultrix-accent"
                />
                <label htmlFor="recorrente" className="text-sm text-vultrix-light">
                  Despesa recorrente (mensal)
                </label>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-4 py-2 bg-vultrix-gray text-white rounded-lg hover:bg-vultrix-gray/80 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-vultrix-accent text-white rounded-lg hover:bg-vultrix-accent/90 transition-colors"
                >
                  {editingId ? 'Salvar' : 'Adicionar'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}
