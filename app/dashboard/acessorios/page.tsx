"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/AuthProvider";
import {
  Plus,
  X,
  Package,
  Edit,
  Trash2,
  Magnet,
  Key,
  Droplet,
  Palette,
  Box,
} from "lucide-react";

type Accessory = {
  id: string;
  created_at: string;
  user_id: string;
  nome: string;
  categoria: "ima" | "chaveiro" | "cola" | "tinta" | "outro";
  descricao: string | null;
  custo_unitario: number;
  estoque_atual: number;
  unidade: string;
};

const CATEGORIAS = [
  { value: "ima", label: "Ímã", icon: Magnet },
  { value: "chaveiro", label: "Chaveiro", icon: Key },
  { value: "cola", label: "Cola/Adesivo", icon: Droplet },
  { value: "tinta", label: "Tinta", icon: Palette },
  { value: "outro", label: "Outro", icon: Box },
];

const UNIDADES = ["unidade", "grama", "ml", "metro", "par"];

export default function AcessoriosPage() {
  const { user } = useAuth();
  const [accessories, setAccessories] = useState<Accessory[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAccessory, setEditingAccessory] = useState<Accessory | null>(
    null
  );

  const [formData, setFormData] = useState({
    nome: "",
    categoria: "outro" as "ima" | "chaveiro" | "cola" | "tinta" | "outro",
    descricao: "",
    custo_unitario: 0,
    estoque_atual: 0,
    unidade: "unidade",
  });

  useEffect(() => {
    if (user) {
      loadAccessories();
    }
  }, [user]);

  const loadAccessories = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("accessories")
        .select("*")
        .eq("user_id", user!.id)
        .order("nome");

      if (error) throw error;
      setAccessories(data || []);
    } catch (error) {
      console.error("Erro ao carregar acessórios:", error);
      alert("Erro ao carregar acessórios");
    } finally {
      setLoading(false);
    }
  };

  const openModal = (accessory?: Accessory) => {
    if (accessory) {
      setEditingAccessory(accessory);
      setFormData({
        nome: accessory.nome,
        categoria: accessory.categoria,
        descricao: accessory.descricao || "",
        custo_unitario: accessory.custo_unitario,
        estoque_atual: accessory.estoque_atual,
        unidade: accessory.unidade,
      });
    } else {
      setEditingAccessory(null);
      setFormData({
        nome: "",
        categoria: "outro",
        descricao: "",
        custo_unitario: 0,
        estoque_atual: 0,
        unidade: "unidade",
      });
    }
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingAccessory(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nome.trim() || formData.custo_unitario <= 0) {
      alert("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      if (editingAccessory) {
        // Atualizar
        const { error } = await supabase
          .from("accessories")
          .update(formData)
          .eq("id", editingAccessory.id);

        if (error) throw error;
        alert("Acessório atualizado com sucesso!");
      } else {
        // Criar
        const { error } = await supabase.from("accessories").insert({
          user_id: user!.id,
          ...formData,
        });

        if (error) throw error;
        alert("Acessório cadastrado com sucesso!");
      }

      closeModal();
      loadAccessories();
    } catch (error) {
      console.error("Erro ao salvar acessório:", error);
      alert("Erro ao salvar acessório");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este acessório?")) return;

    try {
      const { error } = await supabase
        .from("accessories")
        .delete()
        .eq("id", id);

      if (error) throw error;
      alert("Acessório excluído com sucesso!");
      loadAccessories();
    } catch (error) {
      console.error("Erro ao excluir acessório:", error);
      alert("Erro ao excluir acessório");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-white text-lg">Carregando acessórios...</div>
      </div>
    );
  }

  const getCategoriaIcon = (categoria: string) => {
    const cat = CATEGORIAS.find((c) => c.value === categoria);
    const Icon = cat?.icon || Box;
    return <Icon size={20} />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Acessórios e Materiais
          </h1>
          <p className="text-vultrix-light/70">
            Gerencie ímãs, chaveiros, cola e outros materiais extras
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-6 py-3 bg-vultrix-accent text-white rounded-lg font-semibold hover:bg-vultrix-accent/90 transition-colors"
        >
          <Plus size={20} />
          Novo Acessório
        </button>
      </div>

      {/* Lista de Acessórios */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accessories.map((accessory) => (
          <motion.div
            key={accessory.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-vultrix-dark border border-vultrix-gray rounded-xl p-6 hover:border-vultrix-accent/50 transition-colors"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-vultrix-accent/20 rounded-lg flex items-center justify-center text-vultrix-accent">
                  {getCategoriaIcon(accessory.categoria)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {accessory.nome}
                  </h3>
                  <p className="text-sm text-vultrix-light/70">
                    {
                      CATEGORIAS.find((c) => c.value === accessory.categoria)
                        ?.label
                    }
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => openModal(accessory)}
                  className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => handleDelete(accessory.id)}
                  className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {accessory.descricao && (
              <p className="text-sm text-vultrix-light/60 mb-4">
                {accessory.descricao}
              </p>
            )}

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-vultrix-light/70">Custo:</span>
                <span className="text-white font-semibold">
                  R$ {accessory.custo_unitario.toFixed(2)}/{accessory.unidade}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-vultrix-light/70">Estoque:</span>
                <span
                  className={`font-semibold ${
                    accessory.estoque_atual <= 0
                      ? "text-red-400"
                      : accessory.estoque_atual < 10
                      ? "text-yellow-400"
                      : "text-green-400"
                  }`}
                >
                  {accessory.estoque_atual} {accessory.unidade}(s)
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {accessories.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-vultrix-light/30 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">
            Nenhum acessório cadastrado
          </h3>
          <p className="text-vultrix-light/70 mb-6">
            Cadastre ímãs, chaveiros e outros materiais que você usa
          </p>
          <button
            onClick={() => openModal()}
            className="px-6 py-3 bg-vultrix-accent text-white rounded-lg font-semibold hover:bg-vultrix-accent/90 transition-colors"
          >
            Cadastrar Primeiro Acessório
          </button>
        </div>
      )}

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
                  {editingAccessory ? "Editar Acessório" : "Novo Acessório"}
                </h2>
                <button
                  onClick={closeModal}
                  className="p-2 hover:bg-vultrix-gray rounded-lg transition-colors"
                >
                  <X className="text-vultrix-light" size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Nome */}
                <div>
                  <label className="block text-sm font-medium text-vultrix-light mb-2">
                    Nome *
                  </label>
                  <input
                    type="text"
                    value={formData.nome}
                    onChange={(e) =>
                      setFormData({ ...formData, nome: e.target.value })
                    }
                    placeholder="Ex: Ímã redondo 10mm"
                    className="w-full px-4 py-3 bg-vultrix-black border border-vultrix-gray rounded-lg text-white placeholder-vultrix-light/40 focus:outline-none focus:border-vultrix-accent"
                    required
                  />
                </div>

                {/* Categoria */}
                <div>
                  <label className="block text-sm font-medium text-vultrix-light mb-2">
                    Categoria *
                  </label>
                  <select
                    value={formData.categoria}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        categoria: e.target.value as any,
                      })
                    }
                    className="w-full px-4 py-3 bg-vultrix-black border border-vultrix-gray rounded-lg text-white focus:outline-none focus:border-vultrix-accent"
                  >
                    {CATEGORIAS.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Descrição */}
                <div>
                  <label className="block text-sm font-medium text-vultrix-light mb-2">
                    Descrição
                  </label>
                  <textarea
                    value={formData.descricao}
                    onChange={(e) =>
                      setFormData({ ...formData, descricao: e.target.value })
                    }
                    placeholder="Detalhes do acessório..."
                    rows={3}
                    className="w-full px-4 py-3 bg-vultrix-black border border-vultrix-gray rounded-lg text-white placeholder-vultrix-light/40 focus:outline-none focus:border-vultrix-accent resize-none"
                  />
                </div>

                {/* Custo e Unidade */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-vultrix-light mb-2">
                      Custo Unitário *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.custo_unitario || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          custo_unitario: parseFloat(e.target.value) || 0,
                        })
                      }
                      placeholder="R$ 0.00"
                      className="w-full px-4 py-3 bg-vultrix-black border border-vultrix-gray rounded-lg text-white placeholder-vultrix-light/40 focus:outline-none focus:border-vultrix-accent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-vultrix-light mb-2">
                      Unidade
                    </label>
                    <select
                      value={formData.unidade}
                      onChange={(e) =>
                        setFormData({ ...formData, unidade: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-vultrix-black border border-vultrix-gray rounded-lg text-white focus:outline-none focus:border-vultrix-accent"
                    >
                      {UNIDADES.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Estoque */}
                <div>
                  <label className="block text-sm font-medium text-vultrix-light mb-2">
                    Estoque Atual
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.estoque_atual || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        estoque_atual: parseInt(e.target.value) || 0,
                      })
                    }
                    placeholder="Quantidade em estoque"
                    className="w-full px-4 py-3 bg-vultrix-black border border-vultrix-gray rounded-lg text-white placeholder-vultrix-light/40 focus:outline-none focus:border-vultrix-accent"
                  />
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
                    className="flex-1 px-6 py-3 bg-vultrix-accent text-white rounded-lg font-semibold hover:bg-vultrix-accent/90 transition-colors"
                  >
                    {editingAccessory ? "Salvar" : "Cadastrar"}
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
