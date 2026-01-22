"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Building2, FileText, LogOut, ArrowLeft } from "lucide-react";
import { useAuthStore } from "@/stores/auth";

interface VendorOnboardingProps {
  onSignOut?: () => void;
}

export function VendorOnboarding({ onSignOut }: VendorOnboardingProps) {
  const { profile, setProfile } = useAuthStore();
  const [step, setStep] = useState(1);
  const utils = api.useUtils();

  const [formData, setFormData] = useState({
    companyName: profile?.vendorProfile?.companyName ?? "",
    businessAddress: profile?.vendorProfile?.businessAddress ?? "",
    about: profile?.vendorProfile?.about ?? "",
    country: "Nigeria",
    regNumber: profile?.vendorProfile?.regNumber ?? "",
    fullName: profile?.vendorProfile?.fullName ?? "",
  });

  const submitKyb = api.settings.submitKyb.useMutation({
    onSuccess: async (updatedVendor) => {
      toast.success("Verification submitted!");
      if (profile && profile.vendorProfile) {
        setProfile({
          ...profile,
          vendorProfile: {
            ...profile.vendorProfile,
            ...updatedVendor,
            kybStatus: "IN_REVIEW",
          },
        });
      }
      await utils.user.getProfile.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleNext = () => setStep((p) => p + 1);
  const handleBack = () => setStep((p) => p - 1);

  return (
    <div className="min-h-screen w-full bg-gray-50">
      {/* --- NEW HEADER SHELL --- */}
      <header className="flex w-full items-center justify-between border-b border-gray-200 bg-white px-6 py-4 shadow-sm">
        <div className="flex items-center gap-2">
          {/* You can replace text with your Logo Image */}
          <span className="text-xl font-bold tracking-tight text-gray-900">
            PartyGeng
          </span>
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
            Vendor Setup
          </span>
        </div>

        {/* High Visibility Logout Button */}
        {onSignOut && (
          <Button
            variant="ghost"
            onClick={onSignOut}
            className="text-gray-500 hover:bg-red-50 hover:text-red-600"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Log Out
          </Button>
        )}
      </header>

      {/* --- MAIN CONTENT --- */}
      <div className="flex flex-col items-center justify-center p-4 py-12">
        <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-xl">
          {/* Progress Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">
              {step === 1 ? "Setup Profile" : "Business Verification"}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {step === 1
                ? "Let's get your public profile ready for clients."
                : "We need to verify your business identity."}
            </p>
            <div className="mt-4 flex gap-2">
              <div
                className={`h-1 flex-1 rounded-full transition-colors ${step >= 1 ? "bg-black" : "bg-gray-200"}`}
              />
              <div
                className={`h-1 flex-1 rounded-full transition-colors ${step >= 2 ? "bg-black" : "bg-gray-200"}`}
              />
            </div>
          </div>

          {/* STEP 1: Account Details */}
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-right-4 space-y-4">
              <div className="space-y-2">
                <Label>Company Name</Label>
                <div className="relative">
                  <Building2 className="absolute top-3 left-3 h-4 w-4 text-gray-400" />
                  <Input
                    className="pl-9"
                    placeholder="e.g. Ace Catering Services"
                    value={formData.companyName}
                    onChange={(e) =>
                      setFormData({ ...formData, companyName: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Business Address</Label>
                <Textarea
                  placeholder="Enter your full office address..."
                  className="resize-none"
                  rows={3}
                  value={formData.businessAddress}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      businessAddress: e.target.value,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>About Business (Optional)</Label>
                <Textarea
                  placeholder="Tell us briefly about what you do..."
                  rows={2}
                  value={formData.about}
                  onChange={(e) =>
                    setFormData({ ...formData, about: e.target.value })
                  }
                />
              </div>

              <Button
                className="mt-4 w-full"
                onClick={handleNext}
                disabled={!formData.companyName || !formData.businessAddress}
              >
                Next Step
              </Button>
            </div>
          )}

          {/* STEP 2: KYB Submission */}
          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-4 space-y-4">
              <div className="space-y-2">
                <Label>Country</Label>
                <Select
                  value={formData.country}
                  onValueChange={(val) =>
                    setFormData({ ...formData, country: val })
                  }
                >
                  <SelectTrigger>
                    <div className="flex items-center gap-2">
                      <span className="flex h-4 w-6 items-center justify-center overflow-hidden rounded bg-gray-100 text-[10px] leading-none">
                        🇳🇬
                      </span>
                      <SelectValue />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Nigeria">Nigeria</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>RC / BN Number</Label>
                <div className="relative">
                  <FileText className="absolute top-3 left-3 h-4 w-4 text-gray-400" />
                  <Input
                    className="pl-9"
                    placeholder="RC-123456"
                    value={formData.regNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, regNumber: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Contact Person Full Name</Label>
                <Input
                  placeholder="Your legal name"
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                />
              </div>

              <div className="mt-4 rounded-md border border-yellow-100 bg-yellow-50 p-3 text-xs text-yellow-800">
                By submitting, you agree to our verification terms. We verify
                this number against the official registry.
              </div>

              <div className="mt-6 flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="w-1/3"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button
                  className="w-2/3 bg-black hover:bg-gray-800"
                  onClick={() => submitKyb.mutate(formData)}
                  disabled={
                    submitKyb.isPending ||
                    !formData.regNumber ||
                    !formData.fullName
                  }
                >
                  {submitKyb.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                      Verifying...
                    </>
                  ) : (
                    "Submit Verification"
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* --- OPTIONAL: Additional Footer Link for context --- */}
        <p className="mt-8 text-center text-xs text-gray-400">
          Need help?{" "}
          <a
            href="mailto:support@partygeng.com"
            className="underline hover:text-gray-600"
          >
            Contact Support
          </a>
        </p>
      </div>
    </div>
  );
}
