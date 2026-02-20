"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@/trpc/react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { Loader2, User, Store, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
// import { useAuthStore } from "@/stores/auth";

// --- VALIDATION SCHEMA ---
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
  const [authUser, setAuthUser] = useState<{
    id: string;
    email: string;
  } | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const supabase = createClient();
  const utils = api.useUtils();
  //   const setProfile = useAuthStore((state) => state.setProfile);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<OnboardingValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      role: "CLIENT", // Default selection
    },
  });

  const selectedRole = useWatch({
    control,
    name: "role",
  });

  // 1. CHECK SUPABASE SESSION ON MOUNT
  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error || !session?.user) {
        toast.error("Please log in to continue.");
        router.push("/login");
        return;
      }

      if (!session.user.email) {
        toast.error("Email is required.");
        router.push("/login");
        return;
      }

      setAuthUser({
        id: session.user.id,
        email: session.user.email,
      });
      setIsCheckingSession(false);
    };

    void checkUser();
  }, [router, supabase.auth]);

  // 2. THE MUTATION
  const createUser = api.user.createUser.useMutation({
    onSuccess: async (data) => {
      toast.success("Account setup complete!");
      // Force the AuthProvider to fetch the new profile
      await utils.user.getProfile.invalidate();

      // Redirect based on role
      if (data.role === "VENDOR") {
        router.push("/vendor/dashboard"); // Or wherever vendors go first
      } else {
        router.push("/dashboard"); // Clients
      }
    },
    onError: (err) => {
      // Handle Unique Constraint error for Usernames (Prisma)
      if (
        err.message.includes("Unique constraint") ||
        err.message.includes("already taken")
      ) {
        toast.error("This username is already taken. Please try another.");
      } else {
        toast.error(err.message || "Failed to create account.");
      }
    },
  });

  const onSubmit = (data: OnboardingValues) => {
    if (!authUser) return;

    createUser.mutate({
      id: authUser.id,
      email: authUser.email,
      username: data.username.toLowerCase(),
      role: data.role,
    });
  };

  if (isCheckingSession) {
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
            Let&apos;s finish setting up your account.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
          {/* --- USERNAME INPUT --- */}
          <div>
            <Label htmlFor="username" className="font-semibold text-gray-700">
              Choose a Username
            </Label>
            <div className="relative mt-2">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                @
              </span>
              <Input
                id="username"
                type="text"
                placeholder="partyanimal99"
                className="pl-8 focus-visible:ring-pink-500"
                {...register("username")}
                disabled={createUser.isPending}
              />
            </div>
            {errors.username && (
              <p className="mt-1 text-sm font-medium text-red-600">
                {errors.username.message}
              </p>
            )}
          </div>

          {/* --- ROLE SELECTION --- */}
          <div className="space-y-3">
            <Label className="font-semibold text-gray-700">
              How will you use PartyGeng?
            </Label>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Client Card */}
              <div
                onClick={() =>
                  !createUser.isPending && setValue("role", "CLIENT")
                }
                className={cn(
                  "relative flex cursor-pointer flex-col items-center rounded-xl border-2 p-4 text-center transition-all duration-200",
                  selectedRole === "CLIENT"
                    ? "border-pink-600 bg-pink-50 text-pink-700"
                    : "border-gray-200 bg-white text-gray-600 hover:border-pink-200 hover:bg-gray-50",
                  createUser.isPending && "cursor-not-allowed opacity-50",
                )}
              >
                <User className="mb-2 h-8 w-8" />
                <span className="font-bold">Client</span>
                <span className="mt-1 text-xs font-medium opacity-80">
                  I want to plan events and hire vendors.
                </span>
              </div>

              {/* Vendor Card */}
              <div
                onClick={() =>
                  !createUser.isPending && setValue("role", "VENDOR")
                }
                className={cn(
                  "relative flex cursor-pointer flex-col items-center rounded-xl border-2 p-4 text-center transition-all duration-200",
                  selectedRole === "VENDOR"
                    ? "border-pink-600 bg-pink-50 text-pink-700"
                    : "border-gray-200 bg-white text-gray-600 hover:border-pink-200 hover:bg-gray-50",
                  createUser.isPending && "cursor-not-allowed opacity-50",
                )}
              >
                <Store className="mb-2 h-8 w-8" />
                <span className="font-bold">Vendor</span>
                <span className="mt-1 text-xs font-medium opacity-80">
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

          {/* --- SUBMIT --- */}
          <Button
            type="submit"
            disabled={createUser.isPending}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-pink-600 text-lg font-bold text-white hover:bg-pink-700"
          >
            {createUser.isPending ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" /> Creating Account...
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
