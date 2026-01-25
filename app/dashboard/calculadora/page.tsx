"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useRouter } from "next/navigation";
import { useUserCostSettings } from "@/lib/hooks/useUserCostSettings";
import { useFilaments, Filament } from "@/lib/hooks/useFilaments";
import {
  Calculator as CalcIcon,
  Layers,
  ListPlus,
  ArrowRight,
  ArrowLeft,
  Weight,
  Zap,
  Clock,
  Percent,
  DollarSign,
  Plus,
  Trash,
  Save,
  Package,
  Sparkles,
  ClipboardList,
  Upload,
  Image as ImageIcon,
  FileCode,
  AlertCircle,
  Truck,
  Store,
  CreditCard,
  Hash,
  Edit3,
  Target,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type SelectedFilament = {
  id: string;
  filament_id: string;
  weight_grams: number;
};

type ExtraCost = {
  id: string;
  type: string;
  description: string;
  value: number;
};

type InputMode = "upload" | "manual";

const STATUS_OPTIONS = [
  { value: "draft", label: "Rascunho" },
  { value: "in_progress", label: "Em andamento" },
  { value: "done", label: "Concluído" },
];

const COST_TYPES = [
  { value: "servico", label: "Serviço" },
  { value: "acabamento", label: "Acabamento" },
  { value: "outro", label: "Outro" },
];

const STEPS = [
  { id: 1, title: "Projeto", icon: CalcIcon },
  { id: 2, title: "Dados", icon: Upload },
  { id: 3, title: "Filamentos", icon: Layers },
  { id: 4, title: "Custos", icon: ListPlus },
  { id: 5, title: "Resumo", icon: Sparkles },
];

const makeId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

export default function CalculadoraProjetosPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { kwhCost, loading: costLoading } = useUserCostSettings();
  const { filaments, loading: filamentsLoading } = useFilaments();
  
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [savingProject, setSavingProject] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);

  // Modo de entrada de dados
  const [inputMode, setInputMode] = useState<InputMode>("upload");
  
  // Upload states
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [visionUploading, setVisionUploading] = useState(false);
  const [visionError, setVisionError] = useState<string | null>(null);

  const [project, setProject] = useState({
    name: "",
    description: "",
    status: "draft",
  });

  // Dados extraídos ou manuais
  const [timeHours, setTimeHours] = useState(0);
  const [totalWeightGrams, setTotalWeightGrams] = useState(0);

  const [selectedFilaments, setSelectedFilaments] = useState<SelectedFilament[]>([
    { id: makeId(), filament_id: "", weight_grams: 0 },
  ]);

  const [extraCosts, setExtraCosts] = useState<ExtraCost[]>([]);

  // Custos de venda (padrões profissionais)
  const [embalagemCost, setEmbalagemCost] = useState(0);
  const [etiquetaCost, setEtiquetaCost] = useState(0);
  const [shippingCost, setShippingCost] = useState(22);
  const [marketplaceFeePercent, setMarketplaceFeePercent] = useState(16.5);
  const [anticipationFeePercent, setAnticipationFeePercent] = useState(3.5);
  
  // Quantidade de unidades no plate
  const [unitQuantity, setUnitQuantity] = useState(1);
  
  // Margem e preço personalizado
  const [margin, setMargin] = useState(50);
  const [customSellPrice, setCustomSellPrice] = useState(0);

  // Custo de energia por hora (usa config do usuário ou padrão)
  const energyCostPerHour = useMemo(() => {
    if (kwhCost && kwhCost > 0) {
      // Assumindo impressora ~200W = 0.2 kWh
      return kwhCost * 0.2;
    }
    return 0.15; // padrão
  }, [kwhCost]);

  useEffect(() => {
    if (!filamentsLoading && !costLoading) {
      setLoading(false);
    }
  }, [filamentsLoading, costLoading]);

  const filamentsMap = useMemo(() => {
    const map = new Map<string, Filament>();
    filaments.forEach((f) => map.set(f.id, f));
    return map;
  }, [filaments]);

  // Peso total dos filamentos selecionados
  const filamentsTotalWeight = useMemo(
    () => selectedFilaments.reduce((sum, f) => sum + (f.weight_grams || 0), 0),
    [selectedFilaments]
  );

  // Custo dos filamentos
  const costFilaments = useMemo(() => {
    return selectedFilaments.reduce((sum, item) => {
      const fil = filamentsMap.get(item.filament_id);
      if (!fil || !item.weight_grams) return sum;
      return sum + (item.weight_grams / 1000) * fil.custo_por_kg;
    }, 0);
  }, [selectedFilaments, filamentsMap]);

  // Custo de energia
  const costEnergy = useMemo(
    () => Math.max(0, timeHours) * energyCostPerHour,
    [timeHours, energyCostPerHour]
  );

  // Custo de extras manuais
  const costExtras = useMemo(
    () => extraCosts.reduce((sum, c) => sum + Math.max(0, c.value), 0),
    [extraCosts]
  );

  // Custo total de produção (antes de dividir por quantidade)
  const custoProducaoTotal = costFilaments + costEnergy + costExtras + embalagemCost + etiquetaCost;
  
  // Custo unitário (dividido pela quantidade)
  const custoUnitario = unitQuantity > 0 ? custoProducaoTotal / unitQuantity : custoProducaoTotal;
  
  // Custo com frete
  const custoComFrete = custoUnitario + shippingCost;
  
  // Taxa total do marketplace
  const taxaTotalPercent = marketplaceFeePercent + anticipationFeePercent;
  
  // Preço sugerido usando fórmula correta: Preço = Custo ÷ (1 - taxas% - margem%)
  const precoSugerido = useMemo(() => {
    const divisor = 1 - (taxaTotalPercent / 100) - (margin / 100);
    if (divisor <= 0) return custoComFrete * 3; // fallback se margem muito alta
    return custoComFrete / divisor;
  }, [custoComFrete, taxaTotalPercent, margin]);
  
  // Preço final (personalizado ou sugerido)
  const precoFinal = customSellPrice > 0 ? customSellPrice : precoSugerido;
  
  // Taxas em R$
  const taxaMarketplace = precoFinal * (marketplaceFeePercent / 100);
  const taxaAntecipacao = precoFinal * (anticipationFeePercent / 100);
  const taxasTotal = taxaMarketplace + taxaAntecipacao;
  
  // Lucro real
  const lucroReal = precoFinal - custoComFrete - taxasTotal;
  
  // Margem real calculada
  const margemReal = precoFinal > 0 ? (lucroReal / precoFinal) * 100 : 0;

  const nextStep = () => setStep((s) => Math.min(5, s + 1));
  const prevStep = () => setStep((s) => Math.max(1, s - 1));

  // Handlers de upload
  const handleFileUpload = useCallback(async (file: File) => {
    if (!file) return;
    
    const ext = file.name.toLowerCase().split(".").pop();
    if (ext !== "gcode" && ext !== "3mf") {
      setUploadError("Arquivo deve ser .gcode ou .3mf");
      return;
    }
    
    setUploading(true);
    setUploadError(null);
    
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      const endpoint = ext === "gcode" ? "/api/gcode/extract" : "/api/3mf/extract";
      const res = await fetch(endpoint, { method: "POST", body: formData });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Erro ao processar arquivo");
      }
      
      // Extrair nome do arquivo
      const fileName = file.name.replace(/\.(gcode|3mf)$/i, "");
      if (!project.name) {
        setProject((p) => ({ ...p, name: fileName }));
      }
      
      // Extrair tempo
      if (data.printTimeMinutes) {
        setTimeHours(data.printTimeMinutes / 60);
      } else if (data.printTimeHours) {
        setTimeHours(data.printTimeHours);
      }
      
      // Extrair peso
      if (data.totalWeightGrams) {
        setTotalWeightGrams(data.totalWeightGrams);
        // Atualizar primeiro filamento com peso total
        setSelectedFilaments((prev) => {
          if (prev.length === 1 && prev[0].weight_grams === 0) {
            return [{ ...prev[0], weight_grams: data.totalWeightGrams }];
          }
          return prev;
        });
      }
      
      // Se tiver múltiplos materiais
      if (data.materials && data.materials.length > 0) {
        const newFilaments: SelectedFilament[] = data.materials.map((m: { weightGrams: number }) => ({
          id: makeId(),
          filament_id: "",
          weight_grams: m.weightGrams || 0,
        }));
        if (newFilaments.some((f) => f.weight_grams > 0)) {
          setSelectedFilaments(newFilaments);
        }
      }
      
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao processar arquivo";
      setUploadError(errorMessage);
    } finally {
      setUploading(false);
    }
  }, [project.name]);

  const handleVisionUpload = useCallback(async (file: File) => {
    if (!file) return;
    
    setVisionUploading(true);
    setVisionError(null);
    
    try {
      const formData = new FormData();
      formData.append("image", file);
      
      const res = await fetch("/api/vision/bambu", { method: "POST", body: formData });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Erro ao ler imagem");
      }
      
      if (data.printTimeMinutes) {
        setTimeHours(data.printTimeMinutes / 60);
      }
      if (data.totalWeightGrams) {
        setTotalWeightGrams(data.totalWeightGrams);
        setSelectedFilaments((prev) => {
          if (prev.length === 1 && prev[0].weight_grams === 0) {
            return [{ ...prev[0], weight_grams: data.totalWeightGrams }];
          }
          return prev;
        });
      }
      if (data.notes && !project.name) {
        setProject((p) => ({ ...p, name: data.notes }));
      }
      
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao processar imagem";
      setVisionError(errorMessage);
    } finally {
      setVisionUploading(false);
    }
  }, [project.name]);

  const updateFilamentRow = (rowId: string, patch: Partial<SelectedFilament>) => {
    setSelectedFilaments((rows) =>
      rows.map((r) => (r.id === rowId ? { ...r, ...patch } : r))
    );
  };

  const addFilamentRow = () => {
    setSelectedFilaments((rows) => [
      ...rows,
      { id: makeId(), filament_id: "", weight_grams: 0 },
    ]);
  };

  const removeFilamentRow = (rowId: string) => {
    setSelectedFilaments((rows) =>
      rows.length === 1 ? rows : rows.filter((r) => r.id !== rowId)
    );
  };

  const addExtraCost = () => {
    setExtraCosts((rows) => [
      ...rows,
      { id: makeId(), type: "outro", description: "", value: 0 },
    ]);
  };

  const updateExtraCost = (rowId: string, patch: Partial<ExtraCost>) => {
    setExtraCosts((rows) =>
      rows.map((r) => (r.id === rowId ? { ...r, ...patch } : r))
    );
  };

  const removeExtraCost = (rowId: string) => {
    setExtraCosts((rows) => rows.filter((r) => r.id !== rowId));
  };

  // Distribuir peso igualmente entre cores
  const distributeWeightEqually = () => {
    if (totalWeightGrams > 0 && selectedFilaments.length > 0) {
      const weightPerFilament = totalWeightGrams / selectedFilaments.length;
      setSelectedFilaments((rows) =>
        rows.map((r) => ({ ...r, weight_grams: weightPerFilament }))
      );
    }
  };

  const validateProject = () => {
    if (!project.name.trim()) {
      alert("Informe o nome do projeto");
      return false;
    }
    const hasFilament = selectedFilaments.some(
      (f) => f.filament_id && f.weight_grams > 0
    );
    if (!hasFilament) {
      alert("Adicione pelo menos um filamento com peso");
      return false;
    }
    return true;
  };

  const persistProject = async () => {
    if (!user) throw new Error("Usuário não autenticado");
    if (!validateProject()) return null;

    try {
      setSavingProject(true);

      const { data: projectInsert, error: projectError } = await supabase
        .from("projects")
        .insert({
          user_id: user.id,
          name: project.name,
          description: project.description || null,
          status: project.status || "draft",
        })
        .select("id")
        .single();

      if (projectError) throw projectError;
      const newProjectId = projectInsert?.id as string;
      setProjectId(newProjectId);

      const filRows = selectedFilaments
        .filter((f) => f.filament_id && f.weight_grams > 0)
        .map((f) => ({
          user_id: user.id,
          project_id: newProjectId,
          filament_id: f.filament_id,
          weight_grams: f.weight_grams,
        }));

      if (filRows.length) {
        const { error } = await supabase
          .from("project_filaments")
          .insert(filRows);
        if (error) throw error;
      }

      const costRows: ExtraCost[] = [...extraCosts];
      if (costEnergy > 0) {
        costRows.push({
          id: makeId(),
          type: "energia",
          description: "Energia calculada",
          value: costEnergy,
        });
      }

      if (costRows.length) {
        const payload = costRows.map((c) => ({
          user_id: user.id,
          project_id: newProjectId,
          type: c.type,
          description: c.description || null,
          value: c.value,
        }));
        const { error } = await supabase.from("project_costs").insert(payload);
        if (error) throw error;
      }

      alert("Projeto salvo!");
      return newProjectId;
    } catch (err) {
      console.error("Erro ao salvar projeto:", err);
      alert("Erro ao salvar projeto");
      return null;
    } finally {
      setSavingProject(false);
    }
  };

  const criarProduto = async () => {
    if (!user) return;
    if (!validateProject()) return;
    try {
      setSavingProduct(true);
      const ensuredId = projectId || (await persistProject());
      if (!ensuredId) return;

      const payload = {
        user_id: user.id,
        project_id: ensuredId,
        filamento_id: selectedFilaments[0]?.filament_id || null,
        nome: project.name,
        descricao: project.description || null,
        tempo_impressao_horas: timeHours,
        peso_usado: filamentsTotalWeight,
        custo_material: costFilaments,
        custo_energia: costEnergy,
        custo_total: custoUnitario,
        preco_minimo: custoUnitario * 1.1,
        preco_sugerido: precoSugerido,
        margem: margin,
        preco_venda: precoFinal,
        margem_percentual: margemReal,
        status: "ativo",
        foto_url: null,
        // Novos campos de custos
        embalagem_cost: embalagemCost,
        etiqueta_cost: etiquetaCost,
        frete_cost: shippingCost,
        marketplace_fee_percent: marketplaceFeePercent,
        antecipacao_fee_percent: anticipationFeePercent,
        preco_venda_manual: customSellPrice > 0 ? customSellPrice : null,
        quantidade_unidades: unitQuantity,
      };

      const { error } = await supabase.from("products").insert(payload);
      if (error) throw error;

      alert("Produto criado a partir do projeto!");
      if (confirm("Ir para Produtos agora?")) {
        router.push("/dashboard/produtos");
      }
    } catch (err) {
      console.error("Erro ao criar produto:", err);
      alert("Erro ao criar produto");
    } finally {
      setSavingProduct(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-white text-lg">Carregando calculadora...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Calculadora de Projetos
          </h1>
          <p className="text-vultrix-light/70">
            Monte um projeto, some filamentos, custos extras e gere um produto.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => router.push("/dashboard/projetos")}
            className="hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-vultrix-gray text-vultrix-light hover:bg-vultrix-light/5"
          >
            <ClipboardList size={16} />
            Projetos
          </button>
          <button
            onClick={criarProduto}
            disabled={savingProduct}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-vultrix-accent text-white font-semibold hover:brightness-110 transition disabled:opacity-60"
          >
            {savingProduct ? "Criando..." : "Criar Produto"}
          </button>
        </div>
      </div>

      {/* Stepper */}
      <div className="grid grid-cols-5 gap-2">
        {STEPS.map((s) => {
          const Icon = s.icon;
          const active = step === s.id;
          const done = step > s.id;
          return (
            <button
              key={s.id}
              onClick={() => setStep(s.id)}
              className={`rounded-xl border px-3 py-2 flex items-center gap-2 transition ${
                active
                  ? "border-vultrix-accent bg-vultrix-accent/10"
                  : done
                  ? "border-green-500/40 bg-green-500/5"
                  : "border-vultrix-gray bg-vultrix-dark hover:bg-vultrix-light/5"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  active ? "bg-vultrix-accent/20" : "bg-vultrix-gray/40"
                }`}
              >
                <Icon
                  size={14}
                  className={
                    active ? "text-vultrix-accent" : "text-vultrix-light"
                  }
                />
              </div>
              <div className="hidden md:block text-left">
                <div className="text-xs text-vultrix-light/70">
                  {s.id}
                </div>
                <div className="text-white font-semibold text-sm">{s.title}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Conteúdo das etapas */}
      {step === 1 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-vultrix-dark border border-vultrix-gray rounded-xl p-6 space-y-6"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <CalcIcon className="text-blue-400" size={18} />
            </div>
            <div>
              <h2 className="text-xl text-white font-bold">Dados do Projeto</h2>
              <p className="text-vultrix-light/70 text-sm">
                Nome, status e descrição antes de partir para os insumos.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-vultrix-light">
                Nome do projeto *
              </label>
              <input
                value={project.name}
                onChange={(e) =>
                  setProject({ ...project, name: e.target.value })
                }
                className="mt-2 w-full px-4 py-3 bg-vultrix-black border border-vultrix-gray rounded-lg text-white focus:outline-none focus:border-vultrix-accent"
                placeholder="Ex: Suporte articulado"
              />
            </div>
            <div>
              <label className="text-sm text-vultrix-light">Status</label>
              <select
                value={project.status}
                onChange={(e) =>
                  setProject({ ...project, status: e.target.value })
                }
                className="mt-2 w-full px-4 py-3 bg-vultrix-black border border-vultrix-gray rounded-lg text-white focus:outline-none focus:border-vultrix-accent"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm text-vultrix-light">Descrição</label>
            <textarea
              value={project.description}
              onChange={(e) =>
                setProject({ ...project, description: e.target.value })
              }
              className="mt-2 w-full px-4 py-3 bg-vultrix-black border border-vultrix-gray rounded-lg text-white min-h-[120px] focus:outline-none focus:border-vultrix-accent"
              placeholder="Resuma o objetivo, requisitos e observações do projeto"
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={nextStep}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-vultrix-accent text-white font-semibold hover:brightness-110"
            >
              Avançar
              <ArrowRight size={16} />
            </button>
          </div>
        </motion.div>
      )}

      {/* Etapa 2: Upload/Dados */}
      {step === 2 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-vultrix-dark border border-vultrix-gray rounded-xl p-6 space-y-5"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
              <Upload className="text-purple-400" size={18} />
            </div>
            <div>
              <h2 className="text-xl text-white font-bold">Tempo e Peso</h2>
              <p className="text-vultrix-light/70 text-sm">
                Faça upload de arquivo ou insira manualmente
              </p>
            </div>
          </div>

          {/* Toggle de modo */}
          <div className="flex gap-2">
            <button
              onClick={() => setInputMode("upload")}
              className={`flex-1 px-4 py-3 rounded-lg border font-semibold transition ${
                inputMode === "upload"
                  ? "border-vultrix-accent bg-vultrix-accent/15 text-white"
                  : "border-vultrix-gray text-vultrix-light hover:bg-vultrix-light/5"
              }`}
            >
              <Upload size={16} className="inline mr-2" />
              Upload Arquivo
            </button>
            <button
              onClick={() => setInputMode("manual")}
              className={`flex-1 px-4 py-3 rounded-lg border font-semibold transition ${
                inputMode === "manual"
                  ? "border-vultrix-accent bg-vultrix-accent/15 text-white"
                  : "border-vultrix-gray text-vultrix-light hover:bg-vultrix-light/5"
              }`}
            >
              <Edit3 size={16} className="inline mr-2" />
              Manual
            </button>
          </div>

          {inputMode === "upload" && (
            <div className="space-y-4">
              {/* Upload 3MF/G-code */}
              <div className="border-2 border-dashed border-vultrix-gray rounded-xl p-6 text-center hover:border-vultrix-accent/50 transition">
                <input
                  type="file"
                  accept=".gcode,.3mf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                  className="hidden"
                  id="file-upload"
                  disabled={uploading}
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <FileCode size={40} className="mx-auto text-vultrix-light/50 mb-3" />
                  <p className="text-white font-semibold">
                    {uploading ? "Processando..." : "Arraste ou clique para enviar"}
                  </p>
                  <p className="text-vultrix-light/70 text-sm mt-1">
                    Arquivo .gcode ou .3mf do slicer
                  </p>
                </label>
              </div>
              
              {uploadError && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                  <AlertCircle size={16} />
                  {uploadError}
                </div>
              )}

              {/* Upload Screenshot */}
              <div className="border-2 border-dashed border-vultrix-gray rounded-xl p-6 text-center hover:border-purple-500/50 transition">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleVisionUpload(file);
                  }}
                  className="hidden"
                  id="vision-upload"
                  disabled={visionUploading}
                />
                <label htmlFor="vision-upload" className="cursor-pointer">
                  <ImageIcon size={40} className="mx-auto text-purple-400/50 mb-3" />
                  <p className="text-white font-semibold">
                    {visionUploading ? "Lendo com IA..." : "Screenshot do Slicer (IA)"}
                  </p>
                  <p className="text-vultrix-light/70 text-sm mt-1">
                    Bambu Studio, Orca Slicer, PrusaSlicer
                  </p>
                </label>
              </div>
              
              {visionError && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                  <AlertCircle size={16} />
                  {visionError}
                </div>
              )}
            </div>
          )}

          {/* Dados extraídos ou manuais */}
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-vultrix-light flex items-center gap-2">
                <Clock size={14} /> Tempo (horas)
              </label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={timeHours || ""}
                onChange={(e) => setTimeHours(parseFloat(e.target.value) || 0)}
                className="mt-2 w-full px-4 py-3 bg-vultrix-black border border-vultrix-gray rounded-lg text-white focus:outline-none focus:border-vultrix-accent"
                placeholder="Ex: 4.5"
              />
            </div>
            <div>
              <label className="text-sm text-vultrix-light flex items-center gap-2">
                <Weight size={14} /> Peso total (g)
              </label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={totalWeightGrams || ""}
                onChange={(e) => setTotalWeightGrams(parseFloat(e.target.value) || 0)}
                className="mt-2 w-full px-4 py-3 bg-vultrix-black border border-vultrix-gray rounded-lg text-white focus:outline-none focus:border-vultrix-accent"
                placeholder="Ex: 120"
              />
            </div>
            <div>
              <label className="text-sm text-vultrix-light flex items-center gap-2">
                <Hash size={14} /> Qtd. no plate
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={unitQuantity}
                onChange={(e) => setUnitQuantity(parseInt(e.target.value) || 1)}
                className="mt-2 w-full px-4 py-3 bg-vultrix-black border border-vultrix-gray rounded-lg text-white focus:outline-none focus:border-vultrix-accent"
                placeholder="Ex: 1"
              />
              <p className="text-xs text-vultrix-light/50 mt-1">
                Divide o custo total por esta quantidade
              </p>
            </div>
          </div>

          {/* Info sobre dados extraídos */}
          {(timeHours > 0 || totalWeightGrams > 0) && (
            <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
              <p className="text-green-400 text-sm font-semibold mb-2">✓ Dados detectados</p>
              <div className="flex gap-6 text-sm text-vultrix-light">
                <span><Clock size={14} className="inline mr-1" /> {timeHours.toFixed(1)}h</span>
                <span><Weight size={14} className="inline mr-1" /> {totalWeightGrams.toFixed(1)}g</span>
                {unitQuantity > 1 && <span><Hash size={14} className="inline mr-1" /> {unitQuantity} unidades</span>}
              </div>
            </div>
          )}

          <div className="flex justify-between gap-3">
            <button
              onClick={prevStep}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-vultrix-gray text-vultrix-light hover:bg-vultrix-light/5"
            >
              <ArrowLeft size={16} /> Voltar
            </button>
            <button
              onClick={nextStep}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-vultrix-accent text-white font-semibold hover:brightness-110"
            >
              Avançar <ArrowRight size={16} />
            </button>
          </div>
        </motion.div>
      )}

      {/* Etapa 3: Filamentos */}
      {step === 3 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-vultrix-dark border border-vultrix-gray rounded-xl p-6 space-y-5"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                <Layers className="text-green-400" size={18} />
              </div>
              <div>
                <h2 className="text-xl text-white font-bold">
                  Filamentos do Projeto
                </h2>
                <p className="text-vultrix-light/70 text-sm">
                  Adicione vários filamentos e seus pesos estimados.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {totalWeightGrams > 0 && selectedFilaments.length > 1 && (
                <button
                  onClick={distributeWeightEqually}
                  className="inline-flex items-center gap-2 px-3 py-2 border border-vultrix-gray text-vultrix-light rounded-lg text-sm hover:bg-vultrix-light/5"
                >
                  Distribuir peso
                </button>
              )}
              <button
                onClick={addFilamentRow}
                className="inline-flex items-center gap-2 px-3 py-2 bg-vultrix-accent text-white rounded-lg text-sm font-semibold hover:brightness-110"
              >
                <Plus size={14} />
                Adicionar
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {selectedFilaments.map((row, index) => {
              const fil = filamentsMap.get(row.filament_id);
              const color = fil?.cor || "#666";
              return (
                <div
                  key={row.id}
                  className="border border-vultrix-gray rounded-xl p-4 bg-vultrix-black/60 flex flex-col md:flex-row md:items-center gap-4"
                >
                  <div className="flex-1 space-y-2">
                    <label className="text-sm text-vultrix-light">
                      Filamento #{index + 1}
                    </label>
                    <div className="flex items-center gap-3">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ background: color }}
                      />
                      <select
                        value={row.filament_id}
                        onChange={(e) =>
                          updateFilamentRow(row.id, {
                            filament_id: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 bg-vultrix-dark border border-vultrix-gray rounded-lg text-white focus:outline-none focus:border-vultrix-accent"
                      >
                        <option value="">Selecione</option>
                        {filaments.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.nome} · {f.marca} ({f.tipo}) · R${" "}
                            {f.custo_por_kg.toFixed(2)}/kg
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="w-full md:w-52">
                    <label className="text-sm text-vultrix-light">
                      Peso (g)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={row.weight_grams || ""}
                      onChange={(e) =>
                        updateFilamentRow(row.id, {
                          weight_grams: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="mt-2 w-full px-3 py-2 bg-vultrix-dark border border-vultrix-gray rounded-lg text-white focus:outline-none focus:border-vultrix-accent"
                      placeholder="Ex: 120"
                    />
                  </div>
                  <div className="flex items-center gap-2 md:w-32">
                    <button
                      onClick={() => removeFilamentRow(row.id)}
                      className="px-3 py-2 rounded-lg border border-vultrix-gray text-vultrix-light hover:bg-red-500/10 hover:border-red-500/40"
                      disabled={selectedFilaments.length === 1}
                    >
                      <Trash size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between items-center pt-2">
            <div className="text-vultrix-light/80 text-sm">
              Peso total:{" "}
              <span className="text-white font-semibold">
                {filamentsTotalWeight.toFixed(1)} g
              </span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={prevStep}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-vultrix-gray text-vultrix-light hover:bg-vultrix-light/5"
              >
                <ArrowLeft size={16} /> Voltar
              </button>
              <button
                onClick={nextStep}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-vultrix-accent text-white font-semibold hover:brightness-110"
              >
                Avançar <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Etapa 4: Custos de Venda */}
      {step === 4 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-vultrix-dark border border-vultrix-gray rounded-xl p-6 space-y-5"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center">
                <ListPlus className="text-amber-400" size={18} />
              </div>
              <div>
                <h2 className="text-xl text-white font-bold">Custos de Venda</h2>
                <p className="text-vultrix-light/70 text-sm">
                  Configure custos fixos, taxas e margem de lucro.
                </p>
              </div>
            </div>
            <button
              onClick={addExtraCost}
              className="inline-flex items-center gap-2 px-3 py-2 bg-vultrix-accent text-white rounded-lg text-sm font-semibold hover:brightness-110"
            >
              <Plus size={14} /> Custo extra
            </button>
          </div>

          {/* Custos Fixos */}
          <div className="grid md:grid-cols-4 gap-4">
            <div className="border border-vultrix-gray rounded-xl p-4 bg-vultrix-black/60 space-y-2">
              <label className="text-sm text-vultrix-light flex items-center gap-2">
                <Package size={14} /> Embalagem
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-vultrix-light/50 text-sm">R$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={embalagemCost || ""}
                  onChange={(e) => setEmbalagemCost(parseFloat(e.target.value) || 0)}
                  className="w-full pl-10 pr-3 py-2 bg-vultrix-dark border border-vultrix-gray rounded-lg text-white focus:outline-none focus:border-vultrix-accent"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="border border-vultrix-gray rounded-xl p-4 bg-vultrix-black/60 space-y-2">
              <label className="text-sm text-vultrix-light flex items-center gap-2">
                <ClipboardList size={14} /> Etiqueta
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-vultrix-light/50 text-sm">R$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={etiquetaCost || ""}
                  onChange={(e) => setEtiquetaCost(parseFloat(e.target.value) || 0)}
                  className="w-full pl-10 pr-3 py-2 bg-vultrix-dark border border-vultrix-gray rounded-lg text-white focus:outline-none focus:border-vultrix-accent"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="border border-vultrix-gray rounded-xl p-4 bg-vultrix-black/60 space-y-2">
              <label className="text-sm text-vultrix-light flex items-center gap-2">
                <Truck size={14} /> Frete
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-vultrix-light/50 text-sm">R$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={shippingCost}
                  onChange={(e) => setShippingCost(parseFloat(e.target.value) || 0)}
                  className="w-full pl-10 pr-3 py-2 bg-vultrix-dark border border-vultrix-gray rounded-lg text-white focus:outline-none focus:border-vultrix-accent"
                />
              </div>
            </div>
            <div className="border border-vultrix-gray rounded-xl p-4 bg-vultrix-black/60 space-y-2">
              <label className="text-sm text-vultrix-light flex items-center gap-2">
                <Zap size={14} /> Energia
              </label>
              <div className="text-white font-semibold text-lg">
                R$ {costEnergy.toFixed(2)}
              </div>
              <p className="text-xs text-vultrix-light/50">
                {timeHours.toFixed(1)}h × R$ {energyCostPerHour.toFixed(2)}/h
              </p>
            </div>
          </div>

          {/* Taxas */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="border border-vultrix-gray rounded-xl p-4 bg-vultrix-black/60 space-y-2">
              <label className="text-sm text-vultrix-light flex items-center gap-2">
                <Store size={14} /> Taxa Marketplace
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={marketplaceFeePercent}
                  onChange={(e) => setMarketplaceFeePercent(parseFloat(e.target.value) || 0)}
                  className="flex-1 px-3 py-2 bg-vultrix-dark border border-vultrix-gray rounded-lg text-white focus:outline-none focus:border-vultrix-accent"
                />
                <span className="text-vultrix-light">%</span>
              </div>
            </div>
            <div className="border border-vultrix-gray rounded-xl p-4 bg-vultrix-black/60 space-y-2">
              <label className="text-sm text-vultrix-light flex items-center gap-2">
                <CreditCard size={14} /> Taxa Antecipação
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={anticipationFeePercent}
                  onChange={(e) => setAnticipationFeePercent(parseFloat(e.target.value) || 0)}
                  className="flex-1 px-3 py-2 bg-vultrix-dark border border-vultrix-gray rounded-lg text-white focus:outline-none focus:border-vultrix-accent"
                />
                <span className="text-vultrix-light">%</span>
              </div>
            </div>
            <div className="border border-vultrix-gray rounded-xl p-4 bg-vultrix-black/60 space-y-2">
              <label className="text-sm text-vultrix-light flex items-center gap-2">
                <Percent size={14} /> Margem desejada
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={margin}
                  onChange={(e) => setMargin(parseFloat(e.target.value) || 0)}
                  className="flex-1 px-3 py-2 bg-vultrix-dark border border-vultrix-gray rounded-lg text-white focus:outline-none focus:border-vultrix-accent"
                />
                <span className="text-vultrix-light">%</span>
              </div>
              <div className="flex gap-1">
                {[30, 50, 70].map((m) => (
                  <button
                    key={m}
                    onClick={() => setMargin(m)}
                    className={`flex-1 px-2 py-1 rounded border text-xs font-semibold transition ${
                      margin === m
                        ? "border-vultrix-accent bg-vultrix-accent/15 text-white"
                        : "border-vultrix-gray text-vultrix-light hover:bg-vultrix-light/5"
                    }`}
                  >
                    {m}%
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Custos extras */}
          {extraCosts.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm text-vultrix-light font-semibold">Custos extras</h4>
              {extraCosts.map((row) => (
                <div
                  key={row.id}
                  className="border border-vultrix-gray rounded-xl p-4 bg-vultrix-black/60 flex flex-col md:flex-row md:items-center gap-3"
                >
                  <div className="md:w-40">
                    <select
                      value={row.type}
                      onChange={(e) => updateExtraCost(row.id, { type: e.target.value })}
                      className="w-full px-3 py-2 bg-vultrix-dark border border-vultrix-gray rounded-lg text-white text-sm"
                    >
                      {COST_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1">
                    <input
                      value={row.description}
                      onChange={(e) => updateExtraCost(row.id, { description: e.target.value })}
                      className="w-full px-3 py-2 bg-vultrix-dark border border-vultrix-gray rounded-lg text-white text-sm"
                      placeholder="Descrição"
                    />
                  </div>
                  <div className="w-32">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-vultrix-light/50 text-sm">R$</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={row.value || ""}
                        onChange={(e) => updateExtraCost(row.id, { value: parseFloat(e.target.value) || 0 })}
                        className="w-full pl-10 pr-3 py-2 bg-vultrix-dark border border-vultrix-gray rounded-lg text-white text-sm"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => removeExtraCost(row.id)}
                    className="px-3 py-2 rounded-lg border border-vultrix-gray text-vultrix-light hover:bg-red-500/10 hover:border-red-500/40"
                  >
                    <Trash size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Preço personalizado */}
          <div className="border border-purple-500/30 rounded-xl p-4 bg-purple-500/5 space-y-3">
            <h4 className="text-sm text-purple-300 font-semibold flex items-center gap-2">
              <Target size={14} /> Preço de venda personalizado (opcional)
            </h4>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-vultrix-light">Seu preço</label>
                <div className="relative mt-2">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-vultrix-light/50 text-sm">R$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={customSellPrice || ""}
                    onChange={(e) => setCustomSellPrice(parseFloat(e.target.value) || 0)}
                    className="w-full pl-10 pr-3 py-3 bg-vultrix-dark border border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    placeholder={precoSugerido.toFixed(2)}
                  />
                </div>
                <p className="text-xs text-vultrix-light/50 mt-1">
                  Deixe vazio para usar o preço sugerido
                </p>
              </div>
              <div className="flex items-center justify-center">
                <div className="text-center">
                  <p className="text-sm text-vultrix-light/70">Margem real</p>
                  <p className={`text-3xl font-bold ${margemReal >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {margemReal.toFixed(1)}%
                  </p>
                  {margemReal < margin && margemReal >= 0 && (
                    <p className="text-xs text-yellow-400 mt-1">⚠️ Abaixo da margem desejada</p>
                  )}
                  {margemReal < 0 && (
                    <p className="text-xs text-red-400 mt-1">⚠️ Prejuízo!</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center pt-2">
            <div className="text-sm text-vultrix-light/80">
              Extras: <span className="text-white font-semibold">R$ {costExtras.toFixed(2)}</span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={prevStep}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-vultrix-gray text-vultrix-light hover:bg-vultrix-light/5"
              >
                <ArrowLeft size={16} /> Voltar
              </button>
              <button
                onClick={nextStep}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-vultrix-accent text-white font-semibold hover:brightness-110"
              >
                Avançar <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Etapa 5: Resumo */}
      {step === 5 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Cards de resumo */}
          <div className="grid md:grid-cols-5 gap-3">
            <ResumoCard
              icon={Weight}
              title="Peso"
              value={`${filamentsTotalWeight.toFixed(0)}g`}
              color="text-blue-400"
            />
            <ResumoCard
              icon={Clock}
              title="Tempo"
              value={`${timeHours.toFixed(1)}h`}
              color="text-purple-400"
            />
            <ResumoCard
              icon={Hash}
              title="Qtd"
              value={`${unitQuantity}`}
              color="text-cyan-400"
            />
            <ResumoCard
              icon={Percent}
              title="Margem"
              value={`${margemReal.toFixed(0)}%`}
              color={margemReal >= margin ? "text-green-400" : "text-yellow-400"}
            />
            <ResumoCard
              icon={DollarSign}
              title="Lucro"
              value={`R$ ${lucroReal.toFixed(2)}`}
              color={lucroReal >= 0 ? "text-green-400" : "text-red-400"}
            />
          </div>

          {/* Caixa de Custo Unitário em destaque */}
          <div className="bg-gradient-to-r from-red-500/20 to-orange-500/20 border-2 border-red-500/40 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-300 font-semibold mb-1">💰 CUSTO UNITÁRIO</p>
                <p className="text-xs text-vultrix-light/70">
                  Material + Energia + Embalagem + Etiqueta + Frete
                  {unitQuantity > 1 && ` (÷ ${unitQuantity} unidades)`}
                </p>
              </div>
              <div className="text-right">
                <p className="text-4xl font-bold text-white">
                  R$ {custoComFrete.toFixed(2)}
                </p>
                <p className="text-sm text-vultrix-light/70">
                  Produção: R$ {custoUnitario.toFixed(2)} + Frete: R$ {shippingCost.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Resumo financeiro detalhado */}
          <div className="bg-vultrix-dark border border-vultrix-gray rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-vultrix-accent/10 rounded-lg flex items-center justify-center">
                <Sparkles className="text-vultrix-accent" size={18} />
              </div>
              <div>
                <h2 className="text-xl text-white font-bold">Resumo Financeiro</h2>
                <p className="text-vultrix-light/70 text-sm">
                  Fórmula: Preço = Custo ÷ (1 - taxas% - margem%)
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {/* Custos */}
              <div className="border border-vultrix-gray rounded-lg p-4 bg-vultrix-black/60 space-y-2">
                <h4 className="text-sm font-semibold text-vultrix-light/70 mb-3">CUSTOS</h4>
                <div className="flex justify-between text-sm">
                  <span className="text-vultrix-light/80">Material</span>
                  <span className="text-white">R$ {costFilaments.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-vultrix-light/80">Energia</span>
                  <span className="text-white">R$ {costEnergy.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-vultrix-light/80">Embalagem + Etiqueta</span>
                  <span className="text-white">R$ {(embalagemCost + etiquetaCost).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-vultrix-light/80">Extras</span>
                  <span className="text-white">R$ {costExtras.toFixed(2)}</span>
                </div>
                {unitQuantity > 1 && (
                  <div className="flex justify-between text-sm border-t border-vultrix-gray pt-2">
                    <span className="text-vultrix-light/80">Produção total</span>
                    <span className="text-white">R$ {custoProducaoTotal.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm border-t border-vultrix-gray pt-2">
                  <span className="text-vultrix-light/80">Custo unitário</span>
                  <span className="text-white font-semibold">R$ {custoUnitario.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-vultrix-light/80">+ Frete</span>
                  <span className="text-white">R$ {shippingCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm border-t border-vultrix-gray pt-2">
                  <span className="text-red-300 font-semibold">Total com frete</span>
                  <span className="text-red-300 font-bold">R$ {custoComFrete.toFixed(2)}</span>
                </div>
              </div>

              {/* Taxas */}
              <div className="border border-vultrix-gray rounded-lg p-4 bg-vultrix-black/60 space-y-2">
                <h4 className="text-sm font-semibold text-vultrix-light/70 mb-3">TAXAS (sobre preço)</h4>
                <div className="flex justify-between text-sm">
                  <span className="text-vultrix-light/80">Marketplace ({marketplaceFeePercent}%)</span>
                  <span className="text-white">R$ {taxaMarketplace.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-vultrix-light/80">Antecipação ({anticipationFeePercent}%)</span>
                  <span className="text-white">R$ {taxaAntecipacao.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm border-t border-vultrix-gray pt-2">
                  <span className="text-yellow-300 font-semibold">Total taxas</span>
                  <span className="text-yellow-300 font-bold">R$ {taxasTotal.toFixed(2)}</span>
                </div>
                <div className="mt-4 p-3 bg-vultrix-gray/30 rounded-lg">
                  <p className="text-xs text-vultrix-light/70 mb-1">Taxa total efetiva</p>
                  <p className="text-xl font-bold text-white">{taxaTotalPercent.toFixed(1)}%</p>
                </div>
              </div>

              {/* Resultado */}
              <div className="border border-green-500/30 rounded-lg p-4 bg-green-500/5 space-y-2">
                <h4 className="text-sm font-semibold text-green-400 mb-3">RESULTADO</h4>
                <div className="flex justify-between text-sm">
                  <span className="text-vultrix-light/80">Preço sugerido</span>
                  <span className="text-white font-semibold">R$ {precoSugerido.toFixed(2)}</span>
                </div>
                {customSellPrice > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-purple-300">Preço personalizado</span>
                    <span className="text-purple-300 font-semibold">R$ {customSellPrice.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm border-t border-vultrix-gray pt-2">
                  <span className="text-vultrix-light/80">Preço final</span>
                  <span className="text-white font-bold text-lg">R$ {precoFinal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-vultrix-light/80">- Custo</span>
                  <span className="text-red-300">- R$ {custoComFrete.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-vultrix-light/80">- Taxas</span>
                  <span className="text-yellow-300">- R$ {taxasTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm border-t border-green-500/30 pt-3 mt-2">
                  <span className="text-green-400 font-semibold">= LUCRO LÍQUIDO</span>
                  <span className={`font-bold text-xl ${lucroReal >= 0 ? "text-green-400" : "text-red-400"}`}>
                    R$ {lucroReal.toFixed(2)}
                  </span>
                </div>
                <div className="mt-3 p-3 bg-green-500/10 rounded-lg text-center">
                  <p className="text-xs text-vultrix-light/70 mb-1">Margem real</p>
                  <p className={`text-2xl font-bold ${margemReal >= margin ? "text-green-400" : margemReal >= 0 ? "text-yellow-400" : "text-red-400"}`}>
                    {margemReal.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>

            {/* Ações */}
            <div className="flex justify-between items-center pt-4 border-t border-vultrix-gray">
              <div className="text-sm text-vultrix-light/70">
                Projeto {projectId ? "✓ salvo" : "ainda não salvo"}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={prevStep}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-vultrix-gray text-vultrix-light hover:bg-vultrix-light/5"
                >
                  <ArrowLeft size={16} /> Voltar
                </button>
                <button
                  onClick={persistProject}
                  disabled={savingProject}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-vultrix-gray text-white font-semibold hover:bg-vultrix-light/10 disabled:opacity-60"
                >
                  {savingProject ? "Salvando..." : "Salvar Projeto"}
                  <Save size={16} />
                </button>
                <button
                  onClick={criarProduto}
                  disabled={savingProduct}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-vultrix-accent text-white font-semibold hover:brightness-110 disabled:opacity-60"
                >
                  {savingProduct ? "Criando..." : "Criar Produto"}
                  <Package size={16} />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

type ResumoCardProps = {
  icon: LucideIcon;
  title: string;
  value: string;
  color: string;
};

function ResumoCard({ icon: Icon, title, value, color }: ResumoCardProps) {
  return (
    <div className="border border-vultrix-gray rounded-xl p-3 bg-vultrix-dark flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-vultrix-black flex items-center justify-center">
        <Icon size={16} className={color} />
      </div>
      <div>
        <div className="text-vultrix-light/70 text-xs">{title}</div>
        <div className="text-white font-bold">{value}</div>
      </div>
    </div>
  );
}
