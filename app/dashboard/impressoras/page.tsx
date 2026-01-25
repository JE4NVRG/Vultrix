"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth/AuthProvider";
import { supabase } from "@/lib/supabase/client";
import { usePrinterModelSearch } from "@/lib/hooks/usePrinterModelSearch";
import {
  useUserCostSettings,
  calcEnergyCostPerHour,
} from "@/lib/hooks/useUserCostSettings";
import { useOnboardingStatus } from "@/lib/hooks/useOnboardingStatus";
import {
  Printer,
  Plus,
  Edit2,
  Trash2,
  Star,
  StarOff,
  Power,
  PowerOff,
  Zap,
  Search,
  Sparkles,
  Wrench,
  Copy,
  Check,
  X,
  AlertCircle,
  Cpu,
  Flame,
  Droplet,
  ExternalLink,
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

type PrinterModel = {
  id: string;
  brand: string;
  model: string;
  avg_watts: number | null;
  notes?: string | null;
};

type FormErrors = {
  name?: string;
  power_watts_default?: string;
  brand?: string;
  model?: string;
  general?: string;
};

type QuickPreset = {
  id: string;
  name: string;
  description: string;
  watts: number;
  icon: React.ReactNode;
  gradient: string;
};

const QUICK_PRESETS: QuickPreset[] = [
  {
    id: "fdm-basic",
    name: "FDM Básica",
    description: "Impressora FDM sem cama aquecida",
    watts: 80,
    icon: <Cpu className="w-8 h-8" />,
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    id: "fdm-heated",
    name: "FDM com Cama",
    description: "Impressora FDM com cama aquecida",
    watts: 150,
    icon: <Flame className="w-8 h-8" />,
    gradient: "from-orange-500 to-red-500",
  },
  {
    id: "fdm-hightemp",
    name: "FDM High Temp",
    description: "Impressora FDM com alta temperatura",
    watts: 220,
    icon: <Zap className="w-8 h-8" />,
    gradient: "from-yellow-500 to-orange-600",
  },
  {
    id: "resin",
    name: "Resina",
    description: "Impressora de resina (SLA/DLP)",
    watts: 60,
    icon: <Droplet className="w-8 h-8" />,
    gradient: "from-purple-500 to-pink-500",
  },
];

export default function ImpressorasPage() {
  const { user } = useAuth();
  const { refresh: refreshOnboarding } = useOnboardingStatus();
  const { kwhCost, loading: costLoading } = useUserCostSettings();

  const [printers, setPrinters] = useState<PrinterData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"model" | "quick" | "manual">(
    "model",
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  // Model selector state
  const [searchQuery, setSearchQuery] = useState("");
  const { results: filteredModels, loading: searchLoading } =
    usePrinterModelSearch(searchQuery);
  const [selectedModel, setSelectedModel] = useState<PrinterModel | null>(null);

  // Quick preset state
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<Partial<PrinterData>>({
    name: "",
    brand: "",
    model: "",
    notes: "",
    power_watts_default: 200,
    is_default: false,
    active: true,
  });

  // Real-time cost preview
  const energyCostPreview = calcEnergyCostPerHour(
    formData.power_watts_default || 0,
    kwhCost,
  );

  useEffect(() => {
    if (user) {
      loadPrinters();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const openAddModal = (mode: "model" | "quick" | "manual" = "model") => {
    setEditingId(null);
    setModalMode(mode);
    setSelectedModel(null);
    setSelectedPreset(null);
    setSearchQuery("");
    setFormErrors({});
    setFormData({
      name: "",
      brand: "",
      model: "",
      notes: "",
      power_watts_default: 200,
      is_default: printers.length === 0, // First printer is default
      active: true,
    });
    setShowModal(true);
  };

  const openEditModal = (printer: PrinterData) => {
    setEditingId(printer.id);
    setModalMode("manual");
    setFormData(printer);
    setFormErrors({});
    setShowModal(true);
  };

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    // Name obrigatório
    if (!formData.name || !formData.name.trim()) {
      errors.name = "Nome da impressora é obrigatório";
    }

    // Power watts obrigatório e > 0
    if (!formData.power_watts_default || formData.power_watts_default <= 0) {
      errors.power_watts_default = "Consumo deve ser maior que zero";
    }

    // Brand/Model: se tiver um, exigir ambos (opcional)
    const hasBrand = formData.brand && formData.brand.trim();
    const hasModel = formData.model && formData.model.trim();

    if (hasBrand && !hasModel) {
      errors.model = "Informe o modelo ou deixe marca vazia";
    }

    if (hasModel && !hasBrand) {
      errors.brand = "Informe a marca ou deixe modelo vazio";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSelectModel = (model: PrinterModel) => {
    setSelectedModel(model);
    setFormErrors({});
    setFormData({
      ...formData,
      name: `${model.brand} ${model.model}`,
      brand: model.brand,
      model: model.model,
      power_watts_default: model.avg_watts || 200,
      notes: model.notes || "",
      printer_model_id: model.id,
    });
  };

  const handleSelectPreset = (presetId: string) => {
    const preset = QUICK_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    setSelectedPreset(presetId);
    setFormErrors({});
    setFormData({
      ...formData,
      name: `Minha ${preset.name}`,
      power_watts_default: preset.watts,
      brand: "",
      model: "",
    });
  };

  const handleSave = async (e?: React.FormEvent) => {
    // Prevent form submission
    if (e) {
      e.preventDefault();
    }

    // Clear previous errors
    setFormErrors({});

    // Validate
    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);

      if (editingId) {
        // Update
        const { error } = await supabase
          .from("printers")
          .update({
            name: formData.name,
            brand: formData.brand || null,
            model: formData.model || null,
            notes: formData.notes || null,
            power_watts_default: formData.power_watts_default,
            kwh_cost_override: formData.kwh_cost_override || null,
            machine_hour_cost_override:
              formData.machine_hour_cost_override || null,
            active: formData.active,
            printer_model_id: formData.printer_model_id || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingId);

        if (error) throw error;

        // Handle default change
        if (formData.is_default) {
          await setDefaultPrinter(editingId);
        }
      } else {
        // Insert
        const { data: newPrinter, error } = await supabase
          .from("printers")
          .insert({
            user_id: user!.id,
            name: formData.name,
            brand: formData.brand || null,
            model: formData.model || null,
            notes: formData.notes || null,
            power_watts_default: formData.power_watts_default,
            kwh_cost_override: formData.kwh_cost_override || null,
            machine_hour_cost_override:
              formData.machine_hour_cost_override || null,
            is_default: formData.is_default || false,
            active: formData.active || true,
            printer_model_id: formData.printer_model_id || null,
          })
          .select()
          .single();

        if (error) throw error;

        // If first printer or marked as default, set as default
        if (formData.is_default && newPrinter) {
          await setDefaultPrinter(newPrinter.id);
        }

        // Refresh onboarding status
        await refreshOnboarding();
      }

      await loadPrinters();

      // SUCCESS: Show feedback and close modal
      const energyCost = calcEnergyCostPerHour(
        formData.power_watts_default!,
        kwhCost,
      );
      alert(
        `✅ Impressora ${editingId ? "atualizada" : "cadastrada"} com sucesso!\n\n` +
          `💡 Energia estimada: R$ ${energyCost.toFixed(2)}/h\n` +
          `(Baseado em ${formData.power_watts_default}W e R$ ${kwhCost.toFixed(2)}/kWh)`,
      );

      setShowModal(false);
    } catch (error: any) {
      console.error("Erro ao salvar impressora:", error);

      // ERROR: Keep modal open and show error
      setFormErrors({
        general: error.message || "Erro ao salvar impressora. Tente novamente.",
      });
    } finally {
      setSaving(false);
    }
  };

  const setDefaultPrinter = async (printerId: string) => {
    try {
      // Primeiro, remove o default de todas as impressoras do usuário
      const { error: removeError } = await supabase
        .from("printers")
        .update({ is_default: false })
        .eq("user_id", user!.id);

      if (removeError) throw removeError;

      // Depois, define a impressora selecionada como padrão
      const { error: setError } = await supabase
        .from("printers")
        .update({ is_default: true })
        .eq("id", printerId)
        .eq("user_id", user!.id);

      if (setError) throw setError;

      await loadPrinters();
    } catch (error: any) {
      console.error("Erro ao definir impressora padrão:", error);

      // Show error to user
      setFormErrors({
        general: error.message || "Erro ao definir impressora padrão",
      });
    }
  };

  const toggleActive = async (printerId: string, currentActive: boolean) => {
    try {
      const { error } = await supabase
        .from("printers")
        .update({ active: !currentActive })
        .eq("id", printerId);

      if (error) throw error;
      await loadPrinters();
    } catch (error) {
      console.error("Erro ao alterar status:", error);
    }
  };

  const duplicatePrinter = async (printer: PrinterData) => {
    try {
      const { error } = await supabase.from("printers").insert({
        user_id: user!.id,
        name: `${printer.name} (Cópia)`,
        brand: printer.brand,
        model: printer.model,
        notes: printer.notes,
        power_watts_default: printer.power_watts_default,
        kwh_cost_override: printer.kwh_cost_override,
        machine_hour_cost_override: printer.machine_hour_cost_override,
        is_default: false,
        active: true,
        printer_model_id: printer.printer_model_id,
      });

      if (error) throw error;
      await loadPrinters();
    } catch (error) {
      console.error("Erro ao duplicar:", error);
    }
  };

  const deletePrinter = async (printerId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta impressora?")) return;

    try {
      const { error } = await supabase
        .from("printers")
        .delete()
        .eq("id", printerId);

      if (error) throw error;
      await loadPrinters();
      await refreshOnboarding();
    } catch (error) {
      console.error("Erro ao excluir:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-vultrix-accent mx-auto"></div>
          <p className="mt-4 text-vultrix-light/70">
            Carregando impressoras...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Impressoras</h1>
          <p className="text-vultrix-light/70">
            Gerencie suas impressoras para cálculos precisos de custos
          </p>
        </div>
        {printers.length > 0 && (
          <button
            onClick={() => openAddModal("model")}
            className="bg-gradient-to-r from-vultrix-accent to-purple-600 hover:from-vultrix-accent/80 hover:to-purple-600/80 text-white font-bold py-3 px-6 rounded-lg transition-all inline-flex items-center gap-2 shadow-lg shadow-vultrix-accent/20"
          >
            <Plus size={20} />
            Nova Impressora
          </button>
        )}
      </div>

      {/* Empty State */}
      {printers.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-vultrix-gray/50 to-vultrix-dark/30 border border-vultrix-light/10 rounded-2xl p-12 text-center"
        >
          <div className="max-w-md mx-auto">
            <div className="w-24 h-24 bg-gradient-to-br from-vultrix-accent/20 to-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-vultrix-accent/30">
              <Printer className="w-12 h-12 text-vultrix-accent" />
            </div>

            <h2 className="text-2xl font-bold text-white mb-3">
              Nenhuma impressora cadastrada
            </h2>
            <p className="text-vultrix-light/70 mb-8">
              Cadastre sua primeira impressora para começar a calcular custos
              reais e gerenciar suas produções
            </p>

            <div className="space-y-3">
              <button
                onClick={() => openAddModal("model")}
                className="w-full bg-gradient-to-r from-vultrix-accent to-purple-600 hover:from-vultrix-accent/80 hover:to-purple-600/80 text-white font-bold py-4 px-6 rounded-lg transition-all inline-flex items-center justify-center gap-2 shadow-lg shadow-vultrix-accent/20"
              >
                <Sparkles size={20} />
                Escolher Modelo (Recomendado)
              </button>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => openAddModal("quick")}
                  className="bg-vultrix-gray/50 hover:bg-vultrix-gray border border-vultrix-light/10 text-white font-semibold py-3 px-4 rounded-lg transition-all inline-flex items-center justify-center gap-2"
                >
                  <Zap size={18} />
                  Cadastro Rápido
                </button>

                <button
                  onClick={() => openAddModal("manual")}
                  className="bg-vultrix-gray/50 hover:bg-vultrix-gray border border-vultrix-light/10 text-white font-semibold py-3 px-4 rounded-lg transition-all inline-flex items-center justify-center gap-2"
                >
                  <Wrench size={18} />
                  Manual
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      ) : (
        /* Printers Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {printers.map((printer, index) => (
            <motion.div
              key={printer.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`bg-gradient-to-br from-vultrix-gray/50 to-vultrix-dark/30 border rounded-xl p-6 ${
                printer.is_default
                  ? "border-vultrix-accent shadow-lg shadow-vultrix-accent/10"
                  : "border-vultrix-light/10"
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-bold text-white">
                      {printer.name}
                    </h3>
                    {printer.is_default && (
                      <Star className="w-4 h-4 text-vultrix-accent fill-vultrix-accent" />
                    )}
                  </div>
                  {(printer.brand || printer.model) && (
                    <p className="text-sm text-vultrix-light/70">
                      {printer.brand} {printer.model}
                    </p>
                  )}
                </div>

                {/* Status Badge */}
                <div
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    printer.active
                      ? "bg-green-500/20 text-green-500"
                      : "bg-red-500/20 text-red-500"
                  }`}
                >
                  {printer.active ? "Ativa" : "Inativa"}
                </div>
              </div>

              {/* Stats */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  <span className="text-vultrix-light/70">Consumo:</span>
                  <span className="text-white font-semibold ml-auto">
                    {printer.power_watts_default}W
                  </span>
                </div>

                {/* Energy Cost */}
                {printer.machine_hour_cost_override ? (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-lg">💰</span>
                    <span className="text-vultrix-light/70">
                      Custo/h (override):
                    </span>
                    <span className="text-green-400 font-bold ml-auto">
                      R$ {printer.machine_hour_cost_override.toFixed(2)}/h
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-lg">💡</span>
                    <span className="text-vultrix-light/70">Energia:</span>
                    <span className="text-green-400 font-bold ml-auto">
                      R${" "}
                      {calcEnergyCostPerHour(
                        printer.power_watts_default,
                        kwhCost,
                      ).toFixed(2)}
                      /h
                    </span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-4 border-t border-vultrix-light/10">
                {!printer.is_default && (
                  <button
                    onClick={() => setDefaultPrinter(printer.id)}
                    className="flex-1 bg-vultrix-accent/20 hover:bg-vultrix-accent/30 text-vultrix-accent border border-vultrix-accent/30 font-semibold py-2 px-3 rounded-lg transition-all text-sm inline-flex items-center justify-center gap-1"
                    title="Definir como padrão"
                  >
                    <Star size={14} />
                    Padrão
                  </button>
                )}

                <button
                  onClick={() => toggleActive(printer.id, printer.active)}
                  className="flex-1 bg-vultrix-gray/50 hover:bg-vultrix-gray text-white font-semibold py-2 px-3 rounded-lg transition-all text-sm inline-flex items-center justify-center gap-1"
                  title={printer.active ? "Desativar" : "Ativar"}
                >
                  {printer.active ? (
                    <PowerOff size={14} />
                  ) : (
                    <Power size={14} />
                  )}
                  {printer.active ? "Desativar" : "Ativar"}
                </button>

                <button
                  onClick={() => openEditModal(printer)}
                  className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-500 border border-blue-500/30 p-2 rounded-lg transition-all"
                  title="Editar"
                >
                  <Edit2 size={16} />
                </button>

                <button
                  onClick={() => duplicatePrinter(printer)}
                  className="bg-green-500/20 hover:bg-green-500/30 text-green-500 border border-green-500/30 p-2 rounded-lg transition-all"
                  title="Duplicar"
                >
                  <Copy size={16} />
                </button>

                <button
                  onClick={() => deletePrinter(printer.id)}
                  className="bg-red-500/20 hover:bg-red-500/30 text-red-500 border border-red-500/30 p-2 rounded-lg transition-all"
                  title="Excluir"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={(e) => {
              // Prevent closing during save
              if (!saving) {
                setShowModal(false);
              }
            }}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gradient-to-br from-vultrix-gray to-vultrix-dark border border-vultrix-light/20 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">
                  {editingId ? "Editar Impressora" : "Nova Impressora"}
                </h2>
                <button
                  onClick={() => {
                    if (!saving) {
                      setShowModal(false);
                    }
                  }}
                  disabled={saving}
                  className="text-vultrix-light/60 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  title={saving ? "Salvando..." : "Fechar"}
                >
                  <X size={24} />
                </button>
              </div>

              {/* Mode Selector (only for new printers) */}
              {!editingId && (
                <div className="grid grid-cols-3 gap-3 mb-6">
                  <button
                    onClick={() => setModalMode("model")}
                    className={`py-3 px-4 rounded-lg font-semibold transition-all ${
                      modalMode === "model"
                        ? "bg-gradient-to-r from-vultrix-accent to-purple-600 text-white shadow-lg shadow-vultrix-accent/20"
                        : "bg-vultrix-gray/50 text-vultrix-light/70 hover:bg-vultrix-gray"
                    }`}
                  >
                    <Sparkles className="w-5 h-5 mx-auto mb-1" />
                    Modelo
                  </button>

                  <button
                    onClick={() => setModalMode("quick")}
                    className={`py-3 px-4 rounded-lg font-semibold transition-all ${
                      modalMode === "quick"
                        ? "bg-gradient-to-r from-vultrix-accent to-purple-600 text-white shadow-lg shadow-vultrix-accent/20"
                        : "bg-vultrix-gray/50 text-vultrix-light/70 hover:bg-vultrix-gray"
                    }`}
                  >
                    <Zap className="w-5 h-5 mx-auto mb-1" />
                    Rápido
                  </button>

                  <button
                    onClick={() => setModalMode("manual")}
                    className={`py-3 px-4 rounded-lg font-semibold transition-all ${
                      modalMode === "manual"
                        ? "bg-gradient-to-r from-vultrix-accent to-purple-600 text-white shadow-lg shadow-vultrix-accent/20"
                        : "bg-vultrix-gray/50 text-vultrix-light/70 hover:bg-vultrix-gray"
                    }`}
                  >
                    <Wrench className="w-5 h-5 mx-auto mb-1" />
                    Manual
                  </button>
                </div>
              )}

              {/* Mode: Choose Model */}
              {modalMode === "model" && !editingId && (
                <div className="space-y-4">
                  {!selectedModel ? (
                    <>
                      <div>
                        <label className="block text-sm font-semibold text-white mb-2">
                          Buscar Modelo
                        </label>
                        <div className="relative">
                          <Search
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-vultrix-light/50"
                            size={20}
                          />
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Digite marca ou modelo..."
                            className="w-full bg-vultrix-dark border border-vultrix-light/20 rounded-lg py-3 px-10 text-white placeholder-vultrix-light/50 focus:outline-none focus:border-vultrix-accent"
                          />
                        </div>
                      </div>

                      {/* Model suggestions */}
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {searchLoading ? (
                          <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-vultrix-accent mx-auto"></div>
                            <p className="text-vultrix-light/60 text-sm mt-2">
                              Buscando modelos...
                            </p>
                          </div>
                        ) : filteredModels.length > 0 ? (
                          filteredModels.map((model) => (
                            <button
                              key={model.id}
                              onClick={() => handleSelectModel(model)}
                              className="w-full bg-vultrix-dark/50 hover:bg-vultrix-dark border border-vultrix-light/10 hover:border-vultrix-accent/50 rounded-lg p-4 text-left transition-all group"
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-white font-semibold group-hover:text-vultrix-accent transition-colors">
                                    {model.brand} {model.model}
                                  </p>
                                  {model.notes && (
                                    <p className="text-sm text-vultrix-light/60 mt-1">
                                      {model.notes}
                                    </p>
                                  )}
                                </div>
                                <div className="bg-yellow-500/20 text-yellow-500 px-3 py-1 rounded-full text-sm font-semibold">
                                  {model.avg_watts || "?"}W
                                </div>
                              </div>
                            </button>
                          ))
                        ) : searchQuery.length >= 2 ? (
                          <div className="text-center py-8 text-vultrix-light/60">
                            Nenhum modelo encontrado
                          </div>
                        ) : (
                          <div className="text-center py-8 text-vultrix-light/60">
                            Digite pelo menos 2 caracteres para buscar
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    /* Selected Model Confirmation */
                    <div className="space-y-4">
                      <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <Check className="w-6 h-6 text-green-500 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-green-500 font-semibold mb-1">
                              Modelo Selecionado
                            </p>
                            <p className="text-white text-lg font-bold">
                              {selectedModel.brand} {selectedModel.model}
                            </p>
                            <p className="text-vultrix-light/70 text-sm mt-2">
                              Consumo sugerido:{" "}
                              <span className="text-yellow-500 font-semibold">
                                {selectedModel.avg_watts}W
                              </span>
                            </p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-white mb-2">
                          Nome da Impressora
                        </label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                          className="w-full bg-vultrix-dark border border-vultrix-light/20 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-vultrix-accent"
                        />
                      </div>

                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="is_default_model"
                          checked={formData.is_default}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              is_default: e.target.checked,
                            })
                          }
                          className="w-5 h-5"
                        />
                        <label
                          htmlFor="is_default_model"
                          className="text-white cursor-pointer"
                        >
                          Definir como impressora padrão
                        </label>
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={() => setSelectedModel(null)}
                          disabled={saving}
                          className="flex-1 bg-vultrix-gray hover:bg-vultrix-gray/80 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-all"
                        >
                          Voltar
                        </button>
                        <button
                          onClick={handleSave}
                          disabled={saving}
                          className="flex-1 bg-gradient-to-r from-vultrix-accent to-purple-600 hover:from-vultrix-accent/80 hover:to-purple-600/80 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-all shadow-lg shadow-vultrix-accent/20 flex items-center justify-center gap-2"
                        >
                          {saving ? (
                            <>
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                              Salvando...
                            </>
                          ) : (
                            "Salvar Impressora"
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Mode: Quick Preset */}
              {modalMode === "quick" && !editingId && (
                <div className="space-y-4">
                  {!selectedPreset ? (
                    <div className="grid grid-cols-2 gap-4">
                      {QUICK_PRESETS.map((preset) => (
                        <button
                          key={preset.id}
                          onClick={() => handleSelectPreset(preset.id)}
                          className={`bg-gradient-to-br ${preset.gradient} hover:shadow-xl p-6 rounded-xl text-white transition-all group`}
                        >
                          <div className="opacity-80 group-hover:opacity-100 mb-3">
                            {preset.icon}
                          </div>
                          <h3 className="font-bold text-lg mb-1">
                            {preset.name}
                          </h3>
                          <p className="text-sm opacity-90 mb-3">
                            {preset.description}
                          </p>
                          <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full inline-block text-sm font-semibold">
                            {preset.watts}W
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    /* Quick Preset Form */
                    <div className="space-y-4">
                      <div className="bg-vultrix-accent/10 border border-vultrix-accent/30 rounded-lg p-4">
                        <p className="text-vultrix-accent font-semibold mb-2">
                          Preset Selecionado
                        </p>
                        <p className="text-white text-lg font-bold">
                          {
                            QUICK_PRESETS.find((p) => p.id === selectedPreset)
                              ?.name
                          }
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-white mb-2">
                          Nome da Impressora
                        </label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                          className="w-full bg-vultrix-dark border border-vultrix-light/20 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-vultrix-accent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-white mb-2">
                          Consumo (Watts)
                        </label>
                        <input
                          type="number"
                          value={formData.power_watts_default}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              power_watts_default: Number(e.target.value),
                            })
                          }
                          className="w-full bg-vultrix-dark border border-vultrix-light/20 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-vultrix-accent"
                        />
                      </div>

                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="is_default_quick"
                          checked={formData.is_default}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              is_default: e.target.checked,
                            })
                          }
                          className="w-5 h-5"
                        />
                        <label
                          htmlFor="is_default_quick"
                          className="text-white cursor-pointer"
                        >
                          Definir como impressora padrão
                        </label>
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={() => setSelectedPreset(null)}
                          disabled={saving}
                          className="flex-1 bg-vultrix-gray hover:bg-vultrix-gray/80 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-all"
                        >
                          Voltar
                        </button>
                        <button
                          onClick={handleSave}
                          disabled={saving}
                          className="flex-1 bg-gradient-to-r from-vultrix-accent to-purple-600 hover:from-vultrix-accent/80 hover:to-purple-600/80 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-all shadow-lg shadow-vultrix-accent/20 flex items-center justify-center gap-2"
                        >
                          {saving ? (
                            <>
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                              Salvando...
                            </>
                          ) : (
                            "Salvar Impressora"
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Mode: Manual */}
              {modalMode === "manual" && (
                <div className="space-y-4">
                  {/* General Error */}
                  {formErrors.general && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-red-500 font-semibold">
                          Erro ao salvar
                        </p>
                        <p className="text-red-400 text-sm mt-1">
                          {formErrors.general}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-semibold text-white mb-2">
                        Nome *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => {
                          setFormData({ ...formData, name: e.target.value });
                          if (formErrors.name)
                            setFormErrors({ ...formErrors, name: undefined });
                        }}
                        className={`w-full bg-vultrix-dark border rounded-lg py-3 px-4 text-white focus:outline-none ${
                          formErrors.name
                            ? "border-red-500 focus:border-red-500"
                            : "border-vultrix-light/20 focus:border-vultrix-accent"
                        }`}
                        placeholder="Ex: Bambu Lab A1"
                      />
                      {formErrors.name && (
                        <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {formErrors.name}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-white mb-2">
                        Marca
                      </label>
                      <input
                        type="text"
                        value={formData.brand || ""}
                        onChange={(e) => {
                          setFormData({ ...formData, brand: e.target.value });
                          if (formErrors.brand)
                            setFormErrors({ ...formErrors, brand: undefined });
                        }}
                        className={`w-full bg-vultrix-dark border rounded-lg py-3 px-4 text-white focus:outline-none ${
                          formErrors.brand
                            ? "border-red-500 focus:border-red-500"
                            : "border-vultrix-light/20 focus:border-vultrix-accent"
                        }`}
                        placeholder="Ex: Bambu Lab"
                      />
                      {formErrors.brand && (
                        <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {formErrors.brand}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-white mb-2">
                        Modelo
                      </label>
                      <input
                        type="text"
                        value={formData.model || ""}
                        onChange={(e) => {
                          setFormData({ ...formData, model: e.target.value });
                          if (formErrors.model)
                            setFormErrors({ ...formErrors, model: undefined });
                        }}
                        className={`w-full bg-vultrix-dark border rounded-lg py-3 px-4 text-white focus:outline-none ${
                          formErrors.model
                            ? "border-red-500 focus:border-red-500"
                            : "border-vultrix-light/20 focus:border-vultrix-accent"
                        }`}
                        placeholder="Ex: A1 Mini"
                      />
                      {formErrors.model && (
                        <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {formErrors.model}
                        </p>
                      )}
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-semibold text-white mb-2">
                        Consumo (Watts) *
                      </label>
                      <input
                        type="number"
                        value={formData.power_watts_default}
                        onChange={(e) => {
                          setFormData({
                            ...formData,
                            power_watts_default: Number(e.target.value),
                          });
                          if (formErrors.power_watts_default) {
                            setFormErrors({
                              ...formErrors,
                              power_watts_default: undefined,
                            });
                          }
                        }}
                        className={`w-full bg-vultrix-dark border rounded-lg py-3 px-4 text-white focus:outline-none ${
                          formErrors.power_watts_default
                            ? "border-red-500 focus:border-red-500"
                            : "border-vultrix-light/20 focus:border-vultrix-accent"
                        }`}
                        placeholder="Ex: 150"
                      />
                      {formErrors.power_watts_default && (
                        <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {formErrors.power_watts_default}
                        </p>
                      )}

                      {/* Real-time cost preview */}
                      {!costLoading && energyCostPreview > 0 && (
                        <div className="mt-2 bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                          <p className="text-green-400 text-sm font-semibold flex items-center gap-2">
                            <span className="text-base">💡</span>
                            Energia estimada: R$ {energyCostPreview.toFixed(2)}
                            /h
                          </p>
                          <p className="text-green-400/70 text-xs mt-1">
                            Baseado em R$ {kwhCost.toFixed(2)}/kWh
                          </p>
                        </div>
                      )}

                      {!costLoading && kwhCost === 0.95 && (
                        <div className="mt-2 bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                          <p className="text-blue-400 text-xs flex items-center gap-2">
                            <AlertCircle className="w-3 h-3" />
                            Usando custo padrão.
                            <a
                              href="/dashboard/perfil"
                              className="underline inline-flex items-center gap-1 hover:text-blue-300"
                            >
                              Configurar no perfil
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-semibold text-white mb-2">
                        Notas
                      </label>
                      <textarea
                        value={formData.notes || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, notes: e.target.value })
                        }
                        rows={3}
                        className="w-full bg-vultrix-dark border border-vultrix-light/20 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-vultrix-accent resize-none"
                        placeholder="Observações sobre esta impressora..."
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <input
                      type="checkbox"
                      id="is_default_manual"
                      checked={formData.is_default}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          is_default: e.target.checked,
                        })
                      }
                      className="w-5 h-5"
                    />
                    <label
                      htmlFor="is_default_manual"
                      className="text-white cursor-pointer"
                    >
                      Definir como impressora padrão
                    </label>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="active_manual"
                      checked={formData.active}
                      onChange={(e) =>
                        setFormData({ ...formData, active: e.target.checked })
                      }
                      className="w-5 h-5"
                    />
                    <label
                      htmlFor="active_manual"
                      className="text-white cursor-pointer"
                    >
                      Impressora ativa
                    </label>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => setShowModal(false)}
                      disabled={saving}
                      className="flex-1 bg-vultrix-gray hover:bg-vultrix-gray/80 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-all"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex-1 bg-gradient-to-r from-vultrix-accent to-purple-600 hover:from-vultrix-accent/80 hover:to-purple-600/80 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-all shadow-lg shadow-vultrix-accent/20 flex items-center justify-center gap-2"
                    >
                      {saving ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          {editingId ? "Atualizando..." : "Salvando..."}
                        </>
                      ) : editingId ? (
                        "Atualizar"
                      ) : (
                        "Salvar"
                      )}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
