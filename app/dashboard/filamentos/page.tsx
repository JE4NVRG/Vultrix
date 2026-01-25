"use client";

import { useAuth } from "@/lib/auth/AuthProvider";
import { supabase } from "@/lib/supabase/client";
import { Database } from "@/types/database";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  Building2,
  Copy,
  Edit2,
  GitMerge,
  Package,
  Palette,
  Plus,
  RefreshCcw,
  Search,
  TrendingUp,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { ChangeEvent, useEffect, useMemo, useState } from "react";

type FilamentRow = Database["public"]["Tables"]["filaments"]["Row"] & {
  filament_brands?:
    | Database["public"]["Tables"]["filament_brands"]["Row"]
    | null;
};

type BrandRow = Database["public"]["Tables"]["filament_brands"]["Row"];

const TIPOS_FILAMENTO = [
  "PLA",
  "ABS",
  "PETG",
  "TPU",
  "Nylon",
  "ASA",
  "PC",
  "PVA",
  "HIPS",
  "Outro",
];

const CORES_RAPIDAS = [
  { name: "Branco", hex: "#FFFFFF" },
  { name: "Preto", hex: "#000000" },
  { name: "Vermelho", hex: "#EF4444" },
  { name: "Azul", hex: "#3B82F6" },
  { name: "Verde", hex: "#10B981" },
  { name: "Amarelo", hex: "#F59E0B" },
  { name: "Laranja", hex: "#F97316" },
  { name: "Roxo", hex: "#8B5CF6" },
  { name: "Rosa", hex: "#EC4899" },
  { name: "Cinza", hex: "#6B7280" },
  { name: "Marrom", hex: "#92400E" },
  { name: "Dourado", hex: "#FCD34D" },
];

type FormMode = "single" | "batch";

type IndividualItem = {
  id: string;
  nome: string;
  brand_id: string;
  tipo: string;
  peso_atual: number;
  peso_inicial: number;
  custo_por_kg: number;
  data_compra: string;
  color_name: string;
  color_hex: string;
  purchase_source: string;
  purchase_url: string;
  notes: string;
  image_url: string;
};

type BatchItem = {
  id: string;
  nome: string;
  peso_atual: number;
  custo_por_kg: number;
  color_name: string;
  color_hex: string;
  notes: string;
};

type SharedPurchase = {
  brand_id: string;
  tipo: string;
  data_compra: string;
  purchase_source: string;
  purchase_url: string;
  notes: string;
};

type PurchaseCostInputs = {
  shippingTotal: number | "";
  feesTotal: number | "";
  prorateByWeight: boolean;
};

type CostBreakdownPerItem = {
  costPerKgWithShipping: number;
  shippingShare: number;
  feeShare: number;
};

type CostBreakdown = {
  shouldDistribute: boolean;
  shippingTotal: number;
  feesTotal: number;
  totalWeight: number;
  perItem: Record<string, CostBreakdownPerItem>;
};

type RestockForm = {
  weight: number;
  costPerKg: number;
  costTotal: number;
  purchaseDate: string;
  purchaseSource: string;
  purchaseUrl: string;
  notes: string;
};

type RestockCostPreview = {
  weightKg: number;
  baseCostPerKg: number;
  costPerKgWithShipping: number;
  shippingShare: number;
  feeShare: number;
};

const generateId = () =>
  `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const createIndividualItem = (
  partial?: Partial<IndividualItem>,
): IndividualItem => ({
  id: generateId(),
  nome: "",
  brand_id: "",
  tipo: "PLA",
  peso_atual: 1000,
  peso_inicial: 1000,
  custo_por_kg: 0,
  data_compra: new Date().toISOString().split("T")[0],
  color_name: "",
  color_hex: "#808080",
  purchase_source: "",
  purchase_url: "",
  notes: "",
  image_url: "",
  ...partial,
});

const createBatchItem = (partial?: Partial<BatchItem>): BatchItem => ({
  id: generateId(),
  nome: "",
  peso_atual: 1000,
  custo_por_kg: 0,
  color_name: "",
  color_hex: "#808080",
  notes: "",
  ...partial,
});

const createSharedPurchase = (
  partial?: Partial<SharedPurchase>,
): SharedPurchase => ({
  brand_id: "",
  tipo: "PLA",
  data_compra: new Date().toISOString().split("T")[0],
  purchase_source: "",
  purchase_url: "",
  notes: "",
  ...partial,
});

const createPurchaseCostInputs = (
  partial?: Partial<PurchaseCostInputs>,
): PurchaseCostInputs => ({
  shippingTotal: "",
  feesTotal: "",
  prorateByWeight: false,
  ...partial,
});

const createRestockForm = (partial?: Partial<RestockForm>): RestockForm => ({
  weight: 0,
  costPerKg: 0,
  costTotal: 0,
  purchaseDate: new Date().toISOString().split("T")[0],
  purchaseSource: "",
  purchaseUrl: "",
  notes: "",
  ...partial,
});

export default function FilamentosPage() {
  const { user, loading: authLoading } = useAuth();
  const [filaments, setFilaments] = useState<FilamentRow[]>([]);
  const [brands, setBrands] = useState<BrandRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTipo, setFilterTipo] = useState<string>("");
  const [filterBrand, setFilterBrand] = useState<string>("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [brandModalOpen, setBrandModalOpen] = useState(false);
  const [newBrand, setNewBrand] = useState({ name: "", website: "" });
  const [formMode, setFormMode] = useState<FormMode>("single");
  const [individualItems, setIndividualItems] = useState<IndividualItem[]>([
    createIndividualItem(),
  ]);
  const [batchItems, setBatchItems] = useState<BatchItem[]>([
    createBatchItem(),
  ]);
  const [sharedPurchase, setSharedPurchase] = useState<SharedPurchase>(
    createSharedPurchase(),
  );
  const [individualCosts, setIndividualCosts] = useState<PurchaseCostInputs>(
    createPurchaseCostInputs(),
  );
  const [batchCosts, setBatchCosts] = useState<PurchaseCostInputs>(
    createPurchaseCostInputs(),
  );
  const [batchPaste, setBatchPaste] = useState("");
  const [restockTarget, setRestockTarget] = useState<FilamentRow | null>(null);
  const [restockForm, setRestockForm] =
    useState<RestockForm>(createRestockForm());
  const [restockCosts, setRestockCosts] = useState<PurchaseCostInputs>(
    createPurchaseCostInputs(),
  );

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      const { data: brandsData } = await supabase
        .from("filament_brands")
        .select("*")
        .eq("user_id", user!.id)
        .order("name");

      setBrands(brandsData || []);

      const { data: filamentsData } = await supabase
        .from("filaments")
        .select(`*, filament_brands (*)`)
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

      setFilaments(filamentsData || []);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBrand = async () => {
    if (!newBrand.name.trim()) {
      alert("Informe o nome da marca");
      return;
    }
    const normalized = newBrand.name.trim().toLowerCase().replace(/\s+/g, "-");
    const { error } = await supabase.from("filament_brands").insert({
      user_id: user!.id,
      name: newBrand.name.trim(),
      normalized_name: normalized,
      website: newBrand.website.trim() || null,
    });
    if (error) {
      console.error("Erro ao criar marca:", error);
      alert("Erro ao criar marca");
      return;
    }
    setNewBrand({ name: "", website: "" });
    setBrandModalOpen(false);
    loadData();
  };

  const computeCostBreakdown = (
    items: Array<{ id: string; peso_atual: number; custo_por_kg: number }>,
    costs: PurchaseCostInputs,
  ): CostBreakdown => {
    const toNumber = (value: number | "" | undefined) => {
      if (typeof value === "number") return value;
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : 0;
    };
    const shippingTotal = Math.max(0, toNumber(costs.shippingTotal));
    const feesTotal = Math.max(0, toNumber(costs.feesTotal));
    const shouldDistribute =
      costs.prorateByWeight && (shippingTotal > 0 || feesTotal > 0);
    const totalWeight =
      items.reduce((sum, item) => sum + item.peso_atual, 0) / 1000;
    const perItem: Record<string, CostBreakdownPerItem> = {};

    items.forEach((item) => {
      const weightKg = item.peso_atual / 1000;
      const baseCostPerKg = item.custo_por_kg;
      let shippingShare = 0;
      let feeShare = 0;
      let costPerKgWithShipping = baseCostPerKg;

      if (shouldDistribute && totalWeight > 0) {
        const weightRatio = weightKg / totalWeight;
        shippingShare = shippingTotal * weightRatio;
        feeShare = feesTotal * weightRatio;
        const totalExtraPerKg = (shippingShare + feeShare) / weightKg;
        costPerKgWithShipping = baseCostPerKg + totalExtraPerKg;
      }

      perItem[item.id] = {
        costPerKgWithShipping,
        shippingShare,
        feeShare,
      };
    });

    return {
      shouldDistribute,
      shippingTotal,
      feesTotal,
      totalWeight,
      perItem,
    };
  };

  const individualCostBreakdown = useMemo(
    () => computeCostBreakdown(individualItems, individualCosts),
    [individualItems, individualCosts],
  );

  const batchCostBreakdown = useMemo(
    () => computeCostBreakdown(batchItems, batchCosts),
    [batchItems, batchCosts],
  );

  const modalSummary = useMemo(() => {
    const items = formMode === "single" ? individualItems : batchItems;
    const breakdown =
      formMode === "single" ? individualCostBreakdown : batchCostBreakdown;
    const totalItems = items.length;
    const totalWeightKg =
      items.reduce((sum, item) => sum + item.peso_atual, 0) / 1000;
    const avgCostKg =
      totalWeightKg > 0
        ? items.reduce(
            (sum, item) => sum + (item.peso_atual / 1000) * item.custo_por_kg,
            0,
          ) / totalWeightKg
        : 0;
    const avgCostKgWithShipping =
      totalWeightKg > 0
        ? items.reduce((sum, item) => {
            const computed = breakdown.perItem[item.id];
            return (
              sum +
              (item.peso_atual / 1000) *
                (computed?.costPerKgWithShipping ?? item.custo_por_kg)
            );
          }, 0) / totalWeightKg
        : 0;

    return { totalItems, totalWeightKg, avgCostKg, avgCostKgWithShipping };
  }, [
    formMode,
    individualItems,
    batchItems,
    individualCostBreakdown,
    batchCostBreakdown,
  ]);

  const stats = useMemo(() => {
    const total = filaments.length;
    const estoque = filaments.reduce((sum, f) => sum + f.peso_atual, 0) / 1000;
    const valor = filaments.reduce(
      (sum, f) => sum + (f.peso_atual / 1000) * f.custo_por_kg,
      0,
    );
    const lowStock = filaments.filter((f) => f.peso_atual < 200).length;
    return { total, estoque, valor, lowStock };
  }, [filaments]);

  const filteredFilaments = useMemo(() => {
    return filaments.filter((f) => {
      const brand = Array.isArray(f.filament_brands)
        ? f.filament_brands[0]
        : f.filament_brands;
      const matchSearch =
        !searchTerm ||
        f.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.marca?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        brand?.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchTipo = !filterTipo || f.tipo === filterTipo;
      const matchBrand = !filterBrand || f.brand_id === filterBrand;
      return matchSearch && matchTipo && matchBrand;
    });
  }, [filaments, searchTerm, filterTipo, filterBrand]);

  const renderSharedCostsCard = (
    costs: PurchaseCostInputs,
    update: (patch: Partial<PurchaseCostInputs>) => void,
    weightKg: number,
    description: string,
  ) => {
    return (
      <div className="border border-vultrix-gray/60 rounded-xl p-4 bg-vultrix-black space-y-4 lg:space-y-5 h-full">
        <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-vultrix-black/60 border border-vultrix-gray/60 text-xs uppercase tracking-[0.08em] text-vultrix-light/70">
          <TrendingUp size={14} /> Custos compartilhados
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-white font-semibold">Frete e taxas</p>
          <p className="text-xs text-vultrix-light/60">{description}</p>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm text-vultrix-light/70">
              Frete total (R$)
            </label>
            <input
              type="number"
              min={0}
              step={0.01}
              value={costs.shippingTotal}
              onChange={(e) => {
                const parsed = Number(e.target.value);
                update({ shippingTotal: Number.isNaN(parsed) ? "" : parsed });
              }}
              placeholder="0.00"
              className="w-full px-4 py-2 bg-vultrix-dark border border-vultrix-gray rounded-lg text-white"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-vultrix-light/70">
              Taxas / Impostos (R$)
            </label>
            <input
              type="number"
              min={0}
              step={0.01}
              value={costs.feesTotal}
              onChange={(e) => {
                const parsed = Number(e.target.value);
                update({ feesTotal: Number.isNaN(parsed) ? "" : parsed });
              }}
              placeholder="0.00"
              className="w-full px-4 py-2 bg-vultrix-dark border border-vultrix-gray rounded-lg text-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id={`prorate-${Math.random()}`}
              checked={costs.prorateByWeight}
              onChange={(e) => update({ prorateByWeight: e.target.checked })}
              className="w-4 h-4"
            />
            <label
              htmlFor={`prorate-${Math.random()}`}
              className="text-sm text-vultrix-light/70 cursor-pointer"
            >
              Ratear por peso
            </label>
          </div>
          {costs.prorateByWeight && weightKg > 0 && (
            <div className="bg-vultrix-dark/60 border border-vultrix-gray/60 rounded-lg p-3 space-y-1">
              <p className="text-xs text-vultrix-light/60">
                Peso total: {weightKg.toFixed(2)} kg
              </p>
              <p className="text-xs text-vultrix-light/60">
                Custo extra/kg: R${" "}
                {(
                  ((typeof costs.shippingTotal === "number"
                    ? costs.shippingTotal
                    : 0) +
                    (typeof costs.feesTotal === "number"
                      ? costs.feesTotal
                      : 0)) /
                  weightKg
                ).toFixed(2)}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderIndividualForm = () => {
    const totalWeightKg =
      individualItems.reduce((sum, current) => sum + current.peso_atual, 0) /
      1000;

    return (
      <div className="space-y-6 lg:space-y-8">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8 items-start">
          <div className="space-y-6">
            {renderSharedCostsCard(
              individualCosts,
              (patch) => setIndividualCosts((prev) => ({ ...prev, ...patch })),
              totalWeightKg,
              "Aplicado a todos os filamentos deste cadastro individual.",
            )}
          </div>
        </div>

        <div className="space-y-6">
          {individualItems.map((item, idx) => (
            <div
              key={item.id}
              className="border border-vultrix-gray/60 rounded-xl p-4 bg-vultrix-black space-y-4"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-vultrix-light/60">
                  Filamento #{idx + 1} – {item.nome || "Sem nome"}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => duplicateIndividualItem(item.id)}
                    className="text-xs text-vultrix-light/70 hover:text-white"
                  >
                    Duplicar
                  </button>
                  <button
                    type="button"
                    onClick={() => removeIndividualItem(item.id)}
                    disabled={individualItems.length === 1}
                    className="text-xs text-red-400 hover:text-red-300 disabled:text-vultrix-light/40"
                  >
                    Remover
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                <div className="space-y-2">
                  <label className="text-sm text-vultrix-light/70">
                    Nome *
                  </label>
                  <input
                    type="text"
                    value={item.nome}
                    onChange={(e) =>
                      updateIndividualItem(item.id, "nome", e.target.value)
                    }
                    placeholder="Nome do filamento (ex: PLA Branco 1.75mm)"
                    className="w-full px-4 py-2 bg-vultrix-dark border border-vultrix-gray rounded-lg text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-vultrix-light/70">
                    Marca *
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={item.brand_id}
                      onChange={(e) =>
                        updateIndividualItem(
                          item.id,
                          "brand_id",
                          e.target.value,
                        )
                      }
                      className="flex-1 px-4 py-2 bg-vultrix-dark border border-vultrix-gray rounded-lg text-white"
                    >
                      <option value="">Selecione</option>
                      {brands.map((brand) => (
                        <option key={brand.id} value={brand.id}>
                          {brand.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setBrandModalOpen(true)}
                      className="px-3 py-2 bg-vultrix-accent/20 text-vultrix-accent rounded-lg"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
                <div className="space-y-2">
                  <label className="text-sm text-vultrix-light/70">Tipo</label>
                  <select
                    value={item.tipo}
                    onChange={(e) =>
                      updateIndividualItem(item.id, "tipo", e.target.value)
                    }
                    className="w-full px-4 py-2 bg-vultrix-dark border border-vultrix-gray rounded-lg text-white"
                  >
                    {TIPOS_FILAMENTO.map((tipo) => (
                      <option key={tipo} value={tipo}>
                        {tipo}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-vultrix-light/70">
                    Peso (g)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={10}
                    value={item.peso_atual}
                    onChange={(e) =>
                      updateIndividualItem(
                        item.id,
                        "peso_atual",
                        Number(e.target.value),
                      )
                    }
                    className="w-full px-4 py-2 bg-vultrix-dark border border-vultrix-gray rounded-lg text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-vultrix-light/70">
                    Custo Kg (R$)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={item.custo_por_kg}
                    onChange={(e) =>
                      updateIndividualItem(
                        item.id,
                        "custo_por_kg",
                        Number(e.target.value),
                      )
                    }
                    className="w-full px-4 py-2 bg-vultrix-dark border border-vultrix-gray rounded-lg text-white"
                  />
                  <p className="text-xs text-vultrix-light/60">
                    C/ frete: R${" "}
                    {(
                      individualCostBreakdown.perItem[item.id]
                        ?.costPerKgWithShipping ?? item.custo_por_kg
                    ).toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                <div className="space-y-2">
                  <label className="text-sm text-vultrix-light/70">Cor</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={item.color_hex}
                      onChange={(e) =>
                        updateIndividualItem(
                          item.id,
                          "color_hex",
                          e.target.value,
                        )
                      }
                      className="w-16 h-12 rounded"
                    />
                    <input
                      type="text"
                      value={item.color_name}
                      onChange={(e) =>
                        updateIndividualItem(
                          item.id,
                          "color_name",
                          e.target.value,
                        )
                      }
                      placeholder="Nome da cor (ex: Azul Royal)"
                      className="flex-1 px-4 py-2 bg-vultrix-dark border border-vultrix-gray rounded-lg text-white"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {CORES_RAPIDAS.map((cor) => (
                      <button
                        key={cor.hex}
                        type="button"
                        onClick={() => {
                          updateIndividualItem(item.id, "color_hex", cor.hex);
                          updateIndividualItem(item.id, "color_name", cor.name);
                        }}
                        className="w-8 h-8 rounded-full border-2 border-white/20 hover:border-white/60"
                        style={{ backgroundColor: cor.hex }}
                        title={cor.name}
                      />
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-vultrix-light/70">
                    Data da compra
                  </label>
                  <input
                    type="date"
                    value={item.data_compra}
                    onChange={(e) =>
                      updateIndividualItem(
                        item.id,
                        "data_compra",
                        e.target.value,
                      )
                    }
                    className="w-full px-4 py-2 bg-vultrix-dark border border-vultrix-gray rounded-lg text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-vultrix-light/70">
                    Origem / Loja
                  </label>
                  <input
                    type="text"
                    value={item.purchase_source}
                    onChange={(e) =>
                      updateIndividualItem(
                        item.id,
                        "purchase_source",
                        e.target.value,
                      )
                    }
                    placeholder="STLFlix, Shopee, fornecedor..."
                    className="w-full px-4 py-2 bg-vultrix-dark border border-vultrix-gray rounded-lg text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-vultrix-light/70">
                    Link da compra
                  </label>
                  <input
                    type="url"
                    value={item.purchase_url}
                    onChange={(e) =>
                      updateIndividualItem(
                        item.id,
                        "purchase_url",
                        e.target.value,
                      )
                    }
                    placeholder="URL para recompra rápida"
                    className="w-full px-4 py-2 bg-vultrix-dark border border-vultrix-gray rounded-lg text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-vultrix-light/70">Notas</label>
                <textarea
                  value={item.notes}
                  onChange={(e) =>
                    updateIndividualItem(item.id, "notes", e.target.value)
                  }
                  rows={2}
                  className="w-full px-4 py-2 bg-vultrix-dark border border-vultrix-gray rounded-lg text-white resize-none"
                  placeholder="Observações sobre qualidade, lote, temperatura ideal..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-vultrix-light/70">
                  Imagem do rolo
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, item.id, "single")}
                  className="w-full px-4 py-2 bg-vultrix-dark border border-vultrix-gray rounded-lg text-white"
                  disabled={uploadingImage}
                />
                {item.image_url && (
                  <img
                    src={item.image_url}
                    alt="Preview"
                    className="w-32 h-32 object-cover rounded-lg border border-vultrix-gray"
                  />
                )}
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addIndividualItem}
          className="w-full px-4 py-2 border border-dashed border-vultrix-gray rounded-lg text-vultrix-accent hover:border-vultrix-accent flex items-center justify-center gap-2"
        >
          <Plus size={16} /> Adicionar outro filamento
        </button>
      </div>
    );
  };

  const renderBatchForm = () => {
    const totalWeightKg =
      batchItems.reduce((sum, current) => sum + current.peso_atual, 0) / 1000;

    return (
      <div className="space-y-6 lg:space-y-8">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8 items-start">
          <div className="border border-vultrix-gray/60 rounded-xl p-4 bg-vultrix-black space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-vultrix-black/60 border border-vultrix-gray/60 text-xs uppercase tracking-[0.08em] text-vultrix-light/70">
              <Building2 size={14} /> Cabeçalho da compra
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-sm text-vultrix-light/60">
                Organize marca, tipo e contexto da compra em lote
              </p>
              <p className="text-white font-semibold">
                Detalhe as informações gerais da compra
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
              <div className="space-y-2">
                <label className="text-sm text-vultrix-light/70">Marca *</label>
                <div className="flex gap-2">
                  <select
                    value={sharedPurchase.brand_id}
                    onChange={(e) =>
                      setSharedPurchase((prev) => ({
                        ...prev,
                        brand_id: e.target.value,
                      }))
                    }
                    className="flex-1 px-4 py-2 bg-vultrix-dark border border-vultrix-gray rounded-lg text-white"
                  >
                    <option value="">Selecione</option>
                    {brands.map((brand) => (
                      <option key={brand.id} value={brand.id}>
                        {brand.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setBrandModalOpen(true)}
                    className="px-3 py-2 bg-vultrix-accent/20 text-vultrix-accent rounded-lg"
                  >
                    + Marca
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-vultrix-light/70">Tipo</label>
                <select
                  value={sharedPurchase.tipo}
                  onChange={(e) =>
                    setSharedPurchase((prev) => ({
                      ...prev,
                      tipo: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-2 bg-vultrix-dark border border-vultrix-gray rounded-lg text-white"
                >
                  {TIPOS_FILAMENTO.map((tipo) => (
                    <option key={tipo} value={tipo}>
                      {tipo}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-vultrix-light/70">
                  Data da compra
                </label>
                <input
                  type="date"
                  value={sharedPurchase.data_compra}
                  onChange={(e) =>
                    setSharedPurchase((prev) => ({
                      ...prev,
                      data_compra: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-2 bg-vultrix-dark border border-vultrix-gray rounded-lg text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-vultrix-light/70">
                  Origem / Link
                </label>
                <input
                  type="text"
                  value={sharedPurchase.purchase_source}
                  onChange={(e) =>
                    setSharedPurchase((prev) => ({
                      ...prev,
                      purchase_source: e.target.value,
                    }))
                  }
                  placeholder="Origem / Loja (STLFlix, Shopee, fornecedor...)"
                  className="w-full px-4 py-2 bg-vultrix-dark border border-vultrix-gray rounded-lg text-white"
                />
                <input
                  type="url"
                  value={sharedPurchase.purchase_url}
                  onChange={(e) =>
                    setSharedPurchase((prev) => ({
                      ...prev,
                      purchase_url: e.target.value,
                    }))
                  }
                  placeholder="Link da compra para recompra rápida"
                  className="w-full px-4 py-2 bg-vultrix-dark border border-vultrix-gray rounded-lg text-white"
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm text-vultrix-light/70">
                  Notas gerais
                </label>
                <textarea
                  value={sharedPurchase.notes}
                  onChange={(e) =>
                    setSharedPurchase((prev) => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                  rows={3}
                  className="w-full px-4 py-2 bg-vultrix-dark border border-vultrix-gray rounded-lg text-white resize-none"
                  placeholder="Notas gerais do pedido, cupom aplicado, referência de frete..."
                />
              </div>
            </div>
          </div>

          <div className="h-full">
            {renderSharedCostsCard(
              batchCosts,
              (patch) => setBatchCosts((prev) => ({ ...prev, ...patch })),
              totalWeightKg,
              "Use os valores abaixo para ratear frete e taxas automaticamente entre todos os itens do lote.",
            )}
          </div>
        </div>

        <div className="border-t border-vultrix-gray/60" />

        <div className="border border-vultrix-gray/60 rounded-xl p-4 bg-vultrix-black space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-vultrix-black/60 border border-vultrix-gray/60 text-xs uppercase tracking-[0.08em] text-vultrix-light/70">
                <Package size={14} /> Lista de itens ({batchItems.length})
              </div>
              <p className="text-sm text-vultrix-light/60 mt-2">
                Nome, cor, peso e custo de cada filamento
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={addBatchItem}
                className="px-3 py-2 border border-dashed border-vultrix-gray rounded-lg text-vultrix-accent hover:border-vultrix-accent"
              >
                + Item
              </button>
              <button
                type="button"
                onClick={handleBatchPaste}
                className="px-3 py-2 border border-vultrix-gray rounded-lg text-vultrix-light/70 hover:text-white"
              >
                Converter colagem
              </button>
            </div>
          </div>

          <textarea
            value={batchPaste}
            onChange={(e) => setBatchPaste(e.target.value)}
            rows={2}
            placeholder="nome;#hex;peso;custo;notas"
            className="w-full px-3 py-2 bg-vultrix-dark border border-vultrix-gray rounded-lg text-white"
          />

          <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
            {batchItems.map((item, idx) => (
              <div
                key={item.id}
                className="border border-vultrix-gray/60 rounded-lg p-4 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm text-vultrix-light/60">
                    Item #{idx + 1} – {item.nome || "Sem nome"}
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => duplicateBatchItem(item.id)}
                      className="text-xs text-vultrix-light/70 hover:text-white"
                    >
                      Duplicar
                    </button>
                    <button
                      type="button"
                      onClick={() => removeBatchItem(item.id)}
                      disabled={batchItems.length === 1}
                      className="text-xs text-red-400 hover:text-red-300 disabled:text-vultrix-light/40"
                    >
                      Remover
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
                  <div className="space-y-2">
                    <label className="text-sm text-vultrix-light/70">
                      Nome *
                    </label>
                    <input
                      type="text"
                      value={item.nome}
                      onChange={(e) =>
                        updateBatchItem(item.id, "nome", e.target.value)
                      }
                      placeholder="Ex: PLA Azul Aurora"
                      className="w-full px-4 py-2 bg-vultrix-dark border border-vultrix-gray rounded-lg text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-vultrix-light/70">
                      Peso (g)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={10}
                      value={item.peso_atual}
                      onChange={(e) =>
                        updateBatchItem(
                          item.id,
                          "peso_atual",
                          Number(e.target.value),
                        )
                      }
                      className="w-full px-4 py-2 bg-vultrix-dark border border-vultrix-gray rounded-lg text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-vultrix-light/70">
                      Custo Kg (R$)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      value={item.custo_por_kg}
                      onChange={(e) =>
                        updateBatchItem(
                          item.id,
                          "custo_por_kg",
                          Number(e.target.value),
                        )
                      }
                      className="w-full px-4 py-2 bg-vultrix-dark border border-vultrix-gray rounded-lg text-white"
                    />
                    <p className="text-xs text-vultrix-light/60">
                      C/ frete: R${" "}
                      {(
                        batchCostBreakdown.perItem[item.id]
                          ?.costPerKgWithShipping ?? item.custo_por_kg
                      ).toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                  <div className="space-y-2">
                    <label className="text-sm text-vultrix-light/70">Cor</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={item.color_hex}
                        onChange={(e) =>
                          updateBatchItem(item.id, "color_hex", e.target.value)
                        }
                        className="w-16 h-12 rounded"
                      />
                      <input
                        type="text"
                        value={item.color_name}
                        onChange={(e) =>
                          updateBatchItem(item.id, "color_name", e.target.value)
                        }
                        placeholder="Nome da cor (ex: Azul Royal)"
                        className="flex-1 px-4 py-2 bg-vultrix-dark border border-vultrix-gray rounded-lg text-white"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-vultrix-light/70">
                      Notas do item
                    </label>
                    <textarea
                      value={item.notes}
                      onChange={(e) =>
                        updateBatchItem(item.id, "notes", e.target.value)
                      }
                      rows={2}
                      className="w-full px-4 py-2 bg-vultrix-dark border border-vultrix-gray rounded-lg text-white resize-none"
                      placeholder="Observações rápidas sobre o rolo"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderRestockForm = () => {
    if (!restockTarget) return null;

    return (
      <div className="space-y-6">
        <div className="bg-vultrix-dark border border-vultrix-gray rounded-xl p-4 space-y-3">
          <p className="text-sm text-vultrix-light/60">Filamento em estoque</p>
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-lg border-2 border-white/20"
              style={{ backgroundColor: restockTarget.color_hex }}
            />
            <div>
              <p className="text-white font-semibold">{restockTarget.nome}</p>
              <p className="text-sm text-vultrix-light/60">
                {restockTarget.marca} • {restockTarget.tipo} •{" "}
                {restockTarget.peso_atual} g
              </p>
            </div>
          </div>
        </div>

        <div className="border border-vultrix-gray/60 rounded-xl p-4 bg-vultrix-black space-y-4">
          <div className="flex flex-col gap-2">
            <p className="text-sm text-vultrix-light/60">Dados da reposição</p>
            <p className="text-white font-semibold">
              Informe peso e custo da nova compra
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm text-vultrix-light/70">
                Peso comprado (g) *
              </label>
              <input
                type="number"
                min={0}
                step={10}
                value={restockForm.weight}
                onChange={(e) =>
                  setRestockForm((prev) => ({
                    ...prev,
                    weight: Number(e.target.value),
                  }))
                }
                className="w-full px-4 py-2 bg-vultrix-dark border border-vultrix-gray rounded-lg text-white"
                placeholder="Ex: 1000"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-vultrix-light/70">
                Data da compra
              </label>
              <input
                type="date"
                value={restockForm.purchaseDate}
                onChange={(e) =>
                  setRestockForm((prev) => ({
                    ...prev,
                    purchaseDate: e.target.value,
                  }))
                }
                className="w-full px-4 py-2 bg-vultrix-dark border border-vultrix-gray rounded-lg text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm text-vultrix-light/70">
                Custo por Kg (R$)
              </label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={restockForm.costPerKg}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  setRestockForm((prev) => ({
                    ...prev,
                    costPerKg: value,
                    costTotal: 0,
                  }));
                }}
                className="w-full px-4 py-2 bg-vultrix-dark border border-vultrix-gray rounded-lg text-white"
                placeholder="Ex: 85.00"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-vultrix-light/70">
                OU Custo total (R$)
              </label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={restockForm.costTotal}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  setRestockForm((prev) => ({
                    ...prev,
                    costTotal: value,
                    costPerKg: 0,
                  }));
                }}
                className="w-full px-4 py-2 bg-vultrix-dark border border-vultrix-gray rounded-lg text-white"
                placeholder="Ex: 85.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm text-vultrix-light/70">
                Origem / Loja
              </label>
              <input
                type="text"
                value={restockForm.purchaseSource}
                onChange={(e) =>
                  setRestockForm((prev) => ({
                    ...prev,
                    purchaseSource: e.target.value,
                  }))
                }
                placeholder="STLFlix, Shopee, fornecedor..."
                className="w-full px-4 py-2 bg-vultrix-dark border border-vultrix-gray rounded-lg text-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-vultrix-light/70">
                Link da compra
              </label>
              <input
                type="url"
                value={restockForm.purchaseUrl}
                onChange={(e) =>
                  setRestockForm((prev) => ({
                    ...prev,
                    purchaseUrl: e.target.value,
                  }))
                }
                placeholder="URL para recompra rápida"
                className="w-full px-4 py-2 bg-vultrix-dark border border-vultrix-gray rounded-lg text-white"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-vultrix-light/70">
              Notas da reposição
            </label>
            <textarea
              value={restockForm.notes}
              onChange={(e) =>
                setRestockForm((prev) => ({ ...prev, notes: e.target.value }))
              }
              rows={3}
              className="w-full px-4 py-2 bg-vultrix-dark border border-vultrix-gray rounded-lg text-white resize-none"
              placeholder="Observações sobre esta compra específica..."
            />
          </div>
        </div>

        <div className="border border-vultrix-gray/60 rounded-xl p-4 bg-vultrix-black space-y-4">
          {renderSharedCostsCard(
            restockCosts,
            (patch) => setRestockCosts((prev) => ({ ...prev, ...patch })),
            restockForm.weight / 1000,
            "Frete e taxas desta reposição (opcional).",
          )}
        </div>
      </div>
    );
  };

  const restockCostPreview: RestockCostPreview = useMemo(() => {
    if (!restockTarget) {
      return {
        weightKg: restockForm.weight / 1000,
        baseCostPerKg: restockForm.costPerKg,
        costPerKgWithShipping: restockForm.costPerKg,
        shippingShare: 0,
        feeShare: 0,
      };
    }

    const weightKg = restockForm.weight / 1000;
    const toNumber = (value: number | "" | undefined) => {
      if (typeof value === "number") return value;
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : 0;
    };
    const shippingTotal = Math.max(0, toNumber(restockCosts.shippingTotal));
    const feesTotal = Math.max(0, toNumber(restockCosts.feesTotal));
    const includeExtras =
      restockCosts.prorateByWeight && (shippingTotal > 0 || feesTotal > 0);
    const baseCostPerKg =
      restockForm.costPerKg > 0
        ? restockForm.costPerKg
        : weightKg > 0 && restockForm.costTotal > 0
          ? restockForm.costTotal / weightKg
          : 0;
    const totalExtras = includeExtras ? shippingTotal + feesTotal : 0;
    const costPerKgWithShipping =
      weightKg > 0
        ? (baseCostPerKg * weightKg + totalExtras) / weightKg
        : baseCostPerKg;

    return {
      weightKg,
      baseCostPerKg,
      costPerKgWithShipping,
      shippingShare: includeExtras ? shippingTotal : 0,
      feeShare: includeExtras ? feesTotal : 0,
    };
  }, [restockForm, restockCosts, restockTarget]);

  const restockWeightedPreview = useMemo(() => {
    if (!restockTarget) return null;
    const newTotalWeight = restockTarget.peso_atual + restockForm.weight;
    const newWeightKg = newTotalWeight / 1000;
    const previousWeightKg = restockTarget.peso_atual / 1000;
    const currentCostWithShipping =
      restockTarget.cost_per_kg_with_shipping || restockTarget.custo_por_kg;
    const weightedBase =
      newWeightKg > 0
        ? (previousWeightKg * restockTarget.custo_por_kg +
            restockCostPreview.weightKg * restockCostPreview.baseCostPerKg) /
          newWeightKg
        : restockCostPreview.baseCostPerKg;
    const weightedWithShipping =
      newWeightKg > 0
        ? (previousWeightKg * currentCostWithShipping +
            restockCostPreview.weightKg *
              restockCostPreview.costPerKgWithShipping) /
          newWeightKg
        : restockCostPreview.costPerKgWithShipping;

    return {
      newTotalWeight,
      weightedBase,
      weightedWithShipping,
    };
  }, [restockForm.weight, restockCostPreview, restockTarget]);

  const isRestockMode = Boolean(restockTarget);
  const modalHeading = isRestockMode
    ? {
        label: "Reposição de estoque",
        title: restockTarget?.nome || "Reposição",
      }
    : editingId
      ? { label: "Editar Filamento", title: "Atualizar registro" }
      : { label: "Novo Filamento", title: "Adicionar ao estoque" };
  const submitLabel = isRestockMode
    ? "Registrar reposição"
    : editingId
      ? "Salvar alterações"
      : "Registrar";

  const handleOpenModal = (filament?: FilamentRow) => {
    setRestockTarget(null);
    setRestockForm(createRestockForm());
    setBatchCosts(createPurchaseCostInputs());
    setRestockCosts(createPurchaseCostInputs());
    if (!filament) {
      setIndividualCosts(createPurchaseCostInputs());
      setEditingId(null);
      setFormMode("single");
      setIndividualItems([createIndividualItem()]);
      setBatchItems([createBatchItem()]);
      setSharedPurchase(createSharedPurchase());
      setModalOpen(true);
      return;
    }

    setEditingId(filament.id);
    setFormMode("single");
    const inferredProration =
      filament.shipping_prorated_by_weight ??
      filament.cost_per_kg_with_shipping !== filament.custo_por_kg;
    setIndividualCosts(
      createPurchaseCostInputs({
        shippingTotal:
          filament.purchase_shipping_total ??
          filament.shipping_share_value ??
          "",
        feesTotal:
          filament.purchase_fees_total ?? filament.fees_share_value ?? "",
        prorateByWeight: inferredProration,
      }),
    );
    setIndividualItems([
      createIndividualItem({
        id: generateId(),
        nome: filament.nome,
        brand_id: filament.brand_id || "",
        tipo: filament.tipo,
        peso_atual: filament.peso_atual,
        peso_inicial: filament.peso_inicial,
        custo_por_kg: filament.custo_por_kg,
        data_compra: filament.data_compra,
        color_name: filament.color_name || "",
        color_hex: filament.color_hex,
        purchase_source: filament.purchase_source || "",
        purchase_url: filament.purchase_url || "",
        notes: filament.notes || "",
        image_url: filament.image_url || "",
      }),
    ]);
    setModalOpen(true);
  };

  const handleOpenRestockModal = (filament: FilamentRow) => {
    setEditingId(null);
    setFormMode("single");
    setIndividualItems([createIndividualItem()]);
    setBatchItems([createBatchItem()]);
    setSharedPurchase(createSharedPurchase());
    setIndividualCosts(createPurchaseCostInputs());
    setBatchCosts(createPurchaseCostInputs());
    setRestockCosts(createPurchaseCostInputs());
    setRestockTarget(filament);
    setRestockForm(
      createRestockForm({
        purchaseSource: filament.purchase_source || "",
        purchaseUrl: filament.purchase_url || "",
      }),
    );
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setIndividualItems([createIndividualItem()]);
    setBatchItems([createBatchItem()]);
    setSharedPurchase(createSharedPurchase());
    setIndividualCosts(createPurchaseCostInputs());
    setBatchCosts(createPurchaseCostInputs());
    setRestockTarget(null);
    setRestockForm(createRestockForm());
    setRestockCosts(createPurchaseCostInputs());
    setBatchPaste("");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este filamento?")) return;
    await supabase.from("filaments").delete().eq("id", id);
    loadData();
  };

  const uploadImage = async (file: File) => {
    if (!user) return null;
    setUploadingImage(true);
    try {
      const ext = file.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("filament-images")
        .upload(fileName, file, { cacheControl: "3600", upsert: false });
      if (error) throw error;
      const { data } = supabase.storage
        .from("filament-images")
        .getPublicUrl(fileName);
      return data.publicUrl;
    } catch (error) {
      console.error("Erro ao enviar imagem:", error);
      alert("Falha ao subir a imagem");
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageUpload = async (
    e: ChangeEvent<HTMLInputElement>,
    itemId: string,
    mode: "single" | "batch",
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("Imagem muito grande! Máximo 2MB.");
      return;
    }
    if (!file.type.startsWith("image/")) {
      alert("Selecione um arquivo de imagem válido");
      return;
    }

    const url = await uploadImage(file);
    if (!url) return;

    if (mode === "single") {
      setIndividualItems((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, image_url: url } : item,
        ),
      );
    } else {
      setBatchItems((prev) =>
        prev.map((item) =>
          item.id === itemId
            ? { ...item, notes: `${item.notes}\nImagem: ${url}` }
            : item,
        ),
      );
    }
  };

  const updateIndividualItem = <K extends keyof IndividualItem>(
    id: string,
    field: K,
    value: IndividualItem[K],
  ) => {
    setIndividualItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
  };

  const updateBatchItem = <K extends keyof BatchItem>(
    id: string,
    field: K,
    value: BatchItem[K],
  ) => {
    setBatchItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
  };

  const addIndividualItem = () =>
    setIndividualItems((prev) => {
      const reference = prev[prev.length - 1] || createIndividualItem();
      return [
        ...prev,
        createIndividualItem({
          brand_id: reference.brand_id,
          tipo: reference.tipo,
          data_compra: reference.data_compra,
          purchase_source: reference.purchase_source,
          purchase_url: reference.purchase_url,
        }),
      ];
    });
  const addBatchItem = () =>
    setBatchItems((prev) => [...prev, createBatchItem()]);

  const duplicateIndividualItem = (id: string) => {
    const source = individualItems.find((item) => item.id === id);
    if (!source) return;
    setIndividualItems((prev) => [
      ...prev,
      createIndividualItem({ ...source, id: generateId() }),
    ]);
  };

  const duplicateBatchItem = (id: string) => {
    const source = batchItems.find((item) => item.id === id);
    if (!source) return;
    setBatchItems((prev) => [
      ...prev,
      createBatchItem({ ...source, id: generateId() }),
    ]);
  };

  const removeIndividualItem = (id: string) => {
    setIndividualItems((prev) =>
      prev.length === 1 ? prev : prev.filter((item) => item.id !== id),
    );
  };

  const removeBatchItem = (id: string) => {
    setBatchItems((prev) =>
      prev.length === 1 ? prev : prev.filter((item) => item.id !== id),
    );
  };

  const handleBatchPaste = () => {
    if (!batchPaste.trim()) return;
    const lines = batchPaste
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    const items = lines.map((line) => {
      const [
        nome = "",
        hex = "#808080",
        peso = "1000",
        custo = "0",
        notas = "",
      ] = line.split(/;|\t|,/).map((chunk) => chunk.trim());
      return createBatchItem({
        nome,
        color_hex: hex || "#808080",
        color_name: nome.split(" ").slice(1).join(" ") || "",
        peso_atual: Number(peso) || 1000,
        custo_por_kg: Number(custo) || 0,
        notes: notas,
      });
    });

    if (items.length) {
      setBatchItems(items);
      setBatchPaste("");
    }
  };

  const buildPayloadFromIndividual = (
    item: IndividualItem,
    breakdown: CostBreakdown,
  ) => {
    const brand = brands.find((b) => b.id === item.brand_id);
    const computed = breakdown.perItem[item.id];
    const shippingTotal =
      breakdown.shippingTotal > 0 ? breakdown.shippingTotal : null;
    const feesTotal = breakdown.feesTotal > 0 ? breakdown.feesTotal : null;
    return {
      user_id: user!.id,
      nome: item.nome.trim(),
      brand_id: item.brand_id || null,
      tipo: item.tipo,
      peso_atual: item.peso_atual,
      peso_inicial: item.peso_inicial || item.peso_atual,
      custo_por_kg: item.custo_por_kg,
      cost_per_kg_with_shipping:
        computed?.costPerKgWithShipping ?? item.custo_por_kg,
      data_compra: item.data_compra,
      color_name: item.color_name || null,
      color_hex: item.color_hex,
      image_url: item.image_url || null,
      notes: item.notes || null,
      purchase_source: item.purchase_source || null,
      purchase_url: item.purchase_url || null,
      purchase_shipping_total: shippingTotal,
      purchase_fees_total: feesTotal,
      shipping_prorated_by_weight: breakdown.shouldDistribute,
      shipping_share_value: computed?.shippingShare ?? null,
      fees_share_value: computed?.feeShare ?? null,
      marca: brand?.name || "Sem marca",
      cor: item.color_name || item.color_hex,
    } satisfies Database["public"]["Tables"]["filaments"]["Insert"];
  };

  const buildPayloadFromBatch = (item: BatchItem, breakdown: CostBreakdown) => {
    const brand = brands.find((b) => b.id === sharedPurchase.brand_id);
    const notes = [item.notes, sharedPurchase.notes].filter(Boolean).join("\n");
    const computed = breakdown.perItem[item.id];
    const shippingTotal =
      breakdown.shippingTotal > 0 ? breakdown.shippingTotal : null;
    const feesTotal = breakdown.feesTotal > 0 ? breakdown.feesTotal : null;
    return {
      user_id: user!.id,
      nome: item.nome.trim(),
      brand_id: sharedPurchase.brand_id || null,
      tipo: sharedPurchase.tipo,
      peso_atual: item.peso_atual,
      peso_inicial: item.peso_atual,
      custo_por_kg: item.custo_por_kg,
      cost_per_kg_with_shipping:
        computed?.costPerKgWithShipping ?? item.custo_por_kg,
      data_compra: sharedPurchase.data_compra,
      color_name: item.color_name || null,
      color_hex: item.color_hex,
      image_url: null,
      notes: notes || null,
      purchase_source: sharedPurchase.purchase_source || null,
      purchase_url: sharedPurchase.purchase_url || null,
      purchase_shipping_total: shippingTotal,
      purchase_fees_total: feesTotal,
      shipping_prorated_by_weight: breakdown.shouldDistribute,
      shipping_share_value: computed?.shippingShare ?? null,
      fees_share_value: computed?.feeShare ?? null,
      marca: brand?.name || "Sem marca",
      cor: item.color_name || item.color_hex,
    } satisfies Database["public"]["Tables"]["filaments"]["Insert"];
  };

  const validateIndividualItems = () => {
    return individualItems.every((item) => item.nome.trim() && item.brand_id);
  };

  const validateBatchItems = () => {
    const baseOk = sharedPurchase.brand_id && sharedPurchase.data_compra;
    return (
      baseOk &&
      batchItems.every((item) => item.nome.trim()) &&
      batchItems.length > 0
    );
  };

  const handleRestockSave = async () => {
    if (!restockTarget) return;
    const pesoComprado = restockForm.weight;
    if (pesoComprado <= 0) {
      alert("Informe o peso comprado para reposição");
      return;
    }

    const weightKg = restockCostPreview.weightKg;
    const baseCostPerKg = restockCostPreview.baseCostPerKg;
    if (baseCostPerKg <= 0) {
      alert("Informe o custo por Kg ou o custo total da compra");
      return;
    }

    const previousWeight = restockTarget.peso_atual;
    const previousWeightKg = previousWeight / 1000;
    const totalWeight = previousWeight + pesoComprado;
    const totalWeightKg = totalWeight / 1000;
    const weightedBaseCost =
      totalWeightKg > 0
        ? (previousWeightKg * restockTarget.custo_por_kg +
            weightKg * baseCostPerKg) /
          totalWeightKg
        : baseCostPerKg;
    const previousCostWithShipping =
      restockTarget.cost_per_kg_with_shipping || restockTarget.custo_por_kg;
    const weightedCostWithShipping =
      totalWeightKg > 0
        ? (previousWeightKg * previousCostWithShipping +
            weightKg * restockCostPreview.costPerKgWithShipping) /
          totalWeightKg
        : restockCostPreview.costPerKgWithShipping;

    const toNumber = (value: number | "" | undefined) => {
      if (typeof value === "number") return value;
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : 0;
    };
    const shippingTotal = Math.max(0, toNumber(restockCosts.shippingTotal));
    const feesTotal = Math.max(0, toNumber(restockCosts.feesTotal));
    const distributeExtras =
      restockCosts.prorateByWeight && (shippingTotal > 0 || feesTotal > 0);
    const noteEntry = restockForm.notes
      ? `Reposição ${restockForm.purchaseDate || new Date().toISOString().split("T")[0]}: ${restockForm.notes}`
      : "";
    const notes = [restockTarget.notes, noteEntry].filter(Boolean).join("\n\n");

    const { error } = await supabase
      .from("filaments")
      .update({
        peso_atual: totalWeight,
        peso_inicial:
          (restockTarget.peso_inicial || restockTarget.peso_atual) +
          pesoComprado,
        custo_por_kg: weightedBaseCost,
        cost_per_kg_with_shipping: weightedCostWithShipping,
        data_compra: restockForm.purchaseDate,
        purchase_source:
          restockForm.purchaseSource || restockTarget.purchase_source,
        purchase_url: restockForm.purchaseUrl || restockTarget.purchase_url,
        notes: notes || null,
        purchase_shipping_total: shippingTotal || null,
        purchase_fees_total: feesTotal || null,
        shipping_prorated_by_weight: distributeExtras,
        shipping_share_value: distributeExtras
          ? restockCostPreview.shippingShare
          : null,
        fees_share_value: distributeExtras ? restockCostPreview.feeShare : null,
      })
      .eq("id", restockTarget.id);

    if (error) {
      throw error;
    }
  };

  // Função para criar despesa automaticamente ao cadastrar filamento
  const createFilamentExpense = async (
    items: Array<{
      nome: string;
      marca: string;
      peso_kg: number;
      custo_por_kg: number;
      data_compra: string;
    }>,
    shippingTotal: number,
    feesTotal: number
  ) => {
    if (!user || items.length === 0) return;

    // Calcular valor total dos filamentos
    const totalFilamentos = items.reduce((sum, item) => {
      return sum + (item.custo_por_kg * item.peso_kg);
    }, 0);

    const valorTotal = totalFilamentos + shippingTotal + feesTotal;
    
    if (valorTotal <= 0) return;

    // Criar descrição detalhada
    const filamentosDesc = items.map(item => 
      `${item.nome} (${item.marca}) - ${item.peso_kg.toFixed(2)}kg x R$${item.custo_por_kg.toFixed(2)}/kg`
    ).join("; ");

    let descricao = `Compra de filamento: ${filamentosDesc}`;
    if (shippingTotal > 0) {
      descricao += ` | Frete: R$${shippingTotal.toFixed(2)}`;
    }
    if (feesTotal > 0) {
      descricao += ` | Taxas: R$${feesTotal.toFixed(2)}`;
    }

    // Usar a data do primeiro item ou hoje
    const dataCompra = items[0]?.data_compra || new Date().toISOString().split("T")[0];

    try {
      await supabase.from("expenses").insert({
        user_id: user.id,
        categoria: "material",
        descricao: descricao,
        valor: valorTotal,
        data: dataCompra,
        recorrente: false,
      });
      console.log("✅ Despesa de filamento criada:", valorTotal);
    } catch (error) {
      console.error("Erro ao criar despesa de filamento:", error);
    }
  };

  const handleSubmit = async () => {
    if (!user) return;

    try {
      if (restockTarget) {
        await handleRestockSave();
        
        // Criar despesa para reposição
        if (restockForm.weight > 0 && restockCostPreview.baseCostPerKg > 0) {
          const valorFilamento = (restockForm.weight / 1000) * restockCostPreview.baseCostPerKg;
          const brand = brands.find((b) => b.id === restockTarget.brand_id);
          await createFilamentExpense(
            [{
              nome: restockTarget.nome,
              marca: brand?.name || restockTarget.marca || "Sem marca",
              peso_kg: restockForm.weight / 1000,
              custo_por_kg: restockCostPreview.baseCostPerKg,
              data_compra: restockForm.purchaseDate,
            }],
            restockCostPreview.shippingShare || 0,
            restockCostPreview.feeShare || 0
          );
        }
        
        handleCloseModal();
        loadData();
        return;
      }

      if (editingId) {
        if (!validateIndividualItems()) {
          alert("Preencha nome e marca do filamento");
          return;
        }
        const payload = buildPayloadFromIndividual(
          individualItems[0],
          individualCostBreakdown,
        );
        await supabase.from("filaments").update(payload).eq("id", editingId);
        // Não cria despesa ao editar, apenas ao adicionar novo
      } else if (formMode === "single") {
        if (!validateIndividualItems()) {
          alert("Preencha nome e marca para todos os filamentos");
          return;
        }
        const payloads = individualItems.map((item) =>
          buildPayloadFromIndividual(item, individualCostBreakdown),
        );
        await supabase.from("filaments").insert(payloads);
        
        // Criar despesas para cada filamento individual
        const itemsForExpense = individualItems.map((item) => {
          const brand = brands.find((b) => b.id === item.brand_id);
          return {
            nome: item.nome,
            marca: brand?.name || "Sem marca",
            peso_kg: item.peso_atual / 1000,
            custo_por_kg: item.custo_por_kg,
            data_compra: item.data_compra,
          };
        });
        await createFilamentExpense(
          itemsForExpense,
          individualCostBreakdown.shippingTotal,
          individualCostBreakdown.feesTotal
        );
      } else {
        if (!validateBatchItems()) {
          alert("Preencha marca, data e nomes dos itens do lote");
          return;
        }
        const payloads = batchItems.map((item) =>
          buildPayloadFromBatch(item, batchCostBreakdown),
        );
        await supabase.from("filaments").insert(payloads);
        
        // Criar despesa para lote
        const brand = brands.find((b) => b.id === sharedPurchase.brand_id);
        const itemsForExpense = batchItems.map((item) => ({
          nome: item.nome,
          marca: brand?.name || "Sem marca",
          peso_kg: item.peso_atual / 1000,
          custo_por_kg: item.custo_por_kg,
          data_compra: sharedPurchase.data_compra,
        }));
        await createFilamentExpense(
          itemsForExpense,
          batchCostBreakdown.shippingTotal,
          batchCostBreakdown.feesTotal
        );
      }

      handleCloseModal();
      loadData();
    } catch (error) {
      console.error("Erro ao salvar filamentos:", error);
      alert("Não foi possível salvar");
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-vultrix-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Filamentos</h1>
          <p className="text-vultrix-light/70">
            Gestão visual e inteligente de estoque
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setBrandModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 border border-vultrix-gray rounded-lg text-white hover:bg-vultrix-gray/40"
          >
            <Building2 size={18} /> Nova Marca
          </button>
          <Link
            href="/dashboard/filamentos/marcas"
            className="flex items-center gap-2 px-4 py-2 border border-vultrix-gray/60 rounded-lg text-white hover:bg-vultrix-gray/30"
          >
            <GitMerge size={18} /> Gerenciar marcas
          </Link>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2 bg-vultrix-accent hover:bg-vultrix-accent/90 text-white rounded-lg"
          >
            <Plus size={18} /> Novo Filamento
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-vultrix-dark border border-vultrix-gray rounded-xl p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Package className="text-blue-400" size={24} />
            </div>
            <div>
              <p className="text-sm text-vultrix-light/60">Total</p>
              <p className="text-2xl text-white font-bold">{stats.total}</p>
            </div>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-vultrix-dark border border-vultrix-gray rounded-xl p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="text-green-400" size={24} />
            </div>
            <div>
              <p className="text-sm text-vultrix-light/60">Estoque</p>
              <p className="text-2xl text-white font-bold">
                {stats.estoque.toFixed(1)} kg
              </p>
            </div>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-vultrix-dark border border-vultrix-gray rounded-xl p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <Building2 className="text-purple-400" size={24} />
            </div>
            <div>
              <p className="text-sm text-vultrix-light/60">Valor total</p>
              <p className="text-2xl text-white font-bold">
                R$ {stats.valor.toFixed(0)}
              </p>
            </div>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-vultrix-dark border border-vultrix-gray rounded-xl p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
              <AlertTriangle className="text-orange-400" size={24} />
            </div>
            <div>
              <p className="text-sm text-vultrix-light/60">Baixo estoque</p>
              <p className="text-2xl text-white font-bold">{stats.lowStock}</p>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[220px]">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-vultrix-light/50"
              size={18}
            />
            <input
              type="text"
              placeholder="Buscar por nome ou marca..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-vultrix-dark border border-vultrix-gray rounded-lg text-white"
            />
          </div>
        </div>
        <select
          value={filterTipo}
          onChange={(e) => setFilterTipo(e.target.value)}
          className="px-4 py-2 bg-vultrix-dark border border-vultrix-gray rounded-lg text-white"
        >
          <option value="">Todos os tipos</option>
          {TIPOS_FILAMENTO.map((tipo) => (
            <option key={tipo} value={tipo}>
              {tipo}
            </option>
          ))}
        </select>
        <select
          value={filterBrand}
          onChange={(e) => setFilterBrand(e.target.value)}
          className="px-4 py-2 bg-vultrix-dark border border-vultrix-gray rounded-lg text-white"
        >
          <option value="">Todas as marcas</option>
          {brands.map((brand) => (
            <option key={brand.id} value={brand.id}>
              {brand.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredFilaments.map((filament, idx) => {
          const brand = Array.isArray(filament.filament_brands)
            ? filament.filament_brands[0]
            : filament.filament_brands;
          const stockPercent =
            (filament.peso_atual / filament.peso_inicial) * 100;
          const lowStock = filament.peso_atual < 200;
          return (
            <motion.div
              key={filament.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.03 }}
              className={`bg-vultrix-dark border rounded-xl overflow-hidden ${
                lowStock ? "border-orange-500/50" : "border-vultrix-gray"
              }`}
            >
              <div className="relative h-40 bg-vultrix-black">
                {filament.image_url ? (
                  <img
                    src={filament.image_url}
                    alt={filament.nome}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="text-vultrix-light/30" size={48} />
                  </div>
                )}
                <div
                  className="absolute top-3 right-3 w-12 h-12 rounded-full border-2 border-white shadow-lg"
                  style={{ backgroundColor: filament.color_hex }}
                  title={filament.color_name || filament.color_hex}
                />
                {lowStock && (
                  <div className="absolute top-3 left-3 px-2 py-1 bg-orange-500 text-white text-xs font-semibold rounded-md flex items-center gap-1">
                    <AlertTriangle size={12} /> Baixo
                  </div>
                )}
              </div>

              <div className="p-4 space-y-3">
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {filament.nome}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-vultrix-light/70">
                    <Building2 size={14} />
                    <span>{brand?.name || filament.marca}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="px-2 py-1 bg-vultrix-black rounded text-vultrix-accent font-medium">
                    {filament.tipo}
                  </span>
                  {filament.color_name && (
                    <span className="text-vultrix-light/70 flex items-center gap-1">
                      <Palette size={14} />
                      {filament.color_name}
                    </span>
                  )}
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-vultrix-light/60">
                    <span>Estoque</span>
                    <span>
                      {filament.peso_atual}g / {filament.peso_inicial}g
                    </span>
                  </div>
                  <div className="w-full h-2 bg-vultrix-black rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        stockPercent > 50
                          ? "bg-green-500"
                          : stockPercent > 20
                            ? "bg-yellow-500"
                            : "bg-red-500"
                      }`}
                      style={{ width: `${Math.min(stockPercent, 100)}%` }}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-vultrix-gray pt-3">
                  <div>
                    <p className="text-xs text-vultrix-light/60">
                      Custo/Kg (c/ frete)
                    </p>
                    <p className="text-lg font-bold text-white">
                      R${" "}
                      {(
                        filament.cost_per_kg_with_shipping ||
                        filament.custo_por_kg
                      ).toFixed(2)}
                    </p>
                    <p className="text-xs text-vultrix-light/50">
                      s/ frete: R$ {filament.custo_por_kg.toFixed(2)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenModal(filament)}
                      className="p-2 hover:bg-vultrix-gray rounded-lg"
                    >
                      <Edit2 className="text-vultrix-light/70" size={16} />
                    </button>
                    <button
                      onClick={() => handleOpenRestockModal(filament)}
                      className="p-2 hover:bg-vultrix-gray rounded-lg"
                      title="Repor estoque"
                    >
                      <RefreshCcw className="text-vultrix-light/70" size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(filament.id)}
                      className="p-2 hover:bg-red-500/20 rounded-lg"
                    >
                      <Trash2 className="text-red-500" size={16} />
                    </button>
                  </div>
                </div>
                {filament.notes && (
                  <p className="text-xs text-vultrix-light/60 italic border-t border-vultrix-gray/50 pt-2">
                    {filament.notes}
                  </p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {filteredFilaments.length === 0 && (
        <div className="text-center py-12 border border-dashed border-vultrix-gray rounded-xl">
          <Package className="mx-auto text-vultrix-light/30 mb-4" size={64} />
          <p className="text-vultrix-light/70">Nenhum filamento encontrado</p>
        </div>
      )}

      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-vultrix-dark border border-vultrix-gray rounded-2xl w-full max-w-7xl max-h-[95vh] overflow-hidden shadow-xl"
            >
              <div className="sticky top-0 bg-vultrix-dark border-b border-vultrix-gray p-6 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-widest text-vultrix-light/60">
                    {modalHeading.label}
                  </p>
                  <h2 className="text-2xl font-bold text-white">
                    {modalHeading.title}
                  </h2>
                </div>
                {!editingId && !isRestockMode && (
                  <div className="bg-vultrix-black border border-vultrix-gray rounded-lg flex overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setFormMode("single")}
                      className={`px-4 py-2 text-sm font-medium ${
                        formMode === "single"
                          ? "bg-vultrix-accent text-white"
                          : "text-vultrix-light/70"
                      }`}
                    >
                      Individual
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormMode("batch")}
                      className={`px-4 py-2 text-sm font-medium ${
                        formMode === "batch"
                          ? "bg-vultrix-accent text-white"
                          : "text-vultrix-light/70"
                      }`}
                    >
                      Compra em lote
                    </button>
                  </div>
                )}
                <button
                  onClick={handleCloseModal}
                  className="p-2 hover:bg-vultrix-gray rounded-lg"
                >
                  <X className="text-vultrix-light/70" size={20} />
                </button>
              </div>

              <div className="flex flex-col lg:flex-row max-h-[calc(95vh-140px)] overflow-hidden">
                <div className="flex-1 lg:flex-[1.55] overflow-y-auto p-6 lg:p-8 space-y-6 lg:space-y-8">
                  {isRestockMode
                    ? renderRestockForm()
                    : formMode === "single"
                      ? renderIndividualForm()
                      : renderBatchForm()}
                </div>
                <div className="lg:w-80 lg:flex-none lg:min-w-[300px] border-t lg:border-t-0 lg:border-l border-vultrix-gray bg-gradient-to-b from-vultrix-black/70 via-vultrix-dark/90 to-vultrix-black p-6 lg:p-7 space-y-6 lg:space-y-7">
                  {isRestockMode ? (
                    <>
                      <div>
                        <p className="text-xs uppercase tracking-[0.08em] text-vultrix-light/60">
                          Resumo da reposição
                        </p>
                        <h3 className="text-3xl font-bold text-white leading-tight">
                          {restockForm.weight || 0} g
                        </h3>
                        <p className="text-sm text-vultrix-light/60">
                          peso informado nesta compra
                        </p>
                      </div>
                      <div className="bg-vultrix-dark border border-vultrix-gray rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-vultrix-light/70">
                            Estoque projetado
                          </span>
                          <span className="text-white font-semibold text-lg">
                            {(
                              restockWeightedPreview?.newTotalWeight ||
                              restockTarget?.peso_atual ||
                              0
                            ).toLocaleString()}{" "}
                            g
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-vultrix-light/70">
                            Custo/kg (s/ frete)
                          </span>
                          <span className="text-white font-semibold text-lg">
                            R${" "}
                            {(
                              restockWeightedPreview?.weightedBase ??
                              restockTarget?.custo_por_kg ??
                              0
                            ).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-vultrix-light/70">
                            Custo/kg (c/ frete)
                          </span>
                          <span className="text-white font-semibold text-lg">
                            R${" "}
                            {(
                              restockWeightedPreview?.weightedWithShipping ??
                              (restockTarget?.cost_per_kg_with_shipping ||
                                restockTarget?.custo_por_kg ||
                                0)
                            ).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <p className="text-sm text-vultrix-light/70">Resumo</p>
                        <h3 className="text-2xl font-bold text-white">
                          {modalSummary.totalItems}{" "}
                          {modalSummary.totalItems === 1 ? "item" : "itens"}
                        </h3>
                        <p className="text-sm text-vultrix-light/60">
                          {modalSummary.totalWeightKg.toFixed(2)} kg totais
                        </p>
                      </div>
                      <div className="bg-vultrix-dark border border-vultrix-gray rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-vultrix-light/70">
                            Peso total
                          </span>
                          <span className="text-white font-semibold">
                            {modalSummary.totalWeightKg.toFixed(2)} kg
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-vultrix-light/70">
                            Custo médio/kg (c/ frete)
                          </span>
                          <span className="text-white font-semibold">
                            R$ {modalSummary.avgCostKgWithShipping.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-vultrix-light/70">
                            Custo médio/kg (s/ frete)
                          </span>
                          <span className="text-white font-semibold">
                            R$ {modalSummary.avgCostKg.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                  <div className="space-y-2">
                    <p className="text-xs text-vultrix-light/60 uppercase tracking-wider">
                      Atalhos
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (isRestockMode) {
                            const url =
                              restockForm.purchaseUrl ||
                              restockTarget?.purchase_url;
                            if (url) navigator.clipboard.writeText(url);
                          } else if (formMode === "single") {
                            const url = individualItems[0]?.purchase_url;
                            if (url) navigator.clipboard.writeText(url);
                          } else if (sharedPurchase.purchase_url) {
                            navigator.clipboard.writeText(
                              sharedPurchase.purchase_url,
                            );
                          }
                        }}
                        className="flex items-center justify-center gap-2 px-3 py-2 border border-vultrix-gray rounded-lg text-sm text-vultrix-light/70 hover:text-white"
                      >
                        <Copy size={14} /> Link compra
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (isRestockMode) {
                            const base =
                              restockForm.costPerKg ||
                              (restockForm.costTotal &&
                              restockCostPreview.weightKg > 0
                                ? restockForm.costTotal /
                                  restockCostPreview.weightKg
                                : 0);
                            const text = `Reposição ${restockTarget?.nome || ""} - ${restockForm.weight}g - R$${base.toFixed(2)}/kg`;
                            navigator.clipboard.writeText(text);
                          } else if (formMode === "single") {
                            const text = individualItems
                              .map(
                                (item) =>
                                  `${item.nome} - ${item.peso_atual}g - R$${item.custo_por_kg}`,
                              )
                              .join("\n");
                            navigator.clipboard.writeText(text);
                          } else {
                            const text = batchItems
                              .map(
                                (item) =>
                                  `${item.nome} - ${item.peso_atual}g - R$${item.custo_por_kg}`,
                              )
                              .join("\n");
                            navigator.clipboard.writeText(text);
                          }
                        }}
                        className="flex items-center justify-center gap-2 px-3 py-2 border border-vultrix-gray rounded-lg text-sm text-vultrix-light/70 hover:text-white"
                      >
                        <Copy size={14} /> Resumo
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 bg-vultrix-dark border-t border-vultrix-gray p-6 flex flex-col gap-3 md:flex-row md:justify-end">
                <button
                  onClick={handleCloseModal}
                  className="px-6 py-2 bg-vultrix-gray/40 hover:bg-vultrix-gray text-white rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSubmit}
                  className="px-6 py-2 bg-vultrix-accent hover:bg-vultrix-accent/90 text-white rounded-lg font-semibold"
                >
                  {editingId ? "Salvar alterações" : "Registrar"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {brandModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-vultrix-dark border border-vultrix-gray rounded-xl w-full max-w-md"
            >
              <div className="p-6 border-b border-vultrix-gray flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Nova marca</h2>
                <button
                  onClick={() => setBrandModalOpen(false)}
                  className="p-2 hover:bg-vultrix-gray rounded-lg"
                >
                  <X className="text-vultrix-light/70" size={18} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm text-vultrix-light/70">
                    Nome *
                  </label>
                  <input
                    type="text"
                    value={newBrand.name}
                    onChange={(e) =>
                      setNewBrand((prev) => ({ ...prev, name: e.target.value }))
                    }
                    className="w-full px-4 py-2 bg-vultrix-black border border-vultrix-gray rounded-lg text-white"
                    placeholder="Ex: Creality"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-vultrix-light/70">
                    Website
                  </label>
                  <input
                    type="url"
                    value={newBrand.website}
                    onChange={(e) =>
                      setNewBrand((prev) => ({
                        ...prev,
                        website: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-2 bg-vultrix-black border border-vultrix-gray rounded-lg text-white"
                    placeholder="https://..."
                  />
                </div>
              </div>
              <div className="p-6 border-t border-vultrix-gray flex justify-end gap-3">
                <button
                  onClick={() => setBrandModalOpen(false)}
                  className="px-4 py-2 bg-vultrix-gray/40 hover:bg-vultrix-gray text-white rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateBrand}
                  className="px-4 py-2 bg-vultrix-accent hover:bg-vultrix-accent/90 text-white rounded-lg"
                >
                  Criar marca
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
