import { AdminUsersTable } from "@/app/_components/admin/AdminUsersTable";
import { CreateUserModal } from "@/app/_components/admin/CreateUserModal";

export default function AdminVendorsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vendor Management</h1>
          <p className="text-gray-500">Manage service providers and businesses.</p>
        </div>
        <CreateUserModal defaultRole="VENDOR" />
      </div>
      <AdminUsersTable initialRole="VENDOR" />
    </div>
  );
}
