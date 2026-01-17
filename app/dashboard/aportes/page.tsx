"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/AuthProvider";
import {
  Plus,
  X,
  TrendingUp,
  Edit,
  Trash2,
  Wallet,
  Calendar,
  DollarSign,
  FileText,
} from "lucide-react";

type CapitalContribution = {
  id: string;
  created_at: string;
  valor: number;
  origem: "pessoal" | "investimento" | "emprestimo" | "outro";
  data: string;
  observacao: string | null;
  comprovante_url: string | null;
};

const ORIGENS = [
  { value: "pessoal", label: "Pessoal", icon: Wallet, color: "bg-blue-500" },
  {
    value: "investimento",
    label: "Investimento",
    icon: TrendingUp,
    color: "bg-green-500",
  },
  {
    value: "emprestimo",
    label: "Empréstimo",
    icon: FileText,
    color: "bg-yellow-500",
  },
  { value: "outro", label: "Outro", icon: DollarSign, color: "bg-gray-500" },
];

export default function AportesPage() {
  const { user } = useAuth();
  const [aportes, setAportes] = useState<CapitalContribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAporte, setEditingAporte] =
    useState<CapitalContribution | null>(null);

  const [formData, setFormData] = useState({
    valor: 0,
    origem: "pessoal" as "pessoal" | "investimento" | "emprestimo" | "outro",
    data: new Date().toISOString().split("T")[0],
    observacao: "",
  });

  useEffect(() => {
    if (user) {
      loadAportes();
    }
  }, [user]);

  const loadAportes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("capital_contributions")
        .select("*")
        .eq("user_id", user!.id)
        .order("data", { ascending: false });

      if (error) throw error;
      setAportes(data || []);
    } catch (error) {
      console.error("Erro ao carregar aportes:", error);
      alert("Erro ao carregar aportes");
    } finally {
      setLoading(false);
    }
  };

  const openModal = (aporte?: CapitalContribution) => {
    if (aporte) {
      setEditingAporte(aporte);
      setFormData({
        valor: aporte.valor,
        origem: aporte.origem,
        data: aporte.data,
        observacao: aporte.observacao || "",
      });
    } else {
      setEditingAporte(null);
      setFormData({
        valor: 0,
        origem: "pessoal",
        data: new Date().toISOString().split("T")[0],
        observacao: "",
      });
    }
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingAporte(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.valor <= 0) {
      alert("Valor deve ser maior que zero");
      return;
    }

    try {
      if (editingAporte) {
        const { error } = await supabase
          .from("capital_contributions")
          .update(formData)
          .eq("id", editingAporte.id);

        if (error) throw error;
        alert("Aporte atualizado com sucesso!");
      } else {
        const { error } = await supabase.from("capital_contributions").insert({
          user_id: user!.id,
          ...formData,
        });

        if (error) throw error;
        alert("Aporte registrado com sucesso!");
      }

      closeModal();
      loadAportes();
    } catch (error) {
      console.error("Erro ao salvar aporte:", error);
      alert("Erro ao salvar aporte");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este aporte?")) return;

    try {
      const { error } = await supabase
        .from("capital_contributions")
        .delete()
        .eq("id", id);

      if (error) throw error;
      alert("Aporte excluído com sucesso!");
      loadAportes();
    } catch (error) {
      console.error("Erro ao excluir aporte:", error);
      alert("Erro ao excluir aporte");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-white text-lg">Carregando aportes...</div>
      </div>
    );
  }

  const totalAportes = aportes.reduce((sum, a) => sum + a.valor, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Aportes de Capital
          </h1>
          <p className="text-vultrix-light/70">
            Registre investimentos que não são vendas
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-6 py-3 bg-vultrix-accent text-white rounded-lg font-semibold hover:bg-vultrix-accent/90 transition-colors"
        >
          <Plus size={20} />
          Novo Aporte
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-vultrix-dark border border-vultrix-gray rounded-xl p-6"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="text-green-500" size={20} />
            </div>
            <div>
              <p className="text-vultrix-light/60 text-xs">Total Aportado</p>
              <p className="text-2xl font-bold text-white">
                R$ {totalAportes.toFixed(2)}
              </p>
            </div>
          </div>
        </motion.div>

        {ORIGENS.map((origem, index) => {
          const total = aportes
            .filter((a) => a.origem === origem.value)
            .reduce((sum, a) => sum + a.valor, 0);
          return (
            <motion.div
              key={origem.value}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-vultrix-dark border border-vultrix-gray rounded-xl p-6"
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className={`w-10 h-10 ${origem.color}/20 rounded-lg flex items-center justify-center`}
                >
                  <origem.icon
                    className={`text-${origem.color.replace("bg-", "")}`}
                    size={20}
                  />
                </div>
                <div>
                  <p className="text-vultrix-light/60 text-xs">
                    {origem.label}
                  </p>
                  <p className="text-lg font-bold text-white">
                    R$ {total.toFixed(2)}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Lista de Aportes */}
      <div className="space-y-3">
        {aportes.length === 0 ? (
          <div className="bg-vultrix-dark border border-vultrix-gray rounded-xl p-12 text-center">
            <Wallet className="w-16 h-16 text-vultrix-light/30 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              Nenhum aporte registrado
            </h3>
            <p className="text-vultrix-light/70 mb-6">
              Comece registrando seu primeiro aporte de capital
            </p>
            <button
              onClick={() => openModal()}
              className="px-6 py-3 bg-vultrix-accent text-white rounded-lg font-semibold hover:bg-vultrix-accent/90 transition-colors"
            >
              Registrar Primeiro Aporte
            </button>
          </div>
        ) : (
          aportes.map((aporte, index) => {
            const origem = ORIGENS.find((o) => o.value === aporte.origem)!;
            return (
              <motion.div
                key={aporte.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-vultrix-dark border border-vultrix-gray rounded-xl p-6 hover:border-vultrix-accent/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div
                      className={`w-12 h-12 ${origem.color}/20 rounded-lg flex items-center justify-center`}
                    >
                      <origem.icon
                        className={`text-${origem.color.replace("bg-", "")}`}
                        size={24}
                      />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-lg font-bold text-white">
                          R$ {aporte.valor.toFixed(2)}
                        </span>
                        <span
                          className={`px-3 py-1 ${origem.color}/20 text-sm rounded-full`}
                        >
                          {origem.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-vultrix-light/60">
                        <div className="flex items-center gap-1">
                          <Calendar size={14} />
                          {new Date(aporte.data).toLocaleDateString("pt-BR")}
                        </div>
                        {aporte.observacao && (
                          <div className="flex items-center gap-1">
                            <FileText size={14} />
                            {aporte.observacao}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => openModal(aporte)}
                      className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(aporte.id)}
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
                  {editingAporte ? "Editar Aporte" : "Novo Aporte"}
                </h2>
                <button
                  onClick={closeModal}
                  className="p-2 hover:bg-vultrix-gray rounded-lg transition-colors"
                >
                  <X className="text-vultrix-light" size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Valor */}
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

                {/* Origem */}
                <div>
                  <label className="block text-sm font-medium text-vultrix-light mb-2">
                    Origem *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {ORIGENS.map((origem) => (
                      <button
                        key={origem.value}
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            origem: origem.value as any,
                          })
                        }
                        className={`p-4 rounded-lg border-2 transition-all ${
                          formData.origem === origem.value
                            ? `${origem.color} border-white`
                            : "bg-vultrix-black border-vultrix-gray hover:border-vultrix-light/30"
                        }`}
                      >
                        <origem.icon
                          size={24}
                          className={`mx-auto mb-2 ${
                            formData.origem === origem.value
                              ? "text-white"
                              : "text-vultrix-light/60"
                          }`}
                        />
                        <p
                          className={`text-sm font-medium ${
                            formData.origem === origem.value
                              ? "text-white"
                              : "text-vultrix-light/70"
                          }`}
                        >
                          {origem.label}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Data */}
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

                {/* Observação */}
                <div>
                  <label className="block text-sm font-medium text-vultrix-light mb-2">
                    Observação
                  </label>
                  <textarea
                    value={formData.observacao}
                    onChange={(e) =>
                      setFormData({ ...formData, observacao: e.target.value })
                    }
                    placeholder="Detalhes sobre o aporte..."
                    rows={3}
                    className="w-full px-4 py-3 bg-vultrix-black border border-vultrix-gray rounded-lg text-white placeholder-vultrix-light/40 focus:outline-none focus:border-vultrix-accent resize-none"
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
                    {editingAporte ? "Salvar" : "Registrar"}
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
