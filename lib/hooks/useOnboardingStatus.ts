"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { supabase } from "@/lib/supabase/client";

type OnboardingStatus = {
  hasProfile: boolean;
  hasPrinter: boolean;
  profileCompleted: boolean;
};

export function useOnboardingStatus() {
  const { user } = useAuth();
  const [status, setStatus] = useState<OnboardingStatus>({
    hasProfile: false,
    hasPrinter: false,
    profileCompleted: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      checkStatus();
    }
  }, [user]);

  const checkStatus = async () => {
    try {
      setLoading(true);

      // Check profile
      const { data: profile } = await supabase
        .from("user_profile")
        .select("profile_completed")
        .eq("user_id", user!.id)
        .maybeSingle();

      // Check printer
      const { data: printers } = await supabase
        .from("printers")
        .select("id")
        .eq("user_id", user!.id)
        .limit(1);

      setStatus({
        hasProfile: !!profile,
        hasPrinter: (printers?.length || 0) > 0,
        profileCompleted: profile?.profile_completed || false,
      });
    } catch (error) {
      console.error("Erro ao verificar onboarding:", error);
    } finally {
      setLoading(false);
    }
  };

  return { status, loading, refresh: checkStatus };
}
