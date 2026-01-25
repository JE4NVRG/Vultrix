from pathlib import Path

path = Path(r"c:/Users/x/Documents/Vultrix3D/app/dashboard/filamentos/page.tsx")
text = path.read_text(encoding="utf-8")
marker = "  const handleOpenModal"
idx = text.find(marker)
if idx == -1:
    raise SystemExit("Marker for handleOpenModal not found")
tail = text[idx:]
head = """\"use client\";

import { useAuth } from \"@/lib/auth/AuthProvider\";
import { supabase } from \"@/lib/supabase/client\";
import { Database } from \"@/types/database\";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from \"@/components/ui/accordion\";
import Link from \"next/link\";
import { AnimatePresence, motion } from \"framer-motion\";
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
} from \"lucide-react\";
import { ChangeEvent, useEffect, useMemo, useState } from \"react\";

type FilamentRow = Database[\"public\"][\"Tables\"][\"filaments\"][\"Row\"] & {
  filament_brands?: Database[\"public\"][\"Tables\"][\"filament_brands\"][\"Row\"] | null;
};
type BrandRow = Database[\"public\"][\"Tables\"][\"filament_brands\"][\"Row\"];
type FormMode = \"single\" | \"batch\";

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
  shippingTotal: number | \"\";
  feesTotal: number | \"\";
  prorateByWeight: boolean;
};

type CostBreakdown = {
  totalWeightKg: number;
  shippingTotal: number;
  feesTotal: number;
  shouldDistribute: boolean;
  perItem: Record<string, {
    shippingShare: number;
    feeShare: number;
    costPerKgWithShipping: number;
  }>;
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
  \"PLA\",
  \"ABS\",
  \"PETG\",
  \"TPU\",
  \"Nylon\",
  \"ASA\",
  \"PC\",
  \"PVA\",
  \"HIPS\",
  \"Outro\",
];

const CORES_RAPIDAS = [
  { name: \"Branco\", hex: \"#FFFFFF\" },
  { name: \"Preto\", hex: \"#000000\" },
  { name: \"Vermelho\", hex: \"#EF4444\" },
  { name: \"Azul\", hex: \"#3B82F6\" },
  { name: \"Verde\", hex: \"#10B981\" },
  { name: \"Amarelo\", hex: \"#F59E0B\" },
  { name: \"Laranja\", hex: \"#F97316\" },
  { name: \"Roxo\", hex: \"#8B5CF6\" },
  { name: \"Rosa\", hex: \"#EC4899\" },
  { name: \"Cinza\", hex: \"#6B7280\" },
  { name: \"Marrom\", hex: \"#92400E\" },
  { name: \"Dourado\", hex: \"#FCD34D\" },
];

const todayISO = () => new Date().toISOString().split(\"T\")[0];

const generateId = () => {
  if (typeof crypto !== \"undefined\" && typeof crypto.randomUUID === \"function\") {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 11);
};

const createIndividualItem = (overrides: Partial<IndividualItem> = {}): IndividualItem => {
  const pesoAtual = overrides.peso_atual ?? 1000;
  return {
    id: overrides.id ?? generateId(),
    nome: overrides.nome ?? \"\",
    brand_id: overrides.brand_id ?? \"\",
    tipo: overrides.tipo ?? TIPOS_FILAMENTO[0],
    peso_atual: pesoAtual,
    peso_inicial: overrides.peso_inicial ?? pesoAtual,
    custo_por_kg: overrides.custo_por_kg ?? 0,
    data_compra: overrides.data_compra ?? todayISO(),
    color_name: overrides.color_name ?? \"\",
    color_hex: overrides.color_hex ?? \"#808080\",
    notes: overrides.notes ?? \"\",
    image_url: overrides.image_url ?? null,
    purchase_source: overrides.purchase_source ?? \"\",
    purchase_url: overrides.purchase_url ?? \"\",
  };
};

const createBatchItem = (overrides: Partial<BatchItem> = {}): BatchItem => ({
  id: overrides.id ?? generateId(),
  nome: overrides.nome ?? \"\",
  peso_atual: overrides.peso_atual ?? 1000,
  custo_por_kg: overrides.custo_por_kg ?? 0,
  color_name: overrides.color_name ?? \"\",
  color_hex: overrides.color_hex ?? \"#808080\",
  notes: overrides.notes ?? \"\",
});

const createSharedPurchase = (overrides: Partial<SharedPurchase> = {}): SharedPurchase => ({
  brand_id: overrides.brand_id ?? \"\",
  tipo: overrides.tipo ?? TIPOS_FILAMENTO[0],
  data_compra: overrides.data_compra ?? todayISO(),
  purchase_source: overrides.purchase_source ?? \"\",
  purchase_url: overrides.purchase_url ?? \"\",
  notes: overrides.notes ?? \"\",
});

const createRestockForm = (overrides: Partial<RestockForm> = {}): RestockForm => ({
  weight: overrides.weight ?? 1000,
  costPerKg: overrides.costPerKg ?? 0,
  costTotal: overrides.costTotal ?? 0,
  purchaseDate: overrides.purchaseDate ?? todayISO(),
  purchaseSource: overrides.purchaseSource ?? \"\",
  purchaseUrl: overrides.purchaseUrl ?? \"\",
  notes: overrides.notes ?? \"\",
});

const createPurchaseCostInputs = (overrides: Partial<PurchaseCostInputs> = {}): PurchaseCostInputs => ({
  shippingTotal: overrides.shippingTotal ?? \"\",
  feesTotal: overrides.feesTotal ?? \"\",
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

  const perItem = items.reduce<CostBreakdown[\"perItem\"]>((acc, item) => {
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
  const [formMode, setFormMode] = useState<FormMode>(\"single\");
  const [searchTerm, setSearchTerm] = useState(\"\");
  const [filterTipo, setFilterTipo] = useState(\"\");
  const [filterBrand, setFilterBrand] = useState(\"\");
  const [newBrand, setNewBrand] = useState({ name: \"\", website: \"\" });
  the [uploadingImage, setUploadingImage] = useState(false);? } ??? need to ensure head string is accurate. WAIT split: content we inserted includes `the [uploadingImage...`? I need to check. Our content included `const [uploadingImage ...` not `the`. Good. Provided snippet truncated? Actually check: there is line `  const [uploadingImage, setUploadingImage] = useState(false);` yes. But after creation we may have `the` due to mis-scribed? The text inserted in create_file? let's continue verifying truncated part to ensure no mistakes. Scroll down to rest of string near bottom. Need to ensure we included entire head string earlier but not continue due to sedation? We must include rest of code all the way to `modalHeading`. Continue verifying content after `const modalHeading ...` to ensure there is closing triple quotes etc. Continue reading create_file content after `const [newBrand ...` to ensure we typed all lines. We need to verify the portion in `create_file` content after `const [newBrand...` to ensure there is no errors (I truncated earlier). Need to view entire script file to ensure no mistakes. Use read_file to inspect `tmp_fix_filamentos_head.py`? sure but instructions say plan all reads? For verifying we just created file; we know content though to be safe? It's long but yes. We'll trust? But glimpsed snippet: there is line `the [uploadingImage` etc? need to confirm. We'll read entire script file to ensure there are no mistakes (since we must run script). We'll use `read_file` to view entire script? instructions: plan all reads before call; we currently only need to read just created script to ensure no mistakes; we also may need to read relevant portion of `page.tsx` after rewriting to verify. We'll plan to read both later? For now, we can rely on our knowledge? But glimpsed earlier when verifying we saw some text `the [uploadingImage, setUploadingImage] ...`? I'd like to confirm there isn't a mistake like `the [uploadingImage...` from autop-run? but expedite by reading script to confirm. We'll plan to read `tmp_fix_filamentos_head.py` and maybe part of `app/dashboard/filamentos/page.tsx` after script run. That is 2 files. According to instructions, plan all needed reads before calling; we plan to read `tmp_fix...` to ensure correctness? but we only need that if we suspect error. Considering we wrote script ourselves, maybe we can skip reading? but I glimpsed partial content in message showing truncated part 