'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth/AuthProvider'
import { 
  Plus, 
  X, 
  ShoppingCart, 
  TrendingUp, 
  DollarSign,
  Calendar,
  User,
  Package,
  Trash2,
  Edit,
  CreditCard
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

type Product = {
  id: string
  nome: string
  custo_total: number
  preco_venda: number
}

type Sale = {
  id: string
  created_at: string
  produto_id: string
  quantity: number
  sale_price: number
  cost_price: number
  profit: number
  payment_method: string
  data: string
  cliente: string | null
  products?: {
    nome: string
  }
}

export default function VendasPage() {
  const { user } = useAuth()
  const [sales, setSales] = useState<Sale[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingSale, setEditingSale] = useState<Sale | null>(null)
  
  // Stats
  const [totalVendas, setTotalVendas] = useState(0)
  const [lucroTotal, setLucroTotal] = useState(0)
  const [vendasHoje, setVendasHoje] = useState(0)
  
  // Form
  const [formData, setFormData] = useState({
    produto_id: '',
    quantity: 1,
    sale_price: 0,
    payment_method: 'dinheiro',
    data: format(new Date(), 'yyyy-MM-dd'),
    cliente: ''
  })

  useEffect(() => {
    if (user) {
      loadData()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Carregar produtos
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id, nome, custo_total, preco_venda')
        .eq('user_id', user!.id)
        .order('nome')

      if (productsError) throw productsError
      setProducts(productsData || [])

      // Carregar vendas
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select(`
          *,
          products (nome)
        `)
        .eq('user_id', user!.id)
        .order('data', { ascending: false })

      if (salesError) throw salesError
      
      // Cast explícito para o tipo Sale
      const typedSales = (salesData || []) as unknown as Sale[]
      setSales(typedSales)

      // Calcular estatísticas
      const total = typedSales?.length || 0
      const lucro = typedSales?.reduce((acc, sale) => acc + (sale.profit || 0), 0) || 0
      const hoje = format(new Date(), 'yyyy-MM-dd')
      const vendasDeHoje = typedSales?.filter(sale => sale.data === hoje).length || 0

      setTotalVendas(total)
      setLucroTotal(lucro)
      setVendasHoje(vendasDeHoje)

    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleProductChange = (productId: string) => {
    const product = products.find(p => p.id === productId)
    if (product) {
      setFormData(prev => ({
        ...prev,
        produto_id: productId,
        sale_price: product.preco_venda
      }))
    }
  }

  const handleSave = async () => {
    if (!formData.produto_id || formData.quantity <= 0 || formData.sale_price <= 0) {
      alert('Preencha todos os campos obrigatórios')
      return
    }

    try {
      const product = products.find(p => p.id === formData.produto_id)
      if (!product) return

      const costPrice = product.custo_total * formData.quantity
      const salePrice = formData.sale_price * formData.quantity
      const profit = salePrice - costPrice

      const saleData = {
        user_id: user!.id,
        produto_id: formData.produto_id,
        quantity: formData.quantity,
        sale_price: formData.sale_price,
        cost_price: product.custo_total,
        profit: profit,
        payment_method: formData.payment_method,
        data: formData.data,
        cliente: formData.cliente || null,
        // Campos legados para compatibilidade
        valor_venda: salePrice,
        lucro_calculado: profit
      }

      if (editingSale) {
        const { error } = await supabase
          .from('sales')
          .update(saleData)
          .eq('id', editingSale.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('sales')
          .insert(saleData)

        if (error) throw error
      }

      setModalOpen(false)
      setEditingSale(null)
      resetForm()
      loadData()
    } catch (error) {
      console.error('Erro ao salvar venda:', error)
      alert('Erro ao salvar venda')
    }
  }

  const handleEdit = (sale: Sale) => {
    setEditingSale(sale)
    setFormData({
      produto_id: sale.produto_id,
      quantity: sale.quantity,
      sale_price: sale.sale_price,
      payment_method: sale.payment_method,
      data: sale.data,
      cliente: sale.cliente || ''
    })
    setModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta venda?')) return

    try {
      const { error } = await supabase
        .from('sales')
        .delete()
        .eq('id', id)

      if (error) throw error
      loadData()
    } catch (error) {
      console.error('Erro ao deletar venda:', error)
      alert('Erro ao deletar venda')
    }
  }

  const resetForm = () => {
    setFormData({
      produto_id: '',
      quantity: 1,
      sale_price: 0,
      payment_method: 'dinheiro',
      data: format(new Date(), 'yyyy-MM-dd'),
      cliente: ''
    })
  }

  const openModal = () => {
    resetForm()
    setEditingSale(null)
    setModalOpen(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-white text-lg">Carregando vendas...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Vendas</h1>
          <p className="text-vultrix-light/70">Gerencie suas vendas e lucros</p>
        </div>
        <button
          onClick={openModal}
          className="flex items-center gap-2 px-6 py-3 bg-vultrix-accent text-white rounded-lg font-semibold hover:bg-vultrix-accent/90 transition-colors"
        >
          <Plus size={20} />
          Nova Venda
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-vultrix-dark border border-vultrix-gray rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <ShoppingCart className="text-blue-500" size={24} />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-white mb-1">{totalVendas}</h3>
          <p className="text-vultrix-light/70 text-sm">Total de Vendas</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-vultrix-dark border border-vultrix-gray rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
              <TrendingUp className="text-green-500" size={24} />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-white mb-1">
            R$ {lucroTotal.toFixed(2)}
          </h3>
          <p className="text-vultrix-light/70 text-sm">Lucro Total</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-vultrix-dark border border-vultrix-gray rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center">
              <Calendar className="text-purple-500" size={24} />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-white mb-1">{vendasHoje}</h3>
          <p className="text-vultrix-light/70 text-sm">Vendas Hoje</p>
        </motion.div>
      </div>

      {/* Sales Table */}
      <div className="bg-vultrix-dark border border-vultrix-gray rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-vultrix-gray">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-vultrix-light uppercase tracking-wider">
                  Produto
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-vultrix-light uppercase tracking-wider">
                  Qtd
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-vultrix-light uppercase tracking-wider">
                  Valor Unit.
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-vultrix-light uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-vultrix-light uppercase tracking-wider">
                  Lucro
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-vultrix-light uppercase tracking-wider">
                  Pagamento
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-vultrix-light uppercase tracking-wider">
                  Data
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-vultrix-light uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-vultrix-light uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-vultrix-gray">
              {sales.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <ShoppingCart className="text-vultrix-light/40" size={48} />
                      <p className="text-vultrix-light/70">Nenhuma venda cadastrada</p>
                      <button
                        onClick={openModal}
                        className="text-vultrix-accent hover:text-vultrix-accent/80 text-sm font-medium"
                      >
                        Registrar primeira venda
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-vultrix-gray/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
                          <Package className="text-blue-500" size={16} />
                        </div>
                        <span className="text-white font-medium">
                          {sale.products?.nome || 'Produto'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-vultrix-light">
                      {sale.quantity}x
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-vultrix-light">
                      R$ {sale.sale_price.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-white font-semibold">
                        R$ {(sale.sale_price * sale.quantity).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`font-semibold ${sale.profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        R$ {sale.profit.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-2 px-3 py-1 bg-vultrix-gray rounded-full text-xs text-vultrix-light">
                        <CreditCard size={12} />
                        {sale.payment_method}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-vultrix-light">
                      {format(new Date(sale.data), 'dd/MM/yyyy', { locale: ptBR })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {sale.cliente ? (
                        <div className="flex items-center gap-2 text-vultrix-light">
                          <User size={14} />
                          {sale.cliente}
                        </div>
                      ) : (
                        <span className="text-vultrix-light/40">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(sale)}
                          className="p-2 hover:bg-vultrix-gray rounded-lg transition-colors text-vultrix-light hover:text-vultrix-accent"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(sale.id)}
                          className="p-2 hover:bg-red-500/10 rounded-lg transition-colors text-vultrix-light hover:text-red-500"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-vultrix-dark border border-vultrix-gray rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-vultrix-gray flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">
                  {editingSale ? 'Editar Venda' : 'Nova Venda'}
                </h2>
                <button
                  onClick={() => {
                    setModalOpen(false)
                    setEditingSale(null)
                  }}
                  className="p-2 hover:bg-vultrix-gray rounded-lg transition-colors text-vultrix-light"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Produto */}
                <div>
                  <label className="block text-sm font-medium text-vultrix-light mb-2">
                    Produto *
                  </label>
                  <select
                    value={formData.produto_id}
                    onChange={(e) => handleProductChange(e.target.value)}
                    className="w-full px-4 py-3 bg-vultrix-black border border-vultrix-gray rounded-lg text-white focus:outline-none focus:border-vultrix-accent"
                    required
                  >
                    <option value="">Selecione um produto</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.nome} - R$ {product.preco_venda.toFixed(2)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Quantidade e Preço */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-vultrix-light mb-2">
                      Quantidade *
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                      className="w-full px-4 py-3 bg-vultrix-black border border-vultrix-gray rounded-lg text-white focus:outline-none focus:border-vultrix-accent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-vultrix-light mb-2">
                      Valor Unitário (R$) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.sale_price}
                      onChange={(e) => setFormData({ ...formData, sale_price: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-3 bg-vultrix-black border border-vultrix-gray rounded-lg text-white focus:outline-none focus:border-vultrix-accent"
                      required
                    />
                  </div>
                </div>

                {/* Método de Pagamento */}
                <div>
                  <label className="block text-sm font-medium text-vultrix-light mb-2">
                    Método de Pagamento *
                  </label>
                  <select
                    value={formData.payment_method}
                    onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                    className="w-full px-4 py-3 bg-vultrix-black border border-vultrix-gray rounded-lg text-white focus:outline-none focus:border-vultrix-accent"
                  >
                    <option value="dinheiro">Dinheiro</option>
                    <option value="pix">PIX</option>
                    <option value="cartao_credito">Cartão de Crédito</option>
                    <option value="cartao_debito">Cartão de Débito</option>
                    <option value="transferencia">Transferência</option>
                  </select>
                </div>

                {/* Data e Cliente */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-vultrix-light mb-2">
                      Data *
                    </label>
                    <input
                      type="date"
                      value={formData.data}
                      onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                      className="w-full px-4 py-3 bg-vultrix-black border border-vultrix-gray rounded-lg text-white focus:outline-none focus:border-vultrix-accent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-vultrix-light mb-2">
                      Cliente (opcional)
                    </label>
                    <input
                      type="text"
                      value={formData.cliente}
                      onChange={(e) => setFormData({ ...formData, cliente: e.target.value })}
                      placeholder="Nome do cliente"
                      className="w-full px-4 py-3 bg-vultrix-black border border-vultrix-gray rounded-lg text-white placeholder-vultrix-light/40 focus:outline-none focus:border-vultrix-accent"
                    />
                  </div>
                </div>

                {/* Preview do Cálculo */}
                {formData.produto_id && (
                  <div className="bg-vultrix-black border border-vultrix-gray rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-vultrix-light mb-3">Resumo da Venda</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-vultrix-light/70">Valor Total:</span>
                        <span className="text-white font-semibold">
                          R$ {(formData.sale_price * formData.quantity).toFixed(2)}
                        </span>
                      </div>
                      {(() => {
                        const product = products.find(p => p.id === formData.produto_id)
                        if (product) {
                          const costTotal = product.custo_total * formData.quantity
                          const saleTotal = formData.sale_price * formData.quantity
                          const profit = saleTotal - costTotal
                          return (
                            <>
                              <div className="flex justify-between">
                                <span className="text-vultrix-light/70">Custo Total:</span>
                                <span className="text-white">R$ {costTotal.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between pt-2 border-t border-vultrix-gray">
                                <span className="text-vultrix-light/70 font-semibold">Lucro:</span>
                                <span className={`font-bold ${profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                  R$ {profit.toFixed(2)}
                                </span>
                              </div>
                            </>
                          )
                        }
                      })()}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setModalOpen(false)
                      setEditingSale(null)
                    }}
                    className="flex-1 px-6 py-3 bg-vultrix-gray text-white rounded-lg font-semibold hover:bg-vultrix-light/10 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex-1 px-6 py-3 bg-vultrix-accent text-white rounded-lg font-semibold hover:bg-vultrix-accent/90 transition-colors"
                  >
                    {editingSale ? 'Atualizar' : 'Registrar Venda'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
