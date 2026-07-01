"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUiStore } from "@/stores/ui";
import { useAuth } from "@/hooks/useAuth";
import LoginJoinComponent from "../../_components/LoginJoinComponent";
export default function JoinPage() {
  const { headerHeight } = useUiStore();
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      const isAdmin = ["ADMIN", "SUPPORT", "FINANCE"].includes(user.role ?? "");
      router.replace(isAdmin ? "/admin" : "/trending");
    }
  }, [user, loading, router]);

  if (loading || user) return null;

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8"
      style={{ paddingTop: headerHeight }}
    >
      <LoginJoinComponent initialView="join" onClose={() => undefined} />
    </div>
  );
}
