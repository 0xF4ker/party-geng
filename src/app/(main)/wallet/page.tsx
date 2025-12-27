"use client";

import React, { useState, Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import {
  type LucideIcon, // Import type for icons
  ChevronDown,
  CalendarDays,
  ArrowDownUp,
  TrendingDown,
  Gift,
  Send,
  Download,
  Plus,
  ArrowUpRight,
  Wallet as WalletIcon,
} from "lucide-react";
import { api } from "@/trpc/react";
import { useAuthStore } from "@/stores/auth";
import { AddFundsModal } from "@/app/_components/payments/AddFundsModal";
import { WithdrawModal } from "@/app/_components/payments/WithdrawModal";
import { TransferFundsModal } from "@/app/_components/payments/TransferFundsModal";
import { RequestFundsModal } from "@/app/_components/payments/RequestFundsModal";
import { cn } from "@/lib/utils";

// --- HELPERS ---
const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(
    Math.abs(amount),
  );

const TransactionTypeBadge = ({ type }: { type: string }) => {
  const styles: Record<string, string> = {
    PAYMENT: "bg-blue-100 text-blue-700 border-blue-200",
    PAYOUT: "bg-orange-100 text-orange-700 border-orange-200",
    TOPUP: "bg-emerald-100 text-emerald-700 border-emerald-200",
    SERVICE_FEE: "bg-gray-100 text-gray-700 border-gray-200",
    REFUND: "bg-purple-100 text-purple-700 border-purple-200",
    TRANSFER: "bg-indigo-100 text-indigo-700 border-indigo-200",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase",
        styles[type] ?? "bg-gray-100 text-gray-700",
      )}
    >
      {type.replace("_", " ")}
    </span>
  );
};

// --- MAIN COMPONENT ---

const WalletPageContent = () => {
  const { profile } = useAuthStore();
  const userType = profile?.role === "VENDOR" ? "vendor" : "client";
  const [activeTab, setActiveTab] = useState("overview");
  const searchParams = useSearchParams();

  const initialShowAddFunds = useMemo(() => {
    return searchParams.get("modal") === "addFunds";
  }, [searchParams]);

  const [showAddFundsModal, setShowAddFundsModal] =
    useState(initialShowAddFunds);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);

  const initialAmount = searchParams.get("amount");
  const quoteId = searchParams.get("quoteId");

  const {
    data: wallet,
    isLoading: walletLoading,
    refetch: refetchWallet,
  } = api.payment.getWallet.useQuery();
  const {
    data: transactionsData,
    isLoading: transactionsLoading,
    refetch: refetchTransactions,
  } = api.payment.getTransactions.useQuery({
    limit: 20,
    offset: 0,
  });

  const availableBalance = wallet?.availableBalance ?? 0;
  const totalExpenses = wallet?.totalExpenses ?? 0;
  const totalEarnings = wallet?.totalEarnings ?? 0;

  if (walletLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 pt-[120px]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-pink-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading wallet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-[100px] pb-20 text-gray-900 lg:pt-[120px]">
      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="mb-6 text-3xl font-bold">Wallet</h1>

        {/* Tabs */}
        <div className="flex items-center border-b border-gray-200">
          <TabButton
            title="Overview"
            isActive={activeTab === "overview"}
            onClick={() => setActiveTab("overview")}
          />
          <TabButton
            title="Financial Documents"
            isActive={activeTab === "docs"}
            onClick={() => setActiveTab("docs")}
          />
        </div>

        {/* Content */}
        {activeTab === "overview" && (
          <div className="mt-8 space-y-8">
            {/* iSave Banner */}
            <div className="flex flex-col items-start justify-between gap-4 rounded-xl bg-linear-to-r from-pink-600 to-purple-600 p-6 text-white shadow-lg sm:flex-row sm:items-center">
              <div>
                <h2 className="flex items-center gap-2 text-2xl font-bold">
                  <WalletIcon className="h-6 w-6" /> iSave
                </h2>
                <p className="mt-1 text-sm text-pink-100 sm:text-base">
                  Automate your savings for your next big event.
                </p>
              </div>
              <button
                onClick={() => (window.location.href = "/isave")}
                className="w-full rounded-lg bg-white px-5 py-2.5 font-semibold text-pink-600 transition-colors hover:bg-pink-50 sm:w-auto"
              >
                View Plans
              </button>
            </div>

            {/* Stats Cards Grid */}
            <div
              className={cn(
                "grid grid-cols-1 gap-6",
                userType === "client" ? "lg:grid-cols-2" : "",
              )}
            >
              <AvailableFundsCard
                availableBalance={availableBalance}
                onAddFunds={() => setShowAddFundsModal(true)}
                onWithdraw={() => setShowWithdrawModal(true)}
                onTransfer={() => setShowTransferModal(true)}
                onRequest={() => setShowRequestModal(true)}
              />
              {userType === "client" && (
                <ClientEarningsExpensesCard
                  totalEarnings={totalEarnings}
                  totalExpenses={totalExpenses}
                />
              )}
            </div>

            {/* Transactions Section */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="flex flex-col gap-4 border-b border-gray-200 bg-gray-50/50 p-4 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="font-semibold text-gray-900">
                  Recent Transactions
                </h3>
                <div className="flex gap-2">
                  <FilterDropdown title="Date" icon={CalendarDays} />
                  <FilterDropdown title="Type" icon={ArrowDownUp} />
                </div>
              </div>

              {transactionsLoading ? (
                <div className="flex justify-center p-12">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-pink-600 border-r-transparent" />
                </div>
              ) : !transactionsData?.length ? (
                <div className="p-12 text-center text-gray-500">
                  No transactions found.
                </div>
              ) : (
                <>
                  {/* Desktop Table */}
                  <div className="hidden md:block">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
                        <tr>
                          <th className="px-6 py-4">Date</th>
                          <th className="px-6 py-4">Type</th>
                          <th className="px-6 py-4">Description</th>
                          <th className="px-6 py-4">Reference</th>
                          <th className="px-6 py-4 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {transactionsData.map((tx) => (
                          <tr
                            key={tx.id}
                            className="transition-colors hover:bg-gray-50/50"
                          >
                            <td className="px-6 py-4 font-mono text-xs text-gray-500">
                              {new Date(tx.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4">
                              <TransactionTypeBadge type={tx.type} />
                            </td>
                            <td
                              className="max-w-xs truncate px-6 py-4 font-medium text-gray-900"
                              title={tx.description}
                            >
                              {tx.description}
                            </td>
                            <td className="px-6 py-4 font-mono text-xs text-gray-400">
                              {tx.order?.id
                                ? `#${tx.order.id.slice(0, 8)}`
                                : "-"}
                            </td>
                            <td
                              className={cn(
                                "px-6 py-4 text-right font-bold",
                                tx.amount > 0
                                  ? "text-emerald-600"
                                  : "text-gray-900",
                              )}
                            >
                              {tx.amount > 0 ? "+" : ""}
                              {formatCurrency(tx.amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="divide-y divide-gray-100 md:hidden">
                    {transactionsData.map((tx) => (
                      <div key={tx.id} className="flex flex-col gap-3 p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="line-clamp-1 text-sm font-semibold text-gray-900">
                              {tx.description}
                            </p>
                            <p className="mt-1 font-mono text-xs text-gray-500">
                              {new Date(tx.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div
                            className={cn(
                              "text-sm font-bold",
                              tx.amount > 0
                                ? "text-emerald-600"
                                : "text-gray-900",
                            )}
                          >
                            {tx.amount > 0 ? "+" : ""}
                            {formatCurrency(tx.amount)}
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <TransactionTypeBadge type={tx.type} />
                          {tx.order?.id && (
                            <span className="font-mono text-[10px] text-gray-400">
                              Ref: #{tx.order.id.slice(0, 6)}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Modals */}
        {showAddFundsModal && (
          <AddFundsModal
            onClose={() => setShowAddFundsModal(false)}
            initialAmount={initialAmount ? Number(initialAmount) : undefined}
            quoteId={quoteId ?? undefined}
          />
        )}
        {showWithdrawModal && (
          <WithdrawModal
            onClose={() => setShowWithdrawModal(false)}
            availableBalance={availableBalance}
            onSuccess={() => {
              void refetchWallet();
              void refetchTransactions();
              setShowWithdrawModal(false);
            }}
          />
        )}
        {showTransferModal && (
          <TransferFundsModal
            isOpen={showTransferModal}
            onClose={() => setShowTransferModal(false)}
            availableBalance={availableBalance}
            onSuccess={() => {
              void refetchWallet();
              void refetchTransactions();
              setShowTransferModal(false);
            }}
          />
        )}
        {showRequestModal && (
          <RequestFundsModal
            isOpen={showRequestModal}
            onClose={() => setShowRequestModal(false)}
            onSuccess={() => setShowRequestModal(false)}
          />
        )}
      </div>
    </div>
  );
};

// --- SUB-COMPONENTS ---

interface TabButtonProps {
  title: string;
  isActive: boolean;
  onClick: () => void;
}

const TabButton = ({ title, isActive, onClick }: TabButtonProps) => (
  <button
    onClick={onClick}
    className={cn(
      "border-b-2 px-4 py-3 text-sm font-semibold transition-colors",
      isActive
        ? "border-pink-600 text-pink-600"
        : "border-transparent text-gray-500 hover:text-gray-800",
    )}
  >
    {title}
  </button>
);

interface AvailableFundsCardProps {
  availableBalance: number;
  onAddFunds: () => void;
  onWithdraw: () => void;
  onTransfer: () => void;
  onRequest: () => void;
}

const AvailableFundsCard = ({
  availableBalance,
  onAddFunds,
  onWithdraw,
  onTransfer,
  onRequest,
}: AvailableFundsCardProps) => (
  <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
    <div className="mb-6">
      <h3 className="text-sm font-medium text-gray-500">Available Funds</h3>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-4xl font-bold text-gray-900">
          ₦{availableBalance.toLocaleString()}
        </span>
        <span className="text-sm font-medium text-gray-400">NGN</span>
      </div>
    </div>
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <ActionButton
        icon={Plus}
        label="Add Funds"
        primary
        onClick={onAddFunds}
      />
      <ActionButton icon={ArrowUpRight} label="Withdraw" onClick={onWithdraw} />
      <ActionButton icon={Send} label="Transfer" onClick={onTransfer} />
      <ActionButton icon={Download} label="Request" onClick={onRequest} />
    </div>
  </div>
);

interface ClientEarningsExpensesCardProps {
  totalEarnings: number;
  totalExpenses: number;
}

const ClientEarningsExpensesCard = ({
  totalEarnings,
  totalExpenses,
}: ClientEarningsExpensesCardProps) => (
  <div className="flex flex-col justify-center gap-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
    <div className="flex items-center gap-4">
      <div className="rounded-full bg-emerald-50 p-3 text-emerald-600">
        <Gift className="h-6 w-6" />
      </div>
      <div>
        <p className="text-sm text-gray-500">Total Earnings</p>
        <p className="text-xl font-bold text-emerald-700">
          +₦{totalEarnings.toLocaleString()}
        </p>
      </div>
    </div>
    <div className="h-px w-full bg-gray-100" />
    <div className="flex items-center gap-4">
      <div className="rounded-full bg-red-50 p-3 text-red-600">
        <TrendingDown className="h-6 w-6" />
      </div>
      <div>
        <p className="text-sm text-gray-500">Total Expenses</p>
        <p className="text-xl font-bold text-gray-900">
          ₦{totalExpenses.toLocaleString()}
        </p>
      </div>
    </div>
  </div>
);

interface ActionButtonProps {
  icon: LucideIcon;
  label: string;
  primary?: boolean;
  onClick: () => void;
}

const ActionButton = ({
  icon: Icon,
  label,
  primary,
  onClick,
}: ActionButtonProps) => (
  <button
    onClick={onClick}
    className={cn(
      "flex flex-col items-center justify-center gap-2 rounded-lg border py-3 text-xs font-semibold transition-all hover:shadow-sm",
      primary
        ? "border-transparent bg-pink-600 text-white hover:bg-pink-700"
        : "border-gray-200 bg-white text-gray-700 hover:border-pink-200 hover:text-pink-600",
    )}
  >
    <Icon className="h-5 w-5" />
    {label}
  </button>
);

interface FilterDropdownProps {
  title: string;
  icon: LucideIcon;
}

const FilterDropdown = ({ title, icon: Icon }: FilterDropdownProps) => (
  <button className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">
    <Icon className="h-3.5 w-3.5 text-gray-400" />
    {title}
    <ChevronDown className="h-3 w-3 text-gray-300" />
  </button>
);

const WalletPage = () => (
  <Suspense fallback={<div className="p-10 text-center">Loading...</div>}>
    <WalletPageContent />
  </Suspense>
);

export default WalletPage;
