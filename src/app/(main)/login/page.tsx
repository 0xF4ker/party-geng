"use client";
import LoginJoinComponent from "../../_components/LoginJoinComponent";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12">
      <LoginJoinComponent initialView="login" onClose={() => {}} />
    </div>
  );
}
