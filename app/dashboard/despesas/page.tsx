"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/AuthProvider";
import {
  Plus,
  Edit,
  Trash2,
  ShoppingCart,
  TrendingDown,
  Calendar,
  DollarSign,
  X,
  Tag,
} from "lucide-react";

type ExpenseCategory = {
  id: string;
  nome: string;
  cor: string;
  icone: string;
};

type Expense = {
  id: string;
  categoria: string;
  descricao: string;
  valor: number;
  data: string;
  recorrente: boolean;
  category_id: string | null;
  expense_categories?: ExpenseCategory;
};

export default function DespesasPage() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const [formData, setFormData] = useState({
    category_id: "",
    descricao: "",
    valor: 0,
    data: new Date().toISOString().split("T")[0],
    recorrente: false,
  });

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Carregar categorias ativas
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("expense_categories")
        .select("*")
        .eq("user_id", user!.id)
        .eq("ativo", true)
        .order("nome");

      if (categoriesError) throw categoriesError;
      setCategories(categoriesData || []);

      // Carregar despesas com categorias
      const { data: expensesData, error: expensesError } = await supabase
        .from("expenses")
        .select(
          `
          *,
          expense_categories (id, nome, cor, icone)
        `
        )
        .eq("user_id", user!.id)
        .order("data", { ascending: false });

      if (expensesError) throw expensesError;
      setExpenses(expensesData || []);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      alert("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const openModal = (expense?: Expense) => {
    if (expense) {
      setEditingExpense(expense);
      setFormData({
        category_id: expense.category_id || "",
        descricao: expense.descricao,
        valor: expense.valor,
        data: expense.data,
        recorrente: expense.recorrente,
      });
    } else {
      setEditingExpense(null);
      setFormData({
        category_id: categories[0]?.id || "",
        descricao: "",
        valor: 0,
        data: new Date().toISOString().split("T")[0],
        recorrente: false,
      });
    }
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingExpense(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.category_id || formData.valor <= 0) {
      alert("Selecione uma categoria e valor válido");
      return;
    }

    try {
      // Pegar nome da categoria para manter compatibilidade
      const category = categories.find((c) => c.id === formData.category_id);

      const expenseData = {
        user_id: user!.id,
        category_id: formData.category_id,
        categoria: category?.nome || "Outros",
        descricao: formData.descricao,
        valor: formData.valor,
        data: formData.data,
        recorrente: formData.recorrente,
      };

      if (editingExpense) {
        const { error } = await supabase
          .from("expenses")
          .update(expenseData)
          .eq("id", editingExpense.id);

        if (error) throw error;
        alert("Despesa atualizada com sucesso!");
      } else {
        const { error } = await supabase.from("expenses").insert(expenseData);

        if (error) throw error;
        alert("Despesa cadastrada com sucesso!");
      }

      closeModal();
      loadData();
    } catch (error) {
      console.error("Erro ao salvar despesa:", error);
      alert("Erro ao salvar despesa");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta despesa?")) return;

    try {
      const { error } = await supabase.from("expenses").delete().eq("id", id);

      if (error) throw error;
      alert("Despesa excluída com sucesso!");
      loadData();
    } catch (error) {
      console.error("Erro ao excluir despesa:", error);
      alert("Erro ao excluir despesa");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-white text-lg">Carregando despesas...</div>
      </div>
    );
  }

  const totalGasto = expenses.reduce((sum, e) => sum + e.valor, 0);
  const gastoMensal = expenses
    .filter((e) => {
      const expDate = new Date(e.data);
      const now = new Date();
      return (
        expDate.getMonth() === now.getMonth() &&
        expDate.getFullYear() === now.getFullYear()
      );
    })
    .reduce((sum, e) => sum + e.valor, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Despesas</h1>
          <p className="text-vultrix-light/70">
            Controle seus gastos e despesas
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-6 py-3 bg-vultrix-accent text-white rounded-lg font-semibold hover:bg-vultrix-accent/90 transition-colors"
        >
          <Plus size={20} />
          Nova Despesa
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-vultrix-dark border border-vultrix-gray rounded-xl p-6"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
              <TrendingDown className="text-red-500" size={20} />
            </div>
            <div>
              <p className="text-vultrix-light/60 text-xs">Total Gasto</p>
              <p className="text-2xl font-bold text-white">
                R$ {totalGasto.toFixed(2)}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-vultrix-dark border border-vultrix-gray rounded-xl p-6"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
              <Calendar className="text-orange-500" size={20} />
            </div>
            <div>
              <p className="text-vultrix-light/60 text-xs">Este Mês</p>
              <p className="text-2xl font-bold text-white">
                R$ {gastoMensal.toFixed(2)}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-vultrix-dark border border-vultrix-gray rounded-xl p-6"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <ShoppingCart className="text-purple-500" size={20} />
            </div>
            <div>
              <p className="text-vultrix-light/60 text-xs">Total de Despesas</p>
              <p className="text-2xl font-bold text-white">{expenses.length}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Link para categorias */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Tag size={20} className="text-blue-400" />
            <div>
              <p className="text-white font-medium">
                Categorias Personalizadas
              </p>
              <p className="text-sm text-vultrix-light/70">
                Organize suas despesas com categorias customizadas
              </p>
            </div>
          </div>
          <a
            href="/dashboard/categorias"
            className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors text-sm font-medium"
          >
            Gerenciar Categorias
          </a>
        </div>
      </div>

      {/* Lista de Despesas */}
      <div className="space-y-3">
        {expenses.length === 0 ? (
          <div className="bg-vultrix-dark border border-vultrix-gray rounded-xl p-12 text-center">
            <ShoppingCart className="w-16 h-16 text-vultrix-light/30 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              Nenhuma despesa cadastrada
            </h3>
            <p className="text-vultrix-light/70 mb-6">
              Comece registrando sua primeira despesa
            </p>
            <button
              onClick={() => openModal()}
              className="px-6 py-3 bg-vultrix-accent text-white rounded-lg font-semibold hover:bg-vultrix-accent/90 transition-colors"
            >
              Cadastrar Primeira Despesa
            </button>
          </div>
        ) : (
          expenses.map((expense, index) => {
            const category = expense.expense_categories;
            return (
              <motion.div
                key={expense.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-vultrix-dark border border-vultrix-gray rounded-xl p-6 hover:border-vultrix-accent/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    {category && (
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${category.cor}20` }}
                      >
                        <div style={{ color: category.cor }}>
                          <ShoppingCart size={24} />
                        </div>
                      </div>
                    )}

                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-lg font-bold text-red-400">
                          - R$ {expense.valor.toFixed(2)}
                        </span>
                        {category && (
                          <span
                            className="px-3 py-1 text-sm rounded-full"
                            style={{
                              backgroundColor: `${category.cor}20`,
                              color: category.cor,
                            }}
                          >
                            {category.nome}
                          </span>
                        )}
                        {expense.recorrente && (
                          <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded-full">
                            Recorrente
                          </span>
                        )}
                      </div>

                      <p className="text-white mb-1">{expense.descricao}</p>

                      <div className="flex items-center gap-1 text-sm text-vultrix-light/60">
                        <Calendar size={14} />
                        {new Date(expense.data).toLocaleDateString("pt-BR")}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => openModal(expense)}
                      className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(expense.id)}
                      className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-vultrix-dark border border-vultrix-gray rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">
                  {editingExpense ? "Editar Despesa" : "Nova Despesa"}
                </h2>
                <button
                  onClick={closeModal}
                  className="p-2 hover:bg-vultrix-gray rounded-lg transition-colors"
                >
                  <X className="text-vultrix-light" size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Categoria */}
                <div>
                  <label className="block text-sm font-medium text-vultrix-light mb-2">
                    Categoria *
                  </label>
                  {categories.length > 0 ? (
                    <select
                      value={formData.category_id}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          category_id: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 bg-vultrix-black border border-vultrix-gray rounded-lg text-white focus:outline-none focus:border-vultrix-accent"
                      required
                    >
                      <option value="">Selecione uma categoria</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.nome}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                      <p className="text-yellow-400 text-sm">
                        Nenhuma categoria encontrada.{" "}
                        <a
                          href="/dashboard/categorias"
                          className="underline font-medium"
                        >
                          Criar categorias
                        </a>
                      </p>
                    </div>
                  )}
                </div>

                {/* Descrição */}
                <div>
                  <label className="block text-sm font-medium text-vultrix-light mb-2">
                    Descrição *
                  </label>
                  <input
                    type="text"
                    value={formData.descricao}
                    onChange={(e) =>
                      setFormData({ ...formData, descricao: e.target.value })
                    }
                    placeholder="Ex: Compra de filamento PLA"
                    className="w-full px-4 py-3 bg-vultrix-black border border-vultrix-gray rounded-lg text-white placeholder-vultrix-light/40 focus:outline-none focus:border-vultrix-accent"
                    required
                  />
                </div>

                {/* Valor e Data */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-vultrix-light mb-2">
                      Valor (R$) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.valor || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          valor: parseFloat(e.target.value) || 0,
                        })
                      }
                      placeholder="0.00"
                      className="w-full px-4 py-3 bg-vultrix-black border border-vultrix-gray rounded-lg text-white placeholder-vultrix-light/40 focus:outline-none focus:border-vultrix-accent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-vultrix-light mb-2">
                      Data *
                    </label>
                    <input
                      type="date"
                      value={formData.data}
                      onChange={(e) =>
                        setFormData({ ...formData, data: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-vultrix-black border border-vultrix-gray rounded-lg text-white focus:outline-none focus:border-vultrix-accent"
                      required
                    />
                  </div>
                </div>

                {/* Recorrente */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="recorrente"
                    checked={formData.recorrente}
                    onChange={(e) =>
                      setFormData({ ...formData, recorrente: e.target.checked })
                    }
                    className="w-5 h-5 rounded border-vultrix-gray bg-vultrix-black focus:ring-vultrix-accent"
                  />
                  <label
                    htmlFor="recorrente"
                    className="text-sm text-vultrix-light cursor-pointer"
                  >
                    Despesa recorrente
                  </label>
                </div>

                {/* Botões */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 px-6 py-3 bg-vultrix-gray text-white rounded-lg font-semibold hover:bg-vultrix-light/10 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={categories.length === 0}
                    className="flex-1 px-6 py-3 bg-vultrix-accent text-white rounded-lg font-semibold hover:bg-vultrix-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {editingExpense ? "Salvar" : "Cadastrar"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
