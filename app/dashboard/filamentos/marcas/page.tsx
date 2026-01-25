"use client";

import Link from "next/link";
import { AlertTriangle, ArrowLeft, GitMerge, RefreshCcw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { supabase } from "@/lib/supabase/client";
import { Database } from "@/types/database";

type BrandRow = Database["public"]["Tables"]["filament_brands"]["Row"];

type BrandUsage = Record<string, number>;

const formatHelper = (value: string) => value.trim().replace(/\s+/g, " ");

export default function FilamentBrandManager() {
  const { user, loading: authLoading } = useAuth();
  const [brands, setBrands] = useState<BrandRow[]>([]);
  const [usage, setUsage] = useState<BrandUsage>({});
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingOrigin, setSavingOrigin] = useState<string | null>(null);
  const [mergeTargets, setMergeTargets] = useState<Record<string, string>>({});

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [
        { data: brandData, error: brandError },
        { data: filamentData, error: filamentError },
      ] = await Promise.all([
        supabase
          .from("filament_brands")
          .select("*")
          .eq("user_id", user.id)
          .order("name", { ascending: true }),
        supabase
          .from("filaments")
          .select("id, brand_id")
          .eq("user_id", user.id),
      ]);

      if (brandError) throw brandError;
      if (filamentError) throw filamentError;

      const safeBrands = brandData ?? [];
      const totals: BrandUsage = {};
      (filamentData ?? []).forEach((filament) => {
        if (filament.brand_id) {
          totals[filament.brand_id] = (totals[filament.brand_id] || 0) + 1;
        }
      });

      setBrands(safeBrands);
      setUsage(totals);
      setMergeTargets({});
    } catch (error) {
      console.error("Erro ao carregar marcas", error);
      alert("Não foi possível carregar as marcas. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, loadData]);

  const filteredBrands = useMemo(() => {
    const term = formatHelper(search.toLowerCase());
    if (!term) return brands;
    return brands.filter((brand) => brand.name.toLowerCase().includes(term));
  }, [brands, search]);

  const handleMerge = async (originId: string) => {
    const targetId = mergeTargets[originId];
    if (!user || !targetId || targetId === originId) return;

    const originBrand = brands.find((brand) => brand.id === originId);
    const targetBrand = brands.find((brand) => brand.id === targetId);
    if (!targetBrand) return;

    const count = usage[originId] ?? 0;
    const confirmed = window.confirm(
      `Mover ${count} ${count === 1 ? "filamento" : "filamentos"} de ${originBrand?.name ?? "esta marca"} para ${targetBrand.name}?`,
    );

    if (!confirmed) return;

    setSavingOrigin(originId);
    try {
      const { error: updateError } = await supabase
        .from("filaments")
        .update({
          brand_id: targetId,
          marca: targetBrand.name,
        })
        .eq("brand_id", originId)
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      const { error: deleteError } = await supabase
        .from("filament_brands")
        .delete()
        .eq("id", originId)
        .eq("user_id", user.id);

      if (deleteError) throw deleteError;

      await loadData();
    } catch (error) {
      console.error("Erro ao mesclar marcas", error);
      alert(
        "Não foi possível concluir a mescla. Verifique os dados e tente novamente.",
      );
    } finally {
      setSavingOrigin(null);
    }
  };

  if (authLoading || (loading && brands.length === 0)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-vultrix-accent" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-vultrix-light/80">
          Faça login para gerenciar suas marcas.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-vultrix-light/70">
            Filamentos
          </p>
          <h1 className="text-3xl font-bold text-white">
            Unificar marcas semelhantes
          </h1>
          <p className="text-vultrix-light/70">
            Centralize variações de nome e deixe o catálogo pronto para o fluxo
            inteligente de compra.
          </p>
        </div>
        <Link
          href="/dashboard/filamentos"
          className="inline-flex items-center gap-2 px-4 py-2 border border-vultrix-gray rounded-lg text-white hover:bg-vultrix-gray/30"
        >
          <ArrowLeft size={18} /> Voltar para Filamentos
        </Link>
      </div>

      <div className="border border-vultrix-gray/70 rounded-xl p-4 bg-vultrix-dark/80">
        <div className="flex items-start gap-3">
          <AlertTriangle className="text-yellow-400 mt-1" size={20} />
          <div>
            <p className="text-white font-semibold">
              Organização agora, IA depois
            </p>
            <p className="text-sm text-vultrix-light/70">
              Estamos preparando uma automação com IA para detectar duplicidades
              em massa. Enquanto isso, use esta tela para consolidar manualmente
              e manter os relatórios coerentes.
            </p>
          </div>
        </div>
      </div>

      <div className="border border-vultrix-gray rounded-2xl bg-vultrix-black">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-4 border-b border-vultrix-gray/40">
          <div>
            <p className="text-white font-semibold">Todas as marcas</p>
            <p className="text-sm text-vultrix-light/60">
              {brands.length} cadastradas · {filteredBrands.length} visíveis
            </p>
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar marca..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="pl-4 pr-10 py-2 rounded-lg bg-vultrix-dark border border-vultrix-gray/60 text-white placeholder:text-vultrix-light/50 focus:outline-none focus:ring-1 focus:ring-vultrix-accent"
              />
              <GitMerge
                size={16}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-vultrix-light/50"
              />
            </div>
            <button
              onClick={loadData}
              className="inline-flex items-center gap-2 px-4 py-2 border border-vultrix-gray rounded-lg text-white hover:bg-vultrix-gray/30"
            >
              <RefreshCcw size={16} /> Atualizar
            </button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {brands.length <= 1 && !loading ? (
            <div className="text-center py-12 border border-dashed border-vultrix-gray/40 rounded-xl">
              <p className="text-white font-semibold">
                Cadastre pelo menos duas marcas
              </p>
              <p className="text-sm text-vultrix-light/70">
                Assim que houver duplicidades, você poderá unificá-las aqui.
              </p>
            </div>
          ) : loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(4)].map((_, index) => (
                <div
                  key={index}
                  className="border border-vultrix-gray/40 rounded-xl p-4 animate-pulse bg-vultrix-dark/60 h-32"
                />
              ))}
            </div>
          ) : filteredBrands.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-vultrix-gray/40 rounded-xl">
              <p className="text-white font-semibold">Nada encontrado</p>
              <p className="text-sm text-vultrix-light/70">
                Ajuste o termo de busca ou limpe o filtro.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredBrands.map((brand) => {
                const selectableTargets = brands.filter(
                  (option) => option.id !== brand.id,
                );
                const currentTarget = mergeTargets[brand.id] ?? "";
                const totalFilaments = usage[brand.id] ?? 0;

                return (
                  <div
                    key={brand.id}
                    className="border border-vultrix-gray/60 rounded-xl p-4 bg-vultrix-dark/60 space-y-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-white font-semibold">{brand.name}</p>
                        <p className="text-xs text-vultrix-light/60 uppercase tracking-wide">
                          {brand.normalized_name ?? "sem slug"}
                        </p>
                      </div>
                      <span className="text-sm px-3 py-1 rounded-full bg-vultrix-gray/30 text-vultrix-light/80">
                        {totalFilaments}{" "}
                        {totalFilaments === 1 ? "filamento" : "filamentos"}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-vultrix-light/60 uppercase">
                          Destino
                        </label>
                        <select
                          value={currentTarget}
                          onChange={(event) =>
                            setMergeTargets((prev) => ({
                              ...prev,
                              [brand.id]: event.target.value,
                            }))
                          }
                          className="w-full mt-1 bg-vultrix-black border border-vultrix-gray/60 rounded-lg px-3 py-2 text-white"
                          disabled={selectableTargets.length === 0}
                        >
                          <option value="">Selecione outra marca</option>
                          {selectableTargets.map((target) => (
                            <option key={target.id} value={target.id}>
                              {target.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-vultrix-light/60 uppercase">
                          Preview
                        </label>
                        <div className="mt-1 px-3 py-2 rounded-lg border border-dashed border-vultrix-gray/50 text-sm text-vultrix-light/80 min-h-[42px] flex items-center">
                          {currentTarget
                            ? `→ ${brands.find((brandOption) => brandOption.id === currentTarget)?.name}`
                            : "Selecione um destino"}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleMerge(brand.id)}
                      disabled={!currentTarget || savingOrigin === brand.id}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-vultrix-accent/90 text-white disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <GitMerge size={16} />
                      {savingOrigin === brand.id
                        ? "Mesclando..."
                        : "Mesclar marca"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
