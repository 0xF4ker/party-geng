"use client";
import { useUiStore } from "@/stores/ui";
import LoginJoinComponent from "../../_components/LoginJoinComponent";

export default function LoginPage() {
  const { headerHeight } = useUiStore();

  return (
    <div
      className="flex min-h-screen w-full items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8"
      style={{
        // Add 40px of extra breathing room below the fixed header
        paddingTop: `${(headerHeight || 80) + 40}px`,
        paddingBottom: "40px",
      }}
    >
      <div className="w-full max-w-4xl">
        <LoginJoinComponent initialView="login" onClose={() => undefined} />
      </div>
    </div>
  );
}
