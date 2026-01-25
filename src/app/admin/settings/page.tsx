"use client";

import { useEffect, useState } from "react";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import {
  Save,
  DollarSign,
  Lock,
  Mail,
  ShieldCheck,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function AdminSettingsPage() {
  const utils = api.useUtils();

  const [formData, setFormData] = useState({
    serviceFeePercent: 5.0,
    minWithdrawalAmount: 2000,
    vendorSubscriptionFee: 5000,
    payoutDelayDays: 3,
    maintenanceMode: false,
    allowNewRegistrations: true,
    isKybEnabled: true,
    supportEmail: "",
    supportPhone: "",
  });

  const { data: settings, isLoading } = api.admin.getGlobalSettings.useQuery();

  useEffect(() => {
    if (settings) {
      setFormData({
        serviceFeePercent: settings.serviceFeePercent,
        minWithdrawalAmount: settings.minWithdrawalAmount,
        vendorSubscriptionFee: settings.vendorSubscriptionFee ?? 5000,
        payoutDelayDays: settings.payoutDelayDays,
        maintenanceMode: settings.maintenanceMode,
        allowNewRegistrations: settings.allowNewRegistrations,
        isKybEnabled: settings.isKybEnabled,
        supportEmail: settings.supportEmail,
        supportPhone: settings.supportPhone ?? "",
      });
    }
  }, [settings]);

  const mutation = api.admin.updateGlobalSettings.useMutation({
    onSuccess: () => {
      toast.success("System settings updated");
      void utils.admin.getGlobalSettings.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSave = () => {
    mutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            System Settings
          </h1>
          <p className="text-sm text-gray-500">
            Configure global business logic and emergency controls.
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={mutation.isPending}
          className="bg-black hover:bg-gray-800"
        >
          {mutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save Changes
        </Button>
      </div>

      <div className="grid gap-6">
        {/* 1. FINANCIAL CONFIGURATION */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <DollarSign className="h-5 w-5 text-green-600" /> Financials
            </CardTitle>
            <CardDescription>
              Manage fees and payout thresholds.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Service Fee (%)</Label>
              <div className="relative">
                <Input
                  type="number"
                  value={formData.serviceFeePercent}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      serviceFeePercent: parseFloat(e.target.value),
                    })
                  }
                />
                <span className="absolute top-2.5 right-3 text-sm text-gray-400">
                  %
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Taken from Vendor earnings per order.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Vendor One-Time Fee (₦)</Label>
              <Input
                type="number"
                value={formData.vendorSubscriptionFee}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    vendorSubscriptionFee: parseFloat(e.target.value),
                  })
                }
              />
              <p className="text-xs text-gray-500">
                Fee charged to vendors after KYB verification.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Min Withdrawal (₦)</Label>
              <Input
                type="number"
                value={formData.minWithdrawalAmount}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    minWithdrawalAmount: parseFloat(e.target.value),
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Payout Delay (Days)</Label>
              <Input
                type="number"
                value={formData.payoutDelayDays}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    payoutDelayDays: parseFloat(e.target.value),
                  })
                }
              />
              <p className="text-xs text-gray-500">
                Days to hold funds after order completion.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 2. ACCESS & SECURITY */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lock className="h-5 w-5 text-orange-600" /> Access Control
            </CardTitle>
            <CardDescription>
              Emergency switches and feature toggles.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label className="text-base">Allow New Registrations</Label>
                <p className="text-sm text-gray-500">
                  If disabled, new users cannot sign up.
                </p>
              </div>
              <Switch
                checked={formData.allowNewRegistrations}
                onCheckedChange={(c) =>
                  setFormData({ ...formData, allowNewRegistrations: c })
                }
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Label className="text-base">Force KYB Verification</Label>
                  <ShieldCheck className="h-4 w-4 text-blue-500" />
                </div>
                <p className="text-sm text-gray-500">
                  Require vendors to be verified before accepting orders.
                </p>
              </div>
              <Switch
                checked={formData.isKybEnabled}
                onCheckedChange={(c) =>
                  setFormData({ ...formData, isKybEnabled: c })
                }
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-4">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertTriangle className="h-4 w-4" />
                  <Label className="text-base font-bold text-red-700">
                    Maintenance Mode
                  </Label>
                </div>
                <p className="text-sm text-red-600/80">
                  Disconnects all non-admin users. Only enable in emergencies.
                </p>
              </div>
              <Switch
                checked={formData.maintenanceMode}
                onCheckedChange={(c) =>
                  setFormData({ ...formData, maintenanceMode: c })
                }
                className="data-[state=checked]:bg-red-600"
              />
            </div>
          </CardContent>
        </Card>

        {/* 3. CONTACT INFO */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Mail className="h-5 w-5 text-blue-600" /> Support Contact
            </CardTitle>
            <CardDescription>
              Visible to users in the help center and emails.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Support Email</Label>
              <Input
                value={formData.supportEmail}
                onChange={(e) =>
                  setFormData({ ...formData, supportEmail: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Support Phone (Optional)</Label>
              <Input
                value={formData.supportPhone}
                onChange={(e) =>
                  setFormData({ ...formData, supportPhone: e.target.value })
                }
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
