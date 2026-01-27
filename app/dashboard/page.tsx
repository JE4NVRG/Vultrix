"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth/AuthProvider";
import { supabase } from "@/lib/supabase/client";
import { useOnboardingStatus } from "@/lib/hooks/useOnboardingStatus";
import Link from "next/link";
import {
  DollarSign,
  TrendingUp,
  Package,
  Layers,
  Calendar,
  Activity,
  Award,
  AlertCircle,
  Wallet,
  TrendingDown,
  PiggyBank,
  Printer,
  User,
  X,
  CheckCircle2,
  Circle,
  AlertTriangle,
  Calculator,
  ShoppingCart,
  Plus,
  ArrowRight,
  Sparkles,
  Lightbulb,
  Target,
  Zap,
  RefreshCw,
  BarChart3,
  Box,
} from "lucide-react";

type BalanceData = {
  total_vendas: number;
  total_aportes: number;
  total_despesas: number;
  saldo_final: number;
  receita_liquida: number;
};

type DashboardMetrics = {
  balance: BalanceData;
  totalVendas: number;
  totalProdutos: number;
  totalFilamentos: number;
  totalImpressoras: number;
  produtoMaisVendido: {
    nome: string;
    quantidade: number;
  } | null;
  filamentoMaisConsumido: {
    nome: string;
    marca: string;
    consumo: number;
  } | null;
  vendasPorDia: Array<{
    data: string;
    valor: number;
  }>;
  filamentosEstoqueBaixo: number;
};

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const {
    status: onboardingStatus,
    loading: onboardingLoading,
    dismiss,
  } = useOnboardingStatus();

  const [metrics, setMetrics] = useState<DashboardMetrics>({
    balance: {
      total_vendas: 0,
      total_aportes: 0,
      total_despesas: 0,
      saldo_final: 0,
      receita_liquida: 0,
    },
    totalVendas: 0,
    totalProdutos: 0,
    totalFilamentos: 0,
    totalImpressoras: 0,
    produtoMaisVendido: null,
    filamentoMaisConsumido: null,
    vendasPorDia: [],
    filamentosEstoqueBaixo: 0,
  });

  const [loading, setLoading] = useState(true);
  const [makerTip, setMakerTip] = useState<string>("");
  const [tipLoading, setTipLoading] = useState(true);
  const [mesAtual] = useState(
    new Date().toLocaleString("pt-BR", { month: "long", year: "numeric" }),
  );

  // Carregar dica do maker
  const loadMakerTip = async () => {
    try {
      setTipLoading(true);
      const response = await fetch('/api/maker-tip');
      if (response.ok) {
        const data = await response.json();
        setMakerTip(data.tip);
      } else {
        throw new Error('API error');
      }
    } catch (error) {
      console.warn('Erro ao carregar dica, usando fallback');
      setMakerTip('💡 Continue focado no seu negócio maker! Cada impressão é um passo para o sucesso.');
    } finally {
      setTipLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadMetrics();
      loadMakerTip();
    }
  }, [user]);

  const loadMetrics = async () => {
    if (!user?.id) {
      console.warn("Usuário não autenticado");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const hoje = new Date();
      const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      const ultimoDiaMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
      const dataInicio = primeiroDiaMes.toISOString().split("T")[0];
      const dataFim = ultimoDiaMes.toISOString().split("T")[0];

      console.log("📊 Carregando métricas para:", { userId: user.id, dataInicio, dataFim });

      // Inicializar balance
      let balance: BalanceData = {
        total_vendas: 0,
        total_aportes: 0,
        total_despesas: 0,
        saldo_final: 0,
        receita_liquida: 0,
      };
      
      // Calcular valores manualmente (mais confiável)
      try {
        // Buscar vendas do mês (suporta ambos os campos: sale_price e valor_venda)
        const { data: vendasData, error: vendasErr } = await supabase
          .from("sales")
          .select("sale_price, valor_venda, quantity")
          .eq("user_id", user.id)
          .gte("data", dataInicio)
          .lte("data", dataFim);
        
        if (vendasErr) {
          console.error("Erro ao buscar vendas:", vendasErr);
        }
        
        const totalVendasCalc = vendasData?.reduce((sum, v) => {
          const preco = v.sale_price || v.valor_venda || 0;
          const qty = v.quantity || 1;
          return sum + (preco * qty);
        }, 0) || 0;
        
        console.log("💰 Vendas encontradas:", vendasData?.length || 0, "Total:", totalVendasCalc);
        
        // Buscar aportes do mês (tabela capital_contributions)
        const { data: aportesData, error: aportesErr } = await supabase
          .from("capital_contributions")
          .select("valor")
          .eq("user_id", user.id)
          .gte("data", dataInicio)
          .lte("data", dataFim);
        
        if (aportesErr) {
          console.error("Erro ao buscar aportes:", aportesErr);
        }
        
        const totalAportes = aportesData?.reduce((sum, a) => sum + (a.valor || 0), 0) || 0;
        console.log("📥 Aportes encontrados:", aportesData?.length || 0, "Total:", totalAportes);
        
        // Buscar despesas do mês
        const { data: despesasData, error: despesasErr } = await supabase
          .from("expenses")
          .select("valor")
          .eq("user_id", user.id)
          .gte("data", dataInicio)
          .lte("data", dataFim);
        
        if (despesasErr) {
          console.error("Erro ao buscar despesas:", despesasErr);
        }
        
        const totalDespesas = despesasData?.reduce((sum, d) => sum + (d.valor || 0), 0) || 0;
        console.log("💸 Despesas encontradas:", despesasData?.length || 0, "Total:", totalDespesas);
        
        balance = {
          total_vendas: totalVendasCalc,
          total_aportes: totalAportes,
          total_despesas: totalDespesas,
          saldo_final: totalVendasCalc + totalAportes - totalDespesas,
          receita_liquida: totalVendasCalc - totalDespesas,
        };
        
        console.log("📈 Balance calculado:", balance);
      } catch (calcError) {
        console.error("Erro ao calcular saldo:", calcError);
      }

      // Buscar vendas do mês com tratamento de erro
      let salesData: any[] = [];
      let totalVendas = 0;
      
      try {
        // Primeiro tenta buscar com relações
        const { data, error: salesError } = await supabase
          .from("sales")
          .select("*")
          .eq("user_id", user.id)
          .gte("data", dataInicio)
          .lte("data", dataFim);

        if (salesError) {
          console.error("Erro ao buscar vendas:", salesError.message || salesError.code || JSON.stringify(salesError));
        } else {
          salesData = data || [];
          totalVendas = salesData.length;
          console.log("🛒 Vendas do mês:", totalVendas);
        }
      } catch (salesErr: any) {
        console.error("Erro crítico ao buscar vendas:", salesErr?.message || salesErr);
      }

      // Buscar produtos para enriquecer os dados de vendas
      let productsMap: Record<string, any> = {};
      try {
        const { data: productsData } = await supabase
          .from("products")
          .select("id, nome, custo_total")
          .eq("user_id", user.id);
        
        productsData?.forEach(p => {
          productsMap[p.id] = p;
        });
      } catch (e) {
        console.warn("Erro ao buscar produtos para enriquecer vendas");
      }

      // Produto mais vendido
      const produtoCount: Record<string, { nome: string; count: number }> = {};
      salesData?.forEach((sale) => {
        const produto = productsMap[sale.produto_id];
        const produtoNome = produto?.nome || "Desconhecido";
        if (!produtoCount[sale.produto_id]) {
          produtoCount[sale.produto_id] = { nome: produtoNome, count: 0 };
        }
        produtoCount[sale.produto_id].count += sale.quantity || 1;
      });

      const produtoMaisVendido =
        Object.values(produtoCount).length > 0
          ? {
              nome: Object.values(produtoCount).reduce(
                (max, p) => (p.count > max.count ? p : max),
                { nome: "", count: 0 },
              ).nome,
              quantidade: Object.values(produtoCount).reduce(
                (max, p) => (p.count > max.count ? p : max),
                { nome: "", count: 0 },
              ).count,
            }
          : null;

      // Filamento mais consumido
      let filamentoMaisConsumido: { nome: string; marca: string; consumo: number } | null = null;
      try {
        const { data: logsData, error: logsError } = await supabase
          .from("filament_consumption_logs")
          .select(
            `
            quantidade_consumida,
            filaments (
              nome,
              marca
            )
          `,
          )
          .eq("user_id", user.id)
          .gte("created_at", primeiroDiaMes.toISOString())
          .lte("created_at", ultimoDiaMes.toISOString());

        if (logsError) {
          console.warn("Tabela filament_consumption_logs pode não existir:", logsError.message);
        } else if (logsData && logsData.length > 0) {
          const filamentoConsumo: Record<
            string,
            { nome: string; marca: string; consumo: number }
          > = {};
          logsData.forEach((log: any) => {
            const filamento = Array.isArray(log.filaments)
              ? log.filaments[0]
              : log.filaments;
            const key = `${filamento?.nome}-${filamento?.marca}`;
            if (!filamentoConsumo[key]) {
              filamentoConsumo[key] = {
                nome: filamento?.nome || "",
                marca: filamento?.marca || "",
                consumo: 0,
              };
            }
            filamentoConsumo[key].consumo += log.quantidade_consumida || 0;
          });

          filamentoMaisConsumido =
            Object.values(filamentoConsumo).length > 0
              ? Object.values(filamentoConsumo).reduce(
                  (max, f) => (f.consumo > max.consumo ? f : max),
                  { nome: "", marca: "", consumo: 0 },
                )
              : null;
        }
      } catch (logsErr) {
        console.warn("Erro ao buscar consumo de filamentos:", logsErr);
      }

      // Contagem de produtos, filamentos e impressoras
      let produtosCount = 0;
      let filamentosCount = 0;
      let impressorasCount = 0;
      let estoqueBaixoCount = 0;

      try {
        const { count: pCount } = await supabase
          .from("products")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id);
        produtosCount = pCount || 0;
        console.log("📦 Produtos:", produtosCount);
      } catch (e) { console.warn("Erro ao contar produtos"); }

      try {
        const { count: fCount } = await supabase
          .from("filaments")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id);
        filamentosCount = fCount || 0;
        console.log("🧵 Filamentos:", filamentosCount);
      } catch (e) { console.warn("Erro ao contar filamentos"); }

      try {
        const { count: iCount } = await supabase
          .from("printers")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id);
        impressorasCount = iCount || 0;
        console.log("🖨️ Impressoras:", impressorasCount);
      } catch (e) { console.warn("Erro ao contar impressoras"); }

      try {
        const { count: ebCount } = await supabase
          .from("filaments")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .lt("peso_disponivel", 200);
        estoqueBaixoCount = ebCount || 0;
      } catch (e) { console.warn("Erro ao contar estoque baixo"); }

      // Vendas por dia (últimos 7 dias)
      const vendasPorDia: Array<{ data: string; valor: number }> = [];
      for (let i = 6; i >= 0; i--) {
        const dia = new Date();
        dia.setDate(dia.getDate() - i);
        const diaStr = dia.toISOString().split("T")[0];

        const vendasDoDia = salesData?.filter((s) => s.data === diaStr) || [];
        const valorDia = vendasDoDia.reduce(
          (sum, s) => sum + ((s.sale_price || s.valor_venda || 0) * (s.quantity || 1)),
          0,
        );

        vendasPorDia.push({
          data: dia.toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
          }),
          valor: valorDia,
        });
      }

      console.log("✅ Métricas carregadas com sucesso!");

      setMetrics({
        balance,
        totalVendas,
        totalProdutos: produtosCount,
        totalFilamentos: filamentosCount,
        totalImpressoras: impressorasCount,
        produtoMaisVendido,
        filamentoMaisConsumido,
        vendasPorDia,
        filamentosEstoqueBaixo: estoqueBaixoCount,
      });
    } catch (error: any) {
      console.error("Erro ao carregar métricas:", error?.message || error?.details || JSON.stringify(error) || error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-vultrix-accent mx-auto"></div>
          <p className="mt-4 text-vultrix-light/70">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  const maxVendaDia = Math.max(...metrics.vendasPorDia.map((v) => v.valor), 1);

  // Banner logic: show if not complete AND not dismissed
  const shouldShowBanner =
    !onboardingLoading &&
    !onboardingStatus.isComplete &&
    !onboardingStatus.isDismissed;

  // Get user initials for avatar fallback
  const getInitials = (name: string | null) => {
    if (!name) return "?";
    const parts = name.split(" ");
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const handleDismissBanner = async () => {
    await dismiss();
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-vultrix-dark/50 to-vultrix-gray/30 border border-vultrix-light/10 rounded-xl p-6"
      >
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="relative">
            {onboardingStatus.avatarUrl ? (
              <img
                src={onboardingStatus.avatarUrl}
                alt="Avatar"
                className="w-16 h-16 rounded-full object-cover border-2 border-vultrix-accent/30"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-vultrix-accent to-purple-600 flex items-center justify-center text-white font-bold text-xl border-2 border-vultrix-accent/30">
                {getInitials(onboardingStatus.displayName)}
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-vultrix-dark"></div>
          </div>

          {/* Greeting */}
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white">
              {onboardingStatus.displayName
                ? `Bem-vindo de volta, ${onboardingStatus.displayName}! 👋`
                : "Bem-vindo de volta! 👋"}
            </h2>
            <p className="text-vultrix-light/70 text-sm mt-1">
              {onboardingStatus.displayName
                ? "Aqui está o resumo do seu negócio"
                : "Complete seu perfil para personalizar sua experiência"}
            </p>
          </div>

          {/* Quick Actions */}
          {!onboardingStatus.displayName && (
            <Link
              href="/dashboard/perfil"
              className="bg-vultrix-accent/20 hover:bg-vultrix-accent/30 text-vultrix-accent border border-vultrix-accent/30 font-semibold py-2 px-4 rounded-lg transition-all"
            >
              Completar Perfil
            </Link>
          )}
        </div>
      </motion.div>

      {/* Dica do Maker IA */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-r from-vultrix-accent/10 to-purple-500/10 border border-vultrix-accent/20 rounded-xl p-5"
      >
        <div className="flex items-start gap-4">
          <div className="bg-vultrix-accent/20 p-3 rounded-lg flex-shrink-0">
            <Sparkles className="text-vultrix-accent" size={24} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-sm font-semibold text-vultrix-accent">Dica do Maker IA</h3>
              <button
                onClick={loadMakerTip}
                className="text-vultrix-light/40 hover:text-vultrix-accent transition-colors"
                title="Nova dica"
              >
                <RefreshCw size={14} className={tipLoading ? 'animate-spin' : ''} />
              </button>
            </div>
            {tipLoading ? (
              <div className="h-5 bg-vultrix-gray/50 rounded animate-pulse w-3/4"></div>
            ) : (
              <p className="text-vultrix-light/80 text-sm leading-relaxed">{makerTip}</p>
            )}
          </div>
        </div>
      </motion.div>

      {/* Acessos Rápidos */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
          <Zap size={18} className="text-yellow-400" />
          Acessos Rápidos
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <Link
            href="/dashboard/calculadora"
            className="bg-vultrix-dark border border-vultrix-gray hover:border-vultrix-accent/50 rounded-xl p-4 flex flex-col items-center gap-2 transition-all hover:scale-105 group"
          >
            <div className="bg-blue-500/10 p-3 rounded-lg group-hover:bg-blue-500/20 transition-colors">
              <Calculator className="text-blue-400" size={22} />
            </div>
            <span className="text-white text-sm font-medium">Calculadora</span>
          </Link>
          
          <Link
            href="/dashboard/produtos"
            className="bg-vultrix-dark border border-vultrix-gray hover:border-vultrix-accent/50 rounded-xl p-4 flex flex-col items-center gap-2 transition-all hover:scale-105 group"
          >
            <div className="bg-green-500/10 p-3 rounded-lg group-hover:bg-green-500/20 transition-colors">
              <Package className="text-green-400" size={22} />
            </div>
            <span className="text-white text-sm font-medium">Produtos</span>
          </Link>
          
          <Link
            href="/dashboard/vendas"
            className="bg-vultrix-dark border border-vultrix-gray hover:border-vultrix-accent/50 rounded-xl p-4 flex flex-col items-center gap-2 transition-all hover:scale-105 group"
          >
            <div className="bg-purple-500/10 p-3 rounded-lg group-hover:bg-purple-500/20 transition-colors">
              <ShoppingCart className="text-purple-400" size={22} />
            </div>
            <span className="text-white text-sm font-medium">Vendas</span>
          </Link>
          
          <Link
            href="/dashboard/filamentos"
            className="bg-vultrix-dark border border-vultrix-gray hover:border-vultrix-accent/50 rounded-xl p-4 flex flex-col items-center gap-2 transition-all hover:scale-105 group"
          >
            <div className="bg-cyan-500/10 p-3 rounded-lg group-hover:bg-cyan-500/20 transition-colors">
              <Layers className="text-cyan-400" size={22} />
            </div>
            <span className="text-white text-sm font-medium">Filamentos</span>
          </Link>
          
          <Link
            href="/dashboard/impressoras"
            className="bg-vultrix-dark border border-vultrix-gray hover:border-vultrix-accent/50 rounded-xl p-4 flex flex-col items-center gap-2 transition-all hover:scale-105 group"
          >
            <div className="bg-orange-500/10 p-3 rounded-lg group-hover:bg-orange-500/20 transition-colors">
              <Printer className="text-orange-400" size={22} />
            </div>
            <span className="text-white text-sm font-medium">Impressoras</span>
          </Link>
          
          <Link
            href="/dashboard/aportes"
            className="bg-vultrix-dark border border-vultrix-gray hover:border-vultrix-accent/50 rounded-xl p-4 flex flex-col items-center gap-2 transition-all hover:scale-105 group"
          >
            <div className="bg-pink-500/10 p-3 rounded-lg group-hover:bg-pink-500/20 transition-colors">
              <Wallet className="text-pink-400" size={22} />
            </div>
            <span className="text-white text-sm font-medium">Aportes</span>
          </Link>
        </div>
      </motion.div>

      {/* Resumo do Negócio */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <div className="bg-vultrix-dark border border-vultrix-gray rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <Package className="text-green-400" size={20} />
            <span className="text-xs text-vultrix-light/50">Produtos</span>
          </div>
          <p className="text-2xl font-bold text-white">{metrics.totalProdutos}</p>
          <Link href="/dashboard/produtos" className="text-xs text-vultrix-accent hover:underline flex items-center gap-1 mt-1">
            Ver todos <ArrowRight size={12} />
          </Link>
        </div>
        
        <div className="bg-vultrix-dark border border-vultrix-gray rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <Layers className="text-cyan-400" size={20} />
            <span className="text-xs text-vultrix-light/50">Filamentos</span>
          </div>
          <p className="text-2xl font-bold text-white">{metrics.totalFilamentos}</p>
          {metrics.filamentosEstoqueBaixo > 0 && (
            <p className="text-xs text-yellow-400 flex items-center gap-1 mt-1">
              <AlertCircle size={12} />
              {metrics.filamentosEstoqueBaixo} com estoque baixo
            </p>
          )}
        </div>
        
        <div className="bg-vultrix-dark border border-vultrix-gray rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <Printer className="text-orange-400" size={20} />
            <span className="text-xs text-vultrix-light/50">Impressoras</span>
          </div>
          <p className="text-2xl font-bold text-white">{metrics.totalImpressoras}</p>
          <Link href="/dashboard/impressoras" className="text-xs text-vultrix-accent hover:underline flex items-center gap-1 mt-1">
            Gerenciar <ArrowRight size={12} />
          </Link>
        </div>
        
        <div className="bg-vultrix-dark border border-vultrix-gray rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <ShoppingCart className="text-purple-400" size={20} />
            <span className="text-xs text-vultrix-light/50">Vendas (mês)</span>
          </div>
          <p className="text-2xl font-bold text-white">{metrics.totalVendas}</p>
          <Link href="/dashboard/vendas" className="text-xs text-vultrix-accent hover:underline flex items-center gap-1 mt-1">
            Registrar <Plus size={12} />
          </Link>
        </div>
      </motion.div>

      {/* Onboarding Banner */}
      {shouldShowBanner && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-amber-500/20 to-orange-500/5 border border-amber-500/30 rounded-xl p-6 relative overflow-hidden"
        >
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl"></div>

          <button
            onClick={handleDismissBanner}
            className="absolute top-4 right-4 text-vultrix-light/60 hover:text-white transition-colors z-10"
            title="Dispensar"
          >
            <X size={20} />
          </button>

          <div className="flex items-start gap-6 relative z-10">
            <div className="bg-gradient-to-br from-amber-500/30 to-orange-500/20 p-4 rounded-xl border border-amber-500/30">
              <AlertTriangle className="text-amber-500" size={28} />
            </div>

            <div className="flex-1">
              <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                Complete seu cadastro
                <span className="text-sm font-normal text-amber-500 bg-amber-500/20 px-2 py-0.5 rounded">
                  {onboardingStatus.hasProfile && onboardingStatus.hasPrinter
                    ? "2/2"
                    : onboardingStatus.hasProfile || onboardingStatus.hasPrinter
                      ? "1/2"
                      : "0/2"}
                </span>
              </h3>

              <p className="text-vultrix-light/80 mb-4">
                Configure seu perfil e cadastre suas impressoras para
                desbloquear todo o potencial do sistema.
              </p>

              {/* Progress Checklist */}
              <div className="space-y-2 mb-5">
                <div className="flex items-center gap-3">
                  {onboardingStatus.hasProfile ? (
                    <CheckCircle2 className="text-green-500" size={20} />
                  ) : (
                    <Circle className="text-vultrix-light/30" size={20} />
                  )}
                  <span
                    className={`text-sm ${onboardingStatus.hasProfile ? "text-green-500 font-medium" : "text-vultrix-light/70"}`}
                  >
                    Perfil configurado
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {onboardingStatus.hasPrinter ? (
                    <CheckCircle2 className="text-green-500" size={20} />
                  ) : (
                    <Circle className="text-vultrix-light/30" size={20} />
                  )}
                  <span
                    className={`text-sm ${onboardingStatus.hasPrinter ? "text-green-500 font-medium" : "text-vultrix-light/70"}`}
                  >
                    Impressora cadastrada
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                {!onboardingStatus.hasProfile && (
                  <Link
                    href="/dashboard/perfil"
                    className="bg-gradient-to-r from-vultrix-accent to-purple-600 hover:from-vultrix-accent/80 hover:to-purple-600/80 text-white font-bold py-2.5 px-6 rounded-lg transition-all inline-flex items-center gap-2 shadow-lg shadow-vultrix-accent/20"
                  >
                    <User size={18} />
                    Configurar Perfil
                  </Link>
                )}

                {!onboardingStatus.hasPrinter && (
                  <Link
                    href="/dashboard/impressoras"
                    className={`${
                      onboardingStatus.hasProfile
                        ? "bg-gradient-to-r from-vultrix-accent to-purple-600 hover:from-vultrix-accent/80 hover:to-purple-600/80 shadow-lg shadow-vultrix-accent/20"
                        : "bg-vultrix-gray hover:bg-vultrix-gray/80"
                    } text-white font-bold py-2.5 px-6 rounded-lg transition-all inline-flex items-center gap-2`}
                  >
                    <Printer size={18} />
                    Cadastrar Impressora
                  </Link>
                )}

                {onboardingStatus.hasProfile && onboardingStatus.hasPrinter && (
                  <div className="flex items-center gap-2 text-green-500 font-semibold">
                    <CheckCircle2 size={20} />
                    Tudo pronto! Você pode dispensar este banner.
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
            <BarChart3 className="text-vultrix-accent" size={24} />
            Painel Financeiro
          </h1>
          <p className="text-vultrix-light/70 flex items-center gap-2 text-sm">
            <Calendar size={14} />
            {mesAtual}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/dashboard/despesas"
            className="bg-vultrix-gray hover:bg-vultrix-gray/80 text-white text-sm font-medium py-2 px-4 rounded-lg transition-all flex items-center gap-2"
          >
            <TrendingDown size={16} />
            Despesas
          </Link>
          <Link
            href="/dashboard/aportes"
            className="bg-vultrix-accent hover:bg-vultrix-accent/80 text-white text-sm font-medium py-2 px-4 rounded-lg transition-all flex items-center gap-2"
          >
            <Plus size={16} />
            Novo Aporte
          </Link>
        </div>
      </div>

      {/* Cards de Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Saldo Final */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-500/20 to-blue-600/5 border border-blue-500/30 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <PiggyBank className="text-blue-500" size={24} />
            </div>
            <TrendingUp className="text-blue-500" size={20} />
          </div>
          <h3 className="text-vultrix-light/70 text-sm mb-1">Saldo Final</h3>
          <p className="text-3xl font-bold text-white">
            R$ {metrics.balance.saldo_final.toFixed(2)}
          </p>
          <p className="text-xs text-vultrix-light/50 mt-2">
            Vendas + Aportes - Despesas
          </p>
        </motion.div>

        {/* Receita Líquida */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-green-500/20 to-green-600/5 border border-green-500/30 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
              <DollarSign className="text-green-500" size={24} />
            </div>
            <TrendingUp className="text-green-500" size={20} />
          </div>
          <h3 className="text-vultrix-light/70 text-sm mb-1">
            Receita Líquida
          </h3>
          <p className="text-3xl font-bold text-white">
            R$ {metrics.balance.receita_liquida.toFixed(2)}
          </p>
          <p className="text-xs text-vultrix-light/50 mt-2">
            Vendas - Despesas
          </p>
        </motion.div>

        {/* Total Aportes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-purple-500/20 to-purple-600/5 border border-purple-500/30 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <Wallet className="text-purple-500" size={24} />
            </div>
            <TrendingUp className="text-purple-500" size={20} />
          </div>
          <h3 className="text-vultrix-light/70 text-sm mb-1">Total Aportes</h3>
          <p className="text-3xl font-bold text-white">
            R$ {metrics.balance.total_aportes.toFixed(2)}
          </p>
          <p className="text-xs text-vultrix-light/50 mt-2">
            Capital investido
          </p>
        </motion.div>

        {/* Total Despesas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-red-500/20 to-red-600/5 border border-red-500/30 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center">
              <TrendingDown className="text-red-500" size={24} />
            </div>
            <AlertCircle className="text-red-500" size={20} />
          </div>
          <h3 className="text-vultrix-light/70 text-sm mb-1">Total Despesas</h3>
          <p className="text-3xl font-bold text-white">
            R$ {metrics.balance.total_despesas.toFixed(2)}
          </p>
          <p className="text-xs text-vultrix-light/50 mt-2">
            Custos operacionais
          </p>
        </motion.div>
      </div>

      {/* Gráfico de Vendas Últimos 7 Dias */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-vultrix-dark border border-vultrix-gray rounded-xl p-6"
      >
        <h2 className="text-xl font-bold text-white mb-6">
          📈 Vendas dos Últimos 7 Dias
        </h2>
        <div className="space-y-3">
          {metrics.vendasPorDia.map((dia, index) => (
            <div key={index} className="space-y-1">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-vultrix-light/70">{dia.data}</span>
                <span className="text-white font-semibold">
                  R$ {dia.valor.toFixed(2)}
                </span>
              </div>
              <div className="w-full bg-vultrix-gray rounded-full h-2 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(dia.valor / maxVendaDia) * 100}%` }}
                  transition={{ delay: 0.5 + index * 0.1, duration: 0.5 }}
                  className="bg-gradient-to-r from-vultrix-accent to-blue-500 h-full rounded-full"
                />
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Destaques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Produto Mais Vendido */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-vultrix-dark border border-vultrix-gray rounded-xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
              <Award className="text-yellow-500" size={20} />
            </div>
            <h2 className="text-xl font-bold text-white">
              🏆 Produto Mais Vendido
            </h2>
          </div>
          {metrics.produtoMaisVendido ? (
            <div className="bg-vultrix-black rounded-lg p-4">
              <p className="text-2xl font-bold text-vultrix-accent mb-2">
                {metrics.produtoMaisVendido.nome}
              </p>
              <p className="text-vultrix-light/70">
                {metrics.produtoMaisVendido.quantidade} unidade
                {metrics.produtoMaisVendido.quantidade !== 1 ? "s" : ""} vendida
                {metrics.produtoMaisVendido.quantidade !== 1 ? "s" : ""}
              </p>
            </div>
          ) : (
            <p className="text-vultrix-light/50 text-center py-8">
              Nenhuma venda registrada este mês
            </p>
          )}
        </motion.div>

        {/* Filamento Mais Consumido */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-vultrix-dark border border-vultrix-gray rounded-xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
              <Layers className="text-cyan-500" size={20} />
            </div>
            <h2 className="text-xl font-bold text-white">
              💎 Filamento Mais Usado
            </h2>
          </div>
          {metrics.filamentoMaisConsumido ? (
            <div className="bg-vultrix-black rounded-lg p-4">
              <p className="text-2xl font-bold text-cyan-400 mb-2">
                {metrics.filamentoMaisConsumido.nome}
              </p>
              <p className="text-vultrix-light/70 mb-1">
                {metrics.filamentoMaisConsumido.marca}
              </p>
              <p className="text-sm text-cyan-500">
                {(metrics.filamentoMaisConsumido.consumo / 1000).toFixed(2)} kg
                consumidos
              </p>
            </div>
          ) : (
            <p className="text-vultrix-light/50 text-center py-8">
              Nenhum consumo registrado este mês
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
}
