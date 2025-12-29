"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

// Types
import { type inferRouterOutputs } from "@trpc/server";
import { type AppRouter } from "@/server/api/root";

type RouterOutputs = inferRouterOutputs<AppRouter>;
type UserItem = RouterOutputs["user"]["getUsers"]["items"][number];
type ActionType = "DELETE" | "SUSPEND" | "ROLE";

interface UserActionModalsProps {
  isOpen: boolean;
  onClose: () => void;
  type: ActionType | null;
  user: UserItem | null;
  onSuccess: () => void;
}

export function UserActionModals({
  isOpen,
  onClose,
  type,
  user,
  onSuccess,
}: UserActionModalsProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(val) => !val && onClose()}>
      <DialogContent>
        {user && type ? (
          <ActionFormContent
            key={`${user.id}-${type}`} // Forces a fresh start for every new action/user
            user={user}
            type={type}
            onClose={onClose}
            onSuccess={onSuccess}
          />
        ) : (
          <div className="flex h-20 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-gray-300" />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// --- SUB-COMPONENT: HANDLES STATE & LOGIC ---
// Splitting this out ensures state is fresh every time it mounts.

function ActionFormContent({
  user,
  type,
  onClose,
  onSuccess,
}: {
  user: UserItem;
  type: ActionType;
  onClose: () => void;
  onSuccess: () => void;
}) {
  // Initialize state directly from props (Lazy initialization)
  // This runs only once when this sub-component mounts.
  const [reason, setReason] = useState("");
  const [newRole, setNewRole] = useState<string>(() => {
    if (["ADMIN", "SUPPORT", "FINANCE"].includes(user.role)) {
      return user.role;
    }
    return "";
  });

  const utils = api.useContext();

  // Mutations
  const suspendMutation = api.user.suspendUser.useMutation({
    onSuccess: () => {
      toast.success("User suspended successfully");
      onSuccess();
      onClose();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = api.user.deleteUser.useMutation({
    onSuccess: () => {
      toast.success("User deleted successfully");
      onSuccess();
      onClose();
    },
    onError: (err) => toast.error(err.message),
  });

  const roleMutation = api.user.updateUserRole.useMutation({
    onSuccess: () => {
      toast.success("User role updated successfully");
      onSuccess();
      onClose();
    },
    onError: (err) => toast.error(err.message),
  });

  const isLoading =
    suspendMutation.isPending ||
    deleteMutation.isPending ||
    roleMutation.isPending;

  const handleSubmit = () => {
    if (type === "SUSPEND") {
      suspendMutation.mutate({
        userId: user.id,
        reason: reason,
        durationDays: 30,
      });
    } else if (type === "DELETE") {
      deleteMutation.mutate({ userId: user.id });
    } else if (type === "ROLE") {
      roleMutation.mutate({
        userId: user.id,
        newRole: newRole as "ADMIN" | "SUPPORT" | "FINANCE",
      });
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {type === "DELETE" && "Delete User Account"}
          {type === "SUSPEND" && "Suspend User Account"}
          {type === "ROLE" && "Update Admin Role"}
        </DialogTitle>
        <DialogDescription>
          Selected User:{" "}
          <span className="text-foreground font-semibold">{user.username}</span>{" "}
          ({user.email})
        </DialogDescription>
      </DialogHeader>

      {/* --- DELETE FORM --- */}
      {type === "DELETE" && (
        <div className="py-4">
          <p className="rounded-md border border-red-100 bg-red-50 p-3 text-sm text-red-600">
            Warning: This action is permanent and cannot be undone. All data
            associated with this user will be removed.
          </p>
        </div>
      )}

      {/* --- SUSPEND FORM --- */}
      {type === "SUSPEND" && (
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Reason for Suspension</Label>
            <Input
              placeholder="Violation of terms..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* --- ROLE FORM --- */}
      {type === "ROLE" && (
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Select New Role</Label>
            <Select value={newRole} onValueChange={setNewRole}>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADMIN">Super Admin</SelectItem>
                <SelectItem value="SUPPORT">Support</SelectItem>
                <SelectItem value="FINANCE">Finance</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-muted-foreground text-xs">
              Note: You can only switch roles between internal admin teams.
            </p>
          </div>
        </div>
      )}

      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          variant={type === "DELETE" ? "destructive" : "default"}
          onClick={handleSubmit}
          disabled={
            isLoading ||
            (type === "SUSPEND" && !reason) ||
            (type === "ROLE" && !newRole)
          }
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Confirm
        </Button>
      </DialogFooter>
    </>
  );
}
