"use client";

import React, { useState } from "react";
import Image from "next/image";
import { api } from "@/trpc/react";
import { formatDistanceToNow } from "date-fns";
import {
  ShieldAlert,
  Loader2,
  CheckCircle2,
  XCircle,
  Trash2,
  Ban,
  UserX,
  MessageSquare,
  AlertTriangle,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

// --- 1. Define Types ---
// These should ideally be inferred from your TRPC output helper,
// but for this file, explicit interfaces clarify what we expect.

interface ReportUser {
  id: string;
  username: string;
  email: string;
  status: "ACTIVE" | "SUSPENDED" | "BANNED";
  clientProfile?: { avatarUrl: string | null } | null;
  vendorProfile?: { avatarUrl: string | null } | null;
}

interface ReportPost {
  id: string;
  caption: string | null;
  author: { username: string };
  assets: { url: string }[];
}

interface Report {
  id: string;
  reason: string;
  details: string | null;
  status: "PENDING" | "RESOLVED" | "DISMISSED";
  createdAt: string | Date;
  targetPostId?: string | null;
  targetUserId?: string | null;
  reporter: { username: string; email: string };
  targetUser?: ReportUser | null;
  targetPost?: ReportPost | null;
}

export default function AdminReportsPage() {
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  const { data, isLoading, refetch } = api.report.getAll.useQuery({
    status: "PENDING",
    limit: 50,
  });

  // Explicitly cast or validate the data if TRPC types aren't perfectly aligned yet
  const reports = (data?.reports ?? []) as unknown as Report[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Report Center</h1>
          <p className="text-muted-foreground">
            Review and adjudicate user reports.
          </p>
        </div>
        <div className="flex gap-2">
          <Badge
            variant="outline"
            className="gap-1 border-orange-200 bg-orange-50 px-3 py-1 text-orange-700"
          >
            <AlertTriangle className="h-3 w-3" />
            {reports.length} Pending
          </Badge>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : reports.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center text-gray-500">
            <CheckCircle2 className="mb-2 h-10 w-10 text-green-500" />
            <p>All clean! No pending reports.</p>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-gray-50 font-medium text-gray-500">
              <tr>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Reason</th>
                <th className="px-6 py-4">Target</th>
                <th className="px-6 py-4">Reported By</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {reports.map((report) => (
                <tr key={report.id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4">
                    {report.targetPostId ? (
                      <Badge variant="secondary">
                        <MessageSquare className="mr-1 h-3 w-3" /> Post
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <UserX className="mr-1 h-3 w-3" /> User
                      </Badge>
                    )}
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {report.reason.replace(/_/g, " ")}
                  </td>
                  <td className="px-6 py-4">
                    {report.targetPost ? (
                      <span className="line-clamp-1 max-w-[200px] text-gray-600">
                        {report.targetPost.caption ?? "Image Post"}
                      </span>
                    ) : report.targetUser ? (
                      <div className="flex items-center gap-2">
                        <div className="relative h-6 w-6 overflow-hidden rounded-full bg-gray-200">
                          {/* Placeholder avatar logic */}
                          <div className="flex h-full w-full items-center justify-center text-[10px] font-bold text-gray-500">
                            {report.targetUser.username.charAt(0).toUpperCase()}
                          </div>
                        </div>
                        <span className="font-semibold">
                          @{report.targetUser.username}
                        </span>
                      </div>
                    ) : (
                      <span className="text-red-500 italic">
                        Deleted Content
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    @{report.reporter.username}
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {formatDistanceToNow(new Date(report.createdAt), {
                      addSuffix: true,
                    })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedReport(report)}
                    >
                      Review
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <ReportReviewSheet
        report={selectedReport}
        open={!!selectedReport}
        onClose={() => {
          setSelectedReport(null);
          void refetch();
        }}
      />
    </div>
  );
}

function ReportReviewSheet({
  report,
  open,
  onClose,
}: {
  report: Report | null;
  open: boolean;
  onClose: () => void;
}) {
  const [notes, setNotes] = useState("");

  // Using explicit generic params for useMutation would be ideal,
  // but standard TRPC inference works well here.
  const resolveMutation = api.report.resolveReport.useMutation({
    onSuccess: () => {
      toast.success("Report resolved");
      onClose();
      setNotes("");
    },
    onError: (err) => toast.error(err.message),
  });

  const handleAction = (
    action: "DISMISS" | "BAN_USER" | "DELETE_POST" | "DELETE_POST_AND_BAN",
  ) => {
    if (!report) return;
    resolveMutation.mutate({ reportId: report.id, action, notes });
  };

  if (!report) return null;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-[400px] overflow-y-auto sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Review Report</SheetTitle>
          <SheetDescription>
            Reported for{" "}
            <span className="font-bold text-red-600">
              {report.reason.replace(/_/g, " ")}
            </span>
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* Details Section */}
          <div className="rounded-lg border bg-gray-50 p-4">
            <h4 className="mb-2 text-sm font-semibold text-gray-700">
              Reporter&apos;s Note
            </h4>
            <p className="text-sm text-gray-600">
              {report.details ?? "No additional details provided."}
            </p>
          </div>

          {/* Target Content Preview */}
          <div className="rounded-lg border p-4">
            <h4 className="mb-3 text-sm font-semibold text-gray-900">
              Reported Content
            </h4>

            {report.targetPost ? (
              <div className="space-y-3">
                <div className="mb-2 flex items-center gap-2">
                  <div className="font-bold">
                    @{report.targetPost.author.username}
                  </div>
                  <span className="text-xs text-gray-400">
                    Post ID: {report.targetPostId?.slice(0, 8)}...
                  </span>
                </div>
                {report.targetPost.assets[0] && (
                  <div className="relative aspect-video w-full overflow-hidden rounded-md bg-black">
                    <Image
                      src={report.targetPost.assets[0].url}
                      alt="Reported content"
                      fill
                      className="object-contain"
                    />
                  </div>
                )}
                {report.targetPost.caption && (
                  <p className="text-sm text-gray-800 italic">
                    &quot;{report.targetPost.caption}&quot;
                  </p>
                )}
              </div>
            ) : report.targetUser ? (
              <div className="flex items-center gap-4">
                <div className="relative h-16 w-16 overflow-hidden rounded-full bg-gray-200">
                  <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-gray-400">
                    {report.targetUser.username.charAt(0).toUpperCase()}
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold">
                    @{report.targetUser.username}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {report.targetUser.email}
                  </p>
                  <Badge
                    className={
                      report.targetUser.status === "BANNED"
                        ? "bg-red-100 text-red-700"
                        : "bg-green-100 text-green-700"
                    }
                  >
                    {report.targetUser.status}
                  </Badge>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 font-medium text-red-500">
                <XCircle className="h-5 w-5" /> Content has already been
                deleted.
              </div>
            )}
          </div>

          {/* Admin Notes */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Resolution Notes</label>
            <Textarea
              placeholder="Why are you taking this action?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <SheetFooter className="flex-col gap-3 sm:flex-col">
          <div className="grid w-full grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={() => handleAction("DISMISS")}
              disabled={resolveMutation.isPending}
            >
              <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
              Dismiss Report
            </Button>

            {report.targetPost ? (
              <Button
                variant="destructive"
                onClick={() => handleAction("DELETE_POST")}
                disabled={resolveMutation.isPending}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Post Only
              </Button>
            ) : (
              <Button
                variant="destructive"
                onClick={() => handleAction("BAN_USER")}
                disabled={resolveMutation.isPending}
              >
                <Ban className="mr-2 h-4 w-4" />
                Ban User
              </Button>
            )}
          </div>

          {report.targetPost && (
            <Button
              variant="destructive"
              className="w-full bg-red-700 hover:bg-red-800"
              onClick={() => handleAction("DELETE_POST_AND_BAN")}
              disabled={resolveMutation.isPending}
            >
              <ShieldAlert className="mr-2 h-4 w-4" />
              Delete Post & Ban Author
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
