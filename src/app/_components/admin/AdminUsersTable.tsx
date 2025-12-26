"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import {
  MoreHorizontal,
  Search,
  Trash2,
  UserCog,
  Loader2,
  Ban,
  Undo2,
  Eye,
  Calendar,
  Mail,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { UserActionModals } from "./UserActionModals";
import { UserDetailSheet } from "./UserDetailSheet";

// --- 1. TYPE INFERENCE ---
import { type inferRouterOutputs } from "@trpc/server";
import { type AppRouter } from "@/server/api/root"; // Ensure this path points to your appRouter export

type RouterOutputs = inferRouterOutputs<AppRouter>;

// We extract the array element type from the 'getUsers' query output
// getUsers returns { items: User[], nextCursor: ... }
type UserItem = RouterOutputs["user"]["getUsers"]["items"][number];

type ActionType = "DELETE" | "SUSPEND" | "ROLE";

interface AdminUsersTableProps {
  initialRole: "CLIENT" | "VENDOR" | "ADMIN";
}

export function AdminUsersTable({ initialRole }: AdminUsersTableProps) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState(initialRole);

  // Modal & Sheet State
  const [modalOpen, setModalOpen] = useState(false);
  const [activeAction, setActiveAction] = useState<ActionType | null>(null);

  // Strictly typed state using the inferred UserItem
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [viewUserId, setViewUserId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const { data, isLoading, refetch } = api.user.getUsers.useQuery({
    limit: 20,
    role: roleFilter,
    search: search || undefined,
  });

  const restoreMutation = api.user.restoreUser.useMutation({
    onSuccess: () => {
      toast.success("User account restored");
      void refetch();
    },
  });

  const openModal = (action: ActionType, user: UserItem) => {
    setSelectedUser(user);
    setActiveAction(action);
    setModalOpen(true);
  };

  const handleRestore = (userId: string) => restoreMutation.mutate({ userId });

  const handleViewUser = (userId: string) => {
    setViewUserId(userId);
    setIsDetailOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center justify-between gap-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            placeholder="Search..."
            className="h-10 w-full rounded-lg border border-gray-200 pr-4 pl-10 text-sm focus:border-pink-500 focus:outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="p-8 text-center">
          <Loader2 className="mx-auto animate-spin" />
        </div>
      ) : (
        <>
          {/* --- VIEW 1: DESKTOP TABLE --- */}
          <div className="hidden overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm md:block">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
                <tr>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Joined</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {/* No type assertion needed here, 'user' is automatically UserItem */}
                {data?.items.map((user) => (
                  <DesktopUserRow
                    key={user.id}
                    user={user}
                    onView={handleViewUser}
                    onAction={openModal}
                    onRestore={handleRestore}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* --- VIEW 2: MOBILE CARDS --- */}
          <div className="grid gap-4 md:hidden">
            {data?.items.map((user) => (
              <MobileUserCard
                key={user.id}
                user={user}
                onView={handleViewUser}
                onAction={openModal}
              />
            ))}
          </div>
        </>
      )}

      <UserDetailSheet
        userId={viewUserId}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
      />

      <UserActionModals
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        type={activeAction}
        user={selectedUser}
        onSuccess={refetch}
      />
    </div>
  );
}

// --- SUB-COMPONENTS ---

interface UserRowProps {
  user: UserItem;
  onView: (id: string) => void;
  onAction: (action: ActionType, user: UserItem) => void;
  onRestore?: (id: string) => void;
}

function DesktopUserRow({ user, onView, onAction, onRestore }: UserRowProps) {
  // Use nullish coalescing to safely handle potential nulls
  const displayName =
    user.clientProfile?.name ??
    user.vendorProfile?.companyName ??
    user.username;
  const displayAvatar =
    user.clientProfile?.avatarUrl ?? user.vendorProfile?.avatarUrl;
  const isSuspended = user.status === "SUSPENDED" || user.status === "BANNED";

  return (
    <tr className="group hover:bg-gray-50/50">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-gray-100">
            {displayAvatar ? (
              <img
                src={displayAvatar}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center font-bold text-gray-400">
                {user.username[0]?.toUpperCase() ?? "?"}
              </div>
            )}
          </div>
          <div>
            <p className="font-medium text-gray-900">{displayName}</p>
            <p className="text-xs text-gray-500">{user.email}</p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
          {user.role}
        </span>
      </td>
      <td className="px-6 py-4">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${user.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${user.status === "ACTIVE" ? "bg-emerald-500" : "bg-red-500"}`}
          ></span>
          {user.status}
        </span>
      </td>
      <td className="px-6 py-4">
        {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="icon" onClick={() => onView(user.id)}>
            <Eye className="h-4 w-4 text-gray-400" />
          </Button>
          <UserActionsDropdown
            user={user}
            onAction={onAction}
            onRestore={onRestore!}
            isSuspended={isSuspended}
          />
        </div>
      </td>
    </tr>
  );
}

function MobileUserCard({ user, onView, onAction }: UserRowProps) {
  const displayName =
    user.clientProfile?.name ??
    user.vendorProfile?.companyName ??
    user.username;
  const displayAvatar =
    user.clientProfile?.avatarUrl ?? user.vendorProfile?.avatarUrl;

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-gray-100">
            {displayAvatar ? (
              <img
                src={displayAvatar}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center font-bold text-gray-400">
                {user.username[0]?.toUpperCase() ?? "?"}
              </div>
            )}
          </div>
          <div>
            <p className="font-medium text-gray-900">{displayName}</p>
            <p className="flex items-center gap-1 text-xs text-gray-500">
              <Mail className="h-3 w-3" /> {user.email}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={() => onView(user.id)}>
          <Eye className="h-4 w-4 text-gray-400" />
        </Button>
      </div>

      <div className="flex items-center justify-between border-t border-gray-50 pt-3">
        <div className="flex gap-2">
          <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
            {user.role}
          </span>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${user.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}
          >
            {user.status}
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <Calendar className="h-3 w-3" />
          {formatDistanceToNow(new Date(user.createdAt))}
        </div>
      </div>

      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={() => onAction("ROLE", user)}
      >
        Manage User
      </Button>
    </div>
  );
}

interface DropdownProps {
  user: UserItem;
  onAction: (action: ActionType, user: UserItem) => void;
  onRestore: (id: string) => void;
  isSuspended: boolean;
}

function UserActionsDropdown({
  user,
  onAction,
  onRestore,
  isSuspended,
}: DropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => onAction("ROLE", user)}>
          <UserCog className="mr-2 h-4 w-4" /> Update Role
        </DropdownMenuItem>
        {isSuspended ? (
          <DropdownMenuItem onClick={() => onRestore(user.id)}>
            <Undo2 className="mr-2 h-4 w-4" /> Restore Access
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            onClick={() => onAction("SUSPEND", user)}
            className="text-orange-600"
          >
            <Ban className="mr-2 h-4 w-4" /> Suspend User
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => onAction("DELETE", user)}
          className="text-red-600"
        >
          <Trash2 className="mr-2 h-4 w-4" /> Delete Account
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
