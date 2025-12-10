"use client";
import { api } from "@/trpc/react";
import { useAuthStore } from "@/stores/auth";
import { useEffect, useState, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // FIX: Use selectors to get actions.
  // This prevents the component from re-rendering when the store state changes.
  const setProfile = useAuthStore((state) => state.setProfile);
  const setIsLoading = useAuthStore((state) => state.setIsLoading);

  // Optional: We can read the current ID to prevent redundant updates
  const storedProfileId = useAuthStore((state) => state.profile?.id);

  const [isSessionChecked, setIsSessionChecked] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const utils = api.useUtils();

  // 1. Fetch Profile
  const { data: profile, isLoading: isProfileLoading } =
    api.user.getProfile.useQuery(undefined, {
      enabled: hasSession,
      staleTime: 1000 * 60 * 5,
      retry: 1,
    });

  // 2. THE HEALER
  const healAccountMutation = api.auth.healAccount.useMutation({
    onSuccess: async () => {
      toast.success("Account profile restored.");
      await utils.user.getProfile.invalidate();
    },
    onError: () => {
      const supabase = createClient();
      void supabase.auth.signOut();
      setHasSession(false);
      setProfile(null);
      toast.error("Account error. Please log in again.");
    },
  });

  // 3. Check session on mount
  useEffect(() => {
    const supabase = createClient();

    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setHasSession(!!session);
      setIsSessionChecked(true);

      if (!session) {
        setProfile(null);
      }
    };

    void checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setHasSession(!!session);
      if (!session) {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [setProfile]);

  // 4. Update Store & Detect Orphans (or Incomplete Profiles)
  useEffect(() => {
    // Sync store
    if (profile && profile.id !== storedProfileId) {
      setProfile(profile);
    }

    // Define what "Incomplete" means
    // We check if the user exists, but is missing role-specific data
    const isProfileIncomplete =
      profile &&
      ((profile.role === "VENDOR" && !profile.vendorProfile) ||
        (profile.role === "CLIENT" && !profile.clientProfile));
      // Add !profile.wallet here if your getProfile query includes the wallet

    // Trigger Heal if:
    // 1. Session exists
    // 2. Loading finished
    // 3. Profile is MISSING (!profile) ... OR ... Profile is INCOMPLETE (isProfileIncomplete)
    if (
      hasSession &&
      !isProfileLoading &&
      (!profile || isProfileIncomplete) &&
      !healAccountMutation.isPending
    ) {
      console.warn(
        "User account incomplete or missing. Attempting to repair...",
      );
      healAccountMutation.mutate();
    }
  }, [
    profile,
    storedProfileId,
    setProfile,
    hasSession,
    isProfileLoading,
    healAccountMutation,
  ]);

  // 5. Global Loading State
  useEffect(() => {
    const isLoading = !isSessionChecked || (hasSession && isProfileLoading);
    setIsLoading(isLoading);
  }, [isSessionChecked, hasSession, isProfileLoading, setIsLoading]);

  return <>{children}</>;
}
