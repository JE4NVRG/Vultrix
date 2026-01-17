"use client";

import { useAuth } from "@/lib/auth/AuthProvider";
import { supabase } from "@/lib/supabase/client";
import { Database } from "@/types/database";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Package,
  Search,
  TrendingUp,
  AlertTriangle,
  Edit2,
  Trash2,
  X,
  Upload,
  Building2,
  Palette,
  Image as ImageIcon,
} from "lucide-react";
import { useEffect, useState } from "react";

type Filament = Database["public"]["Tables"]["filaments"]["Row"] & {
  filament_brands?:
    | Database["public"]["Tables"]["filament_brands"]["Row"]
    | null;
};
type Brand = Database["public"]["Tables"]["filament_brands"]["Row"];

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

export default function FilamentosPage() {
  const { user, loading: authLoading } = useAuth();
  const [filaments, setFilaments] = useState<Filament[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTipo, setFilterTipo] = useState<string>("");
  const [filterBrand, setFilterBrand] = useState<string>("");
  const [uploadingImage, setUploadingImage] = useState(false);

  // Modal novo filamento
  const [formData, setFormData] = useState({
    nome: "",
    brand_id: "",
    tipo: "PLA",
    peso_atual: 1000,
    custo_por_kg: 0,
    data_compra: new Date().toISOString().split("T")[0],
    color_name: "",
    color_hex: "#808080",
    notes: "",
    image_url: "",
  });

  // Modal nova marca
  const [brandModalOpen, setBrandModalOpen] = useState(false);
  const [newBrand, setNewBrand] = useState({ name: "", website: "" });

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      // Carregar marcas
      const { data: brandsData } = await supabase
        .from("filament_brands")
        .select("*")
        .eq("user_id", user!.id)
        .order("name");

      setBrands(brandsData || []);

      // Carregar filamentos com marcas
      const { data: filamentsData } = await supabase
        .from("filaments")
        .select(
          `
          *,
          filament_brands (*)
        `
        )
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

      setFilaments(filamentsData || []);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (filament?: Filament) => {
    if (filament) {
      setEditingId(filament.id);
      setFormData({
        nome: filament.nome,
        brand_id: filament.brand_id || "",
        tipo: filament.tipo,
        peso_atual: filament.peso_atual,
        custo_por_kg: filament.custo_por_kg,
        data_compra: filament.data_compra,
        color_name: filament.color_name || "",
        color_hex: filament.color_hex || "#808080",
        notes: filament.notes || "",
        image_url: filament.image_url || "",
      });
    } else {
      setEditingId(null);
      setFormData({
        nome: "",
        brand_id: "",
        tipo: "PLA",
        peso_atual: 1000,
        custo_por_kg: 0,
        data_compra: new Date().toISOString().split("T")[0],
        color_name: "",
        color_hex: "#808080",
        notes: "",
        image_url: "",
      });
    }
    setModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validar tamanho (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert("Imagem muito grande! Máximo 2MB.");
      return;
    }

    // Validar tipo
    if (!file.type.startsWith("image/")) {
      alert("Apenas imagens são permitidas!");
      return;
    }

    setUploadingImage(true);

    try {
      // Nome único para o arquivo
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      // Upload para Supabase Storage
      const { data, error } = await supabase.storage
        .from("filament-images")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) throw error;

      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from("filament-images")
        .getPublicUrl(fileName);

      setFormData((prev) => ({ ...prev, image_url: urlData.publicUrl }));
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      alert("Erro ao fazer upload da imagem");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.nome || !formData.brand_id) {
      alert("Preencha nome e marca!");
      return;
    }

    try {
      const brand = brands.find((b) => b.id === formData.brand_id);
      const marca = brand?.name || "Desconhecida";

      const payload = {
        ...formData,
        user_id: user!.id,
        marca, // Campo legacy
        cor: formData.color_name || formData.color_hex, // Campo legacy
        peso_inicial: formData.peso_atual,
      };

      if (editingId) {
        await supabase.from("filaments").update(payload).eq("id", editingId);
      } else {
        await supabase.from("filaments").insert(payload);
      }

      setModalOpen(false);
      loadData();
    } catch (error) {
      console.error("Erro ao salvar:", error);
      alert("Erro ao salvar filamento");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este filamento?")) return;

    try {
      await supabase.from("filaments").delete().eq("id", id);
      loadData();
    } catch (error) {
      console.error("Erro ao deletar:", error);
    }
  };

  const handleCreateBrand = async () => {
    if (!newBrand.name.trim()) {
      alert("Digite o nome da marca!");
      return;
    }

    try {
      const { data } = await supabase
        .from("filament_brands")
        .insert({
          user_id: user!.id,
          name: newBrand.name.trim(),
          website: newBrand.website.trim() || null,
        })
        .select()
        .single();

      if (data) {
        setBrands(
          [...brands, data].sort((a, b) => a.name.localeCompare(b.name))
        );
        setFormData((prev) => ({ ...prev, brand_id: data.id }));
      }

      setBrandModalOpen(false);
      setNewBrand({ name: "", website: "" });
    } catch (error) {
      console.error("Erro ao criar marca:", error);
      alert("Erro ao criar marca");
    }
  };

  // Filtros
  const filteredFilaments = filaments.filter((f) => {
    const matchSearch =
      f.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.marca?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchTipo = !filterTipo || f.tipo === filterTipo;
    const matchBrand = !filterBrand || f.brand_id === filterBrand;
    return matchSearch && matchTipo && matchBrand;
  });

  // Estatísticas
  const totalFilamentos = filaments.length;
  const estoqueTotal = filaments.reduce((sum, f) => sum + f.peso_atual, 0);
  const valorTotal = filaments.reduce(
    (sum, f) => sum + (f.peso_atual / 1000) * f.custo_por_kg,
    0
  );
  const lowStock = filaments.filter((f) => f.peso_atual < 200).length;

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-vultrix-accent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Filamentos</h1>
          <p className="text-vultrix-light/70">
            Gestão visual e inteligente de estoque
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2 bg-vultrix-accent hover:bg-vultrix-accent/90 text-white rounded-lg transition-colors"
        >
          <Plus size={20} />
          Novo Filamento
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-vultrix-dark border border-vultrix-gray rounded-xl p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Package className="text-blue-500" size={24} />
            </div>
            <div>
              <p className="text-vultrix-light/70 text-sm">Total</p>
              <p className="text-2xl font-bold text-white">{totalFilamentos}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-vultrix-dark border border-vultrix-gray rounded-xl p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="text-green-500" size={24} />
            </div>
            <div>
              <p className="text-vultrix-light/70 text-sm">Estoque</p>
              <p className="text-2xl font-bold text-white">
                {(estoqueTotal / 1000).toFixed(1)} kg
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-vultrix-dark border border-vultrix-gray rounded-xl p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <Building2 className="text-purple-500" size={24} />
            </div>
            <div>
              <p className="text-vultrix-light/70 text-sm">Valor Total</p>
              <p className="text-2xl font-bold text-white">
                R$ {valorTotal.toFixed(0)}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-vultrix-dark border border-vultrix-gray rounded-xl p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
              <AlertTriangle className="text-orange-500" size={24} />
            </div>
            <div>
              <p className="text-vultrix-light/70 text-sm">Baixo Estoque</p>
              <p className="text-2xl font-bold text-white">{lowStock}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Filtros */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-vultrix-light/50"
              size={20}
            />
            <input
              type="text"
              placeholder="Buscar por nome ou marca..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-vultrix-dark border border-vultrix-gray rounded-lg text-white placeholder:text-vultrix-light/50 focus:outline-none focus:border-vultrix-accent"
            />
          </div>
        </div>

        <select
          value={filterTipo}
          onChange={(e) => setFilterTipo(e.target.value)}
          className="px-4 py-2 bg-vultrix-dark border border-vultrix-gray rounded-lg text-white focus:outline-none focus:border-vultrix-accent"
        >
          <option value="">Todos os Tipos</option>
          {TIPOS_FILAMENTO.map((tipo) => (
            <option key={tipo} value={tipo}>
              {tipo}
            </option>
          ))}
        </select>

        <select
          value={filterBrand}
          onChange={(e) => setFilterBrand(e.target.value)}
          className="px-4 py-2 bg-vultrix-dark border border-vultrix-gray rounded-lg text-white focus:outline-none focus:border-vultrix-accent"
        >
          <option value="">Todas as Marcas</option>
          {brands.map((brand) => (
            <option key={brand.id} value={brand.id}>
              {brand.name}
            </option>
          ))}
        </select>
      </div>

      {/* Grid de Filamentos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredFilaments.map((filament, index) => {
          const brand = Array.isArray(filament.filament_brands)
            ? filament.filament_brands[0]
            : filament.filament_brands;
          const stockPercent =
            (filament.peso_atual / filament.peso_inicial) * 100;
          const isLowStock = filament.peso_atual < 200;

          return (
            <motion.div
              key={filament.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className={`bg-vultrix-dark border ${
                isLowStock ? "border-orange-500/50" : "border-vultrix-gray"
              } rounded-xl overflow-hidden hover:border-vultrix-accent transition-all`}
            >
              {/* Imagem */}
              <div className="relative h-40 bg-vultrix-black overflow-hidden">
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

                {/* Badge de cor */}
                <div
                  className="absolute top-3 right-3 w-12 h-12 rounded-full border-2 border-white shadow-lg"
                  style={{ backgroundColor: filament.color_hex }}
                  title={filament.color_name || filament.color_hex}
                />

                {/* Badge baixo estoque */}
                {isLowStock && (
                  <div className="absolute top-3 left-3 px-2 py-1 bg-orange-500 text-white text-xs font-bold rounded-md flex items-center gap-1">
                    <AlertTriangle size={12} />
                    BAIXO
                  </div>
                )}
              </div>

              {/* Conteúdo */}
              <div className="p-4 space-y-3">
                {/* Nome e Marca */}
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">
                    {filament.nome}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-vultrix-light/70">
                    <Building2 size={14} />
                    <span>{brand?.name || filament.marca}</span>
                  </div>
                </div>

                {/* Tipo e Cor */}
                <div className="flex items-center gap-4 text-sm">
                  <div className="px-2 py-1 bg-vultrix-black rounded text-vultrix-accent font-medium">
                    {filament.tipo}
                  </div>
                  {filament.color_name && (
                    <div className="text-vultrix-light/70 flex items-center gap-1">
                      <Palette size={14} />
                      {filament.color_name}
                    </div>
                  )}
                </div>

                {/* Barra de Estoque */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-vultrix-light/70">
                    <span>Estoque</span>
                    <span className="font-medium">
                      {filament.peso_atual}g / {filament.peso_inicial}g
                    </span>
                  </div>
                  <div className="w-full h-2 bg-vultrix-black rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
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

                {/* Custo */}
                <div className="flex justify-between items-center pt-2 border-t border-vultrix-gray">
                  <div>
                    <p className="text-xs text-vultrix-light/70">Custo/kg</p>
                    <p className="text-lg font-bold text-white">
                      R$ {filament.custo_por_kg.toFixed(2)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openModal(filament)}
                      className="p-2 hover:bg-vultrix-gray rounded-lg transition-colors"
                    >
                      <Edit2 className="text-vultrix-light/70" size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(filament.id)}
                      className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                    >
                      <Trash2 className="text-red-500" size={16} />
                    </button>
                  </div>
                </div>

                {/* Notas */}
                {filament.notes && (
                  <p className="text-xs text-vultrix-light/50 italic line-clamp-2 pt-2 border-t border-vultrix-gray/50">
                    {filament.notes}
                  </p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {filteredFilaments.length === 0 && (
        <div className="text-center py-12">
          <Package className="mx-auto text-vultrix-light/30 mb-4" size={64} />
          <p className="text-vultrix-light/70 text-lg">
            Nenhum filamento encontrado
          </p>
        </div>
      )}

      {/* Modal Novo/Editar Filamento */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-vultrix-dark border border-vultrix-gray rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="sticky top-0 bg-vultrix-dark border-b border-vultrix-gray p-6 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">
                  {editingId ? "Editar Filamento" : "Novo Filamento"}
                </h2>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-2 hover:bg-vultrix-gray rounded-lg transition-colors"
                >
                  <X className="text-vultrix-light/70" size={24} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Upload de Imagem */}
                <div>
                  <label className="block text-sm font-medium text-vultrix-light/70 mb-2">
                    Imagem do Filamento
                  </label>
                  <div className="flex gap-4 items-start">
                    {formData.image_url ? (
                      <div className="relative w-32 h-32 rounded-lg overflow-hidden">
                        <img
                          src={formData.image_url}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() =>
                            setFormData((prev) => ({ ...prev, image_url: "" }))
                          }
                          className="absolute top-2 right-2 p-1 bg-red-500 rounded-full hover:bg-red-600 transition-colors"
                        >
                          <X size={16} className="text-white" />
                        </button>
                      </div>
                    ) : (
                      <label className="w-32 h-32 border-2 border-dashed border-vultrix-gray rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-vultrix-accent transition-colors">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          disabled={uploadingImage}
                        />
                        {uploadingImage ? (
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-vultrix-accent"></div>
                        ) : (
                          <>
                            <ImageIcon
                              className="text-vultrix-light/50 mb-2"
                              size={24}
                            />
                            <span className="text-xs text-vultrix-light/50">
                              Adicionar
                            </span>
                          </>
                        )}
                      </label>
                    )}
                    <div className="flex-1 text-xs text-vultrix-light/50">
                      <p>• Tamanho máximo: 2MB</p>
                      <p>• Formatos: JPG, PNG, WebP</p>
                      <p>• Recomendado: 400x400px</p>
                    </div>
                  </div>
                </div>

                {/* Nome */}
                <div>
                  <label className="block text-sm font-medium text-vultrix-light/70 mb-2">
                    Nome *
                  </label>
                  <input
                    type="text"
                    value={formData.nome}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, nome: e.target.value }))
                    }
                    placeholder="Ex: PLA Branco 1.75mm"
                    className="w-full px-4 py-2 bg-vultrix-black border border-vultrix-gray rounded-lg text-white placeholder:text-vultrix-light/50 focus:outline-none focus:border-vultrix-accent"
                  />
                </div>

                {/* Marca */}
                <div>
                  <label className="block text-sm font-medium text-vultrix-light/70 mb-2">
                    Marca *
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={formData.brand_id}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          brand_id: e.target.value,
                        }))
                      }
                      className="flex-1 px-4 py-2 bg-vultrix-black border border-vultrix-gray rounded-lg text-white focus:outline-none focus:border-vultrix-accent"
                    >
                      <option value="">Selecione a marca</option>
                      {brands.map((brand) => (
                        <option key={brand.id} value={brand.id}>
                          {brand.name}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => setBrandModalOpen(true)}
                      className="px-4 py-2 bg-vultrix-accent/20 text-vultrix-accent hover:bg-vultrix-accent/30 rounded-lg transition-colors font-medium"
                    >
                      + Nova Marca
                    </button>
                  </div>
                </div>

                {/* Tipo */}
                <div>
                  <label className="block text-sm font-medium text-vultrix-light/70 mb-2">
                    Tipo
                  </label>
                  <select
                    value={formData.tipo}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, tipo: e.target.value }))
                    }
                    className="w-full px-4 py-2 bg-vultrix-black border border-vultrix-gray rounded-lg text-white focus:outline-none focus:border-vultrix-accent"
                  >
                    {TIPOS_FILAMENTO.map((tipo) => (
                      <option key={tipo} value={tipo}>
                        {tipo}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Cor */}
                <div>
                  <label className="block text-sm font-medium text-vultrix-light/70 mb-2">
                    Cor
                  </label>
                  <div className="flex gap-4 items-start">
                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        value={formData.color_name}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            color_name: e.target.value,
                          }))
                        }
                        placeholder="Nome da cor (ex: Azul Royal)"
                        className="w-full px-4 py-2 bg-vultrix-black border border-vultrix-gray rounded-lg text-white placeholder:text-vultrix-light/50 focus:outline-none focus:border-vultrix-accent"
                      />
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={formData.color_hex}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              color_hex: e.target.value,
                            }))
                          }
                          className="w-16 h-10 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={formData.color_hex}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              color_hex: e.target.value,
                            }))
                          }
                          placeholder="#RRGGBB"
                          className="flex-1 px-4 py-2 bg-vultrix-black border border-vultrix-gray rounded-lg text-white placeholder:text-vultrix-light/50 focus:outline-none focus:border-vultrix-accent"
                        />
                      </div>
                    </div>

                    {/* Preview da cor */}
                    <div className="flex flex-col items-center gap-2">
                      <div
                        className="w-20 h-20 rounded-lg border-2 border-white shadow-lg"
                        style={{ backgroundColor: formData.color_hex }}
                      />
                      <span className="text-xs text-vultrix-light/50">
                        Preview
                      </span>
                    </div>
                  </div>

                  {/* Cores rápidas */}
                  <div className="mt-3">
                    <p className="text-xs text-vultrix-light/50 mb-2">
                      Cores rápidas:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {CORES_RAPIDAS.map((cor) => (
                        <button
                          key={cor.hex}
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              color_hex: cor.hex,
                              color_name: cor.name,
                            }))
                          }
                          className="w-8 h-8 rounded-full border-2 border-white hover:scale-110 transition-transform"
                          style={{ backgroundColor: cor.hex }}
                          title={cor.name}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Peso e Custo */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-vultrix-light/70 mb-2">
                      Peso Atual (g)
                    </label>
                    <input
                      type="number"
                      value={formData.peso_atual}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          peso_atual: Number(e.target.value),
                        }))
                      }
                      min="0"
                      step="10"
                      className="w-full px-4 py-2 bg-vultrix-black border border-vultrix-gray rounded-lg text-white focus:outline-none focus:border-vultrix-accent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-vultrix-light/70 mb-2">
                      Custo por Kg (R$)
                    </label>
                    <input
                      type="number"
                      value={formData.custo_por_kg}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          custo_por_kg: Number(e.target.value),
                        }))
                      }
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-2 bg-vultrix-black border border-vultrix-gray rounded-lg text-white focus:outline-none focus:border-vultrix-accent"
                    />
                  </div>
                </div>

                {/* Data de Compra */}
                <div>
                  <label className="block text-sm font-medium text-vultrix-light/70 mb-2">
                    Data de Compra
                  </label>
                  <input
                    type="date"
                    value={formData.data_compra}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        data_compra: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-2 bg-vultrix-black border border-vultrix-gray rounded-lg text-white focus:outline-none focus:border-vultrix-accent"
                  />
                </div>

                {/* Notas */}
                <div>
                  <label className="block text-sm font-medium text-vultrix-light/70 mb-2">
                    Observações
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        notes: e.target.value,
                      }))
                    }
                    rows={3}
                    placeholder="Notas adicionais sobre o filamento..."
                    className="w-full px-4 py-2 bg-vultrix-black border border-vultrix-gray rounded-lg text-white placeholder:text-vultrix-light/50 focus:outline-none focus:border-vultrix-accent resize-none"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 bg-vultrix-dark border-t border-vultrix-gray p-6 flex justify-end gap-3">
                <button
                  onClick={() => setModalOpen(false)}
                  className="px-6 py-2 bg-vultrix-gray hover:bg-vultrix-gray/80 text-white rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSubmit}
                  className="px-6 py-2 bg-vultrix-accent hover:bg-vultrix-accent/90 text-white rounded-lg transition-colors font-medium"
                >
                  {editingId ? "Salvar Alterações" : "Criar Filamento"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Nova Marca */}
      <AnimatePresence>
        {brandModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-vultrix-dark border border-vultrix-gray rounded-xl max-w-md w-full"
            >
              <div className="p-6 border-b border-vultrix-gray flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">Nova Marca</h2>
                <button
                  onClick={() => setBrandModalOpen(false)}
                  className="p-2 hover:bg-vultrix-gray rounded-lg transition-colors"
                >
                  <X className="text-vultrix-light/70" size={20} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-vultrix-light/70 mb-2">
                    Nome da Marca *
                  </label>
                  <input
                    type="text"
                    value={newBrand.name}
                    onChange={(e) =>
                      setNewBrand((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="Ex: Creality"
                    className="w-full px-4 py-2 bg-vultrix-black border border-vultrix-gray rounded-lg text-white placeholder:text-vultrix-light/50 focus:outline-none focus:border-vultrix-accent"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-vultrix-light/70 mb-2">
                    Website (opcional)
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
                    placeholder="https://exemplo.com"
                    className="w-full px-4 py-2 bg-vultrix-black border border-vultrix-gray rounded-lg text-white placeholder:text-vultrix-light/50 focus:outline-none focus:border-vultrix-accent"
                  />
                </div>
              </div>

              <div className="p-6 border-t border-vultrix-gray flex justify-end gap-3">
                <button
                  onClick={() => setBrandModalOpen(false)}
                  className="px-4 py-2 bg-vultrix-gray hover:bg-vultrix-gray/80 text-white rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateBrand}
                  className="px-4 py-2 bg-vultrix-accent hover:bg-vultrix-accent/90 text-white rounded-lg transition-colors font-medium"
                >
                  Criar Marca
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
