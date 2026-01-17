"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useRouter } from "next/navigation";
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
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Filament = {
  id: string;
  nome: string;
  marca: string;
  tipo: string;
  color_hex: string | null;
  custo_por_kg: number;
  peso_atual: number;
};

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

const STATUS_OPTIONS = [
  { value: "draft", label: "Rascunho" },
  { value: "in_progress", label: "Em andamento" },
  { value: "done", label: "Concluído" },
];

const COST_TYPES = [
  { value: "energia", label: "Energia" },
  { value: "servico", label: "Serviço" },
  { value: "acabamento", label: "Acabamento" },
  { value: "embalagem", label: "Embalagem" },
  { value: "outro", label: "Outro" },
];

const STEPS = [
  { id: 1, title: "Projeto", icon: CalcIcon },
  { id: 2, title: "Filamentos", icon: Layers },
  { id: 3, title: "Custos", icon: ListPlus },
  { id: 4, title: "Resumo", icon: Sparkles },
];

const makeId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

export default function CalculadoraProjetosPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [filaments, setFilaments] = useState<Filament[]>([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [savingProject, setSavingProject] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);

  const [project, setProject] = useState({
    name: "",
    description: "",
    status: "draft",
  });

  const [selectedFilaments, setSelectedFilaments] = useState<
    SelectedFilament[]
  >([{ id: makeId(), filament_id: "", weight_grams: 0 }]);

  const [extraCosts, setExtraCosts] = useState<ExtraCost[]>([]);

  const [energy, setEnergy] = useState({
    hours: 0,
    costPerHour: 2,
  });

  const [margin, setMargin] = useState(50);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const { data, error } = await supabase
          .from("filaments")
          .select("id, nome, marca, tipo, color_hex, custo_por_kg, peso_atual")
          .eq("user_id", user.id)
          .order("nome");

        if (error) throw error;
        setFilaments(data || []);
      } catch (err) {
        console.error("Erro ao carregar filamentos:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const filamentsMap = useMemo(() => {
    const map = new Map<string, Filament>();
    filaments.forEach((f) => map.set(f.id, f));
    return map;
  }, [filaments]);

  const totalWeight = useMemo(
    () => selectedFilaments.reduce((sum, f) => sum + (f.weight_grams || 0), 0),
    [selectedFilaments]
  );

  const costFilaments = useMemo(() => {
    return selectedFilaments.reduce((sum, item) => {
      const fil = filamentsMap.get(item.filament_id);
      if (!fil || !item.weight_grams) return sum;
      return sum + (item.weight_grams / 1000) * fil.custo_por_kg;
    }, 0);
  }, [selectedFilaments, filamentsMap]);

  const costEnergy = useMemo(
    () => Math.max(0, energy.hours) * Math.max(0, energy.costPerHour),
    [energy]
  );

  const costExtras = useMemo(
    () => extraCosts.reduce((sum, c) => sum + Math.max(0, c.value), 0),
    [extraCosts]
  );

  const custoTotal = costFilaments + costEnergy + costExtras;
  const precoMinimo = custoTotal * 1.1;
  const precoSugerido = custoTotal * (1 + margin / 100);
  const lucroEstimado = precoSugerido - custoTotal;

  const nextStep = () => setStep((s) => Math.min(4, s + 1));
  const prevStep = () => setStep((s) => Math.max(1, s - 1));

  const updateFilamentRow = (
    rowId: string,
    patch: Partial<SelectedFilament>
  ) => {
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
        filamento_id: null,
        nome: project.name,
        descricao: project.description || null,
        tempo_impressao_horas: energy.hours,
        peso_usado: totalWeight,
        custo_material: costFilaments,
        custo_energia: costEnergy,
        custo_total: custoTotal,
        preco_minimo: precoMinimo,
        preco_sugerido: precoSugerido,
        margem: margin,
        preco_venda: precoSugerido,
        margem_percentual: margin,
        status: "ativo",
        foto_url: null,
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
      <div className="grid grid-cols-4 gap-3">
        {STEPS.map((s) => {
          const Icon = s.icon;
          const active = step === s.id;
          const done = step > s.id;
          return (
            <div
              key={s.id}
              className={`rounded-xl border px-4 py-3 flex items-center gap-3 transition ${
                active
                  ? "border-vultrix-accent bg-vultrix-accent/10"
                  : done
                  ? "border-green-500/40 bg-green-500/5"
                  : "border-vultrix-gray bg-vultrix-dark"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  active ? "bg-vultrix-accent/20" : "bg-vultrix-gray/40"
                }`}
              >
                <Icon
                  size={18}
                  className={
                    active ? "text-vultrix-accent" : "text-vultrix-light"
                  }
                />
              </div>
              <div>
                <div className="text-xs text-vultrix-light/70">
                  Etapa {s.id}
                </div>
                <div className="text-white font-semibold">{s.title}</div>
              </div>
            </div>
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

      {step === 2 && (
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
            <button
              onClick={addFilamentRow}
              className="inline-flex items-center gap-2 px-3 py-2 bg-vultrix-accent text-white rounded-lg text-sm font-semibold hover:brightness-110"
            >
              <Plus size={14} />
              Adicionar
            </button>
          </div>

          <div className="space-y-3">
            {selectedFilaments.map((row, index) => {
              const fil = filamentsMap.get(row.filament_id);
              const color = fil?.color_hex || "#666";
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
                {totalWeight.toFixed(1)} g
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

      {step === 3 && (
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
                <h2 className="text-xl text-white font-bold">
                  Custos e Energia
                </h2>
                <p className="text-vultrix-light/70 text-sm">
                  Calcule energia e adicione custos extras configuráveis.
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

          <div className="grid md:grid-cols-2 gap-4">
            <div className="border border-vultrix-gray rounded-xl p-4 bg-vultrix-black/60 space-y-3">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <Zap size={16} className="text-amber-400" /> Energia
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-vultrix-light">
                    Tempo (h)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={energy.hours || ""}
                    onChange={(e) =>
                      setEnergy({
                        ...energy,
                        hours: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="mt-2 w-full px-3 py-2 bg-vultrix-dark border border-vultrix-gray rounded-lg text-white focus:outline-none focus:border-vultrix-accent"
                    placeholder="Ex: 4.5"
                  />
                </div>
                <div>
                  <label className="text-sm text-vultrix-light">
                    Custo por hora (R$)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={energy.costPerHour}
                    onChange={(e) =>
                      setEnergy({
                        ...energy,
                        costPerHour: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="mt-2 w-full px-3 py-2 bg-vultrix-dark border border-vultrix-gray rounded-lg text-white focus:outline-none focus:border-vultrix-accent"
                  />
                </div>
              </div>
              <div className="flex justify-between text-sm text-vultrix-light/80">
                <span>Energia estimada</span>
                <span className="text-white font-semibold">
                  R$ {costEnergy.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="border border-vultrix-gray rounded-xl p-4 bg-vultrix-black/60 space-y-3">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <DollarSign size={16} className="text-green-400" /> Margem e
                preço
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-vultrix-light">
                    Margem (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={margin}
                    onChange={(e) => setMargin(parseFloat(e.target.value) || 0)}
                    className="mt-2 w-full px-3 py-2 bg-vultrix-dark border border-vultrix-gray rounded-lg text-white focus:outline-none focus:border-vultrix-accent"
                  />
                </div>
                <div className="flex items-end gap-2">
                  {[30, 50, 70, 100].map((m) => (
                    <button
                      key={m}
                      onClick={() => setMargin(m)}
                      className={`flex-1 px-2 py-2 rounded-lg border text-sm font-semibold transition ${
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
              <div className="text-sm text-vultrix-light/80 flex justify-between">
                <span>Preço sugerido</span>
                <span className="text-white font-semibold">
                  R$ {precoSugerido.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {extraCosts.length === 0 && (
              <div className="text-sm text-vultrix-light/70">
                Nenhum custo extra adicionado.
              </div>
            )}
            {extraCosts.map((row) => (
              <div
                key={row.id}
                className="border border-vultrix-gray rounded-xl p-4 bg-vultrix-black/60 flex flex-col md:flex-row md:items-center gap-3"
              >
                <div className="md:w-48">
                  <label className="text-sm text-vultrix-light">Tipo</label>
                  <select
                    value={row.type}
                    onChange={(e) =>
                      updateExtraCost(row.id, { type: e.target.value })
                    }
                    className="mt-2 w-full px-3 py-2 bg-vultrix-dark border border-vultrix-gray rounded-lg text-white focus:outline-none focus:border-vultrix-accent"
                  >
                    {COST_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="text-sm text-vultrix-light">
                    Descrição
                  </label>
                  <input
                    value={row.description}
                    onChange={(e) =>
                      updateExtraCost(row.id, { description: e.target.value })
                    }
                    className="mt-2 w-full px-3 py-2 bg-vultrix-dark border border-vultrix-gray rounded-lg text-white focus:outline-none focus:border-vultrix-accent"
                    placeholder="Ex: Acabamento, embalagem, serviço"
                  />
                </div>
                <div className="md:w-40">
                  <label className="text-sm text-vultrix-light">
                    Valor (R$)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={row.value || ""}
                    onChange={(e) =>
                      updateExtraCost(row.id, {
                        value: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="mt-2 w-full px-3 py-2 bg-vultrix-dark border border-vultrix-gray rounded-lg text-white focus:outline-none focus:border-vultrix-accent"
                  />
                </div>
                <button
                  onClick={() => removeExtraCost(row.id)}
                  className="px-3 py-2 rounded-lg border border-vultrix-gray text-vultrix-light hover:bg-red-500/10 hover:border-red-500/40"
                >
                  <Trash size={16} />
                </button>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center pt-2">
            <div className="text-sm text-vultrix-light/80">
              Custos extras:{" "}
              <span className="text-white font-semibold">
                R$ {costExtras.toFixed(2)}
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

      {step === 4 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="grid md:grid-cols-4 gap-4">
            <ResumoCard
              icon={Weight}
              title="Peso total"
              value={`${totalWeight.toFixed(1)} g`}
              color="text-blue-400"
            />
            <ResumoCard
              icon={DollarSign}
              title="Material"
              value={`R$ ${costFilaments.toFixed(2)}`}
              color="text-green-400"
            />
            <ResumoCard
              icon={Zap}
              title="Energia + extras"
              value={`R$ ${(costEnergy + costExtras).toFixed(2)}`}
              color="text-amber-400"
            />
            <ResumoCard
              icon={Percent}
              title="Margem"
              value={`${margin.toFixed(0)}%`}
              color="text-vultrix-accent"
            />
          </div>

          <div className="bg-vultrix-dark border border-vultrix-gray rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-vultrix-accent/10 rounded-lg flex items-center justify-center">
                <Sparkles className="text-vultrix-accent" size={18} />
              </div>
              <div>
                <h2 className="text-xl text-white font-bold">
                  Resumo financeiro
                </h2>
                <p className="text-vultrix-light/70 text-sm">
                  Atualiza em tempo real conforme filamentos e custos.
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="border border-vultrix-gray rounded-lg p-4 bg-vultrix-black/60 space-y-3">
                <div className="flex justify-between text-sm text-vultrix-light/80">
                  <span>Custo dos filamentos</span>
                  <span className="text-white font-semibold">
                    R$ {costFilaments.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-vultrix-light/80">
                  <span>Energia</span>
                  <span className="text-white font-semibold">
                    R$ {costEnergy.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-vultrix-light/80">
                  <span>Custos extras</span>
                  <span className="text-white font-semibold">
                    R$ {costExtras.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-vultrix-light/80 border-t border-vultrix-gray pt-3">
                  <span>Custo total</span>
                  <span className="text-red-300 font-bold text-lg">
                    R$ {custoTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="border border-vultrix-gray rounded-lg p-4 bg-vultrix-black/60 space-y-3">
                <div className="flex justify-between text-sm text-vultrix-light/80">
                  <span>Preço mínimo (10%)</span>
                  <span className="text-white font-semibold">
                    R$ {precoMinimo.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-vultrix-light/80">
                  <span>Preço sugerido</span>
                  <span className="text-white font-semibold">
                    R$ {precoSugerido.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-vultrix-light/80 border-t border-vultrix-gray pt-3">
                  <span>Lucro estimado</span>
                  <span className="text-green-300 font-bold text-lg">
                    R$ {lucroEstimado.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div className="text-sm text-vultrix-light/70">
                Projeto {projectId ? "salvo" : "ainda não salvo"}.
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
                  {savingProduct
                    ? "Criando..."
                    : "Criar Produto a partir do Projeto"}
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
    <div className="border border-vultrix-gray rounded-xl p-4 bg-vultrix-dark flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-vultrix-black flex items-center justify-center">
        <Icon size={18} className={color} />
      </div>
      <div>
        <div className="text-vultrix-light/70 text-sm">{title}</div>
        <div className="text-white font-bold text-lg">{value}</div>
      </div>
    </div>
  );
}
