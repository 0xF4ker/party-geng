"use client";
import { useUiStore } from "@/stores/ui";
import LoginJoinComponent from "../../_components/LoginJoinComponent";

export default function LoginPage() {
  const { headerHeight } = useUiStore();
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8"
      style={{ paddingTop: headerHeight }}
    >
      <LoginJoinComponent initialView="login" onClose={() => undefined} />
    </div>
  );
}
