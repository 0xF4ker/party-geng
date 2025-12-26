import { AdminUsersTable } from "@/app/_components/admin/AdminUsersTable";
import { CreateUserModal } from "@/app/_components/admin/CreateUserModal";

export default function AdminStaffPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin & Staff</h1>
          <p className="text-gray-500">Manage platform administrators and support staff.</p>
        </div>
        {/* Only Super Admins might see this button in real logic */}
        <CreateUserModal defaultRole="ADMIN" />
      </div>
      <AdminUsersTable initialRole="ADMIN" />
    </div>
  );
}
