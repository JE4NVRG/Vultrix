"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/AuthProvider";

export type Printer = {
  id: string;
  name: string;
  brand: string;
  model: string;
  power_watts_default: number;
  is_default: boolean;
};

export function usePrinters() {
  const { user } = useAuth();
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [defaultPrinter, setDefaultPrinter] = useState<Printer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadPrinters();
    }
  }, [user]);

  const loadPrinters = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("printers")
        .select("*")
        .eq("user_id", user!.id)
        .eq("active", true)
        .order("is_default", { ascending: false });

      if (fetchError) throw fetchError;

      setPrinters(data || []);

      // Set default printer
      const defaultPrt = data?.find((p) => p.is_default) || data?.[0] || null;
      setDefaultPrinter(defaultPrt);
    } catch (err: any) {
      console.error("Erro ao carregar impressoras:", err);
      setError(err.message || "Erro ao carregar impressoras");
      setPrinters([]);
      setDefaultPrinter(null);
    } finally {
      setLoading(false);
    }
  };

  return { printers, defaultPrinter, loading, error, refresh: loadPrinters };
}
