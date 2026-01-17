"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { supabase } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { parse3mfFile, ProjectData3mf } from "@/lib/utils/parse3mf";
import { useUserCostSettings } from "@/lib/hooks/useUserCostSettings";
import { useFilaments, Filament } from "@/lib/hooks/useFilaments";
import { usePrinters } from "@/lib/hooks/usePrinters";

type RegistrationMode = "3mf" | "quick" | "manual";

type MaterialMapping = {
  materialIndex: number;
  materialName: string;
  materialColor: string;
  weightGrams: number;
  filamentId: string | null;
};

type QuickFormData = {
  name: string;
  timeHours: number;
  weightGrams: number;
  filamentId: string;
};

type ManualFormData = {
  name: string;
  description: string;
  timeHours: number;
  materials: Array<{
    filamentId: string;
    weightGrams: number;
  }>;
  overrideMaterialCost?: number;
  overrideEnergyCost?: number;
  customMarginPercent?: number;
};

export default function ProdutosPage() {
  const { user } = useAuth();
  const { kwhCost, loading: costLoading } = useUserCostSettings();
  const { filaments, loading: filamentsLoading } = useFilaments();
  const { printers, defaultPrinter } = usePrinters();

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [mode, setMode] = useState<RegistrationMode>("3mf");
  const [saving, setSaving] = useState(false);

  // 3MF Mode State
  const [projectData, setProjectData] = useState<ProjectData3mf | null>(null);
  const [materialMappings, setMaterialMappings] = useState<MaterialMapping[]>(
    [],
  );
  const [uploading, setUploading] = useState(false);

  // Quick Mode State
  const [quickForm, setQuickForm] = useState<QuickFormData>({
    name: "",
    timeHours: 0,
    weightGrams: 0,
    filamentId: "",
  });

  // Manual Mode State
  const [manualForm, setManualForm] = useState<ManualFormData>({
    name: "",
    description: "",
    timeHours: 0,
    materials: [],
  });

  // Products List
  const [products, setProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Load products on mount
  useState(() => {
    loadProducts();
  });

  const loadProducts = async () => {
    try {
      setLoadingProducts(true);
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (err) {
      console.error("Erro ao carregar produtos:", err);
    } finally {
      setLoadingProducts(false);
    }
  };

  // === 3MF MODE HANDLERS ===
  const handle3mfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const data = await parse3mfFile(file);
      setProjectData(data);

      // Initialize material mappings
      const mappings: MaterialMapping[] = data.materials.map((mat, index) => ({
        materialIndex: index,
        materialName: mat.name,
        materialColor: mat.color,
        weightGrams: mat.weight,
        filamentId: null,
      }));

      setMaterialMappings(mappings);
    } catch (err: any) {
      alert(`Erro ao processar arquivo .3mf: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const updateMaterialMapping = (index: number, filamentId: string) => {
    setMaterialMappings((prev) =>
      prev.map((m, i) => (i === index ? { ...m, filamentId } : m)),
    );
  };

  // === QUICK MODE HANDLERS ===
  const updateQuickForm = (field: keyof QuickFormData, value: any) => {
    setQuickForm((prev) => ({ ...prev, [field]: value }));
  };

  // === MANUAL MODE HANDLERS ===
  const updateManualForm = (field: keyof ManualFormData, value: any) => {
    setManualForm((prev) => ({ ...prev, [field]: value }));
  };

  const addManualMaterial = () => {
    setManualForm((prev) => ({
      ...prev,
      materials: [...prev.materials, { filamentId: "", weightGrams: 0 }],
    }));
  };

  const removeManualMaterial = (index: number) => {
    setManualForm((prev) => ({
      ...prev,
      materials: prev.materials.filter((_, i) => i !== index),
    }));
  };

  const updateManualMaterial = (
    index: number,
    field: "filamentId" | "weightGrams",
    value: any,
  ) => {
    setManualForm((prev) => ({
      ...prev,
      materials: prev.materials.map((m, i) =>
        i === index ? { ...m, [field]: value } : m,
      ),
    }));
  };

  // === COST CALCULATIONS ===
  const calculateCosts = () => {
    let materialCost = 0;
    let timeHours = 0;
    let totalWeight = 0;

    if (mode === "3mf" && projectData) {
      timeHours = projectData.totalTime;
      totalWeight = projectData.totalWeight;

      // Calculate material cost from mappings
      materialMappings.forEach((mapping) => {
        if (mapping.filamentId) {
          const filament = filaments.find((f) => f.id === mapping.filamentId);
          if (filament) {
            const weightKg = mapping.weightGrams / 1000;
            materialCost += weightKg * filament.custo_por_kg;
          }
        }
      });
    } else if (mode === "quick") {
      timeHours = quickForm.timeHours;
      totalWeight = quickForm.weightGrams;

      const filament = filaments.find((f) => f.id === quickForm.filamentId);
      if (filament) {
        const weightKg = quickForm.weightGrams / 1000;
        materialCost = weightKg * filament.custo_por_kg;
      }
    } else if (mode === "manual") {
      timeHours = manualForm.timeHours;

      // Use override or calculate
      if (manualForm.overrideMaterialCost !== undefined) {
        materialCost = manualForm.overrideMaterialCost;
      } else {
        manualForm.materials.forEach((mat) => {
          const filament = filaments.find((f) => f.id === mat.filamentId);
          if (filament) {
            const weightKg = mat.weightGrams / 1000;
            materialCost += weightKg * filament.custo_por_kg;
            totalWeight += mat.weightGrams;
          }
        });
      }
    }

    // Energy cost
    const printerWatts = defaultPrinter?.power_watts_default || 250;
    const energyCost =
      manualForm.overrideEnergyCost !== undefined
        ? manualForm.overrideEnergyCost
        : (timeHours * printerWatts * kwhCost) / 1000;

    const totalCost = materialCost + energyCost;
    const marginPercent = manualForm.customMarginPercent || 50;
    const minimumPrice = totalCost * 1.2;
    const suggestedPrice = totalCost * (1 + marginPercent / 100);

    return {
      materialCost,
      energyCost,
      totalCost,
      minimumPrice,
      suggestedPrice,
      totalWeight,
      timeHours,
    };
  };

  const costs = calculateCosts();

  // === SAVE HANDLERS ===
  const canSave = () => {
    if (mode === "3mf") {
      return (
        projectData &&
        materialMappings.every((m) => m.filamentId) &&
        materialMappings.length > 0
      );
    } else if (mode === "quick") {
      return (
        quickForm.name.trim() &&
        quickForm.timeHours > 0 &&
        quickForm.weightGrams > 0 &&
        quickForm.filamentId
      );
    } else if (mode === "manual") {
      return (
        manualForm.name.trim() &&
        manualForm.timeHours > 0 &&
        manualForm.materials.length > 0 &&
        manualForm.materials.every((m) => m.filamentId && m.weightGrams > 0)
      );
    }
    return false;
  };

  const handleSave = async () => {
    if (!canSave()) {
      alert("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      setSaving(true);

      let productName = "";
      if (mode === "3mf") productName = projectData!.name;
      else if (mode === "quick") productName = quickForm.name;
      else productName = manualForm.name;

      const { data: product, error: productError } = await supabase
        .from("products")
        .insert({
          user_id: user!.id,
          nome: productName,
          descricao: mode === "manual" ? manualForm.description : null,
          tempo_impressao_horas: costs.timeHours,
          peso_usado: costs.totalWeight,
          custo_material: costs.materialCost,
          custo_energia: costs.energyCost,
          custo_total: costs.totalCost,
          preco_venda: costs.suggestedPrice,
          margem_percentual:
            mode === "manual" && manualForm.customMarginPercent
              ? manualForm.customMarginPercent
              : 50,
          status: "ativo",
        })
        .select()
        .single();

      if (productError) throw productError;

      // Save multi-filament breakdown if needed
      if (
        mode === "3mf" ||
        (mode === "manual" && manualForm.materials.length > 1)
      ) {
        const filamentBreakdown =
          mode === "3mf"
            ? materialMappings.map((m) => ({
                product_id: product.id,
                filament_id: m.filamentId!,
                peso_gramas: m.weightGrams,
              }))
            : manualForm.materials.map((m) => ({
                product_id: product.id,
                filament_id: m.filamentId,
                peso_gramas: m.weightGrams,
              }));

        const { error: breakdownError } = await supabase
          .from("product_filaments")
          .insert(filamentBreakdown);

        if (breakdownError) throw breakdownError;
      }

      // Reset and reload
      alert("Produto cadastrado com sucesso!");
      resetModal();
      setShowModal(false);
      loadProducts();
    } catch (err: any) {
      console.error("Erro ao salvar produto:", err);
      alert(`Erro ao salvar produto: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const resetModal = () => {
    setMode("3mf");
    setProjectData(null);
    setMaterialMappings([]);
    setQuickForm({ name: "", timeHours: 0, weightGrams: 0, filamentId: "" });
    setManualForm({
      name: "",
      description: "",
      timeHours: 0,
      materials: [],
    });
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
              Produtos
            </h1>
            <p className="text-gray-400 mt-2">
              Gerencie seus produtos impressos em 3D
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-semibold hover:opacity-90 transition-opacity"
          >
            + Novo Produto
          </button>
        </div>

        {/* Products Grid */}
        {loadingProducts ? (
          <div className="text-center text-gray-400 py-12">
            Carregando produtos...
          </div>
        ) : products.length === 0 ? (
          <div className="text-center text-gray-400 py-12">
            Nenhum produto cadastrado ainda.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 hover:border-purple-600 transition-colors"
              >
                <h3 className="text-xl font-bold mb-2">{product.nome}</h3>
                {product.descricao && (
                  <p className="text-gray-400 text-sm mb-4">
                    {product.descricao}
                  </p>
                )}

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Tempo:</span>
                    <span>{product.tempo_impressao_horas.toFixed(2)}h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Peso:</span>
                    <span>{product.peso_usado.toFixed(0)}g</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Custo Total:</span>
                    <span>R$ {product.custo_total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-green-400">
                    <span>Preço Venda:</span>
                    <span>R$ {product.preco_venda.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-purple-400">
                    <span>Margem:</span>
                    <span>{product.margem_percentual.toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !saving && setShowModal(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
            />

            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
              <div
                className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="border-b border-zinc-800 p-6">
                  <h2 className="text-2xl font-bold">Cadastrar Novo Produto</h2>
                  <p className="text-gray-400 text-sm mt-1">
                    Escolha o modo de cadastro e preencha os dados
                  </p>
                </div>

                {/* Mode Selector */}
                <div className="p-6 border-b border-zinc-800">
                  <div className="flex gap-4">
                    <button
                      onClick={() => setMode("3mf")}
                      className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                        mode === "3mf"
                          ? "bg-gradient-to-r from-purple-600 to-pink-600"
                          : "bg-zinc-800 hover:bg-zinc-700"
                      }`}
                    >
                      📁 Importar .3mf
                      <span className="block text-xs text-gray-400 mt-1">
                        (Recomendado)
                      </span>
                    </button>

                    <button
                      onClick={() => setMode("quick")}
                      className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                        mode === "quick"
                          ? "bg-gradient-to-r from-purple-600 to-pink-600"
                          : "bg-zinc-800 hover:bg-zinc-700"
                      }`}
                    >
                      ⚡ Cadastro Rápido
                      <span className="block text-xs text-gray-400 mt-1">
                        Apenas essencial
                      </span>
                    </button>

                    <button
                      onClick={() => setMode("manual")}
                      className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                        mode === "manual"
                          ? "bg-gradient-to-r from-purple-600 to-pink-600"
                          : "bg-zinc-800 hover:bg-zinc-700"
                      }`}
                    >
                      ✏️ Manual Completo
                      <span className="block text-xs text-gray-400 mt-1">
                        Controle total
                      </span>
                    </button>
                  </div>
                </div>

                {/* Modal Body - Dynamic Content by Mode */}
                <div className="p-6 space-y-6">
                  {/* 3MF MODE */}
                  {mode === "3mf" && (
                    <>
                      {!projectData ? (
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Arquivo .3mf do Bambu Studio
                          </label>
                          <input
                            type="file"
                            accept=".3mf"
                            onChange={handle3mfUpload}
                            disabled={uploading}
                            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-purple-600 disabled:opacity-50"
                          />
                          {uploading && (
                            <p className="text-sm text-gray-400 mt-2">
                              Processando arquivo...
                            </p>
                          )}
                        </div>
                      ) : (
                        <>
                          {/* Project Data Preview */}
                          <div className="bg-zinc-800 rounded-lg p-4 space-y-2">
                            <h3 className="font-semibold text-lg">
                              {projectData.name}
                            </h3>
                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div>
                                <span className="text-gray-400">Tempo:</span>
                                <span className="ml-2">
                                  {projectData.totalTime.toFixed(2)}h
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-400">Peso:</span>
                                <span className="ml-2">
                                  {projectData.totalWeight.toFixed(0)}g
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-400">
                                  Materiais:
                                </span>
                                <span className="ml-2">
                                  {projectData.materials.length}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Material Mapping */}
                          <div>
                            <h4 className="font-semibold mb-3">
                              Vincular Materiais aos Filamentos
                            </h4>
                            <div className="space-y-3">
                              {materialMappings.map((mapping, index) => (
                                <div
                                  key={index}
                                  className="bg-zinc-800 rounded-lg p-4 space-y-2"
                                >
                                  <div className="flex items-center gap-3">
                                    <div
                                      className="w-6 h-6 rounded-full border-2 border-white"
                                      style={{
                                        backgroundColor: mapping.materialColor,
                                      }}
                                    />
                                    <div className="flex-1">
                                      <div className="font-medium">
                                        {mapping.materialName}
                                      </div>
                                      <div className="text-xs text-gray-400">
                                        {mapping.weightGrams.toFixed(0)}g
                                      </div>
                                    </div>
                                  </div>

                                  <select
                                    value={mapping.filamentId || ""}
                                    onChange={(e) =>
                                      updateMaterialMapping(
                                        index,
                                        e.target.value,
                                      )
                                    }
                                    className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg focus:outline-none focus:border-purple-600"
                                  >
                                    <option value="">
                                      Selecione o filamento...
                                    </option>
                                    {filaments.map((fil) => (
                                      <option key={fil.id} value={fil.id}>
                                        {fil.nome} - {fil.marca} ({fil.tipo}) -
                                        R$ {fil.custo_por_kg.toFixed(2)}/kg
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                    </>
                  )}

                  {/* QUICK MODE */}
                  {mode === "quick" && (
                    <>
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Nome do Produto *
                        </label>
                        <input
                          type="text"
                          value={quickForm.name}
                          onChange={(e) =>
                            updateQuickForm("name", e.target.value)
                          }
                          placeholder="Ex: Vaso decorativo"
                          className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-purple-600"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Tempo de Impressão (horas) *
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            value={quickForm.timeHours}
                            onChange={(e) =>
                              updateQuickForm(
                                "timeHours",
                                parseFloat(e.target.value),
                              )
                            }
                            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-purple-600"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Peso Usado (gramas) *
                          </label>
                          <input
                            type="number"
                            step="1"
                            min="0"
                            value={quickForm.weightGrams}
                            onChange={(e) =>
                              updateQuickForm(
                                "weightGrams",
                                parseFloat(e.target.value),
                              )
                            }
                            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-purple-600"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Filamento Usado *
                        </label>
                        <select
                          value={quickForm.filamentId}
                          onChange={(e) =>
                            updateQuickForm("filamentId", e.target.value)
                          }
                          className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-purple-600"
                        >
                          <option value="">Selecione...</option>
                          {filaments.map((fil) => (
                            <option key={fil.id} value={fil.id}>
                              {fil.nome} - {fil.marca} ({fil.tipo}) - R${" "}
                              {fil.custo_por_kg.toFixed(2)}/kg
                            </option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}

                  {/* MANUAL MODE */}
                  {mode === "manual" && (
                    <>
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Nome do Produto *
                        </label>
                        <input
                          type="text"
                          value={manualForm.name}
                          onChange={(e) =>
                            updateManualForm("name", e.target.value)
                          }
                          placeholder="Ex: Peça personalizada"
                          className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-purple-600"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Descrição (opcional)
                        </label>
                        <textarea
                          value={manualForm.description}
                          onChange={(e) =>
                            updateManualForm("description", e.target.value)
                          }
                          placeholder="Detalhes sobre o produto..."
                          rows={3}
                          className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-purple-600 resize-none"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Tempo de Impressão (horas) *
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={manualForm.timeHours}
                          onChange={(e) =>
                            updateManualForm(
                              "timeHours",
                              parseFloat(e.target.value),
                            )
                          }
                          className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-purple-600"
                        />
                      </div>

                      {/* Materials Section */}
                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <label className="block text-sm font-medium">
                            Materiais Usados *
                          </label>
                          <button
                            onClick={addManualMaterial}
                            className="px-3 py-1 bg-purple-600 rounded-lg text-sm hover:opacity-90"
                          >
                            + Adicionar Material
                          </button>
                        </div>

                        {manualForm.materials.length === 0 ? (
                          <div className="text-center text-gray-400 py-4 bg-zinc-800 rounded-lg">
                            Nenhum material adicionado ainda
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {manualForm.materials.map((material, index) => (
                              <div
                                key={index}
                                className="bg-zinc-800 rounded-lg p-4 space-y-2"
                              >
                                <div className="flex justify-between items-center">
                                  <span className="font-medium">
                                    Material {index + 1}
                                  </span>
                                  <button
                                    onClick={() => removeManualMaterial(index)}
                                    className="text-red-400 hover:text-red-300 text-sm"
                                  >
                                    Remover
                                  </button>
                                </div>

                                <select
                                  value={material.filamentId}
                                  onChange={(e) =>
                                    updateManualMaterial(
                                      index,
                                      "filamentId",
                                      e.target.value,
                                    )
                                  }
                                  className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg focus:outline-none focus:border-purple-600"
                                >
                                  <option value="">
                                    Selecione o filamento...
                                  </option>
                                  {filaments.map((fil) => (
                                    <option key={fil.id} value={fil.id}>
                                      {fil.nome} - {fil.marca} ({fil.tipo}) - R${" "}
                                      {fil.custo_por_kg.toFixed(2)}/kg
                                    </option>
                                  ))}
                                </select>

                                <input
                                  type="number"
                                  step="1"
                                  min="0"
                                  value={material.weightGrams}
                                  onChange={(e) =>
                                    updateManualMaterial(
                                      index,
                                      "weightGrams",
                                      parseFloat(e.target.value),
                                    )
                                  }
                                  placeholder="Peso em gramas"
                                  className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg focus:outline-none focus:border-purple-600"
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Advanced Options */}
                      <details className="bg-zinc-800 rounded-lg p-4">
                        <summary className="cursor-pointer font-medium">
                          Opções Avançadas
                        </summary>
                        <div className="mt-4 space-y-4">
                          <div>
                            <label className="block text-sm font-medium mb-2">
                              Custo Material (substituir cálculo)
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={manualForm.overrideMaterialCost || ""}
                              onChange={(e) =>
                                updateManualForm(
                                  "overrideMaterialCost",
                                  e.target.value
                                    ? parseFloat(e.target.value)
                                    : undefined,
                                )
                              }
                              placeholder="R$ (opcional)"
                              className="w-full px-4 py-2 bg-zinc-700 border border-zinc-600 rounded-lg focus:outline-none focus:border-purple-600"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-2">
                              Custo Energia (substituir cálculo)
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={manualForm.overrideEnergyCost || ""}
                              onChange={(e) =>
                                updateManualForm(
                                  "overrideEnergyCost",
                                  e.target.value
                                    ? parseFloat(e.target.value)
                                    : undefined,
                                )
                              }
                              placeholder="R$ (opcional)"
                              className="w-full px-4 py-2 bg-zinc-700 border border-zinc-600 rounded-lg focus:outline-none focus:border-purple-600"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-2">
                              Margem de Lucro Personalizada (%)
                            </label>
                            <input
                              type="number"
                              step="1"
                              min="0"
                              value={manualForm.customMarginPercent || ""}
                              onChange={(e) =>
                                updateManualForm(
                                  "customMarginPercent",
                                  e.target.value
                                    ? parseFloat(e.target.value)
                                    : undefined,
                                )
                              }
                              placeholder="50 (padrão)"
                              className="w-full px-4 py-2 bg-zinc-700 border border-zinc-600 rounded-lg focus:outline-none focus:border-purple-600"
                            />
                          </div>
                        </div>
                      </details>
                    </>
                  )}

                  {/* Cost Preview */}
                  {canSave() && (
                    <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border border-purple-700/50 rounded-lg p-4">
                      <h4 className="font-semibold mb-3 text-purple-300">
                        💰 Previsão de Custos e Preço
                      </h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Material:</span>
                          <span>R$ {costs.materialCost.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Energia:</span>
                          <span>R$ {costs.energyCost.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-bold">
                          <span className="text-gray-300">Custo Total:</span>
                          <span>R$ {costs.totalCost.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Preço Mínimo:</span>
                          <span>R$ {costs.minimumPrice.toFixed(2)}</span>
                        </div>
                        <div className="col-span-2 flex justify-between font-bold text-green-400">
                          <span>Preço Sugerido:</span>
                          <span className="text-lg">
                            R$ {costs.suggestedPrice.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="border-t border-zinc-800 p-6 flex justify-end gap-3">
                  <button
                    onClick={() => {
                      resetModal();
                      setShowModal(false);
                    }}
                    disabled={saving}
                    className="px-6 py-2 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-colors disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={!canSave() || saving}
                    className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {saving ? "Salvando..." : "Cadastrar Produto"}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
