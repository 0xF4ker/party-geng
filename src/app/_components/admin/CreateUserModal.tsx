"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

// Define the full set of roles
type UserRole = "CLIENT" | "VENDOR" | "ADMIN" | "SUPPORT" | "FINANCE";

// Helper to check if a role is an admin-type role
const isAdminRole = (
  role: UserRole,
): role is "ADMIN" | "SUPPORT" | "FINANCE" => {
  return ["ADMIN", "SUPPORT", "FINANCE"].includes(role);
};

export function CreateUserModal({ defaultRole }: { defaultRole: UserRole }) {
  const [isOpen, setIsOpen] = useState(false);

  // State for the role actually being created
  const [selectedRole, setSelectedRole] = useState<UserRole>(defaultRole);

  const [formData, setFormData] = useState({
    email: "",
    username: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);

  // Reset selected role when modal opens or default changes
  useEffect(() => {
    if (isOpen) {
      setSelectedRole(defaultRole);
    }
  }, [isOpen, defaultRole]);

  const supabase = createClient();
  const createUserMutation = api.user.createUser.useMutation();
  const createAdminMutation = api.user.adminCreateUser.useMutation();
  const utils = api.useUtils(); // To invalidate list after creation

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Step A: Create in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          // Use selectedRole here, not defaultRole
          data: { username: formData.username, role: selectedRole },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("No user returned from Supabase");

      const userId = authData.user.id;

      // Step B: Sync to Database using the correct mutation
      if (isAdminRole(selectedRole)) {
        await createAdminMutation.mutateAsync({
          id: userId,
          email: formData.email,
          username: formData.username,
          role: selectedRole,
        });
      } else {
        await createUserMutation.mutateAsync({
          id: userId,
          email: formData.email,
          username: formData.username,
          role: selectedRole,
        });
      }

      toast.success(`${selectedRole} created successfully!`);

      // Refresh the list
      void utils.user.getUsers.invalidate();

      setIsOpen(false);
      setFormData({ email: "", username: "", password: "" });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create user";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const isAdminContext = isAdminRole(defaultRole);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-pink-600 text-white hover:bg-pink-700">
          <Plus className="mr-2 h-4 w-4" />
          Create {isAdminContext ? "Admin" : defaultRole.toLowerCase()}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Create New {isAdminContext ? "Admin User" : defaultRole}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleCreate} className="space-y-4 pt-4">
          {/* Only show Role Selector if we are in an Admin context */}
          {isAdminContext && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Role</label>
              <Select
                value={selectedRole}
                onValueChange={(val) => setSelectedRole(val as UserRole)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Super Admin</SelectItem>
                  <SelectItem value="SUPPORT">Support Agent</SelectItem>
                  <SelectItem value="FINANCE">Finance Manager</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Username</label>
            <input
              required
              className="w-full rounded-md border p-2 text-sm"
              value={formData.username}
              onChange={(e) =>
                setFormData({ ...formData, username: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <input
              required
              type="email"
              className="w-full rounded-md border p-2 text-sm"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Password</label>
            <input
              required
              type="password"
              minLength={6}
              className="w-full rounded-md border p-2 text-sm"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-pink-600 hover:bg-pink-700"
            disabled={loading}
          >
            {loading ? "Creating..." : "Create Account"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
