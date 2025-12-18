"use client";

import React, { useState } from "react";
import { X, Check, ArrowLeft, Mail } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { api } from "@/trpc/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
// import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth";

// Mock cn function for demonstration
const cn = (...inputs: (string | boolean | undefined | null)[]) => {
  return inputs.filter(Boolean).join(" ");
};

// Mock Google & Apple/Facebook icons
const GoogleIcon = () => (
  // ... (omitted for brevity, no changes) ...
  <svg className="h-5 w-5" viewBox="0 0 48 48">
    <path
      fill="#FFC107"
      d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
    ></path>
    <path
      fill="#FF3D00"
      d="m6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"
    ></path>
    <path
      fill="#4CAF50"
      d="m24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
    ></path>
    <path
      fill="#1976D2"
      d="m43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l.003-.002s-2.1.3h-.002l6.19 5.238C39.601 36.31 44 30.648 44 24c0-1.341-.138-2.65-.389-3.917z"
    ></path>
  </svg>
);

const AppleIcon = () => (
  // ... (omitted for brevity, no changes) ...
  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
    <path d="M10.021 6.54c.48.01 1.25.33 1.83.98s.96 1.48.96 2.37c0 .9-.35 1.63-.94 2.19c-.6.58-1.27.87-2.02.85c-.4-.01-1.12-.3-1.74-.93c-.62-.63-.97-1.42-.97-2.35c0-.9.37-1.68 1.02-2.23c.65-.55 1.38-.85 1.86-.88m1.78 7.37c.36-.5.54-1.1.54-1.8c0-.9-.37-1.68-1.1-2.33c-.75-.65-1.62-.97-2.61-.97c-.98 0-1.84.32-2.58.97c-.74.65-1.12 1.44-1.12 2.38c0 .92.34 1.7.99 2.33c.66.63 1.4.95 2.2.95c.57 0 1.1-.14 1.58-.42c.04.01.07.02.09.02c.07 0 .15-.01.21-.02M10 18C8.16 18 6.5 17.34 5.03 16.03C3.56 14.72 2.7 13.1 2.45 11.18c-.04-.33.07-.63.3-.87c.23-.24.52-.36.87-.36h.22c.28 0 .54.08.78.25c.24.17.5.42.78.75c.27.33.5.58.67.75c.18.17.35.26.49.26c.14 0 .3-.1.48-.29c.18-.2.4-.38.65-.56c.25-.18.53-.27.84-.27c.38 0 .75.14 1.09.4s.6.58.76.95c.03.06.07.1.13.12c.06.02.1.03.13.03h.25c.32 0 .59-.11.82-.33c.23-.22.34-.5.34-.84c-.03-1.6-.5-2.98-1.42-4.14c-.9-1.15-2-1.72-3.3-1.72c-.22 0-.46.03-.7.08c-.24.05-.5.1-.75.13c-.3 0-.56-.1-.78-.3c-.22-.2-.33-.45-.33-.74c0-.33.11-.59.33-.79c.22-.2.5-.3.84-.3h.25c2.3 0 4.2.7 5.68 2.1c.95.9 1.55 2.02 1.8 3.36c.03.14.04.28.04.4c0 .3-.1.55-.3.75c-.2.2-.44.3-.72.3c-.3 0-.58-.1-.82-.3s-.5-.38-.78-.57c-.28-.19-.53-.28-.75-.28c-.22 0-.4.08-.55.23c-.15.15-.3.33-.45.54c-.15.2-.3.38-.45.54c-.15.16-.3.24-.43.24c-.11 0-.23-.04-.35-.12c-.12-.08-.27-.19-.45-.33c-.18-.14-.38-.21-.6-.21c-.3 0-.58.11-.84.34c-.26.23-.39.52-.39.88c0 .33.16.68.48 1.04c.32.36.7.64 1.14.84c.44.2.9.3 1.38.3c1.9 0 3.44-.65 4.63-1.94c.5-.55.88-1.17 1.13-1.85c.03.2.04.4.04.6c0 1.2-.33 2.28-.98 3.22c-.65.94-1.48 1.68-2.5 2.2c-1.02.52-2.12.8-3.3.8Z"></path>
  </svg>
);

const FacebookIcon = () => (
  // ... (omitted for brevity, no changes) ...
  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
    <path
      fillRule="evenodd"
      d="M20 10c0-5.523-4.477-10-10-10S0 4.477 0 10c0 5.013 3.657 9.128 8.438 9.878v-6.987h-2.54V10h2.54V7.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V10h2.773l-.443 2.89h-2.33v6.988C16.343 19.128 20 15.013 20 10Z"
      clipRule="evenodd"
    ></path>
  </svg>
);

const EmailForm = ({
  onBack,
  isJoinView,
  email,
  setEmail,
  password,
  setPassword,
  handleSubmit,
  loading,
}: {
  onBack: () => void;
  isJoinView: boolean;
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  handleSubmit: (e: React.FormEvent) => void;
  loading: boolean;
}) => (
  // FIX: Form fields no longer show "Confirm Password", just Email and Password
  // The 'handleSubmit' function will now handle the logic to move to the username step
  <form onSubmit={handleSubmit} className="flex flex-col gap-4">
    <button
      type="button"
      onClick={onBack}
      className="flex items-center gap-1 text-sm font-semibold text-gray-600 hover:text-gray-900"
    >
      <ArrowLeft className="h-4 w-4" />
      Back to options
    </button>

    <div>
      <label
        htmlFor="email"
        className="block text-sm font-medium text-gray-700"
      >
        {isJoinView ? "Email" : "Email or Username"}
      </label>
      <input
        type="text"
        id="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={
          isJoinView ? "e.g. name@example.com" : "Enter email or username"
        }
        className="mt-1 w-full rounded-md border border-gray-300 p-3 focus:outline-pink-500"
        required
      />
    </div>

    <div>
      <label
        htmlFor="password"
        className="block text-sm font-medium text-gray-700"
      >
        Password
      </label>
      <input
        type="password"
        id="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Enter your password"
        className="mt-1 w-full rounded-md border border-gray-300 p-3 focus:outline-pink-500"
        required
      />
    </div>

    <button
      type="submit"
      disabled={loading}
      className="w-full rounded-lg bg-pink-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-pink-700 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading ? "Loading..." : "Continue"}
    </button>
  </form>
);

// NEW: Username Form Sub-component (from reference)
const UsernameForm = ({
  onBack,
  username,
  setUsername,
  handleCreateAccount,
  loading,
}: {
  onBack: () => void;
  username: string;
  setUsername: (username: string) => void;
  handleCreateAccount: (e: React.FormEvent) => void;
  loading: boolean;
}) => (
  <form onSubmit={handleCreateAccount} className="flex flex-col gap-4">
    <button
      type="button"
      onClick={onBack}
      className="flex items-center gap-1 text-sm font-semibold text-gray-600 hover:text-gray-900"
    >
      <ArrowLeft className="h-4 w-4" />
      Back to email
    </button>

    <h3 className="text-2xl font-bold text-gray-900">
      Get your profile started
    </h3>
    <p className="-mt-2 text-gray-600">
      Add a username that&apos;s unique to you, this is how you&apos;ll appear
      to others.
    </p>

    <div>
      <label
        htmlFor="username"
        className="block text-sm font-medium text-gray-700"
      >
        Choose a username
      </label>
      <input
        type="text"
        id="username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="e.g. djspinmaster"
        className="mt-1 w-full rounded-md border border-gray-300 p-3 focus:outline-pink-500"
        required
      />
      {/* Add validation messages here */}
    </div>

    <button
      type="submit"
      disabled={loading}
      className="w-full rounded-lg bg-pink-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-pink-700 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading ? "Creating account..." : "Create my account"}
    </button>
  </form>
);

const AuthModal = ({
  isModal = false,
  initialView = "login",
  onClose,
}: {
  isModal?: boolean;
  initialView?: string;
  onClose?: () => void;
}) => {
  const router = useRouter();
  // const queryClient = useQueryClient();
  const [view, setView] = useState(initialView);
  const [selectedRole, setSelectedRole] = useState("client");
  // FIX: Updated step logic
  const [step, setStep] = useState("options"); // 'options', 'email', 'username'

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  // Removed confirmPassword, as it's part of the email form's logic if needed, but Fiverr flow doesn't use it on step 1

  // tRPC hooks
  const createUserMutation = api.auth.createUser.useMutation();
  const utils = api.useUtils();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (view === "login") {
        // Sign in with Supabase
        const supabase = createClient();
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          toast.error(error.message);
        } else {
          toast.success("Welcome back!");

          // Optimistically set profile from session data (instant!)
          if (data.user) {
            const optimisticProfile = {
              id: data.user.id,
              email: data.user.email!,
              username:
                (data.user.user_metadata?.username as string) ??
                data.user.email?.split("@")[0] ??
                "",
              role: (data.user.user_metadata?.role as string) ?? "CLIENT",
              vendorProfile:
                (data.user.user_metadata?.role as string) === "VENDOR"
                  ? {}
                  : null,
              clientProfile:
                (data.user.user_metadata?.role as string) === "CLIENT"
                  ? {}
                  : null,
              createdAt: new Date(data.user.created_at),
              updatedAt: new Date(),
            };

            // Set optimistic profile in store immediately
            const { setProfile } = useAuthStore.getState();
            // Type-safe cast to the setProfile parameter type to avoid using 'any'
            setProfile(
              optimisticProfile as unknown as Parameters<typeof setProfile>[0],
            );
          }

          // Close modal immediately
          if (onClose) onClose();

          // Invalidate and refetch real profile in background
          await utils.user.getProfile.invalidate();
          await utils.user.getProfile.fetch(); // Background fetch

          // Navigate immediately using metadata
          const userRole = data.user?.user_metadata?.role as string;

          if (userRole === "VENDOR") {
            router.push("/dashboard");
          } else if (userRole === "CLIENT") {
            router.push("/manage_events");
          } else {
            router.push("/");
          }
        }
      } else {
        // For join flow, proceed to username step
        setStep("username");
      }
    } catch (error) {
      console.log("Auth error:", error);
      toast.error(`An error occurred. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const supabase = createClient();

      // Check if username is available
      // Note: This would be better done with debouncing as user types
      // For now, we'll skip the check and let the database handle uniqueness

      // 1. Create Supabase auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            role: selectedRole.toUpperCase(),
          },
          emailRedirectTo: window.location.origin,
        },
      });

      if (authError) {
        toast.error(authError.message);
        setLoading(false);
        return;
      }

      if (!authData.user) {
        toast.error("Failed to create account. Please try again.");
        setLoading(false);
        return;
      }

      // 2. Create user in database via tRPC
      await createUserMutation.mutateAsync({
        id: authData.user.id,
        email: authData.user.email!,
        username,
        role: selectedRole.toUpperCase() as "CLIENT" | "VENDOR",
      });

      // Check if user was auto-confirmed (session exists)
      const hasSession = authData.session !== null;

      if (hasSession) {
        // User is automatically logged in (email confirmation disabled)
        toast.success("Account created successfully! Welcome!");

        // Optimistically set profile from signup data (instant!)
        const optimisticProfile = {
          id: authData.user.id,
          email: authData.user.email!,
          username,
          role: selectedRole.toUpperCase(),
          vendorProfile: selectedRole === "vendor" ? {} : null,
          clientProfile: selectedRole === "client" ? {} : null,
          createdAt: new Date(authData.user.created_at),
          updatedAt: new Date(),
        };

        // Set optimistic profile in store immediately
        const { setProfile } = useAuthStore.getState();
        // Cast to any to satisfy the store's stricter UserRole typing for optimistic updates
        setProfile(
          optimisticProfile as unknown as Parameters<typeof setProfile>[0],
        );

        // Close modal immediately
        if (onClose) onClose();

        // Invalidate and refetch real profile in background
        await utils.user.getProfile.invalidate();
        await utils.user.getProfile.fetch(); // Background fetch

        // Navigate immediately based on selected role
        if (selectedRole === "vendor") {
          router.push("/dashboard");
        } else {
          router.push("/manage_events");
        }
      } else {
        // User needs to verify email
        toast.success(
          "Account created! Please check your email to verify and login.",
        );

        // Close modal and don't redirect
        if (onClose) onClose();
      }
    } catch (error) {
      console.error("Signup error:", error);
      toast.error("An error occurred during signup. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = (targetStep: "options" | "email") => {
    setStep(targetStep);
    // Don't clear email/pass when going back to email form
    if (targetStep === "options") {
      setEmail("");
      setPassword("");
    }
  };

  return (
    <>
      <style>
        {`
          .auth-view-wrapper {
            position: relative;
            /* Set min-height to prevent jiggle. Adjust as needed. */
            min-height: 400px; 
          }
          .auth-view {
            width: 100%;
            transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.35s;
            position: absolute;
            top: 0;
            left: 0;
            backface-visibility: hidden; /* Prevents flickering */
          }
          .auth-view.entering {
            transform: translateX(0);
            opacity: 1;
          }
          .auth-view.exiting-left {
            transform: translateX(-100%);
            opacity: 0;
          }
          .auth-view.hidden-right {
            transform: translateX(100%);
            opacity: 0;
          }
        `}
      </style>

      <div
        className={cn(
          "flex items-center justify-center",
          isModal ? "fixed inset-0 z-50 bg-black/60" : "bg-gray-100", // Fullscreen bg if not modal
        )}
      >
        <div
          className={cn(
            "relative flex overflow-hidden bg-white shadow-xl",
            isModal
              ? "m-4 h-full w-full sm:h-auto sm:max-h-[90vh] sm:max-w-4xl sm:rounded-lg" // Modal classes
              : "min-h-screen w-screen sm:mx-auto sm:my-12 sm:h-auto sm:max-h-[90vh] sm:min-h-0 sm:w-full sm:max-w-4xl sm:rounded-lg",
          )}
        >
          {/* Left Side (Branding) */}
          <div
            className="relative hidden w-1/2 flex-col justify-center bg-cover bg-center p-12 lg:flex"
            style={{
              backgroundImage:
                "url(https://placehold.co/600x800/ec4899/ffffff/png?text=Partygeng&font=inter)",
            }}
          >
            {/* Overlay */}
            <div className="absolute inset-0 bg-pink-800 opacity-75"></div>
            {/* Content */}
            <div className="relative z-10 text-white">
              <h2 className="mb-6 text-4xl leading-tight font-bold">
                Success starts here.
              </h2>
              <ul className="space-y-4 text-lg">
                <li className="flex items-center gap-3">
                  <Check className="h-6 w-6 shrink-0" />
                  Find verified vendors
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-6 w-6 shrink-0" />
                  Get quotes and pay securely
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-6 w-6 shrink-0" />
                  Plan your perfect event
                </li>
              </ul>
            </div>
          </div>

          {/* Right Side (Form) */}
          <div className="relative w-full overflow-hidden overflow-y-auto bg-white p-8 md:w-1/2 md:p-12">
            {isModal && onClose && (
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            )}
            {/* Show titles only on the first step */}
            <div className={cn(step !== "options" && "hidden")}>
              <h2 className="mb-4 text-3xl font-bold text-gray-900 md:hidden">
                Success starts here.
              </h2>
              <h3 className="mb-4 hidden text-3xl font-bold text-gray-900 md:block">
                {view === "join"
                  ? "Create a new account"
                  : "Sign in to your account"}
              </h3>
              <p className="mb-6 text-gray-500">
                {view === "join"
                  ? "Already have an account? "
                  : "Don't have an account? "}
                <button
                  onClick={() => {
                    setView(view === "join" ? "login" : "join");
                    setStep("options");
                    handleBack("options");
                  }}
                  className="font-semibold text-pink-600 hover:underline"
                >
                  {view === "join" ? "Sign in" : "Join here"}
                </button>
              </p>
            </div>
            {/* Role Selector (Only on 'join' and 'options' step) */}
            {view === "join" && step === "options" && (
              <div className="mb-6">
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  I am joining as a:
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedRole("client")}
                    className={cn(
                      "flex-1 rounded-lg border p-4 text-left transition-all",
                      selectedRole === "client"
                        ? "border-pink-600 bg-pink-50 ring-2 ring-pink-200"
                        : "border-gray-300 bg-white hover:border-gray-400",
                    )}
                  >
                    <p className="font-bold text-gray-800">Client</p>
                    <p className="text-sm text-gray-600">
                      I&apos;m here to hire vendors and plan events.
                    </p>
                  </button>
                  <button
                    onClick={() => setSelectedRole("vendor")}
                    className={cn(
                      "flex-1 rounded-lg border p-4 text-left transition-all",
                      selectedRole === "vendor"
                        ? "border-pink-600 bg-pink-50 ring-2 ring-pink-200"
                        : "border-gray-300 bg-white hover:border-gray-400",
                    )}
                  >
                    <p className="font-bold text-gray-800">Vendor</p>
                    <p className="text-sm text-gray-600">
                      I&Apos;m an event professional looking to offer my
                      services.
                    </p>
                  </button>
                </div>
              </div>
            )}
            {/* Animated View Wrapper */}
            <div className="auth-view-wrapper">
              {/* View 1: Social & Email Options */}
              <div
                className={cn(
                  "auth-view",
                  step === "options" ? "entering" : "exiting-left",
                )}
              >
                <div className="flex flex-col gap-4">
                  <button className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 px-4 py-3 font-semibold text-gray-700 transition-colors hover:bg-gray-50">
                    <GoogleIcon />
                    Continue with Google
                  </button>
                  <button
                    onClick={() => setStep("email")}
                    className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 px-4 py-3 font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    <Mail className="h-5 w-5 text-gray-600" />
                    Continue with email
                  </button>
                </div>
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-300"></span>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-white px-2 text-gray-500">OR</span>
                  </div>
                </div>
                <div className="flex flex-col gap-4 sm:flex-row">
                  <button className="flex flex-1 items-center justify-center gap-3 rounded-lg border border-gray-300 px-4 py-3 font-semibold text-gray-700 transition-colors hover:bg-gray-50">
                    <AppleIcon />
                    Apple
                  </button>
                  <button className="flex flex-1 items-center justify-center gap-3 rounded-lg border border-gray-300 px-4 py-3 font-semibold text-gray-700 transition-colors hover:bg-gray-50">
                    <FacebookIcon />
                    Facebook
                  </button>
                </div>
              </div>

              {/* View 2: Email Form */}
              <div
                className={cn(
                  "auth-view",
                  step === "email"
                    ? "entering"
                    : step === "options"
                      ? "hidden-right"
                      : "exiting-left",
                )}
              >
                <EmailForm
                  onBack={() => handleBack("options")}
                  isJoinView={view === "join"}
                  email={email}
                  setEmail={setEmail}
                  password={password}
                  setPassword={setPassword}
                  handleSubmit={handleSubmit}
                  loading={loading}
                />
              </div>

              {/* View 3: Username Form (Join Only) */}
              <div
                className={cn(
                  "auth-view",
                  step === "username" ? "entering" : "hidden-right",
                )}
              >
                <UsernameForm
                  onBack={() => handleBack("email")}
                  username={username}
                  setUsername={setUsername}
                  handleCreateAccount={handleCreateAccountSubmit}
                  loading={loading}
                />
              </div>
            </div>{" "}
            {/* End of auth-view-wrapper */}
            <p className="mt-8 text-xs text-gray-400">
              By {view === "join" ? "joining" : "signing in"}, you agree to the
              Partygeng{" "}
              <Link href="/terms-of-service" className="underline hover:text-pink-600">
                Terms of Service
              </Link>{" "}
              and to occasionally receive emails from us. Please read our{" "}
              <Link href="/privacy-policy" className="underline hover:text-pink-600">
                Privacy Policy
              </Link>{" "}
              to learn how we use your personal data.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default AuthModal;
