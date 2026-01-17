"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/AuthProvider";

export type Filament = {
  id: string;
  nome: string;
  marca: string;
  tipo: string;
  cor: string;
  custo_por_kg: number;
  peso_atual: number;
  peso_inicial: number;
  active: boolean;
};

export function useFilaments() {
  const { user } = useAuth();
  const [filaments, setFilaments] = useState<Filament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadFilaments();
    }
  }, [user]);

  const loadFilaments = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("filaments")
        .select("*")
        .eq("user_id", user!.id)
        .eq("active", true)
        .order("nome", { ascending: true });

      if (fetchError) throw fetchError;

      setFilaments(data || []);
    } catch (err: any) {
      console.error("Erro ao carregar filamentos:", err);
      setError(err.message || "Erro ao carregar filamentos");
      setFilaments([]);
    } finally {
      setLoading(false);
    }
  };

  return { filaments, loading, error, refresh: loadFilaments };
}
