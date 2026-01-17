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

export function usePrinterModels() {
  const [models, setModels] = useState<PrinterModel[]>([]);
  const [loading, setLoading] = useState(true);
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
    } catch (err: any) {
      console.error("Erro ao carregar modelos:", err);
      setError(err.message || "Erro ao carregar modelos");
      setModels([]);
    } finally {
      setLoading(false);
    }
  };

  const searchModels = (query: string): PrinterModel[] => {
    if (!query || query.length < 2) return models;

    const lowerQuery = query.toLowerCase();
    return models.filter(
      (m) =>
        m.brand.toLowerCase().includes(lowerQuery) ||
        m.model.toLowerCase().includes(lowerQuery)
    );
  };

  return { models, loading, error, searchModels, refresh: loadModels };
}
