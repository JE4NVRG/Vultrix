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

// Popular models for fallback suggestions
const POPULAR_MODEL_IDS = [
  "Bambu Lab A1 Mini",
  "Bambu Lab A1",
  "Bambu Lab P1S",
  "Bambu Lab X1 Carbon",
  "Creality Ender 3",
  "Prusa MK4",
  "Anycubic Kobra",
];

export function usePrinterModels() {
  const [models, setModels] = useState<PrinterModel[]>([]);
  const [popularModels, setPopularModels] = useState<PrinterModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("printer_models")
        .select("*")
        .eq("active", true)
        .order("brand", { ascending: true })
        .order("model", { ascending: true });

      if (fetchError) throw fetchError;

      setModels(data || []);

      // Set popular models
      if (data) {
        const popular = data.filter((m) =>
          POPULAR_MODEL_IDS.some((pop) =>
            `${m.brand} ${m.model}`.includes(
              pop.split(" ").slice(0, 2).join(" "),
            ),
          ),
        );
        setPopularModels(popular.slice(0, 8));
      }
    } catch (err: any) {
      console.error("Erro ao carregar modelos:", err);
      setError(err.message || "Erro ao carregar modelos");
      setModels([]);
    } finally {
      setLoading(false);
    }
  };

  const searchModels = async (query: string): Promise<PrinterModel[]> => {
    // Empty query: return popular models
    if (!query || query.length === 0) {
      return popularModels;
    }

    // Query too short: return empty
    if (query.length < 2) {
      return [];
    }

    try {
      setSearching(true);

      // Search in Supabase with ilike
      const { data, error: searchError } = await supabase
        .from("printer_models")
        .select("*")
        .eq("active", true)
        .or(`brand.ilike.*${query}*,model.ilike.*${query}*`)
        .order("brand", { ascending: true })
        .order("model", { ascending: true })
        .limit(20);

      if (searchError) throw searchError;

      return data || [];
    } catch (err: any) {
      console.error("Erro ao buscar modelos:", err);
      return [];
    } finally {
      setSearching(false);
    }
  };

  return {
    models,
    popularModels,
    loading,
    searching,
    error,
    searchModels,
    refresh: loadModels,
  };
}
