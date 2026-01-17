"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth/AuthProvider";
import { supabase } from "@/lib/supabase/client";
import { usePrinterModels } from "@/lib/hooks/usePrinterModels";
import { ModelSelector } from "@/components/ModelSelector";
import { WattsEstimator } from "@/components/WattsEstimator";
import {
  Printer,
  Plus,
  Edit2,
  Trash2,
  Star,
  Power,
  Zap,
  DollarSign,
  Clock,
  Save,
  X,
  Undo2,
  AlertCircle,
} from "lucide-react";

type PrinterData = {
  id: string;
  name: string;
  brand?: string;
  model?: string;
  notes?: string;
  power_watts_default: number;
  kwh_cost_override?: number;
  machine_hour_cost_override?: number;
  is_default: boolean;
  active: boolean;
  printer_model_id?: string;
  created_at: string;
};

export default function ImpressorasPage() {
  const { user } = useAuth();
  const { models, loading: modelsLoading } = usePrinterModels();
  const [printers, setPrinters] = useState<PrinterData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [suggestedModel, setSuggestedModel] = useState<string | null>(null);
  const [isEstimate, setIsEstimate] = useState(false);
  const [formData, setFormData] = useState<Partial<PrinterData>>({
    name: "",
    brand: "",
    model: "",
    notes: "",
    power_watts_default: 200,
    kwh_cost_override: undefined,
    machine_hour_cost_override: undefined,
    is_default: false,
    active: true,
    printer_model_id: undefined,
  });

  useEffect(() => {
    if (user) {
      loadPrinters();
    }
  }, [user]);

  const loadPrinters = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("printers")
        .select("*")
        .eq("user_id", user!.id)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: true });

      if (error) throw error;
      setPrinters(data || []);
    } catch (error) {
      console.error("Erro ao carregar impressoras:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (!formData.name || formData.power_watts_default! <= 0) {
        alert("Preencha o nome e o consumo (watts) corretamente");
        return;
      }

      if (editingId) {
        const { error } = await supabase
          .from("printers")
          .update({
            ...formData,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingId)
          .eq("user_id", user!.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("printers").insert({
          user_id: user!.id,
          ...formData,
        });

        if (error) throw error;
      }

      await loadPrinters();
      handleCancel();
    } catch (error) {
      console.error("Erro ao salvar impressora:", error);
      alert("Erro ao salvar impressora");
    }
  };

  const handleEdit = (printer: PrinterData) => {
    setFormData(printer);
    setEditingId(printer.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta impressora?")) return;

    try {
      const { error } = await supabase
        .from("printers")
        .delete()
        .eq("id", id)
        .eq("user_id", user!.id);

      if (error) throw error;
      await loadPrinters();
    } catch (error) {
      console.error("Erro ao deletar impressora:", error);
      alert("Erro ao deletar impressora");
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      // Clear all defaults first
      await supabase
        .from("printers")
        .update({ is_default: false })
        .eq("user_id", user!.id);

      // Set new default
      const { error } = await supabase
        .from("printers")
        .update({ is_default: true })
        .eq("id", id)
        .eq("user_id", user!.id);

      if (error) throw error;
      await loadPrinters();
    } catch (error) {
      console.error("Erro ao definir padrão:", error);
    }
  };

  const handleToggleActive = async (id: string, active: boolean) => {
    try {
      const { error } = await supabase
        .from("printers")
        .update({ active, updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("user_id", user!.id);

      if (error) throw error;
      await loadPrinters();
    } catch (error) {
      console.error("Erro ao alterar status:", error);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setSuggestedModel(null);
    setIsEstimate(false);
    setFormData({
      name: "",
      brand: "",
      model: "",
      notes: "",
      power_watts_default: 200,
      kwh_cost_override: undefined,
      machine_hour_cost_override: undefined,
      is_default: false,
      active: true,
      printer_model_id: undefined,
    });
  };

  const handleModelSelect = (model: any) => {
    setSuggestedModel(model.id);
    setIsEstimate(false);
    setFormData({
      ...formData,
      brand: model.brand,
      model: model.model,
      power_watts_default: model.avg_watts || formData.power_watts_default || 200,
      printer_model_id: model.id,
      notes: model.notes || formData.notes,
    });
  };

  const handleWattsEstimate = (watts: number) => {
    setIsEstimate(true);
    setFormData({
      ...formData,
      power_watts_default: watts,
    });
  };

  const handleUndoSuggestion = () => {
    setSuggestedModel(null);
    setIsEstimate(false);
    setFormData({
      ...formData,
      brand: "",
      model: "",
      power_watts_default: 200,
      printer_model_id: undefined,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white text-xl">Carregando impressoras...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Printer className="text-vultrix-accent" />
            Impressoras
          </h1>
          <p className="text-vultrix-light/60 mt-1">
            Gerencie suas impressoras 3D e custos operacionais
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-vultrix-accent hover:bg-vultrix-accent/80 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center gap-2"
        >
          <Plus size={20} />
          Nova Impressora
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-vultrix-dark border border-vultrix-gray rounded-lg p-6"
        >
          <h2 className="text-xl font-bold text-white mb-4">
            {editingId ? "Editar Impressora" : "Nova Impressora"}
          </h2>

          {/* Model Selector */}
          {!editingId && !modelsLoading && models.length > 0 && (
            <div className="mb-6 p-4 bg-vultrix-black/50 border border-vultrix-accent/20 rounded-lg">
              <ModelSelector
                models={models}
                onSelect={handleModelSelect}
                disabled={!!suggestedModel}
              />
              
              {suggestedModel && (
                <div className="mt-3 flex items-center gap-2 text-sm text-vultrix-accent">
                  <AlertCircle size={16} />
                  <span>Sugestão aplicada</span>
                  <button
                    type="button"
                    onClick={handleUndoSuggestion}
                    className="ml-auto flex items-center gap-1 hover:text-vultrix-accent/80 transition-colors"
                  >
                    <Undo2 size={14} />
                    Desfazer
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-vultrix-light mb-2">
                Nome *
              </label>
              <input
                type="text"
                value={formData.name || ""}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Ex: Bambu A1 Mini - Sala"
                className="w-full bg-vultrix-black border border-vultrix-gray rounded-lg px-4 py-2 text-white focus:outline-none focus:border-vultrix-accent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-vultrix-light mb-2">
                Marca
              </label>
              <input
                type="text"
                value={formData.brand || ""}
                onChange={(e) =>
                  setFormData({ ...formData, brand: e.target.value })
                }
                placeholder="Ex: Bambu Lab"
                className="w-full bg-vultrix-black border border-vultrix-gray rounded-lg px-4 py-2 text-white focus:outline-none focus:border-vultrix-accent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-vultrix-light mb-2">
                Modelo
              </label>
              <input
                type="text"
                value={formData.model || ""}
                onChange={(e) =>
                  setFormData({ ...formData, model: e.target.value })
                }
                placeholder="Ex: A1 Mini"
                className="w-full bg-vultrix-black border border-vultrix-gray rounded-lg px-4 py-2 text-white focus:outline-none focus:border-vultrix-accent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-vultrix-light mb-2 flex items-center gap-2 justify-between">
                <span className="flex items-center gap-2">
                  <Zap size={16} />
                  Consumo Padrão (Watts) *
                </span>
                <WattsEstimator onSelect={handleWattsEstimate} />
              </label>
              <input
                type="number"
                value={formData.power_watts_default || 0}
                onChange={(e) => {
                  setIsEstimate(false);
                  setFormData({
                    ...formData,
                    power_watts_default: parseFloat(e.target.value) || 0,
                  });
                }}
                min="1"
                className="w-full bg-vultrix-black border border-vultrix-gray rounded-lg px-4 py-2 text-white focus:outline-none focus:border-vultrix-accent"
              />
              {isEstimate && (
                <p className="text-xs text-orange-400 mt-1 flex items-center gap-1">
                  <AlertCircle size={12} />
                  Valor estimado - recomendado medir com tomada medidora
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-vultrix-light mb-2 flex items-center gap-2">
                <DollarSign size={16} />
                Custo kWh Override (opcional)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.kwh_cost_override || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    kwh_cost_override: e.target.value
                      ? parseFloat(e.target.value)
                      : undefined,
                  })
                }
                placeholder="Usar padrão do perfil"
                className="w-full bg-vultrix-black border border-vultrix-gray rounded-lg px-4 py-2 text-white focus:outline-none focus:border-vultrix-accent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-vultrix-light mb-2 flex items-center gap-2">
                <Clock size={16} />
                Custo/Hora Override (opcional)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.machine_hour_cost_override || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    machine_hour_cost_override: e.target.value
                      ? parseFloat(e.target.value)
                      : undefined,
                  })
                }
                placeholder="Usar padrão"
                className="w-full bg-vultrix-black border border-vultrix-gray rounded-lg px-4 py-2 text-white focus:outline-none focus:border-vultrix-accent"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-vultrix-light mb-2">
                Notas
              </label>
              <textarea
                value={formData.notes || ""}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Observações sobre esta impressora"
                rows={3}
                className="w-full bg-vultrix-black border border-vultrix-gray rounded-lg px-4 py-2 text-white focus:outline-none focus:border-vultrix-accent"
              />
            </div>

            <div className="md:col-span-2 flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_default || false}
                  onChange={(e) =>
                    setFormData({ ...formData, is_default: e.target.checked })
                  }
                  className="w-5 h-5 rounded border-vultrix-gray bg-vultrix-black checked:bg-vultrix-accent"
                />
                <span className="text-vultrix-light">Marcar como padrão</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.active ?? true}
                  onChange={(e) =>
                    setFormData({ ...formData, active: e.target.checked })
                  }
                  className="w-5 h-5 rounded border-vultrix-gray bg-vultrix-black checked:bg-vultrix-accent"
                />
                <span className="text-vultrix-light">Ativa</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSave}
              className="flex-1 bg-vultrix-accent hover:bg-vultrix-accent/80 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Save size={20} />
              Salvar
            </button>
            <button
              onClick={handleCancel}
              className="bg-vultrix-gray hover:bg-vultrix-gray/80 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <X size={20} />
              Cancelar
            </button>
          </div>
        </motion.div>
      )}

      {/* List */}
      <div className="grid gap-4">
        {printers.length === 0 ? (
          <div className="bg-vultrix-dark border border-vultrix-gray rounded-lg p-8 text-center">
            <Printer size={48} className="mx-auto text-vultrix-light/40 mb-4" />
            <p className="text-vultrix-light/60">
              Nenhuma impressora cadastrada ainda
            </p>
          </div>
        ) : (
          printers.map((printer) => (
            <motion.div
              key={printer.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`bg-vultrix-dark border rounded-lg p-6 ${
                printer.is_default
                  ? "border-vultrix-accent"
                  : "border-vultrix-gray"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-white">
                      {printer.name}
                    </h3>
                    {printer.is_default && (
                      <span className="bg-vultrix-accent/20 text-vultrix-accent text-xs px-2 py-1 rounded flex items-center gap-1">
                        <Star size={12} fill="currentColor" />
                        Padrão
                      </span>
                    )}
                    {!printer.active && (
                      <span className="bg-red-500/20 text-red-500 text-xs px-2 py-1 rounded">
                        Inativa
                      </span>
                    )}
                  </div>

                  {(printer.brand || printer.model) && (
                    <p className="text-vultrix-light/60 text-sm mb-3">
                      {[printer.brand, printer.model].filter(Boolean).join(" - ")}
                    </p>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-vultrix-light/60 mb-1">
                        Consumo
                      </p>
                      <p className="text-white font-medium">
                        {printer.power_watts_default}W
                      </p>
                    </div>
                    {printer.kwh_cost_override && (
                      <div>
                        <p className="text-xs text-vultrix-light/60 mb-1">
                          Custo kWh
                        </p>
                        <p className="text-white font-medium">
                          R$ {printer.kwh_cost_override.toFixed(2)}
                        </p>
                      </div>
                    )}
                    {printer.machine_hour_cost_override && (
                      <div>
                        <p className="text-xs text-vultrix-light/60 mb-1">
                          Custo/Hora
                        </p>
                        <p className="text-white font-medium">
                          R$ {printer.machine_hour_cost_override.toFixed(2)}
                        </p>
                      </div>
                    )}
                  </div>

                  {printer.notes && (
                    <p className="text-vultrix-light/60 text-sm mt-3">
                      {printer.notes}
                    </p>
                  )}
                </div>

                <div className="flex gap-2 ml-4">
                  {!printer.is_default && (
                    <button
                      onClick={() => handleSetDefault(printer.id)}
                      className="p-2 text-vultrix-light/60 hover:text-vultrix-accent hover:bg-vultrix-accent/10 rounded transition-colors"
                      title="Definir como padrão"
                    >
                      <Star size={20} />
                    </button>
                  )}
                  <button
                    onClick={() => handleToggleActive(printer.id, !printer.active)}
                    className="p-2 text-vultrix-light/60 hover:text-white hover:bg-vultrix-gray rounded transition-colors"
                    title={printer.active ? "Desativar" : "Ativar"}
                  >
                    <Power size={20} />
                  </button>
                  <button
                    onClick={() => handleEdit(printer)}
                    className="p-2 text-vultrix-light/60 hover:text-white hover:bg-vultrix-gray rounded transition-colors"
                    title="Editar"
                  >
                    <Edit2 size={20} />
                  </button>
                  <button
                    onClick={() => handleDelete(printer.id)}
                    className="p-2 text-vultrix-light/60 hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
                    title="Excluir"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
