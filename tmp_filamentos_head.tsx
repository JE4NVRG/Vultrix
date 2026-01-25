"use client";

import { useAuth } from "@/lib/auth/AuthProvider";
import { supabase } from "@/lib/supabase/client";
import { Database } from "@/types/database";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
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
  filament_brands?: Database["public"]["Tables"]["filament_brands"]["Row"] | null;
};
type BrandRow = Database["public"]["Tables"]["filament_brands"]["Row"];
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
  notes: string;
  image_url: string | null;
  purchase_source: string;
  purchase_url: string;
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

type CostBreakdown = {
  totalWeightKg: number;
  shippingTotal: number;
  feesTotal: number;
  shouldDistribute: boolean;
  perItem: Record<
    string,
    {
      shippingShare: number;
      feeShare: number;
      costPerKgWithShipping: number;
    }
  >;
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

type StatsSummary = {
  total: number;
  estoque: number;
  valor: number;
  lowStock: number;
};

type ModalSummary = {
  totalItems: number;
  totalWeightKg: number;
  avgCostKg: number;
  avgCostKgWithShipping: number;
};

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

const todayISO = () => new Date().toISOString().split("T")[0];

const generateId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 11);
};

const createIndividualItem = (overrides: Partial<IndividualItem> = {}): IndividualItem => {
  const pesoAtual = overrides.peso_atual ?? 1000;
  return {
    id: overrides.id ?? generateId(),
    nome: overrides.nome ?? "",
    brand_id: overrides.brand_id ?? "",
    tipo: overrides.tipo ?? TIPOS_FILAMENTO[0],
    peso_atual: pesoAtual,
    peso_inicial: overrides.peso_inicial ?? pesoAtual,
    custo_por_kg: overrides.custo_por_kg ?? 0,
    data_compra: overrides.data_compra ?? todayISO(),
    color_name: overrides.color_name ?? "",
    color_hex: overrides.color_hex ?? "#808080",
    notes: overrides.notes ?? "",
    image_url: overrides.image_url ?? null,
    purchase_source: overrides.purchase_source ?? "",
    purchase_url: overrides.purchase_url ?? "",
  };
};

const createBatchItem = (overrides: Partial<BatchItem> = {}): BatchItem => ({
  id: overrides.id ?? generateId(),
  nome: overrides.nome ?? "",
  peso_atual: overrides.peso_atual ?? 1000,
  custo_por_kg: overrides.custo_por_kg ?? 0,
  color_name: overrides.color_name ?? "",
  color_hex: overrides.color_hex ?? "#808080",
  notes: overrides.notes ?? "",
});

const createSharedPurchase = (overrides: Partial<SharedPurchase> = {}): SharedPurchase => ({
  brand_id: overrides.brand_id ?? "",
  tipo: overrides.tipo ?? TIPOS_FILAMENTO[0],
  data_compra: overrides.data_compra ?? todayISO(),
  purchase_source: overrides.purchase_source ?? "",
  purchase_url: overrides.purchase_url ?? "",
  notes: overrides.notes ?? "",
});

const createRestockForm = (overrides: Partial<RestockForm> = {}): RestockForm => ({
  weight: overrides.weight ?? 1000,
  costPerKg: overrides.costPerKg ?? 0,
  costTotal: overrides.costTotal ?? 0,
  purchaseDate: overrides.purchaseDate ?? todayISO(),
  purchaseSource: overrides.purchaseSource ?? "",
  purchaseUrl: overrides.purchaseUrl ?? "",
  notes: overrides.notes ?? "",
});

const createPurchaseCostInputs = (overrides: Partial<PurchaseCostInputs> = {}): PurchaseCostInputs => ({
  shippingTotal: overrides.shippingTotal ?? "",
  feesTotal: overrides.feesTotal ?? "",
  prorateByWeight: overrides.prorateByWeight ?? true,
});

const calculateCostBreakdown = (
  items: Array<{ id: string; peso_atual: number; custo_por_kg: number }>,
  costs: PurchaseCostInputs,
): CostBreakdown => {
  const shippingTotal = Number(costs.shippingTotal) || 0;
  const feesTotal = Number(costs.feesTotal) || 0;
  const totalWeightKg = items.reduce((sum, item) => sum + item.peso_atual, 0) / 1000;
  const shouldDistribute = costs.prorateByWeight && totalWeightKg > 0 && (shippingTotal > 0 || feesTotal > 0);

  const perItem = items.reduce<CostBreakdown["perItem"]>((acc, item) => {
    const weightKg = item.peso_atual / 1000;
    const shippingShare = shouldDistribute && totalWeightKg > 0 ? (shippingTotal * weightKg) / totalWeightKg : 0;
    const feeShare = shouldDistribute && totalWeightKg > 0 ? (feesTotal * weightKg) / totalWeightKg : 0;
    const costPerKgWithShipping =
      weightKg > 0 ? (item.custo_por_kg * weightKg + shippingShare + feeShare) / weightKg : item.custo_por_kg;
    acc[item.id] = { shippingShare, feeShare, costPerKgWithShipping };
    return acc;
  }, {});

  return { totalWeightKg, shippingTotal, feesTotal, shouldDistribute, perItem };
};

const calculateStats = (rows: FilamentRow[]): StatsSummary => {
  const total = rows.length;
  const estoque = rows.reduce((sum, row) => sum + row.peso_atual / 1000, 0);
  const valor = rows.reduce(
    (sum, row) => sum + (row.cost_per_kg_with_shipping || row.custo_por_kg) * (row.peso_atual / 1000),
    0,
  );
  const lowStock = rows.filter((row) => row.peso_atual < 200).length;
  return { total, estoque, valor, lowStock };
};

export default function FilamentosPage() {
  const { user, loading: authLoading } = useAuth();
  const [filaments, setFilaments] = useState<FilamentRow[]>([]);
  const [brands, setBrands] = useState<BrandRow[]>([]);
  const [stats, setStats] = useState<StatsSummary>({ total: 0, estoque: 0, valor: 0, lowStock: 0 });
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [brandModalOpen, setBrandModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<FormMode>("single");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTipo, setFilterTipo] = useState("");
  const [filterBrand, setFilterBrand] = useState("");
  const [newBrand, setNewBrand] = useState({ name: "", website: "" });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [batchPaste, setBatchPaste] = useState("");
  const [individualItems, setIndividualItems] = useState<IndividualItem[]>([createIndividualItem()]);
  const [batchItems, setBatchItems] = useState<BatchItem[]>([createBatchItem()]);
  const [sharedPurchase, setSharedPurchase] = useState<SharedPurchase>(createSharedPurchase());
  const [individualCosts, setIndividualCosts] = useState<PurchaseCostInputs>(createPurchaseCostInputs());
  const [batchCosts, setBatchCosts] = useState<PurchaseCostInputs>(createPurchaseCostInputs());
  const [restockCosts, setRestockCosts] = useState<PurchaseCostInputs>(createPurchaseCostInputs());
  const [restockTarget, setRestockTarget] = useState<FilamentRow | null>(null);
  const [restockForm, setRestockForm] = useState<RestockForm>(createRestockForm());

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [brandsResponse, filamentsResponse] = await Promise.all([
        supabase.from("filament_brands").select("*").eq("user_id", user.id).order("name"),
        supabase
          .from("filaments")
          .select(`*, filament_brands (*)`)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
      ]);

      if (brandsResponse.error) throw brandsResponse.error;
      if (filamentsResponse.error) throw filamentsResponse.error;

      setBrands((brandsResponse.data || []).sort((a, b) => a.name.localeCompare(b.name)));
      const rows = filamentsResponse.data || [];
      setFilaments(rows);
      setStats(calculateStats(rows));
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const filteredFilaments = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return filaments.filter((filament) => {
      const brandRelation = Array.isArray(filament.filament_brands)
        ? filament.filament_brands[0]
        : filament.filament_brands;
      const brandName = brandRelation?.name?.toLowerCase() ?? "";
      const matchesTerm = term
        ? (filament.nome || "").toLowerCase().includes(term) ||
          (filament.marca || "").toLowerCase().includes(term) ||
          brandName.includes(term)
        : true;
      const matchesTipo = filterTipo ? filament.tipo === filterTipo : true;
      const matchesBrand = filterBrand ? filament.brand_id === filterBrand : true;
      return matchesTerm && matchesTipo && matchesBrand;
    });
  }, [filaments, searchTerm, filterTipo, filterBrand]);

  const individualCostBreakdown = useMemo(
    () => calculateCostBreakdown(individualItems, individualCosts),
    [individualItems, individualCosts],
  );

  const batchCostBreakdown = useMemo(
    () => calculateCostBreakdown(batchItems, batchCosts),
    [batchItems, batchCosts],
  );

  const modalSummary = useMemo<ModalSummary>(() => {
    const items = formMode === "single" ? individualItems : batchItems;
    const breakdown = formMode === "single" ? individualCostBreakdown : batchCostBreakdown;
    if (!items.length) {
      return { totalItems: 0, totalWeightKg: 0, avgCostKg: 0, avgCostKgWithShipping: 0 };
    }

    const totalWeightKg = items.reduce((sum, item) => sum + item.peso_atual, 0) / 1000;
    if (totalWeightKg <= 0) {
      return {
        totalItems: items.length,
        totalWeightKg: 0,
        avgCostKg: 0,
        avgCostKgWithShipping: 0,
      };
    }

    const baseWeighted = items.reduce((sum, item) => sum + item.custo_por_kg * (item.peso_atual / 1000), 0) / totalWeightKg;
    const withShipping =
      items.reduce((sum, item) => {
        const costWithExtras = breakdown.perItem[item.id]?.costPerKgWithShipping ?? item.custo_por_kg;
        return sum + costWithExtras * (item.peso_atual / 1000);
      }, 0) / totalWeightKg;

    return {
      totalItems: items.length,
      totalWeightKg,
      avgCostKg: baseWeighted,
      avgCostKgWithShipping: withShipping,
    };
  }, [formMode, individualItems, batchItems, individualCostBreakdown, batchCostBreakdown]);

  const restockCostPreview = useMemo(() => {
    const weightKg = restockForm.weight / 1000;
    if (!restockTarget) {
      return {
        weightKg,
        baseCostPerKg:
          restockForm.costPerKg > 0
            ? restockForm.costPerKg
            : weightKg > 0 && restockForm.costTotal > 0
            ? restockForm.costTotal / weightKg
            : 0,
        costPerKgWithShipping:
          restockForm.costPerKg > 0
            ? restockForm.costPerKg
            : weightKg > 0 && restockForm.costTotal > 0
            ? restockForm.costTotal / weightKg
            : 0,
        shippingShare: 0,
        feeShare: 0,
      };
    }

    const toNumber = (value: number | "") => (typeof value === "number" ? value : Number(value) || 0);
    const shippingTotal = Math.max(0, toNumber(restockCosts.shippingTotal));
    const feesTotal = Math.max(0, toNumber(restockCosts.feesTotal));
    const includeExtras = restockCosts.prorateByWeight && (shippingTotal > 0 || feesTotal > 0);
    const baseCostPerKg =
      restockForm.costPerKg > 0
        ? restockForm.costPerKg
        : weightKg > 0 && restockForm.costTotal > 0
        ? restockForm.costTotal / weightKg
        : 0;
    const totalExtras = includeExtras ? shippingTotal + feesTotal : 0;
    const costPerKgWithShipping =
      weightKg > 0 ? (baseCostPerKg * weightKg + totalExtras) / weightKg : baseCostPerKg;

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
    const currentCostWithShipping = restockTarget.cost_per_kg_with_shipping || restockTarget.custo_por_kg;
    const weightedBase =
      newWeightKg > 0
        ?
            (previousWeightKg * restockTarget.custo_por_kg +
              restockCostPreview.weightKg * restockCostPreview.baseCostPerKg) /
            newWeightKg
        : restockCostPreview.baseCostPerKg;
    const weightedWithShipping =
      newWeightKg > 0
        ?
            (previousWeightKg * currentCostWithShipping +
              restockCostPreview.weightKg * restockCostPreview.costPerKgWithShipping) /
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
    ? { label: "Reposição de estoque", title: restockTarget?.nome || "Reposição" }
    : editingId
    ? { label: "Editar Filamento", title: "Atualizar registro" }
    : { label: "Novo Filamento", title: "Adicionar ao estoque" };
