"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/AuthProvider";
import {
  Plus,
  X,
  Package,
  Edit,
  Trash2,
  DollarSign,
  TrendingUp,
  Clock,
  Weight,
  ToggleLeft,
  ToggleRight,
  Check,
  Paintbrush,
} from "lucide-react";

type Filament = {
  id: string;
  nome: string;
  marca: string;
  tipo: string;
  cor: string;
  custo_por_kg: number;
};

type ProductFilament = {
  filamento_id: string;
  peso_usado: number;
  ordem: number;
  cor_identificacao: string;
};

type Product = {
  id: string;
  created_at: string;
  nome: string;
  descricao: string | null;
  filamento_id: string | null;
  tempo_impressao_horas: number;
  peso_usado: number;
  custo_material: number;
  custo_energia: number;
  custo_total: number;
  preco_venda: number;
  margem_percentual: number;
  status: "ativo" | "desativado";
  filaments?: {
    nome: string;
    marca: string;
    tipo: string;
    cor: string;
  };
};

export default function ProdutosPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [filaments, setFilaments] = useState<Filament[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    tempo_impressao_horas: 0,
    custo_energia_hora: 2.0,
    margem_percentual: 50,
    status: "ativo" as "ativo" | "desativado",
  });

  // Múltiplos filamentos
  const [selectedFilaments, setSelectedFilaments] = useState<ProductFilament[]>(
    []
  );
  const [currentFilament, setCurrentFilament] = useState({
    filamento_id: "",
    peso_usado: 0,
    cor_identificacao: "",
  });

  // Calculated values
  const [custoMaterial, setCustoMaterial] = useState(0);
  const [custoEnergia, setCustoEnergia] = useState(0);
  const [custoTotal, setCustoTotal] = useState(0);
  const [precoVenda, setPrecoVenda] = useState(0);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  useEffect(() => {
    calcularCustos();
  }, [
    selectedFilaments,
    formData.tempo_impressao_horas,
    formData.custo_energia_hora,
    formData.margem_percentual,
  ]);

  const calcularCustos = () => {
    if (selectedFilaments.length === 0) {
      setCustoMaterial(0);
      setCustoEnergia(0);
      setCustoTotal(0);
      setPrecoVenda(0);
      return;
    }

    // Calcular custo de todos os filamentos
    let custoMat = 0;
    selectedFilaments.forEach((sf) => {
      const filamento = filaments.find((f) => f.id === sf.filamento_id);
      if (filamento) {
        custoMat += (sf.peso_usado / 1000) * filamento.custo_por_kg;
      }
    });

    const custoEner =
      formData.tempo_impressao_horas * formData.custo_energia_hora;
    const custoTot = custoMat + custoEner;
    const precoV = custoTot * (1 + formData.margem_percentual / 100);

    setCustoMaterial(custoMat);
    setCustoEnergia(custoEner);
    setCustoTotal(custoTot);
    setPrecoVenda(precoV);
  };

  const addFilament = () => {
    if (!currentFilament.filamento_id || currentFilament.peso_usado <= 0) {
      alert("Selecione um filamento e defina o peso");
      return;
    }

    // Verificar se já não está adicionado
    if (
      selectedFilaments.some(
        (sf) => sf.filamento_id === currentFilament.filamento_id
      )
    ) {
      alert("Este filamento já foi adicionado");
      return;
    }

    setSelectedFilaments([
      ...selectedFilaments,
      {
        filamento_id: currentFilament.filamento_id,
        peso_usado: currentFilament.peso_usado,
        ordem: selectedFilaments.length + 1,
        cor_identificacao: currentFilament.cor_identificacao,
      },
    ]);

    // Limpar campos
    setCurrentFilament({
      filamento_id: "",
      peso_usado: 0,
      cor_identificacao: "",
    });
  };

  const removeFilament = (filamentoId: string) => {
    setSelectedFilaments(
      selectedFilaments.filter((sf) => sf.filamento_id !== filamentoId)
    );
  };

  const loadData = async () => {
    try {
      setLoading(true);

      // Carregar filamentos
      const { data: filamentsData, error: filamentsError } = await supabase
        .from("filaments")
        .select("*")
        .eq("user_id", user!.id)
        .order("nome");

      if (filamentsError) throw filamentsError;
      setFilaments(filamentsData || []);

      // Carregar produtos com info de filamento
      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select(
          `
          *,
          filaments (nome, marca, tipo, cor)
        `
        )
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

      if (productsError) throw productsError;
      setProducts(productsData || []);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.nome.trim() || selectedFilaments.length === 0) {
      alert("Preencha o nome e adicione pelo menos um filamento");
      return;
    }

    try {
      const productData = {
        user_id: user!.id,
        nome: formData.nome,
        descricao: formData.descricao || null,
        filamento_id: null, // Não usado para produtos multicolor
        peso_usado: selectedFilaments.reduce(
          (sum, sf) => sum + sf.peso_usado,
          0
        ),
        tempo_impressao_horas: formData.tempo_impressao_horas,
        custo_material: custoMaterial,
        custo_energia: custoEnergia,
        custo_total: custoTotal,
        preco_venda: precoVenda,
        margem_percentual: formData.margem_percentual,
        status: formData.status,
      };

      if (editingProduct) {
        // Atualizar produto
        const { error } = await supabase
          .from("products")
          .update(productData)
          .eq("id", editingProduct.id);

        if (error) throw error;

        // Deletar filamentos antigos e inserir novos
        await supabase
          .from("product_filaments")
          .delete()
          .eq("produto_id", editingProduct.id);

        const { error: filamentsError } = await supabase
          .from("product_filaments")
          .insert(
            selectedFilaments.map((sf) => ({
              produto_id: editingProduct.id,
              filamento_id: sf.filamento_id,
              peso_usado: sf.peso_usado,
              ordem: sf.ordem,
              cor_identificacao: sf.cor_identificacao || null,
            }))
          );

        if (filamentsError) throw filamentsError;
      } else {
        // Criar novo produto
        const { data: newProduct, error } = await supabase
          .from("products")
          .insert(productData)
          .select()
          .single();

        if (error) throw error;

        // Inserir filamentos
        const { error: filamentsError } = await supabase
          .from("product_filaments")
          .insert(
            selectedFilaments.map((sf) => ({
              produto_id: newProduct.id,
              filamento_id: sf.filamento_id,
              peso_usado: sf.peso_usado,
              ordem: sf.ordem,
              cor_identificacao: sf.cor_identificacao || null,
            }))
          );

        if (filamentsError) throw filamentsError;
      }

      setModalOpen(false);
      setEditingProduct(null);
      resetForm();
      loadData();
      alert("Produto salvo com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar produto:", error);
      alert("Erro ao salvar produto");
    }
  };

  const handleEdit = async (product: Product) => {
    setEditingProduct(product);
    setFormData({
      nome: product.nome,
      descricao: product.descricao || "",
      tempo_impressao_horas: product.tempo_impressao_horas,
      custo_energia_hora:
        product.custo_energia / (product.tempo_impressao_horas || 1),
      margem_percentual: product.margem_percentual,
      status: product.status,
    });

    // Carregar filamentos do produto
    try {
      const { data, error } = await supabase
        .from("product_filaments")
        .select("*")
        .eq("produto_id", product.id)
        .order("ordem");

      if (error) throw error;

      if (data && data.length > 0) {
        setSelectedFilaments(
          data.map((pf) => ({
            filamento_id: pf.filamento_id,
            peso_usado: pf.peso_usado,
            ordem: pf.ordem,
            cor_identificacao: pf.cor_identificacao || "",
          }))
        );
      } else {
        // Produto antigo com filamento único
        if (product.filamento_id) {
          setSelectedFilaments([
            {
              filamento_id: product.filamento_id,
              peso_usado: product.peso_usado,
              ordem: 1,
              cor_identificacao: "",
            },
          ]);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar filamentos do produto:", error);
    }

    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este produto?")) return;

    try {
      const { error } = await supabase.from("products").delete().eq("id", id);

      if (error) throw error;
      loadData();
    } catch (error) {
      console.error("Erro ao deletar produto:", error);
      alert("Erro ao deletar produto");
    }
  };

  const toggleStatus = async (product: Product) => {
    try {
      const newStatus = product.status === "ativo" ? "desativado" : "ativo";

      const { error } = await supabase
        .from("products")
        .update({ status: newStatus })
        .eq("id", product.id);

      if (error) throw error;
      loadData();
    } catch (error) {
      console.error("Erro ao alterar status:", error);
      alert("Erro ao alterar status");
    }
  };

  const resetForm = () => {
    setFormData({
      nome: "",
      descricao: "",
      tempo_impressao_horas: 0,
      custo_energia_hora: 2.0,
      margem_percentual: 50,
      status: "ativo",
    });
    setSelectedFilaments([]);
    setCurrentFilament({
      filamento_id: "",
      peso_usado: 0,
      cor_identificacao: "",
    });
  };

  const openModal = () => {
    resetForm();
    setEditingProduct(null);
    setModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-white text-lg">Carregando produtos...</div>
      </div>
    );
  }

  const produtosAtivos = products.filter((p) => p.status === "ativo").length;
  const lucroMedioPercentual =
    products.length > 0
      ? products.reduce((acc, p) => acc + p.margem_percentual, 0) /
        products.length
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Produtos</h1>
          <p className="text-vultrix-light/70">
            Gerencie seu catálogo de produtos
          </p>
        </div>
        <button
          onClick={openModal}
          className="flex items-center gap-2 px-6 py-3 bg-vultrix-accent text-white rounded-lg font-semibold hover:bg-vultrix-accent/90 transition-colors"
        >
          <Plus size={20} />
          Novo Produto
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-vultrix-dark border border-vultrix-gray rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <Package className="text-blue-500" size={24} />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-white mb-1">
            {products.length}
          </h3>
          <p className="text-vultrix-light/70 text-sm">Total de Produtos</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-vultrix-dark border border-vultrix-gray rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
              <Check className="text-green-500" size={24} />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-white mb-1">
            {produtosAtivos}
          </h3>
          <p className="text-vultrix-light/70 text-sm">Produtos Ativos</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-vultrix-dark border border-vultrix-gray rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center">
              <TrendingUp className="text-purple-500" size={24} />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-white mb-1">
            {lucroMedioPercentual.toFixed(0)}%
          </h3>
          <p className="text-vultrix-light/70 text-sm">Margem Média</p>
        </motion.div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.length === 0 ? (
          <div className="col-span-full bg-vultrix-dark border border-vultrix-gray rounded-xl p-12 text-center">
            <Package className="mx-auto text-vultrix-light/40 mb-4" size={48} />
            <p className="text-vultrix-light/70 mb-4">
              Nenhum produto cadastrado
            </p>
            <button
              onClick={openModal}
              className="text-vultrix-accent hover:text-vultrix-accent/80 text-sm font-medium"
            >
              Cadastrar primeiro produto
            </button>
          </div>
        ) : (
          products.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`bg-vultrix-dark border rounded-xl p-6 hover:border-vultrix-accent transition-colors ${
                product.status === "ativo"
                  ? "border-vultrix-gray"
                  : "border-vultrix-gray/50 opacity-60"
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white mb-1">
                    {product.nome}
                  </h3>
                  {product.descricao && (
                    <p className="text-vultrix-light/60 text-sm line-clamp-2">
                      {product.descricao}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => toggleStatus(product)}
                  className="ml-2 p-2 hover:bg-vultrix-gray rounded-lg transition-colors"
                  title={product.status === "ativo" ? "Desativar" : "Ativar"}
                >
                  {product.status === "ativo" ? (
                    <ToggleRight className="text-green-500" size={20} />
                  ) : (
                    <ToggleLeft className="text-vultrix-light/40" size={20} />
                  )}
                </button>
              </div>

              {/* Filamento */}
              {product.filaments && (
                <div className="mb-4 p-3 bg-vultrix-black rounded-lg">
                  <p className="text-xs text-vultrix-light/50 mb-1">
                    Filamento
                  </p>
                  <p className="text-white text-sm font-medium">
                    {product.filaments.nome} - {product.filaments.tipo}
                  </p>
                  <p className="text-vultrix-light/60 text-xs">
                    {product.filaments.marca} • {product.filaments.cor}
                  </p>
                </div>
              )}

              {/* Specs */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <Weight size={14} className="text-vultrix-light/50" />
                  <span className="text-vultrix-light/70">
                    {product.peso_usado}g
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock size={14} className="text-vultrix-light/50" />
                  <span className="text-vultrix-light/70">
                    {product.tempo_impressao_horas}h
                  </span>
                </div>
              </div>

              {/* Custos e Preço */}
              <div className="space-y-2 mb-4 p-3 bg-vultrix-black rounded-lg">
                <div className="flex justify-between text-sm">
                  <span className="text-vultrix-light/60">Custo Total:</span>
                  <span className="text-red-400 font-semibold">
                    R$ {product.custo_total.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-vultrix-light/60">Preço Venda:</span>
                  <span className="text-green-400 font-bold">
                    R$ {product.preco_venda.toFixed(2)}
                  </span>
                </div>
                <div className="pt-2 border-t border-vultrix-gray flex justify-between text-sm">
                  <span className="text-vultrix-light/60">Margem:</span>
                  <span className="text-vultrix-accent font-bold">
                    {product.margem_percentual.toFixed(0)}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-vultrix-light/60">Lucro:</span>
                  <span className="text-green-500 font-bold">
                    R$ {(product.preco_venda - product.custo_total).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(product)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-vultrix-gray text-white rounded-lg hover:bg-vultrix-light/10 transition-colors text-sm font-medium"
                >
                  <Edit size={14} />
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(product.id)}
                  className="px-4 py-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-vultrix-dark border border-vultrix-gray rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-vultrix-gray flex items-center justify-between sticky top-0 bg-vultrix-dark z-10">
                <h2 className="text-2xl font-bold text-white">
                  {editingProduct ? "Editar Produto" : "Novo Produto"}
                </h2>
                <button
                  onClick={() => {
                    setModalOpen(false);
                    setEditingProduct(null);
                  }}
                  className="p-2 hover:bg-vultrix-gray rounded-lg transition-colors text-vultrix-light"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Nome e Descrição */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-vultrix-light mb-2">
                      Nome do Produto *
                    </label>
                    <input
                      type="text"
                      value={formData.nome}
                      onChange={(e) =>
                        setFormData({ ...formData, nome: e.target.value })
                      }
                      placeholder="Ex: Miniatura de Dragão"
                      className="w-full px-4 py-3 bg-vultrix-black border border-vultrix-gray rounded-lg text-white placeholder-vultrix-light/40 focus:outline-none focus:border-vultrix-accent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-vultrix-light mb-2">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          status: e.target.value as "ativo" | "desativado",
                        })
                      }
                      className="w-full px-4 py-3 bg-vultrix-black border border-vultrix-gray rounded-lg text-white focus:outline-none focus:border-vultrix-accent"
                    >
                      <option value="ativo">Ativo</option>
                      <option value="desativado">Desativado</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-vultrix-light mb-2">
                    Descrição (opcional)
                  </label>
                  <textarea
                    value={formData.descricao}
                    onChange={(e) =>
                      setFormData({ ...formData, descricao: e.target.value })
                    }
                    placeholder="Detalhes do produto..."
                    rows={3}
                    className="w-full px-4 py-3 bg-vultrix-black border border-vultrix-gray rounded-lg text-white placeholder-vultrix-light/40 focus:outline-none focus:border-vultrix-accent resize-none"
                  />
                </div>

                {/* Filamentos (Multicolor) */}
                <div>
                  <label className="block text-sm font-medium text-vultrix-light mb-3">
                    Filamentos Utilizados *{" "}
                    {selectedFilaments.length > 1 && (
                      <span className="text-vultrix-accent">(Multicolor)</span>
                    )}
                  </label>

                  {/* Lista de filamentos adicionados */}
                  {selectedFilaments.length > 0 && (
                    <div className="mb-4 space-y-2">
                      {selectedFilaments.map((sf) => {
                        const filamento = filaments.find(
                          (f) => f.id === sf.filamento_id
                        );
                        return (
                          <div
                            key={sf.filamento_id}
                            className="flex items-center gap-3 p-3 bg-vultrix-black border border-vultrix-gray rounded-lg"
                          >
                            <div className="flex items-center gap-2 flex-1">
                              <Paintbrush
                                size={16}
                                className="text-vultrix-accent"
                              />
                              <div className="flex-1">
                                <p className="text-white font-medium text-sm">
                                  {filamento?.nome} - {filamento?.cor}
                                </p>
                                <p className="text-vultrix-light/60 text-xs">
                                  {sf.peso_usado}g
                                  {sf.cor_identificacao &&
                                    ` • ${sf.cor_identificacao}`}
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeFilament(sf.filamento_id)}
                              className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-colors"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Adicionar novo filamento */}
                  <div className="bg-vultrix-black border border-vultrix-gray rounded-lg p-4 space-y-3">
                    <div>
                      <select
                        value={currentFilament.filamento_id}
                        onChange={(e) =>
                          setCurrentFilament({
                            ...currentFilament,
                            filamento_id: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 bg-vultrix-dark border border-vultrix-gray rounded-lg text-white focus:outline-none focus:border-vultrix-accent"
                      >
                        <option value="">Selecione um filamento</option>
                        {filaments.map((fil) => (
                          <option key={fil.id} value={fil.id}>
                            {fil.nome} - {fil.cor} ({fil.marca}) - R${" "}
                            {fil.custo_por_kg.toFixed(2)}/kg
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={currentFilament.peso_usado || ""}
                          onChange={(e) =>
                            setCurrentFilament({
                              ...currentFilament,
                              peso_usado: parseFloat(e.target.value) || 0,
                            })
                          }
                          placeholder="Peso (gramas)"
                          className="w-full px-4 py-2 bg-vultrix-dark border border-vultrix-gray rounded-lg text-white placeholder-vultrix-light/40 focus:outline-none focus:border-vultrix-accent text-sm"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          value={currentFilament.cor_identificacao}
                          onChange={(e) =>
                            setCurrentFilament({
                              ...currentFilament,
                              cor_identificacao: e.target.value,
                            })
                          }
                          placeholder="Identificação (opcional)"
                          className="w-full px-4 py-2 bg-vultrix-dark border border-vultrix-gray rounded-lg text-white placeholder-vultrix-light/40 focus:outline-none focus:border-vultrix-accent text-sm"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={addFilament}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-vultrix-accent/20 text-vultrix-accent rounded-lg hover:bg-vultrix-accent/30 transition-colors text-sm font-medium"
                    >
                      <Plus size={16} />
                      Adicionar Filamento
                    </button>
                  </div>
                </div>

                {/* Tempo */}
                <div>
                  <label className="block text-sm font-medium text-vultrix-light mb-2">
                    Tempo Médio de Impressão (horas) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.tempo_impressao_horas || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        tempo_impressao_horas: parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="Ex: 3.5"
                    className="w-full px-4 py-3 bg-vultrix-black border border-vultrix-gray rounded-lg text-white placeholder-vultrix-light/40 focus:outline-none focus:border-vultrix-accent"
                    required
                  />
                </div>

                {/* Custo Energia e Margem */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-vultrix-light mb-2">
                      Custo Energia/Hora (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.custo_energia_hora}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          custo_energia_hora: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full px-4 py-3 bg-vultrix-black border border-vultrix-gray rounded-lg text-white focus:outline-none focus:border-vultrix-accent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-vultrix-light mb-2">
                      Margem de Lucro (%)
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={formData.margem_percentual}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          margem_percentual: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full px-4 py-3 bg-vultrix-black border border-vultrix-gray rounded-lg text-white focus:outline-none focus:border-vultrix-accent"
                    />
                  </div>
                </div>

                {/* Preview dos Cálculos */}
                {custoTotal > 0 && (
                  <div className="bg-vultrix-black border border-vultrix-gray rounded-lg p-6">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <DollarSign size={20} className="text-vultrix-accent" />
                      Cálculo Automático
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-vultrix-light/50 mb-1">
                          Custo Material
                        </p>
                        <p className="text-red-400 font-semibold">
                          R$ {custoMaterial.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-vultrix-light/50 mb-1">
                          Custo Energia
                        </p>
                        <p className="text-red-400 font-semibold">
                          R$ {custoEnergia.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-vultrix-light/50 mb-1">
                          Custo Total
                        </p>
                        <p className="text-red-500 font-bold text-lg">
                          R$ {custoTotal.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-vultrix-light/50 mb-1">
                          Preço Sugerido
                        </p>
                        <p className="text-green-500 font-bold text-lg">
                          R$ {precoVenda.toFixed(2)}
                        </p>
                      </div>
                      <div className="col-span-2 pt-3 border-t border-vultrix-gray">
                        <p className="text-xs text-vultrix-light/50 mb-1">
                          Lucro Estimado
                        </p>
                        <p className="text-green-400 font-bold text-xl">
                          R$ {(precoVenda - custoTotal).toFixed(2)} (
                          {formData.margem_percentual}%)
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setModalOpen(false);
                      setEditingProduct(null);
                    }}
                    className="flex-1 px-6 py-3 bg-vultrix-gray text-white rounded-lg font-semibold hover:bg-vultrix-light/10 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex-1 px-6 py-3 bg-vultrix-accent text-white rounded-lg font-semibold hover:bg-vultrix-accent/90 transition-colors"
                  >
                    {editingProduct ? "Atualizar" : "Salvar Produto"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
