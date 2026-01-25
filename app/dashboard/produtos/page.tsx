"use client";

import { useState, useEffect } from "react";
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
  const [thumbnailBase64, setThumbnailBase64] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showManualFallback, setShowManualFallback] = useState(false);
  const [manualTimeHours, setManualTimeHours] = useState(0);
  const [manualWeightGrams, setManualWeightGrams] = useState(0);

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

  // Additional Costs State (aplicável a todos os modos)
  const [embalagemCost, setEmbalagemCost] = useState(0);
  const [etiquetaCost, setEtiquetaCost] = useState(0);
  const [marketplaceFeePercent, setMarketplaceFeePercent] = useState(0);
  const [customMarginPercent, setCustomMarginPercent] = useState(50);


  // Products List
  const [products, setProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

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

  // Load products on mount
  useEffect(() => {
    if (user) {
      loadProducts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // === 3MF MODE HANDLERS ===
  /**
   * Handler genérico para .gcode (recomendado) e .3mf
   */
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isGCode = file.name.toLowerCase().endsWith('.gcode');
    const is3mf = file.name.toLowerCase().endsWith('.3mf');

    if (!isGCode && !is3mf) {
      setUploadError('Arquivo deve ser .gcode ou .3mf');
      return;
    }

    try {
      setUploading(true);
      setUploadError(null);
      setShowManualFallback(false);

      // Chamar API route apropriada
      const formData = new FormData();
      formData.append('file', file);

      const endpoint = isGCode ? '/api/gcode/extract' : '/api/3mf/extract';
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao processar arquivo');
      }

      const data = await response.json();

      console.log(`✅ Dados extraídos do ${isGCode ? 'GCode' : '3MF'}:`, data);

      // AVISO: se enviou .3mf mas não tem breakdown de materiais
      if (is3mf && (!data.materials || data.materials.length === 0)) {
        setUploadError(
          '⚠️ .3mf não contém breakdown de materiais. Para melhor precisão, exporte o .gcode do fatiador!'
        );
      }

      // Armazenar thumbnail se disponível (só .3mf tem)
      if (data.thumbnail_base64) {
        setThumbnailBase64(data.thumbnail_base64);
        console.log('🖼️ Thumbnail capturado com sucesso');
      }

      // Verificar se conseguiu extrair tempo e peso
      const hasTime = data.estimated_time_minutes !== null;
      const hasWeight = data.total_weight_grams !== null;
      const hasMaterials = data.materials && data.materials.length > 0;

      // Definir valores iniciais de fallback
      let fallbackTimeHours = 0;
      let fallbackWeightGrams = 0;

      if (!hasTime || !hasWeight) {
        // Mostrar fallback manual
        setShowManualFallback(true);
        setUploadError(
          'Não foi possível extrair tempo/peso automaticamente. Informe manualmente abaixo.'
        );

        // Se tiver dados parciais, usar como inicial
        if (hasTime) {
          fallbackTimeHours = data.estimated_time_minutes / 60;
          setManualTimeHours(fallbackTimeHours);
        }
        if (hasWeight) {
          fallbackWeightGrams = data.total_weight_grams;
          setManualWeightGrams(fallbackWeightGrams);
        }
      }

      // Montar ProjectData
      const projectDataResult: ProjectData3mf = {
        name: data.name,
        totalTime: hasTime ? data.estimated_time_minutes / 60 : fallbackTimeHours,
        totalWeight: hasWeight ? data.total_weight_grams : fallbackWeightGrams,
        materials: hasMaterials
          ? data.materials.map((mat: any) => ({
              name: isGCode ? mat.name : mat.material_type,
              color: isGCode ? (mat.color || '#CCCCCC') : mat.color_hex,
              weight: isGCode ? mat.weight_grams : mat.weight_grams,
            }))
          : [],
      };

      setProjectData(projectDataResult);

      // Initialize material mappings
      if (hasMaterials) {
        const mappings: MaterialMapping[] = data.materials.map(
          (mat: any, index: number) => ({
            materialIndex: index,
            materialName: isGCode ? mat.name : mat.material_type,
            materialColor: isGCode ? (mat.color || '#CCCCCC') : mat.color_hex,
            weightGrams: isGCode ? mat.weight_grams : mat.weight_grams,
            filamentId: null,
          })
        );
        setMaterialMappings(mappings);
        console.log(`🎨 ${mappings.length} materiais detectados!`);
      } else if (hasWeight && data.total_weight_grams > 0) {
        // Criar um material genérico se só tiver peso total
        const mappings: MaterialMapping[] = [
          {
            materialIndex: 0,
            materialName: 'Material Único',
            materialColor: '#CCCCCC',
            weightGrams: data.total_weight_grams,
            filamentId: null,
          },
        ];
        setMaterialMappings(mappings);
      }
    } catch (err: any) {
      console.error('❌ Erro ao processar arquivo:', err);
      setUploadError(err.message || 'Erro ao processar arquivo');
      setShowManualFallback(true);
    } finally {
      setUploading(false);
    }
  };

  const updateMaterialMapping = (index: number, filamentId: string) => {
    setMaterialMappings((prev) =>
      prev.map((m, i) => (i === index ? { ...m, filamentId } : m)),
    );
  };

  const add3mfMaterial = () => {
    setMaterialMappings((prev) => [
      ...prev,
      {
        materialIndex: prev.length,
        materialName: `Material ${prev.length + 1}`,
        materialColor: "#CCCCCC",
        weightGrams: 0,
        filamentId: null,
      },
    ]);
  };

  const remove3mfMaterial = (index: number) => {
    setMaterialMappings((prev) => prev.filter((_, i) => i !== index));
  };

  const update3mfMaterialWeight = (index: number, weightGrams: number) => {
    setMaterialMappings((prev) =>
      prev.map((m, i) => (i === index ? { ...m, weightGrams } : m)),
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

    // Custos adicionais
    const packagingCost = embalagemCost || 0;
    const labelCost = etiquetaCost || 0;

    // Custo base (sem marketplace fee)
    const baseCost = materialCost + energyCost + packagingCost + labelCost;

    // Calcular preço sugerido com margem
    const marginPercent = customMarginPercent || 50;
    const minimumPrice = baseCost * 1.2; // 20% mínimo
    const suggestedPriceBeforeFee = baseCost * (1 + marginPercent / 100);

    // Calcular marketplace fee SOBRE o preço de venda
    const marketplaceFeeAmount = (suggestedPriceBeforeFee * marketplaceFeePercent) / 100;
    
    // Custo total REAL incluindo fee
    const totalCost = baseCost + marketplaceFeeAmount;
    
    // Preço final sugerido (já considerando que a fee será deduzida)
    const suggestedPrice = suggestedPriceBeforeFee;

    // Lucro líquido = preço venda - custos - fee
    const profitMargin = suggestedPrice - totalCost;

    return {
      materialCost,
      energyCost,
      packagingCost,
      labelCost,
      marketplaceFeeAmount,
      baseCost,
      totalCost,
      minimumPrice,
      suggestedPrice,
      profitMargin,
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
        !showManualFallback && // Não permitir salvar enquanto fallback estiver ativo
        materialMappings.every((m) => m.filamentId && m.weightGrams > 0) &&
        materialMappings.length > 0 &&
        projectData.totalTime > 0 &&
        projectData.totalWeight > 0
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

      const { data: product, error: productError} = await supabase
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
          margem_percentual: customMarginPercent,
          status: "ativo",
          thumbnail_url: thumbnailBase64,
          embalagem_cost: embalagemCost,
          etiqueta_cost: etiquetaCost,
          marketplace_fee_percent: marketplaceFeePercent,
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
    setThumbnailBase64(null);
    setUploadError(null);
    setShowManualFallback(false);
    setManualTimeHours(0);
    setManualWeightGrams(0);
    setQuickForm({ name: "", timeHours: 0, weightGrams: 0, filamentId: "" });
    setManualForm({
      name: "",
      description: "",
      timeHours: 0,
      materials: [],
    });
    
    // Reset novos campos de custo
    setEmbalagemCost(0);
    setEtiquetaCost(0);
    setMarketplaceFeePercent(0);
    setCustomMarginPercent(50);
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("Tem certeza que deseja excluir este produto?")) return;

    try {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", productId);

      if (error) throw error;

      alert("Produto excluído com sucesso!");
      loadProducts();
    } catch (err: any) {
      console.error("Erro ao excluir produto:", err);
      alert(`Erro ao excluir produto: ${err.message}`);
    }
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
                className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden hover:border-purple-600 transition-colors"
              >
                {/* Thumbnail */}
                {product.thumbnail_url && (
                  <div className="w-full h-48 bg-zinc-800">
                    <img
                      src={product.thumbnail_url}
                      alt={product.nome}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2">{product.nome}</h3>
                  {product.descricao && (
                    <p className="text-gray-400 text-sm mb-4">
                      {product.descricao}
                    </p>
                  )}

                  <div className="space-y-2 text-sm mb-4">
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

                  {/* Botões de Ação */}
                  <div className="flex gap-2 pt-4 border-t border-zinc-800">
                    <button
                      onClick={() => handleDeleteProduct(product.id)}
                      className="flex-1 px-3 py-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 rounded-lg text-sm font-medium transition-colors"
                    >
                      🗑️ Excluir
                    </button>
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
                            🎯 Arquivo .gcode (recomendado) ou .3mf
                          </label>
                          <input
                            type="file"
                            accept=".gcode,.3mf"
                            onChange={handleFileUpload}
                            disabled={uploading}
                            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-purple-600 disabled:opacity-50"
                          />
                          <p className="text-xs text-gray-400 mt-2">
                            💡 Para melhor precisão em multi-cor, exporte o <strong>.gcode</strong> do seu fatiador (Bambu Studio, Orca Slicer, Prusa).
                          </p>
                          {uploading && (
                            <div className="flex items-center gap-2 text-sm text-blue-400 mt-2">
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-400 border-t-transparent"></div>
                              <span>Extraindo dados...</span>
                            </div>
                          )}
                          {uploadError && !uploading && (
                            <div className="mt-3 p-3 bg-red-900/20 border border-red-500/50 rounded-lg">
                              <p className="text-sm text-red-400">{uploadError}</p>
                            </div>
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

                          {/* Fallback Manual - Se não conseguiu extrair tempo/peso */}
                          {showManualFallback && (
                            <div className="bg-yellow-900/20 border border-yellow-500/50 rounded-lg p-4 space-y-3">
                              <h4 className="font-semibold text-yellow-400">
                                ⚠️ Informações Incompletas
                              </h4>
                              <p className="text-sm text-yellow-200">
                                O arquivo .3mf não contém todas as informações necessárias.
                                Preencha os campos abaixo manualmente:
                              </p>
                              
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium mb-2">
                                    Tempo de Impressão (horas) *
                                  </label>
                                  <input
                                    type="number"
                                    step="0.1"
                                    value={manualTimeHours}
                                    onChange={(e) =>
                                      setManualTimeHours(parseFloat(e.target.value) || 0)
                                    }
                                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-purple-600"
                                  />
                                </div>

                                <div>
                                  <label className="block text-sm font-medium mb-2">
                                    Peso Total (gramas) *
                                  </label>
                                  <input
                                    type="number"
                                    step="1"
                                    value={manualWeightGrams}
                                    onChange={(e) =>
                                      setManualWeightGrams(parseFloat(e.target.value) || 0)
                                    }
                                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-purple-600"
                                  />
                                </div>
                              </div>

                              <button
                                onClick={() => {
                                  // Atualizar projectData com valores manuais
                                  setProjectData((prev) => ({
                                    ...prev!,
                                    totalTime: manualTimeHours,
                                    totalWeight: manualWeightGrams,
                                  }));
                                  setShowManualFallback(false);
                                }}
                                disabled={manualTimeHours <= 0 || manualWeightGrams <= 0}
                                className="w-full py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-zinc-700 disabled:text-zinc-500 rounded-lg font-medium transition-colors"
                              >
                                Confirmar Valores Manuais
                              </button>
                            </div>
                          )}

                          {/* Material Mapping */}
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-semibold">
                                Vincular Materiais aos Filamentos
                              </h4>
                              <button
                                type="button"
                                onClick={add3mfMaterial}
                                className="text-sm px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded-md transition-colors flex items-center gap-1"
                              >
                                <span className="text-lg">+</span>
                                Adicionar Material
                              </button>
                            </div>
                            <div className="space-y-3">
                              {materialMappings.map((mapping, index) => (
                                <div
                                  key={index}
                                  className="bg-zinc-800 rounded-lg p-4 space-y-3"
                                >
                                  <div className="flex items-start gap-3">
                                    <div
                                      className="w-6 h-6 rounded-full border-2 border-white flex-shrink-0 mt-1"
                                      style={{
                                        backgroundColor: mapping.materialColor,
                                      }}
                                    />
                                    <div className="flex-1 space-y-3">
                                      <div className="flex items-center justify-between">
                                        <div className="font-medium">
                                          {mapping.materialName}
                                        </div>
                                        {materialMappings.length > 1 && (
                                          <button
                                            type="button"
                                            onClick={() => remove3mfMaterial(index)}
                                            className="text-red-400 hover:text-red-300 text-sm transition-colors"
                                          >
                                            Remover
                                          </button>
                                        )}
                                      </div>

                                      {/* Peso do Material */}
                                      <div>
                                        <label className="text-xs text-gray-400 block mb-1">
                                          Peso (gramas) *
                                        </label>
                                        <input
                                          type="number"
                                          min="0"
                                          step="0.1"
                                          value={mapping.weightGrams}
                                          onChange={(e) =>
                                            update3mfMaterialWeight(
                                              index,
                                              parseFloat(e.target.value) || 0
                                            )
                                          }
                                          className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg focus:outline-none focus:border-purple-600"
                                          placeholder="Ex: 25.5"
                                        />
                                      </div>

                                      {/* Seletor de Filamento */}
                                      <div>
                                        <label className="text-xs text-gray-400 block mb-1">
                                          Filamento do Estoque *
                                        </label>
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

                                      {/* Custo Calculado */}
                                      {mapping.filamentId && (
                                        <div className="text-xs text-purple-400 flex items-center justify-between bg-zinc-900 rounded px-2 py-1">
                                          <span>Custo deste material:</span>
                                          <span className="font-medium">
                                            R${" "}
                                            {(
                                              (mapping.weightGrams / 1000) *
                                              (filaments.find(
                                                (f) => f.id === mapping.filamentId
                                              )?.custo_por_kg || 0)
                                            ).toFixed(2)}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}

                              {/* Custo Total de Materiais */}
                              {materialMappings.length > 1 &&
                                materialMappings.every((m) => m.filamentId) && (
                                  <div className="bg-purple-900/30 border border-purple-700 rounded-lg p-3">
                                    <div className="flex items-center justify-between text-sm">
                                      <span className="text-purple-300 font-medium">
                                        💰 Custo Total de Materiais:
                                      </span>
                                      <span className="text-purple-100 font-bold text-lg">
                                        R${" "}
                                        {materialMappings
                                          .reduce((total, m) => {
                                            const filament = filaments.find(
                                              (f) => f.id === m.filamentId
                                            );
                                            return (
                                              total +
                                              (m.weightGrams / 1000) *
                                                (filament?.custo_por_kg || 0)
                                            );
                                          }, 0)
                                          .toFixed(2)}
                                      </span>
                                    </div>
                                  </div>
                                )}
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

                  {/* Seção de Custos Adicionais e Margem (comum a todos os modos) */}
                  <details open className="bg-zinc-900 rounded-lg p-4 border border-zinc-800">
                    <summary className="font-semibold cursor-pointer text-purple-400 mb-4">
                      💳 Custos Adicionais e Margem
                    </summary>
                    
                    <div className="space-y-4">
                      {/* Grid de Custos Adicionais */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-400 mb-1">
                            📦 Embalagem (R$)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={embalagemCost}
                            onChange={(e) => setEmbalagemCost(parseFloat(e.target.value) || 0)}
                            placeholder="0.00"
                            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm focus:outline-none focus:border-purple-600"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-400 mb-1">
                            🏷️ Etiqueta/Adesivo (R$)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={etiquetaCost}
                            onChange={(e) => setEtiquetaCost(parseFloat(e.target.value) || 0)}
                            placeholder="0.00"
                            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm focus:outline-none focus:border-purple-600"
                          />
                        </div>
                      </div>

                      {/* Taxa Marketplace e Margem */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-400 mb-1">
                            🛒 Taxa Marketplace (%)
                          </label>
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            max="100"
                            value={marketplaceFeePercent}
                            onChange={(e) => setMarketplaceFeePercent(parseFloat(e.target.value) || 0)}
                            placeholder="Ex: 15 (Mercado Livre)"
                            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm focus:outline-none focus:border-purple-600"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Mercado Livre: ~15%, Shopee: ~18%
                          </p>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-400 mb-1">
                            📊 Margem de Lucro (%)
                          </label>
                          <input
                            type="number"
                            step="5"
                            min="0"
                            value={customMarginPercent}
                            onChange={(e) => setCustomMarginPercent(parseFloat(e.target.value) || 50)}
                            placeholder="50"
                            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm focus:outline-none focus:border-purple-600"
                          />
                        </div>
                      </div>
                    </div>
                  </details>

                  {/* Cost Preview */}
                  {canSave() && (
                    <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border border-purple-700/50 rounded-lg p-4">
                      <h4 className="font-semibold mb-3 text-purple-300">
                        💰 Previsão de Custos e Preço
                      </h4>

                      {/* Detalhamento de Materiais (modo .3mf com múltiplos) */}
                      {mode === "3mf" && materialMappings.length > 1 && (
                        <div className="mb-4 space-y-2">
                          <div className="text-xs font-medium text-purple-400 mb-2">
                            Custo por Material:
                          </div>
                          {materialMappings.map((mapping, index) => {
                            const filament = filaments.find(
                              (f) => f.id === mapping.filamentId
                            );
                            const cost = filament
                              ? (mapping.weightGrams / 1000) * filament.custo_por_kg
                              : 0;
                            return (
                              <div
                                key={index}
                                className="flex items-center justify-between text-xs bg-zinc-900/50 rounded px-2 py-1"
                              >
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-3 h-3 rounded-full border"
                                    style={{ backgroundColor: mapping.materialColor }}
                                  />
                                  <span className="text-gray-400">
                                    {mapping.materialName} ({mapping.weightGrams}g)
                                  </span>
                                </div>
                                <span className="text-gray-300">
                                  R$ {cost.toFixed(2)}
                                </span>
                              </div>
                            );
                          })}
                          <div className="border-t border-purple-700/50 pt-2" />
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">💎 Material:</span>
                          <span>R$ {costs.materialCost.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">⚡ Energia:</span>
                          <span>R$ {costs.energyCost.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">📦 Embalagem:</span>
                          <span>R$ {costs.packagingCost.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">🏷️ Etiqueta:</span>
                          <span>R$ {costs.labelCost.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-orange-400">
                          <span>🛒 Fee Marketplace:</span>
                          <span>R$ {costs.marketplaceFeeAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-red-400">
                          <span>💸 Custo TOTAL:</span>
                          <span>R$ {costs.totalCost.toFixed(2)}</span>
                        </div>
                        <div className="col-span-2 border-t border-purple-700/50 pt-2" />
                        <div className="flex justify-between">
                          <span className="text-gray-400">Preço Mínimo (20%):</span>
                          <span>R$ {costs.minimumPrice.toFixed(2)}</span>
                        </div>
                        <div className="col-span-2 flex justify-between font-bold text-green-400">
                          <span>💰 Preço de Venda Sugerido:</span>
                          <span className="text-lg">
                            R$ {costs.suggestedPrice.toFixed(2)}
                          </span>
                        </div>
                        <div className="col-span-2 flex justify-between text-purple-300">
                          <span>💵 Lucro Líquido:</span>
                          <span className="text-lg font-semibold">
                            R$ {costs.profitMargin.toFixed(2)} ({((costs.profitMargin / costs.suggestedPrice) * 100).toFixed(1)}%)
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
