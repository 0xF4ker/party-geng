import { AdminUsersTable } from "@/app/_components/admin/AdminUsersTable";
import { CreateUserModal } from "@/app/_components/admin/CreateUserModal";

export default function AdminClientsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Client Management</h1>
          <p className="text-gray-500">Manage standard user accounts.</p>
        </div>
        <CreateUserModal defaultRole="CLIENT" />
      </div>
      <AdminUsersTable initialRole="CLIENT" />
    </div>
  );
}
