"use client";
import { api } from "@/trpc/react";
import { useAuthStore } from "@/stores/auth";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setProfile, setIsLoading } = useAuthStore();
  const [isSessionChecked, setIsSessionChecked] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const utils = api.useUtils();

  // 1. Fetch Profile (Only if session exists)
  const { data: profile, isLoading: isProfileLoading } =
    api.user.getProfile.useQuery(undefined, {
      enabled: hasSession,
      staleTime: 1000 * 60 * 5, // Cache for 5 minutes
      retry: 1, // Don't retry endlessly if 404
    });

  // 2. THE HEALER: Mutation to fix orphaned accounts
  // You need to create this tRPC procedure (see note below)
  const healAccountMutation = api.auth.healAccount.useMutation({
    onSuccess: async () => {
      toast.success("Account profile restored.");
      await utils.user.getProfile.invalidate();
    },
    onError: () => {
      // If healing fails, force logout so they don't get stuck in a broken state
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

  // 4. Update Store & Detect Orphans
  useEffect(() => {
    // Standard Case: Profile loaded successfully
    if (profile) {
      setProfile(profile);
    }

    // EDGE CASE: Orphan Detection
    // We have a session, profile finished loading, but profile is null/undefined
    if (
      hasSession &&
      !isProfileLoading &&
      !profile &&
      !healAccountMutation.isPending
    ) {
      console.warn(
        "Orphaned user detected (Auth exists, DB missing). Attempting to heal...",
      );
      healAccountMutation.mutate();
    }
  }, [profile, setProfile, hasSession, isProfileLoading, healAccountMutation]);

  // 5. Global Loading State
  useEffect(() => {
    // We are loading if:
    // 1. We haven't checked Supabase yet OR
    // 2. We have a session, but are waiting for the profile
    const isLoading = !isSessionChecked || (hasSession && isProfileLoading);
    setIsLoading(isLoading);
  }, [isSessionChecked, hasSession, isProfileLoading, setIsLoading]);

  return <>{children}</>;
}
