"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, AlertTriangle } from "lucide-react";

type ActionType = "DELETE" | "SUSPEND" | "ROLE" | null;

interface UserActionModalsProps {
  isOpen: boolean;
  onClose: () => void;
  type: ActionType;
  user: { id: string; username: string; role: string } | null;
  onSuccess: () => void;
}

export function UserActionModals({ isOpen, onClose, type, user, onSuccess }: UserActionModalsProps) {
  const [loading, setLoading] = useState(false);
  
  // Form States
  const [suspendReason, setSuspendReason] = useState("");
  const [suspendDuration, setSuspendDuration] = useState("7"); // "7", "30", "permanent"
  const [newRole, setNewRole] = useState(user?.role || "CLIENT");

  // API Mutations
  const deleteMutation = api.user.deleteUser.useMutation();
  const suspendMutation = api.user.suspendUser.useMutation();
  const roleMutation = api.user.updateUserRole.useMutation();

  if (!user) return null;

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteMutation.mutateAsync({ userId: user.id });
      toast.success("User permanently deleted");
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSuspend = async () => {
    setLoading(true);
    try {
      await suspendMutation.mutateAsync({
        userId: user.id,
        reason: suspendReason,
        durationDays: suspendDuration === "permanent" ? undefined : parseInt(suspendDuration),
      });
      toast.success(suspendDuration === "permanent" ? "User banned" : "User suspended");
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleUpdate = async () => {
    setLoading(true);
    try {
      await roleMutation.mutateAsync({
        userId: user.id,
        newRole: newRole as any,
      });
      toast.success("Role updated successfully");
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        
        {/* DELETE MODAL */}
        {type === "DELETE" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" /> Delete Account
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to delete <strong>{user.username}</strong>? This action cannot be undone and will remove all associated data.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
              <Button variant="destructive" onClick={handleDelete} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Delete Permanently
              </Button>
            </DialogFooter>
          </>
        )}

        {/* SUSPEND MODAL */}
        {type === "SUSPEND" && (
          <>
            <DialogHeader>
              <DialogTitle>Suspend Account</DialogTitle>
              <DialogDescription>
                Restrict access for <strong>{user.username}</strong>.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Duration</Label>
                <Select value={suspendDuration} onValueChange={setSuspendDuration}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 Days</SelectItem>
                    <SelectItem value="30">30 Days</SelectItem>
                    <SelectItem value="permanent">Permanent Ban</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Reason</Label>
                <Textarea 
                  placeholder="Violation of terms..." 
                  value={suspendReason} 
                  onChange={(e) => setSuspendReason(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
              <Button onClick={handleSuspend} disabled={loading || !suspendReason}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirm Suspension
              </Button>
            </DialogFooter>
          </>
        )}

        {/* ROLE MODAL */}
        {type === "ROLE" && (
          <>
            <DialogHeader>
              <DialogTitle>Update Role</DialogTitle>
              <DialogDescription>
                Change permissions for <strong>{user.username}</strong>.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label className="mb-2 block">Select Role</Label>
              <Select value={newRole} onValueChange={setNewRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CLIENT">Client</SelectItem>
                    <SelectItem value="VENDOR">Vendor</SelectItem>
                    <SelectItem value="SUPPORT">Support</SelectItem>
                    <SelectItem value="FINANCE">Finance</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                  </SelectContent>
                </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
              <Button onClick={handleRoleUpdate} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Role
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
