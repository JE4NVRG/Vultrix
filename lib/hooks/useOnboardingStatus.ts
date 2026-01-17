"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { supabase } from "@/lib/supabase/client";

type OnboardingStatus = {
  hasProfile: boolean;
  hasPrinter: boolean;
  profileCompleted: boolean;
  isDismissed: boolean;
  isComplete: boolean;
  displayName: string | null;
  avatarUrl: string | null;
};

export function useOnboardingStatus() {
  const { user } = useAuth();
  const [status, setStatus] = useState<OnboardingStatus>({
    hasProfile: false,
    hasPrinter: false,
    profileCompleted: false,
    isDismissed: false,
    isComplete: false,
    displayName: null,
    avatarUrl: null,
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
        .select("display_name, logo_url, profile_completed")
        .eq("user_id", user!.id)
        .maybeSingle();

      // Check printer
      const { data: printers } = await supabase
        .from("printers")
        .select("id")
        .eq("user_id", user!.id)
        .limit(1);

      // Check if onboarding was dismissed
      const { data: settings } = await supabase
        .from("user_settings")
        .select("onboarding_dismissed")
        .eq("user_id", user!.id)
        .maybeSingle();

      const hasProfile = !!profile && !!profile.display_name;
      const hasPrinter = (printers?.length || 0) > 0;
      const isComplete = hasProfile && hasPrinter;
      const isDismissed = settings?.onboarding_dismissed || false;

      setStatus({
        hasProfile,
        hasPrinter,
        profileCompleted: profile?.profile_completed || false,
        isDismissed,
        isComplete,
        displayName: profile?.display_name || null,
        avatarUrl: profile?.logo_url || null,
      });
    } catch (error) {
      console.error("Erro ao verificar onboarding:", error);
    } finally {
      setLoading(false);
    }
  };

  const dismiss = async () => {
    if (!user) return;

    try {
      // Upsert settings with dismissed flag
      const { error } = await supabase
        .from("user_settings")
        .upsert(
          {
            user_id: user.id,
            onboarding_dismissed: true,
          },
          {
            onConflict: "user_id",
          }
        );

      if (error) throw error;

      // Update local state
      setStatus((prev) => ({ ...prev, isDismissed: true }));
    } catch (error) {
      console.error("Erro ao dispensar onboarding:", error);
    }
  };

  return { status, loading, refresh: checkStatus, dismiss };
}
