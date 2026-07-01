"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { Loader2, ShieldCheck, Key, User, Mail, Lock, DollarSign, FileText } from "lucide-react";
import { useUiStore } from "@/stores/ui";
import { useAuth } from "@/hooks/useAuth";

export default function CoordinatorRegistrationPage() {
  const router = useRouter();
  const { headerHeight } = useUiStore();
  const { user, loading } = useAuth();

  // Redirect already-logged-in users
  useEffect(() => {
    if (!loading && user) {
      const isAdmin = ["ADMIN", "SUPPORT", "FINANCE"].includes(user.role ?? "");
      router.replace(isAdmin ? "/admin" : "/trending");
    }
  }, [user, loading, router]);

  // Step 1: Access Key
  const [accessKey, setAccessKey] = useState("");
  const [keyValidated, setKeyValidated] = useState(false);
  const [validatingKey, setValidatingKey] = useState(false);

  // Step 2: Onboarding Details
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [price, setPrice] = useState<number>(15000); // default base price

  const [usernameChecking, setUsernameChecking] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);

  const utils = api.useUtils();

  // Check username availability as they type
  useEffect(() => {
    if (username.length < 3) {
      setUsernameAvailable(null);
      return;
    }
    setUsernameChecking(true);
    const delayDebounce = setTimeout(async () => {
      try {
        const res = await utils.auth.checkUsername.fetch({ username: username.toLowerCase() });
        setUsernameAvailable(res.available);
      } catch {
        setUsernameAvailable(false);
      } finally {
        setUsernameChecking(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [username, utils]);

  // Query key validation
  const handleValidateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessKey.trim()) {
      toast.error("Please enter your access key.");
      return;
    }
    setValidatingKey(true);
    try {
      const res = await utils.coordinator.validateKey.fetch({ key: accessKey.trim() });
      if (res.valid) {
        setKeyValidated(true);
        toast.success("Access key validated successfully!");
      } else {
        toast.error("Invalid or already used access key.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to validate key.");
    } finally {
      setValidatingKey(false);
    }
  };

  // Submit registration
  const registerMutation = api.coordinator.register.useMutation({
    onSuccess: () => {
      toast.success("Coordinator account registered successfully! Redirecting to login...");
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    },
    onError: (err) => {
      toast.error(err.message || "Failed to register coordinator.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyValidated) {
      toast.error("Please validate your access key first.");
      return;
    }
    if (usernameAvailable === false) {
      toast.error("Please choose a different username.");
      return;
    }
    if (bio.length < 10) {
      toast.error("Bio must be at least 10 characters.");
      return;
    }

    registerMutation.mutate({
      accessKey: accessKey.trim(),
      email,
      username: username.toLowerCase(),
      password,
      name,
      bio,
      price,
    });
  };

  if (loading || user) return null;

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8"
      style={{ paddingTop: headerHeight }}
    >
      <div className="w-full max-w-lg space-y-8 rounded-2xl border border-gray-100 bg-white p-8 shadow-xl">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-pink-50">
            <ShieldCheck className="h-6 w-6 text-[var(--l-brand-pink)]" />
          </div>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-gray-900">
            Join as a Coordinator
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Partygeng Managed Coordinators have direct access to client events.
          </p>
        </div>

        {!keyValidated ? (
          /* Step 1: Access Key Validation Form */
          <form onSubmit={handleValidateKey} className="space-y-6">
            <div>
              <label htmlFor="key" className="block text-sm font-semibold text-gray-700">
                Enter Invitation / Access Key
              </label>
              <div className="relative mt-2">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <Key className="h-5 w-5" />
                </span>
                <input
                  id="key"
                  type="text"
                  placeholder="e.g. CO-XXXXXXXXXXXX"
                  value={accessKey}
                  onChange={(e) => setAccessKey(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-3 pl-10 pr-4 text-gray-900 focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
                  required
                />
              </div>
              <p className="mt-2 text-xs text-gray-400">
                Access keys are manually generated in the backend by platform administrators.
              </p>
            </div>

            <button
              type="submit"
              disabled={validatingKey}
              className="flex w-full items-center justify-center rounded-xl bg-pink-600 py-3 text-base font-bold text-white transition hover:bg-pink-700 disabled:opacity-50"
            >
              {validatingKey ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Validating...
                </>
              ) : (
                "Verify Access Key"
              )}
            </button>
          </form>
        ) : (
          /* Step 2: Main Registration Form */
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="rounded-xl bg-green-50 p-4 border border-green-200 flex items-center gap-3 mb-2">
              <Key className="h-5 w-5 text-green-600 shrink-0" />
              <div>
                <p className="text-xs text-green-700 font-bold">Key Validated</p>
                <p className="text-xs text-green-600">{accessKey}</p>
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
                Email Address
              </label>
              <div className="relative mt-1">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-4 text-sm text-gray-900 focus:border-pink-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-semibold text-gray-700">
                Choose Username
              </label>
              <div className="relative mt-1">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <User className="h-4 w-4" />
                </span>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="coordinator_jane"
                  className={`w-full rounded-xl border py-2.5 pl-10 pr-10 text-sm text-gray-900 focus:outline-none ${
                    usernameAvailable === true
                      ? "border-green-500 focus:border-green-500"
                      : usernameAvailable === false
                      ? "border-red-500 focus:border-red-500"
                      : "border-gray-200 focus:border-pink-500"
                  }`}
                  required
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  {usernameChecking && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
                  {usernameAvailable === true && <span className="text-xs text-green-600 font-bold">✓</span>}
                  {usernameAvailable === false && <span className="text-xs text-red-600 font-bold">Taken</span>}
                </div>
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                Password
              </label>
              <div className="relative mt-1">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-4 text-sm text-gray-900 focus:border-pink-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-gray-700">
                Full Name
              </label>
              <div className="relative mt-1">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <User className="h-4 w-4" />
                </span>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Doe"
                  className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-4 text-sm text-gray-900 focus:border-pink-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* Price */}
            <div>
              <label htmlFor="price" className="block text-sm font-semibold text-gray-700">
                Coordinator Base Price (₦)
              </label>
              <div className="relative mt-1">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <DollarSign className="h-4 w-4" />
                </span>
                <input
                  id="price"
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  placeholder="15000"
                  className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-4 text-sm text-gray-900 focus:border-pink-500 focus:outline-none"
                  required
                />
              </div>
              <p className="mt-1 text-[11px] text-gray-400">
                This is the flat hiring rate clients will pay to add you to their event collaboration board.
              </p>
            </div>

            {/* Bio */}
            <div>
              <label htmlFor="bio" className="block text-sm font-semibold text-gray-700">
                Professional Bio
              </label>
              <div className="relative mt-1">
                <span className="absolute top-3 left-3 text-gray-400">
                  <FileText className="h-4 w-4" />
                </span>
                <textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell clients about your coordination experience, past events, and style..."
                  rows={3}
                  className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-4 text-sm text-gray-900 focus:border-pink-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={registerMutation.isPending || usernameAvailable === false}
              className="flex w-full items-center justify-center rounded-xl bg-pink-600 py-3 text-base font-bold text-white transition hover:bg-pink-700 disabled:opacity-50"
            >
              {registerMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Creating Account...
                </>
              ) : (
                "Complete Coordinator Setup"
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
