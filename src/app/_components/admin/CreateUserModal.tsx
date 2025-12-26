"use client";

import { useState } from "react";
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
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

// Define the full set of roles available in the system
type UserRole = "CLIENT" | "VENDOR" | "ADMIN" | "SUPPORT" | "FINANCE";

// Helper to check if a role is an admin-type role
const isAdminRole = (
  role: UserRole,
): role is "ADMIN" | "SUPPORT" | "FINANCE" => {
  return ["ADMIN", "SUPPORT", "FINANCE"].includes(role);
};

export function CreateUserModal({
  defaultRole,
}: {
  defaultRole: UserRole; // Updated type to include SUPPORT/FINANCE
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);

  const supabase = createClient();

  const createUserMutation = api.user.createUser.useMutation();
  const createAdminMutation = api.user.adminCreateUser.useMutation();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Step A: Create in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: { username: formData.username, role: defaultRole },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("No user returned from Supabase");

      const userId = authData.user.id;

      // Step B: Sync to Database using the correct mutation based on role
      if (isAdminRole(defaultRole)) {
        // TS specifically knows defaultRole is "ADMIN" | "SUPPORT" | "FINANCE" here
        await createAdminMutation.mutateAsync({
          id: userId,
          email: formData.email,
          username: formData.username,
          role: defaultRole,
        });
      } else {
        // TS knows defaultRole is "CLIENT" | "VENDOR" here
        await createUserMutation.mutateAsync({
          id: userId,
          email: formData.email,
          username: formData.username,
          role: defaultRole,
        });
      }

      toast.success("User created successfully!");
      setIsOpen(false);
      setFormData({ email: "", username: "", password: "" });
    } catch (err) {
      // Safer error handling without explicit 'any'
      const message =
        err instanceof Error ? err.message : "Failed to create user";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-pink-600 text-white hover:bg-pink-700">
          <Plus className="mr-2 h-4 w-4" /> Create {defaultRole.toLowerCase()}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New {defaultRole}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleCreate} className="space-y-4 pt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Username</label>
            <input
              required
              className="w-full rounded-md border p-2"
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
              className="w-full rounded-md border p-2"
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
              className="w-full rounded-md border p-2"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-pink-600"
            disabled={loading}
          >
            {loading ? "Creating..." : "Create Account"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
