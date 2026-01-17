"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/AuthProvider";
import {
  Plus,
  Edit,
  Trash2,
  Check,
  X,
  Package,
  Zap,
  Wrench,
  Megaphone,
  Printer,
  Circle,
  ShoppingCart,
  Home,
  Car,
  Smartphone,
} from "lucide-react";

type ExpenseCategory = {
  id: string;
  nome: string;
  descricao: string | null;
  cor: string;
  icone: string;
  ativo: boolean;
};

const ICONES_DISPONIVEIS = [
  { nome: "package", Icone: Package, label: "Pacote" },
  { nome: "zap", Icone: Zap, label: "Energia" },
  { nome: "wrench", Icone: Wrench, label: "Ferramenta" },
  { nome: "megaphone", Icone: Megaphone, label: "Megafone" },
  { nome: "printer", Icone: Printer, label: "Impressora" },
  { nome: "shopping-cart", Icone: ShoppingCart, label: "Carrinho" },
  { nome: "home", Icone: Home, label: "Casa" },
  { nome: "car", Icone: Car, label: "Carro" },
  { nome: "smartphone", Icone: Smartphone, label: "Celular" },
  { nome: "circle", Icone: Circle, label: "Círculo" },
];

const CORES_DISPONIVEIS = [
  "#3B82F6", // blue
  "#EF4444", // red
  "#10B981", // green
  "#F59E0B", // yellow
  "#8B5CF6", // purple
  "#EC4899", // pink
  "#06B6D4", // cyan
  "#6B7280", // gray
];

export default function CategoriasPage() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    cor: "#3B82F6",
    icone: "package",
  });

  useEffect(() => {
    if (user) {
      loadCategories();
    }
  }, [user]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("expense_categories")
        .select("*")
        .eq("user_id", user!.id)
        .order("nome");

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error("Erro ao carregar categorias:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (categoryId?: string) => {
    if (!formData.nome.trim()) {
      alert("Nome é obrigatório");
      return;
    }

    try {
      if (categoryId) {
        // Atualizar
        const { error } = await supabase
          .from("expense_categories")
          .update(formData)
          .eq("id", categoryId);

        if (error) throw error;
      } else {
        // Criar
        const { error } = await supabase.from("expense_categories").insert({
          user_id: user!.id,
          ...formData,
          ativo: true,
        });

        if (error) throw error;
      }

      setEditingId(null);
      setCreating(false);
      setFormData({
        nome: "",
        descricao: "",
        cor: "#3B82F6",
        icone: "package",
      });
      loadCategories();
    } catch (error) {
      console.error("Erro ao salvar categoria:", error);
      alert("Erro ao salvar categoria");
    }
  };

  const handleEdit = (category: ExpenseCategory) => {
    setEditingId(category.id);
    setFormData({
      nome: category.nome,
      descricao: category.descricao || "",
      cor: category.cor,
      icone: category.icone,
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza? Despesas já cadastradas não serão afetadas."))
      return;

    try {
      const { error } = await supabase
        .from("expense_categories")
        .delete()
        .eq("id", id);

      if (error) throw error;
      loadCategories();
    } catch (error) {
      console.error("Erro ao excluir categoria:", error);
      alert("Erro ao excluir categoria");
    }
  };

  const toggleAtivo = async (id: string, ativo: boolean) => {
    try {
      const { error } = await supabase
        .from("expense_categories")
        .update({ ativo: !ativo })
        .eq("id", id);

      if (error) throw error;
      loadCategories();
    } catch (error) {
      console.error("Erro ao alterar status:", error);
    }
  };

  const getIconComponent = (iconeName: string) => {
    const icon = ICONES_DISPONIVEIS.find((i) => i.nome === iconeName);
    return icon?.Icone || Circle;
  };

  if (loading) {
    return <div className="text-white text-center py-12">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Categorias de Despesas
          </h1>
          <p className="text-vultrix-light/70">
            Gerencie suas categorias personalizadas
          </p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-2 px-6 py-3 bg-vultrix-accent text-white rounded-lg font-semibold hover:bg-vultrix-accent/90 transition-colors"
        >
          <Plus size={20} />
          Nova Categoria
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Card para criar nova */}
        {creating && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-vultrix-dark border-2 border-vultrix-accent rounded-xl p-6"
          >
            <div className="space-y-4">
              <input
                type="text"
                value={formData.nome}
                onChange={(e) =>
                  setFormData({ ...formData, nome: e.target.value })
                }
                placeholder="Nome da categoria"
                className="w-full px-3 py-2 bg-vultrix-black border border-vultrix-gray rounded-lg text-white placeholder-vultrix-light/40 focus:outline-none focus:border-vultrix-accent text-sm"
                autoFocus
              />

              <textarea
                value={formData.descricao}
                onChange={(e) =>
                  setFormData({ ...formData, descricao: e.target.value })
                }
                placeholder="Descrição"
                rows={2}
                className="w-full px-3 py-2 bg-vultrix-black border border-vultrix-gray rounded-lg text-white placeholder-vultrix-light/40 focus:outline-none focus:border-vultrix-accent text-sm resize-none"
              />

              {/* Seletor de ícone */}
              <div>
                <p className="text-xs text-vultrix-light/60 mb-2">Ícone:</p>
                <div className="grid grid-cols-5 gap-2">
                  {ICONES_DISPONIVEIS.map(({ nome, Icone }) => (
                    <button
                      key={nome}
                      type="button"
                      onClick={() => setFormData({ ...formData, icone: nome })}
                      className={`p-2 rounded-lg border transition-colors ${
                        formData.icone === nome
                          ? "bg-vultrix-accent border-vultrix-accent"
                          : "bg-vultrix-black border-vultrix-gray hover:border-vultrix-accent/50"
                      }`}
                    >
                      <Icone size={16} className="mx-auto" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Seletor de cor */}
              <div>
                <p className="text-xs text-vultrix-light/60 mb-2">Cor:</p>
                <div className="grid grid-cols-8 gap-2">
                  {CORES_DISPONIVEIS.map((cor) => (
                    <button
                      key={cor}
                      type="button"
                      onClick={() => setFormData({ ...formData, cor })}
                      className={`w-8 h-8 rounded-lg border-2 transition-all ${
                        formData.cor === cor
                          ? "border-white scale-110"
                          : "border-transparent"
                      }`}
                      style={{ backgroundColor: cor }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setCreating(false)}
                  className="flex-1 px-4 py-2 bg-vultrix-gray text-white rounded-lg hover:bg-vultrix-light/10 transition-colors text-sm"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleSave()}
                  className="flex-1 px-4 py-2 bg-vultrix-accent text-white rounded-lg hover:bg-vultrix-accent/90 transition-colors text-sm font-semibold"
                >
                  Criar
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Cards de categorias existentes */}
        {categories.map((category, index) => {
          const IconComponent = getIconComponent(category.icone);
          const isEditing = editingId === category.id;

          return (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`bg-vultrix-dark border rounded-xl p-6 ${
                category.ativo
                  ? "border-vultrix-gray"
                  : "border-vultrix-gray/50 opacity-60"
              }`}
            >
              {isEditing ? (
                <div className="space-y-4">
                  <input
                    type="text"
                    value={formData.nome}
                    onChange={(e) =>
                      setFormData({ ...formData, nome: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-vultrix-black border border-vultrix-gray rounded-lg text-white text-sm"
                  />
                  <textarea
                    value={formData.descricao}
                    onChange={(e) =>
                      setFormData({ ...formData, descricao: e.target.value })
                    }
                    rows={2}
                    className="w-full px-3 py-2 bg-vultrix-black border border-vultrix-gray rounded-lg text-white text-sm resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingId(null);
                        setFormData({
                          nome: "",
                          descricao: "",
                          cor: "#3B82F6",
                          icone: "package",
                        });
                      }}
                      className="flex-1 px-4 py-2 bg-vultrix-gray rounded-lg text-sm"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => handleSave(category.id)}
                      className="flex-1 px-4 py-2 bg-vultrix-accent rounded-lg text-sm font-semibold"
                    >
                      Salvar
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3 flex-1">
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${category.cor}20` }}
                      >
                        <IconComponent
                          size={24}
                          style={{ color: category.cor }}
                        />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">
                          {category.nome}
                        </h3>
                        {category.descricao && (
                          <p className="text-sm text-vultrix-light/60 line-clamp-1">
                            {category.descricao}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleAtivo(category.id, category.ativo)}
                      className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        category.ativo
                          ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                          : "bg-gray-500/20 text-gray-400 hover:bg-gray-500/30"
                      }`}
                    >
                      {category.ativo ? "Ativa" : "Inativa"}
                    </button>
                    <button
                      onClick={() => handleEdit(category)}
                      className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(category.id)}
                      className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          );
        })}
      </div>

      {categories.length === 0 && !creating && (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-vultrix-light/30 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">
            Nenhuma categoria cadastrada
          </h3>
          <p className="text-vultrix-light/70 mb-6">
            Crie categorias personalizadas para organizar suas despesas
          </p>
          <button
            onClick={() => setCreating(true)}
            className="px-6 py-3 bg-vultrix-accent text-white rounded-lg font-semibold hover:bg-vultrix-accent/90 transition-colors"
          >
            Criar Primeira Categoria
          </button>
        </div>
      )}
    </div>
  );
}
