import { AuditLogTable } from "@/app/_components/admin/AuditLogTable";

export default function AdminAuditPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">System Audit Logs</h1>
        <p className="text-gray-500">
          Traceable history of all administrative actions, system events, and security triggers.
        </p>
      </div>

      <AuditLogTable />
    </div>
  );
}
