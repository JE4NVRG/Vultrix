"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/AuthProvider";

type UserCostSettings = {
  kwhCost: number;
  defaultMachineHourCost: number | null;
  profileName: string;
  loading: boolean;
  error: string | null;
};

export function useUserCostSettings(): UserCostSettings {
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserCostSettings>({
    kwhCost: 0.95, // Fallback final
    defaultMachineHourCost: null,
    profileName: "",
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!user) {
      setSettings({
        kwhCost: 0.95,
        defaultMachineHourCost: null,
        profileName: "",
        loading: false,
        error: null,
      });
      return;
    }

    loadSettings();
  }, [user]);

  const loadSettings = async () => {
    try {
      setSettings((prev) => ({ ...prev, loading: true, error: null }));

      // 1. Tentar pegar de user_profile.default_kwh_cost
      const { data: profile } = await supabase
        .from("user_profile")
        .select("name, default_kwh_cost, default_machine_hour_cost")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (profile?.default_kwh_cost && profile.default_kwh_cost > 0) {
        setSettings({
          kwhCost: profile.default_kwh_cost,
          defaultMachineHourCost: profile.default_machine_hour_cost || null,
          profileName: profile.name || "",
          loading: false,
          error: null,
        });
        return;
      }

      // 2. Fallback: user_settings.custo_kwh
      const { data: userSettings } = await supabase
        .from("user_settings")
        .select("custo_kwh")
        .eq("user_id", user!.id)
        .maybeSingle();

      const kwhCost =
        userSettings?.custo_kwh && userSettings.custo_kwh > 0
          ? userSettings.custo_kwh
          : 0.95; // Fallback final

      setSettings({
        kwhCost,
        defaultMachineHourCost: profile?.default_machine_hour_cost || null,
        profileName: profile?.name || "",
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error("Erro ao carregar configurações de custo:", error);
      setSettings({
        kwhCost: 0.95,
        defaultMachineHourCost: null,
        profileName: "",
        loading: false,
        error: "Erro ao carregar configurações",
      });
    }
  };

  return settings;
}

export function calcEnergyCostPerHour(watts: number, kwhCost: number): number {
  if (!watts || watts <= 0 || !kwhCost || kwhCost <= 0) {
    return 0;
  }

  const kwhPerHour = watts / 1000;
  return kwhPerHour * kwhCost;
}
