"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import {
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  Clock,
  Loader2,
  Banknote,
  CheckCircle,
  XCircle,
  RefreshCw,
  type LucideIcon,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// --- TYPE INFERENCE ---
import { type inferRouterOutputs } from "@trpc/server";
import { type AppRouter } from "@/server/api/root";

type RouterOutputs = inferRouterOutputs<AppRouter>;
type TransactionItem =
  RouterOutputs["payment"]["adminGetAllTransactions"]["items"][number];

// --- HELPERS ---
const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(
    Math.abs(amount),
  );

const TransactionStatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    COMPLETED: "bg-emerald-100 text-emerald-700 border-emerald-200",
    PENDING: "bg-orange-100 text-orange-700 border-orange-200",
    FAILED: "bg-red-100 text-red-700 border-red-200",
    HELD: "bg-gray-100 text-gray-700 border-gray-200",
  };

  const icons: Record<string, LucideIcon> = {
    COMPLETED: CheckCircle,
    PENDING: Clock,
    FAILED: XCircle,
  };

  const Icon = icons[status] ?? Clock;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        styles[status] ?? "bg-gray-100",
      )}
    >
      <Icon className="h-3 w-3" /> {status}
    </span>
  );
};

export default function AdminFinancePage() {
  const [activeTab, setActiveTab] = useState("transactions");
  const [search, setSearch] = useState("");

  // Queries
  const { data: stats, isLoading: statsLoading } =
    api.payment.adminGetStats.useQuery();
  const {
    data: transactionsData,
    isLoading: txLoading,
    refetch,
  } = api.payment.adminGetAllTransactions.useQuery({
    limit: 50,
    search: search || undefined,
    type: activeTab === "payouts" ? "PAYOUT" : undefined,
    status: activeTab === "payouts" ? "PENDING" : undefined,
  });

  const transactions = transactionsData?.items ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Financial Overview</h1>
        <p className="text-gray-500">
          Manage system funds, track payouts, and audit transactions.
        </p>
      </div>

      {/* 1. STATS CARDS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Inflow"
          value={stats?.totalInflow ?? 0}
          icon={ArrowDownLeft}
          color="text-emerald-600"
          bg="bg-emerald-50"
          loading={statsLoading}
        />
        <StatCard
          label="Total Payouts"
          value={stats?.totalPayouts ?? 0}
          icon={ArrowUpRight}
          color="text-blue-600"
          bg="bg-blue-50"
          loading={statsLoading}
        />
        <StatCard
          label="Pending Requests"
          value={stats?.pendingPayoutsCount ?? 0}
          isCurrency={false}
          icon={Clock}
          color="text-orange-600"
          bg="bg-orange-50"
          loading={statsLoading}
        />
        <StatCard
          label="Pending Volume"
          value={stats?.pendingPayoutsVolume ?? 0}
          icon={Banknote}
          color="text-purple-600"
          bg="bg-purple-50"
          loading={statsLoading}
        />
      </div>

      {/* 2. MAIN CONTENT TABS */}
      <Tabs
        defaultValue="transactions"
        className="w-full"
        onValueChange={setActiveTab}
      >
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <TabsList className="h-auto w-full border border-gray-200 bg-white p-1 sm:w-auto">
            <TabsTrigger value="transactions" className="flex-1 sm:flex-none">
              All Transactions
            </TabsTrigger>
            <TabsTrigger
              value="payouts"
              className="relative flex-1 sm:flex-none"
            >
              Payout Requests
              {(stats?.pendingPayoutsCount ?? 0) > 0 && (
                <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-[10px] text-white">
                  {stats?.pendingPayoutsCount}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <div className="relative w-full sm:w-64">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              placeholder="Search user..."
              className="h-10 w-full rounded-lg border border-gray-200 pr-4 pl-10 text-sm focus:border-pink-500 focus:outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* TAB 1: ALL TRANSACTIONS */}
        <TabsContent value="transactions">
          <TransactionTable
            data={transactions}
            isLoading={txLoading}
            showActions={false}
            onActionComplete={refetch}
          />
        </TabsContent>

        {/* TAB 2: PAYOUT REQUESTS */}
        <TabsContent value="payouts">
          <TransactionTable
            data={transactions}
            isLoading={txLoading}
            showActions={true}
            onActionComplete={refetch}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// --- SUB-COMPONENTS ---

interface StatCardProps {
  label: string;
  value?: number;
  icon: LucideIcon;
  color: string;
  bg: string;
  isCurrency?: boolean;
  loading: boolean;
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  bg,
  isCurrency = true,
  loading,
}: StatCardProps) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-500">{label}</h3>
        <div className={`rounded-full p-2 ${bg}`}>
          <Icon className={`h-4 w-4 ${color}`} />
        </div>
      </div>
      <div className="mt-4">
        {loading ? (
          <div className="h-8 w-24 animate-pulse rounded bg-gray-100" />
        ) : (
          <p className="text-2xl font-bold text-gray-900">
            {isCurrency ? formatCurrency(value ?? 0) : (value ?? 0)}
          </p>
        )}
      </div>
    </div>
  );
}

interface TransactionTableProps {
  data?: TransactionItem[];
  isLoading: boolean;
  showActions: boolean;
  onActionComplete?: () => void;
}

type PayoutActionType = "APPROVE" | "REJECT" | null;

function TransactionTable({
  data,
  isLoading,
  showActions,
  onActionComplete,
}: TransactionTableProps) {
  const [selectedTx, setSelectedTx] = useState<TransactionItem | null>(null);
  const [actionType, setActionType] = useState<PayoutActionType>(null);

  // New Mutation for verification
  const verifyMutation = api.payment.checkWithdrawalStatus.useMutation({
    onSuccess: (res) => {
      toast.success(res.message);
      onActionComplete?.();
    },
    onError: (err) => toast.error(err.message),
  });

  if (isLoading)
    return (
      <div className="p-12 text-center">
        <Loader2 className="mx-auto animate-spin" />
      </div>
    );
  if (!data?.length)
    return (
      <div className="p-12 text-center text-gray-500">
        No transactions found.
      </div>
    );

  const handleAction = (tx: TransactionItem, type: "APPROVE" | "REJECT") => {
    setSelectedTx(tx);
    setActionType(type);
  };

  const handleVerify = (tx: TransactionItem) => {
    verifyMutation.mutate({ transactionId: tx.id });
  };

  return (
    <>
      {/* --- DESKTOP VIEW (Table) --- */}
      <div className="hidden overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm md:block">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
            <tr>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">User</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Amount</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Description</th>
              {showActions && <th className="px-6 py-4 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.map((tx) => {
              const isPositive = tx.amount > 0;
              const userDisplay =
                tx.wallet.user.clientProfile?.name ??
                tx.wallet.user.vendorProfile?.companyName ??
                tx.wallet.user.username;

              const isPendingPayout =
                tx.type === "PAYOUT" && tx.status === "PENDING";

              return (
                <tr key={tx.id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4 font-mono text-xs whitespace-nowrap">
                    {format(new Date(tx.createdAt), "MMM d, HH:mm")}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">
                      {userDisplay}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge
                      variant="outline"
                      className="border-gray-200 font-mono text-xs"
                    >
                      {tx.type}
                    </Badge>
                  </td>
                  <td
                    className={`px-6 py-4 font-medium ${isPositive ? "text-emerald-600" : "text-gray-900"}`}
                  >
                    {isPositive ? "+" : ""}
                    {formatCurrency(tx.amount)}
                  </td>
                  <td className="px-6 py-4">
                    <TransactionStatusBadge status={tx.status} />
                  </td>
                  <td
                    className="max-w-xs truncate px-6 py-4 text-xs"
                    title={tx.description ?? ""}
                  >
                    {tx.description}
                  </td>
                  {showActions && (
                    <td className="px-6 py-4 text-right">
                      {isPendingPayout ? (
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 gap-2 border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100 hover:text-orange-800"
                            onClick={() => handleVerify(tx)}
                            disabled={verifyMutation.isPending}
                          >
                            {verifyMutation.isPending ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <RefreshCw className="h-3.5 w-3.5" />
                            )}
                            Verify
                          </Button>
                          {/* Optional Manual Actions if verification fails or manual override needed */}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={() => handleAction(tx, "REJECT")}
                          >
                            <XCircle className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      ) : null}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* --- MOBILE VIEW (Card Grid) --- */}
      <div className="grid gap-3 md:hidden">
        {data.map((tx) => {
          const isPositive = tx.amount > 0;
          const userDisplay =
            tx.wallet.user.clientProfile?.name ??
            tx.wallet.user.vendorProfile?.companyName ??
            tx.wallet.user.username;
          const isPendingPayout =
            tx.type === "PAYOUT" && tx.status === "PENDING";

          return (
            <div
              key={tx.id}
              className="flex flex-col gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {userDisplay}
                  </p>
                  <p className="mt-1 font-mono text-xs text-gray-500">
                    {format(new Date(tx.createdAt), "MMM d, HH:mm")}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className="border-gray-200 font-mono text-xs"
                >
                  {tx.type}
                </Badge>
              </div>

              <div className="flex items-center justify-between border-t border-gray-50 pt-3">
                <div
                  className={`text-lg font-bold ${isPositive ? "text-emerald-600" : "text-gray-900"}`}
                >
                  {isPositive ? "+" : ""}
                  {formatCurrency(tx.amount)}
                </div>
                <TransactionStatusBadge status={tx.status} />
              </div>

              <div className="rounded bg-gray-50 p-2 text-xs text-gray-500">
                {tx.description}
              </div>

              {showActions && isPendingPayout && (
                <div className="grid grid-cols-1 pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-2 border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100"
                    onClick={() => handleVerify(tx)}
                    disabled={verifyMutation.isPending}
                  >
                    {verifyMutation.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3.5 w-3.5" />
                    )}
                    Verify Status
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ACTION MODAL (Kept for manual overrides if needed) */}
      <PayoutActionModal
        isOpen={!!selectedTx}
        onClose={() => {
          setSelectedTx(null);
          setActionType(null);
        }}
        tx={selectedTx}
        action={actionType}
        onSuccess={onActionComplete}
      />
    </>
  );
}

interface PayoutActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  tx: TransactionItem | null;
  action: PayoutActionType;
  onSuccess?: () => void;
}

function PayoutActionModal({
  isOpen,
  onClose,
  tx,
  action,
  onSuccess,
}: PayoutActionModalProps) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const mutation = api.payment.adminProcessPayout.useMutation({
    onSuccess: () => {
      toast.success(
        action === "APPROVE" ? "Payout Approved" : "Payout Rejected",
      );
      onSuccess?.();
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSubmit = () => {
    if (!tx || !action) return;
    if (action === "REJECT" && !reason)
      return toast.error("Reason required for rejection");

    setLoading(true);
    mutation.mutate({
      transactionId: tx.id,
      action: action,
      rejectionReason: reason,
    });
  };

  if (!tx || !action) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {action === "APPROVE" ? "Approve Withdrawal" : "Reject Withdrawal"}
          </DialogTitle>
          <DialogDescription>
            {action === "APPROVE"
              ? `Mark this transaction as completed? Ensure funds have been sent.`
              : `Refund ${formatCurrency(tx.amount)} back to the user's wallet?`}
          </DialogDescription>
        </DialogHeader>

        <div className="mb-4 space-y-2 rounded-lg bg-gray-50 p-4 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">User</span>
            <span className="font-medium">{tx.wallet.user.username}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Amount</span>
            <span className="text-lg font-bold">
              {formatCurrency(tx.amount)}
            </span>
          </div>
          <div className="mt-2 border-t border-gray-200 pt-2">
            <span className="mb-1 block text-xs text-gray-500">
              Bank Details
            </span>
            <span className="block text-sm font-medium">{tx.description}</span>
          </div>
        </div>

        {action === "REJECT" && (
          <Textarea
            placeholder="Reason for rejection (sent to user)..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant={action === "REJECT" ? "destructive" : "default"}
            className={
              action === "APPROVE" ? "bg-emerald-600 hover:bg-emerald-700" : ""
            }
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {action === "APPROVE" ? "Confirm Transfer" : "Refund User"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
