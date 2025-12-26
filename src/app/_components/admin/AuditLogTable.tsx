"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import {
  Search,
  Filter,
  Eye,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Shield,
  FileJson,
  Calendar,
  Database,
  User as UserIcon,
  Tag
} from "lucide-react";
import { format } from "date-fns";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

// --- HELPERS ---
const ActionBadge = ({ action }: { action: string }) => {
  let colorClass = "bg-gray-100 text-gray-600 border-gray-200"; // Default
  
  if (action.includes("CREATE")) colorClass = "bg-emerald-100 text-emerald-700 border-emerald-200";
  if (action.includes("UPDATE")) colorClass = "bg-blue-100 text-blue-700 border-blue-200";
  if (action.includes("DELETE")) colorClass = "bg-red-100 text-red-700 border-red-200";
  if (action.includes("LOGIN") || action.includes("AUTH")) colorClass = "bg-purple-100 text-purple-700 border-purple-200";
  if (action.includes("PAYOUT") || action.includes("TRANSFER")) colorClass = "bg-orange-100 text-orange-700 border-orange-200";
  if (action.includes("SUSPEND") || action.includes("BAN")) colorClass = "bg-red-100 text-red-800 border-red-200";

  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-1 text-[10px] sm:text-xs font-medium ${colorClass}`}>
      {action.replace(/_/g, " ")}
    </span>
  );
};

export function AuditLogTable() {
  const [page, setPage] = useState(1);
  const pageSize = 20;
  
  // Filters
  const [entityFilter, setEntityFilter] = useState<string>("ALL");
  const [userSearch, setUserSearch] = useState("");
  
  // Detail View State
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Query
  const { data, isLoading } = api.activityLog.getAllLogs.useQuery({
    limit: pageSize,
    offset: (page - 1) * pageSize,
    entityType: entityFilter === "ALL" ? undefined : entityFilter,
    userId: userSearch || undefined, 
  });

  const totalPages = data ? Math.ceil(data.totalCount / pageSize) : 0;

  const handleViewLog = (log: any) => {
    setSelectedLog(log);
    setIsSheetOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* 1. RESPONSIVE TOOLBAR */}
      <div className="flex flex-col gap-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        
        {/* Inputs Stack */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center flex-1">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input 
              placeholder="Search User ID..." 
              className="pl-9 h-10 w-full rounded-lg bg-gray-50 border-gray-200 focus:bg-white transition-colors"
              value={userSearch}
              onChange={(e) => { setUserSearch(e.target.value); setPage(1); }}
            />
          </div>
          
          <Select 
            value={entityFilter} 
            onValueChange={(val) => { setEntityFilter(val); setPage(1); }}
          >
            <SelectTrigger className="w-full sm:w-[180px] h-10 bg-gray-50 border-gray-200 focus:bg-white">
              <div className="flex items-center gap-2 text-gray-600">
                <Filter className="h-4 w-4" />
                <SelectValue placeholder="Entity Type" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Entities</SelectItem>
              <SelectItem value="USER">User</SelectItem>
              <SelectItem value="ORDER">Order</SelectItem>
              <SelectItem value="TRANSACTION">Transaction</SelectItem>
              <SelectItem value="CATEGORY">Category</SelectItem>
              <SelectItem value="SERVICE">Service</SelectItem>
              <SelectItem value="AUTH">Auth / Security</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Count Badge */}
        <div className="hidden md:flex items-center gap-2 text-xs font-medium text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full">
          <Database className="h-3.5 w-3.5" />
          <span>{isLoading ? "..." : data?.totalCount} Records</span>
        </div>
      </div>

      {isLoading ? (
        <div className="p-12 text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-pink-600" /></div>
      ) : data?.logs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-12 text-center text-gray-400">
           No logs found matching criteria.
        </div>
      ) : (
        <>
          {/* --- VIEW 1: DESKTOP TABLE --- */}
          <div className="hidden md:block overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500">
                <tr>
                  <th className="px-6 py-4">Timestamp</th>
                  <th className="px-6 py-4">Actor</th>
                  <th className="px-6 py-4">Action</th>
                  <th className="px-6 py-4">Entity</th>
                  <th className="px-6 py-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs whitespace-nowrap text-gray-500">
                      {format(new Date(log.createdAt), "MMM d, HH:mm:ss")}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">{log.user.username}</span>
                        <span className="text-xs text-gray-400">{log.user.role}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <ActionBadge action={log.action} />
                    </td>
                    <td className="px-6 py-4">
                      {log.entityType ? (
                        <div className="flex items-center gap-2 text-xs">
                          <Badge variant="outline" className="text-gray-500 font-normal border-gray-200 bg-gray-50">{log.entityType}</Badge>
                          <span className="font-mono text-gray-400" title={log.entityId || ""}>
                            #{log.entityId?.slice(0, 6)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleViewLog(log)}
                        className="text-gray-400 hover:text-pink-600 hover:bg-pink-50"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* --- VIEW 2: MOBILE CARDS --- */}
          <div className="grid gap-3 md:hidden">
             {data.logs.map((log) => (
               <div key={log.id} className="flex flex-col gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm active:bg-gray-50">
                 <div className="flex items-start justify-between">
                    <ActionBadge action={log.action} />
                    <span className="text-xs font-mono text-gray-400">
                       {format(new Date(log.createdAt), "MMM d, HH:mm")}
                    </span>
                 </div>
                 
                 <div className="flex items-center gap-3 py-1">
                    <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                       {log.user.username[0].toUpperCase()}
                    </div>
                    <div>
                       <p className="text-sm font-semibold text-gray-900">{log.user.username}</p>
                       <p className="text-xs text-gray-500">{log.user.role}</p>
                    </div>
                 </div>

                 <div className="flex items-center justify-between border-t border-gray-50 pt-3">
                    <div className="flex items-center gap-2">
                       {log.entityType ? (
                         <>
                           <Tag className="h-3.5 w-3.5 text-gray-400" />
                           <span className="text-xs font-medium text-gray-700">{log.entityType}</span>
                           <span className="text-xs font-mono text-gray-400">#{log.entityId?.slice(0,4)}</span>
                         </>
                       ) : (
                         <span className="text-xs text-gray-400 italic">System Event</span>
                       )}
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleViewLog(log)} className="h-8 text-pink-600 hover:text-pink-700 hover:bg-pink-50">
                       View Details
                    </Button>
                 </div>
               </div>
             ))}
          </div>

          {/* PAGINATION (Shared) */}
          <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50 rounded-lg p-4 mt-2">
            <div className="text-xs text-gray-500">
              Page {page} of {totalPages || 1}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}

      {/* 3. LOG DETAIL SHEET (Responsive) */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-full sm:max-w-md flex flex-col h-full border-l border-gray-100">
          {selectedLog && (
            <>
              <SheetHeader className="pb-6 border-b border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="font-mono text-xs">LOG #{selectedLog.id.slice(0,6)}</Badge>
                  <span className="text-xs text-gray-400">{format(new Date(selectedLog.createdAt), "HH:mm")}</span>
                </div>
                <SheetTitle className="text-xl font-bold">Log Details</SheetTitle>
                <SheetDescription>
                  Full audit trail for this system event.
                </SheetDescription>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto py-6 space-y-6">
                
                {/* Meta Information Block */}
                <div className="space-y-3">
                   <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Event Context</h4>
                   <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-3">
                      <div className="flex justify-between items-center">
                         <div className="flex items-center gap-2 text-sm text-gray-600">
                            <UserIcon className="h-4 w-4" /> Actor
                         </div>
                         <div className="text-right">
                            <div className="text-sm font-semibold text-gray-900">{selectedLog.user.username}</div>
                            <div className="text-xs text-gray-500">{selectedLog.user.email}</div>
                         </div>
                      </div>
                      <div className="flex justify-between items-center border-t border-gray-200 pt-3">
                         <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Shield className="h-4 w-4" /> Action
                         </div>
                         <ActionBadge action={selectedLog.action} />
                      </div>
                      {selectedLog.entityType && (
                        <div className="flex justify-between items-center border-t border-gray-200 pt-3">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                             <Database className="h-4 w-4" /> Target
                          </div>
                          <div className="text-right">
                              <Badge variant="secondary" className="bg-white">{selectedLog.entityType}</Badge>
                              <div className="text-xs font-mono text-gray-500 mt-1">{selectedLog.entityId}</div>
                          </div>
                        </div>
                      )}
                   </div>
                </div>

                {/* JSON Details Block */}
                <div className="space-y-3">
                   <div className="flex items-center justify-between">
                     <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Payload Data</h4>
                     <FileJson className="h-4 w-4 text-gray-400" />
                   </div>
                   <div className="rounded-xl border border-gray-800 bg-[#0F172A] p-4 overflow-x-auto shadow-inner">
                      <pre className="text-xs font-mono text-emerald-400 leading-relaxed whitespace-pre-wrap">
                        {JSON.stringify(selectedLog.details, null, 2) || "// No additional details recorded"}
                      </pre>
                   </div>
                   <p className="text-[10px] text-gray-500">
                     * This JSON payload represents the metadata captured at the exact moment of the event.
                   </p>
                </div>
              </div>

              <SheetFooter className="border-t border-gray-100 pt-4 sm:justify-center">
                 <Button variant="outline" className="w-full" onClick={() => setIsSheetOpen(false)}>
                   Close Log
                 </Button>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
