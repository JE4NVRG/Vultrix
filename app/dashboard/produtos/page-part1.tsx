"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/AuthProvider";
import {
  useUserCostSettings,
  calcEnergyCostPerHour,
} from "@/lib/hooks/useUserCostSettings";
import {
  parse3mfFile,
  validate3mfFile,
  type ProjectData3mf,
  type Material3mf,
} from "@/lib/utils/parse3mf";
import {
  Plus,
  X,
  Package,
  Edit,
  Trash2,
  DollarSign,
  Clock,
  Weight,
  Upload,
  FileText,
  Wrench,
  Sparkles,
  AlertCircle,
  Check,
  Zap,
  Droplet,
} from "lucide-react";

type Filament = {
  id: string;
  nome: string;
  marca: string;
  tipo: string;
  cor: string;
  custo_por_kg: number;
  peso_atual: number;
};

type MaterialMapping = {
  material: Material3mf;
  filamento_id: string | null;
  custo_calculado: number;
};

type Product = {
  id: string;
  created_at: string;
  nome: string;
  descricao: string | null;
  tempo_impressao_horas: number;
  peso_usado: number;
  custo_material: number;
  custo_energia: number;
  custo_total: number;
  preco_venda: number;
  preco_minimo: number;
  preco_sugerido: number;
  margem_percentual: number;
  margem: number;
  status: "ativo" | "desativado";
  filamento_id: string | null;
};

type FormErrors = {
  nome?: string;
  tempo_impressao_horas?: string;
  peso_usado?: string;
  filamento_id?: string;
  general?: string;
};

export default function ProdutosPage() {
  const { user } = useAuth();
  const { kwhCost, loading: costLoading } = useUserCostSettings();

  const [products, setProducts] = useState<Product[]>([]);
  const [filaments, setFilaments] = useState<Filament[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"3mf" | "quick" | "manual">("3mf");
  const [saving, setSaving] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  // Modo .3mf
  const [uploading, setUploading] = useState(false);
  const [projectData, setProjectData] = useState<ProjectData3mf | null>(null);
  const [materialMappings, setMaterialMappings] = useState<MaterialMapping[]>(
    [],
  );
  const [mappingComplete, setMappingComplete] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    tempo_impressao_horas: 0,
    peso_usado: 0,
    filamento_id: "",
    margem_percentual: 50,
  });

  // Calculated costs
  const energyCost =
    calcEnergyCostPerHour(
      200, // watts padrão, TODO: pegar da impressora selecionada
      kwhCost,
    ) * (formData.tempo_impressao_horas || 0);

  const materialCost =
    materialMappings.reduce((sum, mapping) => {
      return sum + mapping.custo_calculado;
    }, 0) || calculateSingleFilamentCost();

  const totalCost = materialCost + energyCost;
  const suggestedPrice = totalCost * (1 + formData.margem_percentual / 100);
  const minPrice = totalCost * 1.2; // Mínimo 20% margem

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load products
      const { data: productsData } = await supabase
        .from("products")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

      setProducts(productsData || []);

      // Load filaments
      const { data: filamentsData } = await supabase
        .from("filaments")
        .select("*")
        .eq("user_id", user!.id)
        .eq("active", true)
        .order("nome");

      setFilaments(filamentsData || []);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = (mode: "3mf" | "quick" | "manual" = "3mf") => {
    setModalMode(mode);
    setFormData({
      nome: "",
      descricao: "",
      tempo_impressao_horas: 0,
      peso_usado: 0,
      filamento_id: "",
      margem_percentual: 50,
    });
    setProjectData(null);
    setMaterialMappings([]);
    setMappingComplete(false);
    setFormErrors({});
    setShowModal(true);
  };

  const handle3mfUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validation = validate3mfFile(file);
    if (!validation.valid) {
      setFormErrors({ general: validation.error });
      return;
    }

    try {
      setUploading(true);
      setFormErrors({});

      const data = await parse3mfFile(file);
      setProjectData(data);

      // Pre-fill form
      setFormData({
        ...formData,
        nome: data.name || file.name.replace(/\.3mf$/i, ""),
        tempo_impressao_horas: data.totalTime,
        peso_usado: data.totalWeight,
      });

      // Initialize material mappings
      const mappings: MaterialMapping[] = data.materials.map((material) => ({
        material,
        filamento_id: null,
        custo_calculado: 0,
      }));
      setMaterialMappings(mappings);
    } catch (error: any) {
      setFormErrors({ general: error.message || "Erro ao processar arquivo" });
    } finally {
      setUploading(false);
    }
  };

  const mapMaterialToFilament = (materialIndex: number, filamentId: string) => {
    const filament = filaments.find((f) => f.id === filamentId);
    if (!filament) return;

    const material = materialMappings[materialIndex].material;
    const custo = (material.weight / 1000) * filament.custo_por_kg;

    const newMappings = [...materialMappings];
    newMappings[materialIndex] = {
      ...newMappings[materialIndex],
      filamento_id: filamentId,
      custo_calculado: custo,
    };

    setMaterialMappings(newMappings);

    // Check if all mapped
    const allMapped = newMappings.every((m) => m.filamento_id !== null);
    setMappingComplete(allMapped);
  };

  function calculateSingleFilamentCost(): number {
    if (!formData.filamento_id || !formData.peso_usado) return 0;

    const filament = filaments.find((f) => f.id === formData.filamento_id);
    if (!filament) return 0;

    return (formData.peso_usado / 1000) * filament.custo_por_kg;
  }

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!formData.nome || !formData.nome.trim()) {
      errors.nome = "Nome do produto é obrigatório";
    }

    if (
      !formData.tempo_impressao_horas ||
      formData.tempo_impressao_horas <= 0
    ) {
      errors.tempo_impressao_horas = "Tempo deve ser maior que zero";
    }

    if (!formData.peso_usado || formData.peso_usado <= 0) {
      errors.peso_usado = "Peso deve ser maior que zero";
    }

    // Modo rápido/manual: exigir filamento único
    if (modalMode !== "3mf" && !formData.filamento_id) {
      errors.filamento_id = "Selecione um filamento";
    }

    // Modo .3mf: exigir mapeamento completo
    if (modalMode === "3mf" && !mappingComplete) {
      errors.general = "Mapeie todos os materiais para continuar";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    setFormErrors({});

    if (!validateForm()) return;

    try {
      setSaving(true);

      const productData = {
        user_id: user!.id,
        nome: formData.nome,
        descricao: formData.descricao || null,
        tempo_impressao_horas: formData.tempo_impressao_horas,
        peso_usado: formData.peso_usado,
        custo_material: materialCost,
        custo_energia: energyCost,
        custo_total: totalCost,
        preco_minimo: minPrice,
        preco_sugerido: suggestedPrice,
        preco_venda: suggestedPrice,
        margem_percentual: formData.margem_percentual,
        margem: suggestedPrice - totalCost,
        status: "ativo",
        filamento_id: formData.filamento_id || null,
      };

      const { error } = await supabase.from("products").insert(productData);

      if (error) throw error;

      await loadData();
      setShowModal(false);

      alert(
        `✅ Produto cadastrado com sucesso!\n\n` +
          `💰 Custo total: R$ ${totalCost.toFixed(2)}\n` +
          `💵 Preço sugerido: R$ ${suggestedPrice.toFixed(2)}\n` +
          `📊 Margem: ${formData.margem_percentual}%`,
      );
    } catch (error: any) {
      setFormErrors({
        general: error.message || "Erro ao salvar produto",
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este produto?")) return;

    try {
      const { error } = await supabase.from("products").delete().eq("id", id);

      if (error) throw error;
      await loadData();
    } catch (error) {
      console.error("Erro ao excluir produto:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-vultrix-accent mx-auto"></div>
          <p className="mt-4 text-vultrix-light/70">Carregando produtos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Produtos</h1>
          <p className="text-vultrix-light/70">
            Gerencie seu catálogo e calcule custos automaticamente
          </p>
        </div>
        {products.length > 0 && (
          <button
            onClick={() => openAddModal("3mf")}
            className="bg-gradient-to-r from-vultrix-accent to-purple-600 hover:from-vultrix-accent/80 hover:to-purple-600/80 text-white font-bold py-3 px-6 rounded-lg transition-all inline-flex items-center gap-2 shadow-lg shadow-vultrix-accent/20"
          >
            <Plus size={20} />
            Novo Produto
          </button>
        )}
      </div>

      {/* Empty State */}
      {products.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-vultrix-gray/50 to-vultrix-dark/30 border border-vultrix-light/10 rounded-2xl p-12 text-center"
        >
          <div className="max-w-md mx-auto">
            <div className="w-24 h-24 bg-gradient-to-br from-vultrix-accent/20 to-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-vultrix-accent/30">
              <Package className="w-12 h-12 text-vultrix-accent" />
            </div>

            <h2 className="text-2xl font-bold text-white mb-3">
              Nenhum produto cadastrado
            </h2>
            <p className="text-vultrix-light/70 mb-8">
              Cadastre seus produtos para calcular custos reais e gerenciar seu
              catálogo
            </p>

            <div className="space-y-3">
              <button
                onClick={() => openAddModal("3mf")}
                className="w-full bg-gradient-to-r from-vultrix-accent to-purple-600 hover:from-vultrix-accent/80 hover:to-purple-600/80 text-white font-bold py-4 px-6 rounded-lg transition-all inline-flex items-center justify-center gap-2 shadow-lg shadow-vultrix-accent/20"
              >
                <Upload size={20} />
                Importar .3mf (Recomendado)
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
        /* Products Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-gradient-to-br from-vultrix-gray/50 to-vultrix-dark/30 border border-vultrix-light/10 rounded-xl p-6"
            >
              {/* Product Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white mb-1">
                    {product.nome}
                  </h3>
                  {product.descricao && (
                    <p className="text-sm text-vultrix-light/70">
                      {product.descricao}
                    </p>
                  )}
                </div>
                <div
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    product.status === "ativo"
                      ? "bg-green-500/20 text-green-500"
                      : "bg-red-500/20 text-red-500"
                  }`}
                >
                  {product.status === "ativo" ? "Ativo" : "Desativado"}
                </div>
              </div>

              {/* Stats */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-blue-500" />
                  <span className="text-vultrix-light/70">Tempo:</span>
                  <span className="text-white font-semibold ml-auto">
                    {product.tempo_impressao_horas.toFixed(1)}h
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Weight className="w-4 h-4 text-purple-500" />
                  <span className="text-vultrix-light/70">Peso:</span>
                  <span className="text-white font-semibold ml-auto">
                    {product.peso_usado}g
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="w-4 h-4 text-yellow-500" />
                  <span className="text-vultrix-light/70">Custo:</span>
                  <span className="text-white font-semibold ml-auto">
                    R$ {product.custo_total.toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <span className="text-lg">💵</span>
                  <span className="text-vultrix-light/70">Preço:</span>
                  <span className="text-green-400 font-bold ml-auto">
                    R$ {product.preco_venda.toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <span className="text-lg">📊</span>
                  <span className="text-vultrix-light/70">Margem:</span>
                  <span className="text-vultrix-accent font-semibold ml-auto">
                    {product.margem_percentual.toFixed(0)}%
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-4 border-t border-vultrix-light/10">
                <button
                  onClick={() => deleteProduct(product.id)}
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
              if (!saving) setShowModal(false);
            }}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gradient-to-br from-vultrix-gray to-vultrix-dark border border-vultrix-light/20 rounded-2xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Novo Produto</h2>
                <button
                  onClick={() => {
                    if (!saving) setShowModal(false);
                  }}
                  disabled={saving}
                  className="text-vultrix-light/60 hover:text-white transition-colors disabled:opacity-30"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Mode Selector */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <button
                  onClick={() => setModalMode("3mf")}
                  disabled={saving}
                  className={`py-3 px-4 rounded-lg font-semibold transition-all ${
                    modalMode === "3mf"
                      ? "bg-gradient-to-r from-vultrix-accent to-purple-600 text-white shadow-lg"
                      : "bg-vultrix-gray/50 text-vultrix-light/70 hover:bg-vultrix-gray"
                  }`}
                >
                  <Upload className="w-5 h-5 mx-auto mb-1" />
                  .3mf
                </button>

                <button
                  onClick={() => setModalMode("quick")}
                  disabled={saving}
                  className={`py-3 px-4 rounded-lg font-semibold transition-all ${
                    modalMode === "quick"
                      ? "bg-gradient-to-r from-vultrix-accent to-purple-600 text-white shadow-lg"
                      : "bg-vultrix-gray/50 text-vultrix-light/70 hover:bg-vultrix-gray"
                  }`}
                >
                  <Zap className="w-5 h-5 mx-auto mb-1" />
                  Rápido
                </button>

                <button
                  onClick={() => setModalMode("manual")}
                  disabled={saving}
                  className={`py-3 px-4 rounded-lg font-semibold transition-all ${
                    modalMode === "manual"
                      ? "bg-gradient-to-r from-vultrix-accent to-purple-600 text-white shadow-lg"
                      : "bg-vultrix-gray/50 text-vultrix-light/70 hover:bg-vultrix-gray"
                  }`}
                >
                  <Wrench className="w-5 h-5 mx-auto mb-1" />
                  Manual
                </button>
              </div>

              {/* General Error */}
              {formErrors.general && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start gap-3 mb-6">
                  <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-red-500 font-semibold">Erro</p>
                    <p className="text-red-400 text-sm mt-1">
                      {formErrors.general}
                    </p>
                  </div>
                </div>
              )}

              {/* CONTINUA NO PRÓXIMO ARQUIVO... */}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
