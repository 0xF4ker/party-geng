"use client";
import LoginJoinComponent from "../_components/LoginJoinComponent";

export default function JoinPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12">
      <LoginJoinComponent initialView="join" />
    </div>
  );
}
