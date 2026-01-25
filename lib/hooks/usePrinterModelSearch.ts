"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export type PrinterModel = {
  id: string;
  brand: string;
  model: string;
  category: "fdm" | "resin" | "other";
  avg_watts: number | null;
  peak_watts: number | null;
  notes: string | null;
};

const POPULAR_MODEL_IDS = [
  "Bambu Lab A1 Mini",
  "Bambu Lab A1",
  "Bambu Lab P1S",
  "Bambu Lab X1 Carbon",
  "Creality Ender 3 V2",
  "Creality Ender 3 S1",
  "Prusa MK4",
  "Anycubic Kobra 2",
];

export function usePrinterModelSearch(query: string) {
  const [results, setResults] = useState<PrinterModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Debounce
    const timeoutId = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  const performSearch = async (searchQuery: string) => {
    try {
      setLoading(true);
      setError(null);

      // Empty query: load popular models
      if (!searchQuery || searchQuery.length === 0) {
        const { data, error: fetchError } = await supabase
          .from("printer_models")
          .select("*")
          .eq("active", true)
          .order("brand", { ascending: true })
          .order("model", { ascending: true })
          .limit(8);

        if (fetchError) throw fetchError;

        // Filter for popular models
        const popular = (data || []).filter((m) =>
          POPULAR_MODEL_IDS.some((pop) =>
            `${m.brand} ${m.model}`
              .toLowerCase()
              .includes(pop.toLowerCase().split(" ").slice(0, 2).join(" ")),
          ),
        );

        setResults(popular.length > 0 ? popular : (data || []).slice(0, 8));
        return;
      }

      // Query too short
      if (searchQuery.length < 2) {
        setResults([]);
        return;
      }

      // Perform search
      const { data, error: searchError } = await supabase
        .from("printer_models")
        .select("*")
        .eq("active", true)
        .or(`brand.ilike.*${searchQuery}*,model.ilike.*${searchQuery}*`)
        .order("brand", { ascending: true })
        .order("model", { ascending: true })
        .limit(20);

      if (searchError) throw searchError;

      setResults(data || []);
    } catch (err: any) {
      console.error("Erro ao buscar modelos:", err);
      setError(err.message || "Erro ao buscar modelos");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return { results, loading, error };
}
