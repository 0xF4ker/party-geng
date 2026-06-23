"use client";
import React, { useState, useEffect } from "react";
import {
  X,
  Check,
  ArrowLeft,
  Mail,
  Loader2,
  MailCheck,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { api } from "@/trpc/react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth";
import { cn } from "@/lib/utils";
import { type AuthError } from "@supabase/supabase-js";

/* ── Google Icon ── */
const GoogleIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 48 48">
    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
    <path fill="#FF3D00" d="m6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z" />
    <path fill="#4CAF50" d="m24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
    <path fill="#1976D2" d="m43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l.003-.002s-2.1.3h-.002l6.19 5.238C39.601 36.31 44 30.648 44 24c0-1.341-.138-2.65-.389-3.917z" />
  </svg>
);

/* ── Shared input style ── */
const inputCls = "mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 transition-all focus:border-pink-500 focus:bg-white focus:ring-2 focus:ring-pink-500/20";
const labelCls = "block text-xs font-semibold uppercase tracking-wide text-gray-500";

/* ── Shared social/option button ── */
const OptionBtn = ({
  onClick,
  children,
}: {
  onClick?: () => void;
  children: React.ReactNode;
}) => (
  <button
    type="button"
    onClick={onClick}
    className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:border-gray-300 hover:bg-gray-50 hover:shadow"
  >
    {children}
  </button>
);

/* ── Primary gradient button ── */
const PrimaryBtn = ({
  loading,
  disabled,
  children,
  id,
}: {
  loading?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  id?: string;
}) => (
  <button
    id={id}
    type="submit"
    disabled={loading ?? disabled}
    className="relative flex w-full items-center justify-center overflow-hidden rounded-xl px-4 py-3 text-sm font-bold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
    style={{
      background: "linear-gradient(135deg, #f72585, #b5179e)",
      boxShadow: "0 4px 20px rgba(247,37,133,0.3)",
    }}
  >
    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : children}
  </button>
);

interface FlowProps {
  onClose?: () => void;
  onSwitchView: () => void;
}

/* ──────────────────── LOGIN FLOW ──────────────────── */
const LoginFlow = ({ onClose, onSwitchView }: FlowProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isVerified, setIsVerified] = useState(false);
  const [step, setStep] = useState<"options" | "email">("options");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const utils = api.useUtils();

  useEffect(() => {
    if (
      searchParams.get("verified") === "true" ||
      window.location.href.includes("verified=true")
    ) {
      setIsVerified(true);
      setStep("email");
      window.history.replaceState(null, "", "/login");
      toast.success("Email verified! Please sign in.");
    }
  }, [searchParams]);

  const handleGoogleLogin = async () => {
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (error: unknown) {
      if (error instanceof Error || (error as AuthError).message) {
        toast.error((error as AuthError).message || "Failed to sign in with Google.");
      } else {
        toast.error("An unexpected error occurred.");
      }
    }
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success("Welcome back!");
      try {
        const profile = await utils.user.getProfile.fetch();
        if (!profile || !profile.isOnboarded) {
          if (onClose) onClose();
          router.push("/onboarding");
          return;
        }
        useAuthStore.getState().setProfile(profile);
        if (onClose) onClose();
        if (profile?.status === "BANNED" || profile?.status === "SUSPENDED") {
          toast.error("This account has been suspended.");
          return;
        }
        if (profile?.role === "VENDOR") router.push(`/v/${profile.username}`);
        else if (profile?.role === "CLIENT") router.push(`/c/${profile.username}`);
        else if (["ADMIN", "SUPPORT", "FINANCE"].includes(profile?.role ?? ""))
          router.push("/admin");
        else router.push("/");
      } catch (profileError: unknown) {
        console.error("Profile fetch error:", profileError);
        toast.error("Could not fetch user profile details.");
      }
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
      <div className="animate-in fade-in slide-in-from-left-4 flex flex-col gap-3">
        {/* Divider */}
        <OptionBtn onClick={handleGoogleLogin}><GoogleIcon /> Continue with Google</OptionBtn>
        <OptionBtn onClick={() => setStep("email")}>
          <Mail className="h-5 w-5 text-gray-500" /> Continue with Email
        </OptionBtn>
        <p className="mt-3 text-center text-sm text-gray-500">
          Don&apos;t have an account?{" "}
          <button onClick={onSwitchView} className="font-semibold text-pink-600 hover:underline">
            Join here
          </button>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleLogin} className="animate-in fade-in slide-in-from-right-4 flex flex-col gap-4">
      {isVerified && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
          Email verified! Please sign in to complete your setup.
        </div>
      )}
      <button
        type="button"
        onClick={() => setStep("options")}
        className="flex w-fit items-center gap-1 text-xs font-semibold text-gray-400 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft className="h-3 w-3" /> Back
      </button>
      <div>
        <label className={labelCls}>Email Address</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@example.com"
          className={inputCls}
          required
        />
      </div>
      <div>
        <label className={labelCls}>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          className={inputCls}
          required
        />
      </div>
      <PrimaryBtn loading={loading} id="login-submit-btn">Sign In</PrimaryBtn>
    </form>
  );
};

/* ──────────────────── SIGNUP FLOW ──────────────────── */
const SignupFlow = ({ onClose, onSwitchView }: FlowProps) => {
  const [step, setStep] = useState<"role" | "email" | "username" | "success">("role");
  const [role, setRole] = useState<"CLIENT" | "VENDOR">("CLIENT");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const utils = api.useUtils();
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [usernameError, setUsernameError] = useState("");

  useEffect(() => {
    if (username.length === 0) { setUsernameStatus("idle"); setUsernameError(""); return; }
    if (username.length < 3) { setUsernameStatus("idle"); setUsernameError("Username must be at least 3 characters"); return; }
    const checkAvailability = async () => {
      setUsernameStatus("checking");
      try {
        const isAvailable = await utils.user.checkUsername.fetch({ username: username.toLowerCase() });
        if (isAvailable) { setUsernameStatus("available"); setUsernameError(""); }
        else { setUsernameStatus("taken"); setUsernameError("This username is already taken"); }
      } catch { setUsernameStatus("idle"); }
    };
    const t = setTimeout(() => { void checkAvailability(); }, 500);
    return () => clearTimeout(t);
  }, [username, utils.user.checkUsername]);

  const handleGoogleSignup = async () => {
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?role=${role}`,
        },
      });
      if (error) throw error;
    } catch (error: unknown) {
      if (error instanceof Error || (error as AuthError).message) {
        toast.error((error as AuthError).message || "Failed to sign up with Google.");
      } else {
        toast.error("An unexpected error occurred.");
      }
    }
  };

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (usernameStatus !== "available") return;
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email, password,
        options: {
          data: { username: username.toLowerCase(), role },
          emailRedirectTo: `${window.location.origin}/login?verified=true`,
        },
      });
      if (error) throw error;
      if (data.user && !data.session) setStep("success");
      else window.location.href = "/onboarding";
    } catch (error: unknown) {
      if (error instanceof Error || (error as AuthError).message) {
        toast.error((error as AuthError).message || "Failed to create account.");
      } else {
        toast.error("An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (step === "success") {
    return (
      <div className="animate-in fade-in zoom-in-95 flex flex-col items-center justify-center gap-4 py-8 text-center">
        <div className="rounded-2xl p-4" style={{ background: "linear-gradient(135deg, rgba(247,37,133,0.1), rgba(181,23,158,0.1))" }}>
          <MailCheck className="h-10 w-10" style={{ color: "#f72585" }} />
        </div>
        <h3 className="text-2xl font-bold text-gray-900">Check your email</h3>
        <p className="max-w-xs text-sm text-gray-500">
          We&apos;ve sent a verification link to <span className="font-semibold text-gray-800">{email}</span>. Click it to activate your account.
        </p>
        <button onClick={onClose} className="mt-2 rounded-full border border-pink-200 px-5 py-2 text-sm font-semibold text-pink-600 hover:bg-pink-50 transition-colors">
          Close Window
        </button>
      </div>
    );
  }

  if (step === "role") {
    return (
      <div className="animate-in fade-in slide-in-from-left-4 flex flex-col gap-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">I&apos;m joining as a</p>
        <div className="grid grid-cols-2 gap-3">
          {(["CLIENT", "VENDOR"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={cn(
                "rounded-xl border-2 p-4 text-left transition-all",
                role === r
                  ? "border-pink-500 bg-pink-50 shadow-sm"
                  : "border-gray-200 bg-white hover:border-gray-300",
              )}
            >
              <p className={cn("font-bold text-sm", role === r ? "text-pink-600" : "text-gray-800")}>
                {r === "CLIENT" ? "🎉 Client" : "🎤 Vendor"}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {r === "CLIENT" ? "Hire vendors & plan events." : "Offer your services & get booked."}
              </p>
              {role === r && (
                <div className="mt-2 flex items-center gap-1 text-xs font-semibold text-pink-600">
                  <CheckCircle className="h-3 w-3" /> Selected
                </div>
              )}
            </button>
          ))}
        </div>
        <div className="mt-2 space-y-3">
          <OptionBtn onClick={handleGoogleSignup}><GoogleIcon /> Continue with Google</OptionBtn>
          <button
            onClick={() => setStep("email")}
            className="w-full rounded-xl bg-gray-900 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-black"
          >
            Continue with Email →
          </button>
        </div>
        <p className="mt-1 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <button onClick={onSwitchView} className="font-semibold text-pink-600 hover:underline">Sign in</button>
        </p>
      </div>
    );
  }

  if (step === "email") {
    return (
      <form
        onSubmit={(e) => { e.preventDefault(); setStep("username"); }}
        className="animate-in fade-in slide-in-from-right-4 flex flex-col gap-4"
      >
        <button type="button" onClick={() => setStep("role")} className="flex w-fit items-center gap-1 text-xs font-semibold text-gray-400 hover:text-gray-700 transition-colors">
          <ArrowLeft className="h-3 w-3" /> Back
        </button>
        <div>
          <label className={labelCls}>Email Address</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" className={inputCls} required />
        </div>
        <div>
          <label className={labelCls}>Create Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" minLength={6} className={inputCls} required />
        </div>
        <button type="submit" className="w-full rounded-xl px-4 py-3 text-sm font-bold text-white transition-all hover:-translate-y-0.5" style={{ background: "linear-gradient(135deg, #f72585, #b5179e)", boxShadow: "0 4px 20px rgba(247,37,133,0.3)" }}>
          Continue →
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSignup} className="animate-in fade-in slide-in-from-right-4 flex flex-col gap-4">
      <button type="button" onClick={() => setStep("email")} className="flex w-fit items-center gap-1 text-xs font-semibold text-gray-400 hover:text-gray-700 transition-colors">
        <ArrowLeft className="h-3 w-3" /> Back
      </button>
      <div>
        <h3 className="text-lg font-bold text-gray-900">Choose your username</h3>
        <p className="mt-1 mb-4 text-sm text-gray-500">How you&apos;ll appear to others on PartyGeng.</p>
        <div className="relative">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value.replace(/\s+/g, ""))}
            placeholder="e.g. djspinmaster"
            className={cn(
              inputCls,
              usernameStatus === "taken" && "border-red-300 focus:border-red-500 focus:ring-red-200",
              usernameStatus === "available" && "border-green-300 focus:border-green-500 focus:ring-green-200",
            )}
            required
          />
          <div className="absolute top-1/2 right-3 -translate-y-1/2">
            {usernameStatus === "checking" && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
            {usernameStatus === "available" && <CheckCircle className="h-4 w-4 text-green-500" />}
            {usernameStatus === "taken" && <AlertCircle className="h-4 w-4 text-red-500" />}
          </div>
        </div>
        {usernameError && (
          <p className="mt-2 flex items-center gap-1 text-xs text-red-500">
            <AlertCircle className="h-3 w-3" /> {usernameError}
          </p>
        )}
      </div>
      <PrimaryBtn loading={loading} disabled={usernameStatus !== "available"} id="signup-submit-btn">
        Create Account
      </PrimaryBtn>
    </form>
  );
};

/* ──────────────────── AUTH MODAL SHELL ──────────────────── */
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
        isModal
          ? "fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          : "flex w-full items-center justify-center",
      )}
    >
      <div
        className={cn(
          "relative flex w-full overflow-hidden rounded-2xl bg-white shadow-2xl",
          isModal ? "max-h-[90vh] max-w-4xl" : "max-w-4xl border border-gray-100",
        )}
      >
        {/* ── Left panel: real imagery ── */}
        <div className="relative hidden w-5/12 flex-col justify-end lg:flex" style={{ minHeight: 560 }}>
          <Image
            src="/event-assets/ee4dcf92-748c-4995-839d-f00d502abc31.jpg"
            alt="Event"
            fill
            className="object-cover"
            priority
          />
          {/* Multi-stop gradient overlay */}
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(to top, rgba(10,0,20,0.92) 0%, rgba(114,9,183,0.55) 45%, rgba(0,0,0,0.1) 100%)",
            }}
          />
          {/* Content over image */}
          <div className="relative z-10 p-10 text-white">
            <div
              className="mb-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold"
              style={{ background: "rgba(247,37,133,0.2)", border: "1px solid rgba(247,37,133,0.4)" }}
            >
              <span style={{ color: "#f72585" }}>✦</span>
              <span style={{ color: "rgba(255,255,255,0.85)" }}>Nigeria&apos;s #1 Event Platform</span>
            </div>
            <h2
              className="mb-5 text-3xl font-bold leading-tight"
              style={{ fontFamily: "'Clash Display', 'Quicksand', sans-serif" }}
            >
              Your next unforgettable event starts here.
            </h2>
            <ul className="space-y-3">
              {[
                "Find verified vendors in minutes",
                "Get quotes and pay securely",
                "Plan your perfect event end-to-end",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm" style={{ color: "rgba(255,255,255,0.8)" }}>
                  <span
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                    style={{ background: "rgba(247,37,133,0.25)", border: "1px solid rgba(247,37,133,0.5)" }}
                  >
                    <Check className="h-3 w-3" style={{ color: "#f72585" }} />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── Right panel: form ── */}
        <div className="relative flex w-full flex-col overflow-y-auto bg-white p-8 lg:w-7/12 lg:p-12">
          {/* Close button */}
          {isModal && onClose && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          )}

          {/* Heading */}
          <div className="mb-7">
            <h3
              className="text-2xl font-bold text-gray-900 sm:text-3xl"
              style={{ fontFamily: "'Clash Display', 'Quicksand', sans-serif" }}
            >
              {view === "join" ? "Create an account" : "Welcome back"}
            </h3>
            {/* Pink accent underline */}
            <div
              className="mt-2 h-0.5 w-10 rounded-full"
              style={{ background: "linear-gradient(90deg, #f72585, #b5179e)" }}
            />
          </div>

          {/* Active flow */}
          {view === "login" ? (
            <LoginFlow onClose={onClose} onSwitchView={() => setView("join")} />
          ) : (
            <SignupFlow onClose={onClose} onSwitchView={() => setView("login")} />
          )}

          {/* Footer */}
          <p className="mt-auto pt-8 text-center text-xs leading-relaxed text-gray-400">
            By continuing, you agree to PartyGeng&apos;s{" "}
            <Link href="/terms" className="underline hover:text-pink-600">Terms of Service</Link>
            {" "}and{" "}
            <Link href="/privacy" className="underline hover:text-pink-600">Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
