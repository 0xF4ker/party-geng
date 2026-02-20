"use client";

import React, { useState } from "react";
import { X, Check, ArrowLeft, Mail, Loader2, MailCheck } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { api } from "@/trpc/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth";
import { cn } from "@/lib/utils";
import { type AuthError } from "@supabase/supabase-js";

// --- ICONS ---
const GoogleIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 48 48">
    <path
      fill="#FFC107"
      d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
    />
    <path
      fill="#FF3D00"
      d="m6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"
    />
    <path
      fill="#4CAF50"
      d="m24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
    />
    <path
      fill="#1976D2"
      d="m43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l.003-.002s-2.1.3h-.002l6.19 5.238C39.601 36.31 44 30.648 44 24c0-1.341-.138-2.65-.389-3.917z"
    />
  </svg>
);

// --- STRICT PROPS INTERFACES ---
interface FlowProps {
  onClose?: () => void;
  onSwitchView: () => void;
}

// --- COMPONENT: LOGIN FLOW ---
const LoginFlow = ({ onClose, onSwitchView }: FlowProps) => {
  const router = useRouter();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [step, setStep] = useState<"options" | "email">("options");
  const utils = api.useUtils();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast.success("Welcome back!");
      const profile = await utils.user.getProfile.fetch();
      useAuthStore.getState().setProfile(profile);

      if (onClose) onClose();

      if (profile?.status === "BANNED" || profile?.status === "SUSPENDED")
        return;
      if (profile?.role === "VENDOR") router.push("/vendor/dashboard");
      else if (profile?.role === "CLIENT") router.push("/dashboard");
      else if (["ADMIN", "SUPPORT", "FINANCE"].includes(profile?.role ?? ""))
        router.push("/admin");
      else router.push("/");
    } catch (error: unknown) {
      if (error instanceof Error || (error as AuthError).message) {
        toast.error((error as AuthError).message || "Failed to sign in.");
      } else {
        toast.error("An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (step === "options") {
    return (
      <div className="animate-in fade-in slide-in-from-left-4 flex flex-col gap-4">
        <button className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 px-4 py-3 font-semibold text-gray-700 transition-colors hover:bg-gray-50">
          <GoogleIcon /> Continue with Google
        </button>
        <button
          onClick={() => setStep("email")}
          className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 px-4 py-3 font-semibold text-gray-700 transition-colors hover:bg-gray-50"
        >
          <Mail className="h-5 w-5 text-gray-600" /> Continue with Email
        </button>
        <p className="mt-4 text-center text-gray-500">
          Don&apos;t have an account?{" "}
          <button
            onClick={onSwitchView}
            className="font-semibold text-pink-600 hover:underline"
          >
            Join here
          </button>
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleLogin}
      className="animate-in fade-in slide-in-from-right-4 flex flex-col gap-4"
    >
      <button
        type="button"
        onClick={() => setStep("options")}
        className="flex w-fit items-center gap-1 text-sm font-semibold text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" /> Back to options
      </button>
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Email or Username
        </label>
        <input
          type="text"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter email or username"
          className="mt-1 w-full rounded-md border border-gray-300 p-3 outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Password
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          className="mt-1 w-full rounded-md border border-gray-300 p-3 outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
          required
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="flex w-full justify-center rounded-lg bg-pink-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-pink-700 disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Sign In"}
      </button>
    </form>
  );
};

// --- COMPONENT: SIGNUP FLOW ---
const SignupFlow = ({ onClose, onSwitchView }: FlowProps) => {
  const [step, setStep] = useState<"role" | "email" | "username" | "success">(
    "role",
  );
  const [role, setRole] = useState<"CLIENT" | "VENDOR">("CLIENT");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username, role },
          emailRedirectTo: `${window.location.origin}/auth/confirm?next=/onboarding`,
        },
      });

      if (error) throw error;

      if (data.user && !data.session) {
        setStep("success");
      } else {
        window.location.href = "/onboarding";
      }
    } catch (error: unknown) {
      if (error instanceof Error || (error as AuthError).message) {
        toast.error(
          (error as AuthError).message || "Failed to create account.",
        );
      } else {
        toast.error("An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (step === "success") {
    return (
      <div className="animate-in fade-in zoom-in-95 flex flex-col items-center justify-center space-y-4 py-8 text-center">
        <div className="rounded-full bg-pink-100 p-4">
          <MailCheck className="h-10 w-10 text-pink-600" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900">Check your email</h3>
        <p className="text-gray-600">
          We&apos;ve sent a verification link to{" "}
          <span className="font-semibold text-gray-900">{email}</span>. Please
          click the link to activate your account.
        </p>
        <button
          onClick={onClose}
          className="mt-4 font-semibold text-pink-600 hover:underline"
        >
          Close Window
        </button>
      </div>
    );
  }

  if (step === "role") {
    return (
      <div className="animate-in fade-in slide-in-from-left-4">
        <label className="mb-2 block text-sm font-semibold text-gray-700">
          I am joining as a:
        </label>
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setRole("CLIENT")}
            className={cn(
              "flex-1 rounded-lg border p-4 text-left transition-all",
              role === "CLIENT"
                ? "border-pink-600 bg-pink-50 ring-2 ring-pink-200"
                : "border-gray-300 hover:border-gray-400",
            )}
          >
            <p className="font-bold text-gray-800">Client</p>
            <p className="text-sm text-gray-600">
              I&apos;m here to hire vendors and plan events.
            </p>
          </button>
          <button
            onClick={() => setRole("VENDOR")}
            className={cn(
              "flex-1 rounded-lg border p-4 text-left transition-all",
              role === "VENDOR"
                ? "border-pink-600 bg-pink-50 ring-2 ring-pink-200"
                : "border-gray-300 hover:border-gray-400",
            )}
          >
            <p className="font-bold text-gray-800">Vendor</p>
            <p className="text-sm text-gray-600">
              I&apos;m an event professional offering services.
            </p>
          </button>
        </div>
        <button
          onClick={() => setStep("email")}
          className="w-full rounded-lg bg-gray-900 px-4 py-3 font-semibold text-white transition-colors hover:bg-black"
        >
          Continue with Email
        </button>
        <p className="mt-4 text-center text-gray-500">
          Already have an account?{" "}
          <button
            onClick={onSwitchView}
            className="font-semibold text-pink-600 hover:underline"
          >
            Sign in
          </button>
        </p>
      </div>
    );
  }

  if (step === "email") {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setStep("username");
        }}
        className="animate-in fade-in slide-in-from-right-4 flex flex-col gap-4"
      >
        <button
          type="button"
          onClick={() => setStep("role")}
          className="flex w-fit items-center gap-1 text-sm font-semibold text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" /> Back to roles
        </button>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            className="mt-1 w-full rounded-md border border-gray-300 p-3 outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Create Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            minLength={6}
            className="mt-1 w-full rounded-md border border-gray-300 p-3 outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full rounded-lg bg-pink-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-pink-700"
        >
          Continue
        </button>
      </form>
    );
  }

  return (
    <form
      onSubmit={handleSignup}
      className="animate-in fade-in slide-in-from-right-4 flex flex-col gap-4"
    >
      <button
        type="button"
        onClick={() => setStep("email")}
        className="flex w-fit items-center gap-1 text-sm font-semibold text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" /> Back to email
      </button>
      <div>
        <h3 className="text-2xl font-bold text-gray-900">
          Choose your username
        </h3>
        <p className="mt-1 mb-4 text-sm text-gray-600">
          This is how you&apos;ll appear to others on PartyGeng.
        </p>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="e.g. djspinmaster"
          className="mt-1 w-full rounded-md border border-gray-300 p-3 outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
          required
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="flex w-full justify-center rounded-lg bg-pink-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-pink-700 disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          "Create Account"
        )}
      </button>
    </form>
  );
};

// --- ORCHESTRATOR COMPONENT ---
export default function AuthModal({
  isModal = false,
  initialView = "login",
  onClose,
}: {
  isModal?: boolean;
  initialView?: "login" | "join";
  onClose?: () => void;
}) {
  const [view, setView] = useState<"login" | "join">(initialView);

  return (
    <div
      className={cn(
        "flex items-center justify-center",
        isModal
          ? "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          : "min-h-screen bg-gray-50",
      )}
    >
      <div
        className={cn(
          "relative flex overflow-hidden bg-white shadow-2xl",
          isModal
            ? "m-4 h-full w-full sm:h-auto sm:max-h-[90vh] sm:max-w-4xl sm:rounded-2xl"
            : "w-full sm:my-12 sm:max-w-4xl sm:rounded-2xl",
        )}
      >
        {/* Left Side (Branding) */}
        <div
          className="relative hidden w-1/2 flex-col justify-center bg-cover bg-center p-12 lg:flex"
          style={{
            backgroundImage:
              "url(https://placehold.co/600x800/ec4899/ffffff/png?text=Partygeng)",
          }}
        >
          <div className="absolute inset-0 bg-pink-900/80 mix-blend-multiply"></div>
          <div className="relative z-10 text-white">
            <h2 className="mb-6 text-4xl leading-tight font-bold">
              Success starts here.
            </h2>
            <ul className="space-y-4 text-lg">
              <li className="flex items-center gap-3">
                <Check className="h-6 w-6 shrink-0 text-pink-300" /> Find
                verified vendors
              </li>
              <li className="flex items-center gap-3">
                <Check className="h-6 w-6 shrink-0 text-pink-300" /> Get quotes
                and pay securely
              </li>
              <li className="flex items-center gap-3">
                <Check className="h-6 w-6 shrink-0 text-pink-300" /> Plan your
                perfect event
              </li>
            </ul>
          </div>
        </div>

        {/* Right Side (Form Shell) */}
        <div className="relative w-full overflow-y-auto bg-white p-8 md:w-1/2 md:p-12">
          {isModal && onClose && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          )}

          <div className="mb-8">
            <h3 className="text-3xl font-bold text-gray-900">
              {view === "join" ? "Create an account" : "Welcome back"}
            </h3>
          </div>

          {/* Render Active Flow */}
          {view === "login" ? (
            <LoginFlow onClose={onClose} onSwitchView={() => setView("join")} />
          ) : (
            <SignupFlow
              onClose={onClose}
              onSwitchView={() => setView("login")}
            />
          )}

          {/* Footer Terms */}
          <p className="mt-8 text-center text-xs leading-relaxed text-gray-400">
            By continuing, you agree to PartyGeng&apos;s{" "}
            <Link href="/terms" className="underline hover:text-pink-600">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline hover:text-pink-600">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
