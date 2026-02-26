"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@/trpc/react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import {
  Loader2,
  User,
  Store,
  ArrowRight,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const onboardingSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username cannot exceed 30 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, and underscores allowed"),
  role: z.enum(["CLIENT", "VENDOR"], {
    required_error: "Please select an account type",
  }),
});

type OnboardingValues = z.infer<typeof onboardingSchema>;

export default function OnboardingPage() {
  const router = useRouter();
  const utils = api.useUtils();

  const [authUser, setAuthUser] = useState<{
    id: string;
    email: string;
  } | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState<boolean>(true);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<OnboardingValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      role: "CLIENT",
    },
  });

  const selectedRole = useWatch({
    control,
    name: "role",
  });

  // --- PRISMA PROFILE CHECK ---
  const { data: profile, isLoading: isProfileLoading } =
    api.user.getProfile.useQuery(undefined, {
      enabled: !!authUser,
      retry: false,
    });

  // Username validation state
  const usernameValue = useWatch({ control, name: "username" });
  const [usernameStatus, setUsernameStatus] = useState<
    "idle" | "checking" | "available" | "taken"
  >("idle");

  // Real-time Debounced Username Check
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (!usernameValue || usernameValue.length < 3) {
        setUsernameStatus("idle");
        return;
      }

      setUsernameStatus("checking");

      const performCheck = async () => {
        try {
          const isAvailable = await utils.user.checkUsername.fetch({
            username: usernameValue.toLowerCase(),
            excludeUserId: authUser?.id,
          });
          setUsernameStatus(isAvailable ? "available" : "taken");
        } catch {
          setUsernameStatus("idle");
        }
      };

      void performCheck();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [usernameValue, utils.user.checkUsername, authUser?.id]);

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient();
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error || !session?.user?.email) {
        toast.error("Please log in to continue.");
        router.push("/login");
        return;
      }

      setAuthUser({
        id: session.user.id,
        email: session.user.email,
      });

      interface UserMetadata {
        username?: string;
        role?: string;
      }

      const metadata = session.user.user_metadata as UserMetadata | undefined;

      if (metadata?.username) setValue("username", metadata.username);
      if (metadata?.role === "CLIENT" || metadata?.role === "VENDOR") {
        setValue("role", metadata.role);
      }

      setIsCheckingSession(false);
    };

    void checkUser();
  }, [router, setValue]);

  // 2. REDIRECT IF ALREADY ONBOARDED
  useEffect(() => {
    if (profile?.isOnboarded) {
      if (profile.role === "VENDOR") router.push("/vendor/dashboard");
      else router.push("/dashboard");
    }
  }, [profile, router]);

  // 3. THE MUTATION
  const updateOnboarding = api.user.updateOnboarding.useMutation({
    onSuccess: async (data) => {
      toast.success("Account setup complete!");
      await utils.user.getProfile.invalidate();

      if (data.role === "VENDOR") {
        router.push("/vendor/dashboard");
      } else {
        router.push("/dashboard");
      }
    },
    onError: (err: unknown) => {
      if (err instanceof Error) {
        // tRPC errors usually contain the message string
        if (err.message.toLowerCase().includes("taken")) {
          toast.error("This username is already taken.");
        } else {
          toast.error(err.message);
        }
      } else {
        toast.error("An unexpected error occurred.");
      }
    },
  });

  const onSubmit = (data: OnboardingValues) => {
    if (!authUser) return;
    if (usernameStatus === "taken") {
      toast.error("Please choose an available username.");
      return;
    }

    updateOnboarding.mutate({
      username: data.username.toLowerCase(),
      role: data.role,
    });
  };

  // Guard against render loop: Only show loader if we are actually checking or if they are already onboarded and waiting for redirect
  if (isCheckingSession || isProfileLoading || profile?.isOnboarded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-pink-600" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-gray-100 bg-white p-8 shadow-xl">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900">
            Welcome to PartyGeng! 🎉
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Review your details to finish setting up your account.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
          <div>
            <Label htmlFor="username" className="font-semibold text-gray-700">
              Confirm your Username
            </Label>
            <div className="relative mt-2">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                @
              </span>
              <Input
                id="username"
                type="text"
                placeholder="partyanimal99"
                className={cn(
                  "pl-8 focus-visible:ring-pink-500",
                  usernameStatus === "taken" &&
                    "border-red-500 focus-visible:ring-red-500",
                  usernameStatus === "available" &&
                    "border-green-500 focus-visible:ring-green-500",
                )}
                {...register("username")}
                disabled={updateOnboarding.isPending}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                {usernameStatus === "checking" && (
                  <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                )}
                {usernameStatus === "available" && (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                )}
                {usernameStatus === "taken" && (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                )}
              </div>
            </div>
            {errors.username && (
              <p className="mt-1 text-sm font-medium text-red-600">
                {errors.username.message}
              </p>
            )}
            {usernameStatus === "taken" && (
              <p className="mt-1 text-sm font-medium text-red-600">
                This username is taken.
              </p>
            )}
          </div>

          <div className="space-y-3">
            <Label className="font-semibold text-gray-700">
              Confirm your account type
            </Label>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div
                onClick={() =>
                  !updateOnboarding.isPending && setValue("role", "CLIENT")
                }
                className={cn(
                  "relative flex cursor-pointer flex-col items-center rounded-xl border-2 p-4 text-center transition-all duration-200",
                  selectedRole === "CLIENT"
                    ? "border-pink-600 bg-pink-50 text-pink-700"
                    : "border-gray-200 bg-white text-gray-600 hover:border-pink-200 hover:bg-gray-50",
                  updateOnboarding.isPending && "cursor-not-allowed opacity-50",
                )}
              >
                <User className="mb-2 h-8 w-8" />
                <span className="font-bold">Client</span>
                <span className="mt-1 text-xs font-medium text-gray-500 opacity-80">
                  I want to plan events and hire vendors.
                </span>
              </div>

              <div
                onClick={() =>
                  !updateOnboarding.isPending && setValue("role", "VENDOR")
                }
                className={cn(
                  "relative flex cursor-pointer flex-col items-center rounded-xl border-2 p-4 text-center transition-all duration-200",
                  selectedRole === "VENDOR"
                    ? "border-pink-600 bg-pink-50 text-pink-700"
                    : "border-gray-200 bg-white text-gray-600 hover:border-pink-200 hover:bg-gray-50",
                  updateOnboarding.isPending && "cursor-not-allowed opacity-50",
                )}
              >
                <Store className="mb-2 h-8 w-8" />
                <span className="font-bold">Vendor</span>
                <span className="mt-1 text-xs font-medium text-gray-500 opacity-80">
                  I want to offer my services to clients.
                </span>
              </div>
            </div>
            {errors.role && (
              <p className="mt-1 text-sm font-medium text-red-600">
                {errors.role.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            disabled={
              updateOnboarding.isPending ||
              usernameStatus === "checking" ||
              usernameStatus === "taken"
            }
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-pink-600 text-lg font-bold text-white hover:bg-pink-700"
          >
            {updateOnboarding.isPending ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" /> Saving...
              </>
            ) : (
              <>
                Complete Setup <ArrowRight className="h-5 w-5" />
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
