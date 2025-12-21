"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Bell,
  Shield,
  MessageSquare,
  Moon,
  Volume2,
  Mail,
  UserX,
  Loader2,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface ChatSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChatSettingsModal = ({
  isOpen,
  onClose,
}: ChatSettingsModalProps) => {
  const [activeTab, setActiveTab] = useState<"general" | "privacy">("general");

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl gap-0 p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>Chat Settings</DialogTitle>
          <DialogDescription>
            Manage your messaging preferences and privacy.
          </DialogDescription>
        </DialogHeader>

        <div className="flex h-[500px]">
          {/* Sidebar */}
          <div className="w-1/3 border-r bg-gray-50/50 p-2 space-y-1">
            <button
              onClick={() => setActiveTab("general")}
              className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                activeTab === "general"
                  ? "bg-white text-pink-600 shadow-sm"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <MessageSquare className="h-4 w-4" />
              General
            </button>
            <button
              onClick={() => setActiveTab("privacy")}
              className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                activeTab === "privacy"
                  ? "bg-white text-pink-600 shadow-sm"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <Shield className="h-4 w-4" />
              Privacy & Blocking
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === "general" ? <GeneralSettings /> : <PrivacySettings />}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const GeneralSettings = () => {
  const utils = api.useUtils();
  const { data: settings, isLoading } = api.chat.getSettings.useQuery();

  const mutation = api.chat.updateSettings.useMutation({
    onMutate: async (newSettings) => {
      await utils.chat.getSettings.cancel();
      const previousSettings = utils.chat.getSettings.getData();

      utils.chat.getSettings.setData(undefined, (old) => {
        if (!old) return undefined;
        return { ...old, ...newSettings };
      });

      return { previousSettings };
    },
    onError: (err, newSettings, context) => {
      toast.error("Failed to update settings");
      if (context?.previousSettings) {
        utils.chat.getSettings.setData(undefined, context.previousSettings);
      }
    },
    onSettled: () => {
      utils.chat.getSettings.invalidate();
    },
  });

  const toggle = (key: string, value: boolean) => {
    mutation.mutate({ [key]: value });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-pink-600" />
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
          Messaging Preferences
        </h3>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <label className="text-sm font-medium">Read Receipts</label>
            <p className="text-xs text-gray-500">
              Let others know when you've read their messages.
            </p>
          </div>
          <Switch
            checked={settings.readReceipts}
            onCheckedChange={(checked) => toggle("readReceipts", checked)}
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <label className="text-sm font-medium">Typing Indicators</label>
            <p className="text-xs text-gray-500">
              Show when you are typing a message.
            </p>
          </div>
          <Switch
            checked={settings.typingIndicators}
            onCheckedChange={(checked) => toggle("typingIndicators", checked)}
          />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
          Notifications
        </h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="h-4 w-4 text-gray-500" />
            <div className="space-y-0.5">
              <label className="text-sm font-medium">Mute All</label>
              <p className="text-xs text-gray-500">
                Disable all chat notifications.
              </p>
            </div>
          </div>
          <Switch
            checked={settings.muteAll}
            onCheckedChange={(checked) => toggle("muteAll", checked)}
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Volume2 className="h-4 w-4 text-gray-500" />
            <div className="space-y-0.5">
              <label className="text-sm font-medium">Sound</label>
            </div>
          </div>
          <Switch
            checked={settings.soundEnabled}
            onCheckedChange={(checked) => toggle("soundEnabled", checked)}
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Mail className="h-4 w-4 text-gray-500" />
            <div className="space-y-0.5">
              <label className="text-sm font-medium">Email Notifications</label>
            </div>
          </div>
          <Switch
            checked={settings.emailNotifications}
            onCheckedChange={(checked) => toggle("emailNotifications", checked)}
          />
        </div>
      </div>
      
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
          Appearance
        </h3>
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-3">
            <Moon className="h-4 w-4 text-gray-500" />
            <div className="space-y-0.5">
              <label className="text-sm font-medium">Theme</label>
              <p className="text-xs text-gray-500">
                {settings.theme === "light" ? "Light Mode" : settings.theme === "dark" ? "Dark Mode" : "System"}
              </p>
            </div>
          </div>
          {/* Simple toggle for now, could be a select */}
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => toggle("theme", settings.theme === "light" ? "dark" : "light" as any)}
          >
            Switch to {settings.theme === "light" ? "Dark" : "Light"}
          </Button>
        </div>
      </div>
    </div>
  );
};

const PrivacySettings = () => {
  const { data: blockedUsers, isLoading, refetch } = api.user.getBlockedUsers.useQuery();
  const utils = api.useUtils();

  const unblockMutation = api.user.unblockUser.useMutation({
    onSuccess: () => {
      toast.success("User unblocked");
      refetch();
      // Invalidate conversations to refresh lists if needed
      utils.chat.getConversations.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">
          Blocked Users
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          Blocked users cannot message you or view your profile.
        </p>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-pink-600" />
          </div>
        ) : blockedUsers?.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed py-12 text-center">
            <UserX className="h-8 w-8 text-gray-300 mb-2" />
            <p className="text-sm text-gray-500">You haven't blocked anyone yet.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {blockedUsers?.map((block) => (
              <li key={block.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={block.blocked.clientProfile?.avatarUrl ?? block.blocked.vendorProfile?.avatarUrl ?? undefined} />
                    <AvatarFallback>{block.blocked.username[0].toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {block.blocked.clientProfile?.name ?? block.blocked.vendorProfile?.companyName ?? block.blocked.username}
                    </p>
                    <p className="text-xs text-gray-500">@{block.blocked.username}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => unblockMutation.mutate({ userIdToUnblock: block.blockedId })}
                  disabled={unblockMutation.isPending}
                >
                  Unblock
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};