"use client";
import { api } from "@/trpc/react";
import { useAuthStore } from "@/stores/auth";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const setProfile = useAuthStore((state) => state.setProfile);
  const setIsLoading = useAuthStore((state) => state.setIsLoading);

  // FIX 1: Fetch the full stored profile object, not just the ID, for comparison
  const storedProfile = useAuthStore((state) => state.profile);

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
        // Clear TRPC cache on logout
        void utils.user.getProfile.reset();
      } else {
        // Force refresh on login/session restore to ensure fresh data
        void utils.user.getProfile.invalidate();
      }
    });

    return () => subscription.unsubscribe();
  }, [setProfile, utils]);

  // 4. Update Store & Detect Orphans
  useEffect(() => {
    // Sync store
    if (hasSession && profile) {
      // FIX 2: Compare stringified objects.
      // This ensures that if ANY field changes (bio, subscriptionStatus, etc.),
      // the store updates, triggering re-renders in components listening to those fields.
      const isProfileChanged =
        JSON.stringify(profile) !== JSON.stringify(storedProfile);

      if (isProfileChanged) {
        setProfile(profile);
      }
    }

    // Define Incomplete Profile
    const isProfileIncomplete =
      profile &&
      ((profile.role === "VENDOR" && !profile.vendorProfile) ||
        (profile.role === "CLIENT" && !profile.clientProfile));

    // Trigger Heal
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
    storedProfile, // Dependency updated from storedProfileId to storedProfile
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
