"use client";

import { createClient } from "@/utils/supabase/client";
import { useAuthStore } from "@/stores/auth";
import { redirect, useRouter } from "next/navigation";
import { useEffect } from "react";

export function useAuth() {
  const { profile, setProfile, isLoading } = useAuthStore();
  const router = useRouter();

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setProfile(null);
    router.push("/");
    router.refresh();
  };

  return {
    user: profile,
    loading: isLoading,
    signOut,
    isAuthenticated: !!profile,
  };
}

export function useRequireAuth() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      redirect("/login");
    }
  }, [user, loading, router]);

  return { user, loading };
}
