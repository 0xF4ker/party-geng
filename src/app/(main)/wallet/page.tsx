"use client";

import React, { useState, Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import {
  ChevronDown,
  Info,
  CalendarDays,
  ArrowDownUp,
  TrendingDown, // For Expenses
  Gift, // For Client Earnings
  Send,
  Download,
  Plus,
  ArrowUpRight,
  WalletIcon,
} from "lucide-react";
import { api } from "@/trpc/react";
import { useAuthStore } from "@/stores/auth";
import { AddFundsModal } from "@/app/_components/payments/AddFundsModal";
import { WithdrawModal } from "@/app/_components/payments/WithdrawModal";
import { TransferFundsModal } from "@/app/_components/payments/TransferFundsModal";
import { RequestFundsModal } from "@/app/_components/payments/RequestFundsModal";

// Mock cn function for demonstration
const cn = (...inputs: (string | boolean | undefined | null)[]) => {
  return inputs.filter(Boolean).join(" ");
};

const WalletPageContent = () => {
  const { profile } = useAuthStore();
  const userType = profile?.role === "VENDOR" ? "vendor" : "client";
  const [activeTab, setActiveTab] = useState("overview");
  const searchParams = useSearchParams();

  // FIX: Derive initial state from searchParams to avoid useEffect
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

  // Fetch wallet data
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

  // Calculate balances from wallet data
  const availableBalance = wallet?.availableBalance ?? 0;
  // const clearingBalance = wallet?.clearingBalance ?? 0;
  // const activeOrderBalance = wallet?.activeOrderBalance ?? 0;
  const totalExpenses = wallet?.totalExpenses ?? 0;
  const totalEarnings = wallet?.totalEarnings ?? 0;

  // Format transactions for display
  const formattedTransactions =
    transactionsData?.map((tx) => ({
      id: tx.id,
      date: new Date(tx.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      activity:
        tx.type === "PAYMENT"
          ? "Payment"
          : tx.type === "PAYOUT"
            ? "Withdrawal"
            : tx.type === "SERVICE_FEE"
              ? "Fee"
              : tx.type === "REFUND"
                ? "Refund"
                : tx.type === "TRANSFER"
                  ? "Transfer"
                  : tx.type === "TOPUP"
                    ? "Top-up"
                    : tx.type,
      description: tx.description,
      orderId: tx.order?.id ?? "-",
      amount: tx.amount,
    })) ?? [];

  if (walletLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-[122px] text-gray-900 lg:pt-[127px]">
        <div className="container mx-auto px-4 py-8 sm:px-8">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-pink-600 border-r-transparent"></div>
              <p className="mt-4 text-gray-600">Loading wallet...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-[122px] text-gray-900 lg:pt-[127px]">
      <div className="container mx-auto px-4 py-8 sm:px-8">
        <h1 className="mb-6 text-3xl font-bold">Wallet</h1>

        {/* Tabs (Overview / Financial Docs) */}
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

        {/* Main Content Area */}
        {activeTab === "overview" && (
          <div className="mt-8">
            {/* iSave Banner */}
            <div className="mb-8 flex items-center justify-between rounded-xl bg-linear-to-r from-pink-600 to-purple-600 p-6 text-white shadow-lg">
              <div>
                <h2 className="flex items-center gap-2 text-2xl font-bold">
                  <WalletIcon className="h-6 w-6" />
                  iSave
                </h2>
                <p className="mt-1 text-pink-100">
                  Automate your savings for your next big event.
                </p>
              </div>
              <button
                onClick={() => (window.location.href = "/isave")}
                className="rounded-lg bg-white px-5 py-2.5 font-semibold text-pink-600 transition-colors hover:bg-pink-50"
              >
                View Plans
              </button>
            </div>

                                    {/* --- Cards --- */}

                                    <div

                                      className={cn(

                                        "grid grid-cols-1 gap-6",

                                        userType === "client" ? "md:grid-cols-2" : "",

                                      )}

                                    >

                                      {/* Card 1: Available Funds (COMMON) */}

                                      <AvailableFundsCard

                                        availableBalance={availableBalance}

                                        onAddFunds={() => setShowAddFundsModal(true)}

                                        onWithdraw={() => setShowWithdrawModal(true)}

                                        onTransfer={() => setShowTransferModal(true)}

                                        onRequest={() => setShowRequestModal(true)}

                                      />

                        

                                      {/* Card 2: Earnings & Expenses (Client Only) */}

                                      {userType === "client" && (

                                        <ClientEarningsExpensesCard

                                          totalEarnings={totalEarnings}

                                          totalExpenses={totalExpenses}

                                        />

                                      )}

                                    </div>

                        
                        {/* --- Transaction History --- */}
            <div className="mt-12 rounded-lg border border-gray-200 bg-white shadow-sm">
              {/* Filters */}
              <div className="flex flex-col gap-4 border-b border-gray-200 p-4 sm:flex-row">
                <FilterDropdown title="Date range" icon={CalendarDays} />
                <FilterDropdown title="Activity" icon={ArrowDownUp} />
              </div>
              {/* Table */}
              {transactionsLoading ? (
                <div className="flex items-center justify-center p-10">
                  <div className="text-center">
                    <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-pink-600 border-r-transparent"></div>
                    <p className="mt-2 text-sm text-gray-600">
                      Loading transactions...
                    </p>
                  </div>
                </div>
              ) : (
                <TransactionTable transactions={formattedTransactions} />
              )}
            </div>
          </div>
        )}

        {activeTab === "docs" && (
          <div className="mt-8 rounded-lg border bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">Financial Documents</h2>
            <p className="mt-2 text-gray-600">
              This section will contain invoices, tax documents, and other
              financial reports.
            </p>
            {/* ...Financial documents content would go here... */}
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
            onSuccess={() => {
              setShowRequestModal(false);
            }}
          />
        )}
      </div>
    </div>
  );
};

// --- Sub-Components ---

interface TabButtonProps {
  title: string;
  isActive: boolean;
  onClick: () => void;
}

const TabButton: React.FC<TabButtonProps> = ({ title, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={cn(
      "border-b-2 px-1 py-3 text-sm font-semibold transition-colors sm:px-4 sm:text-base",
      isActive
        ? "border-pink-600 text-pink-600"
        : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-800",
    )}
  >
    {title}
  </button>
);

interface FilterDropdownProps {
  title: string;
  icon: React.ElementType;
}

const FilterDropdown: React.FC<FilterDropdownProps> = ({
  title,
  icon: Icon,
}) => (
  <button className="flex w-full items-center justify-between gap-2 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-gray-400 hover:bg-gray-50 sm:w-auto">
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-gray-500" />
      {title}
    </div>
    <ChevronDown className="h-4 w-4" />
  </button>
);

// Card 1: Available Funds (Common)
interface AvailableFundsCardProps {
  availableBalance: number;
  onAddFunds: () => void;
  onWithdraw: () => void;
  onTransfer: () => void;
  onRequest: () => void;
}

const AvailableFundsCard: React.FC<AvailableFundsCardProps> = ({
  availableBalance,
  onAddFunds,
  onWithdraw,
  onTransfer,
  onRequest,
}) => (
  <div className="flex flex-col justify-between rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
    <div>
      <h3 className="mb-3 text-sm font-medium text-gray-500">
        Available funds
      </h3>
      <p className="mb-1 text-sm text-gray-500">Balance available for use</p>
      <p className="mb-5 text-4xl font-bold text-gray-900">
        ₦{availableBalance.toLocaleString()}
      </p>
    </div>

    <div className="grid grid-cols-2 gap-3">
      <button
        onClick={onAddFunds}
        className="flex items-center justify-center gap-2 rounded-md bg-pink-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-pink-700"
      >
        <Plus className="h-4 w-4" />
        Add Funds
      </button>
      <button
        onClick={onWithdraw}
        className="flex items-center justify-center gap-2 rounded-md border border-gray-300 bg-white py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
      >
        <ArrowUpRight className="h-4 w-4" />
        Withdraw
      </button>
      <button
        onClick={onTransfer}
        className="flex items-center justify-center gap-2 rounded-md border border-gray-300 bg-white py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
      >
        <Send className="h-4 w-4" />
        Transfer
      </button>
      <button
        onClick={onRequest}
        className="flex items-center justify-center gap-2 rounded-md border border-gray-300 bg-white py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
      >
        <Download className="h-4 w-4" />
        Request
      </button>
    </div>
  </div>
);

// Card 2: Client View (Earnings & Expenses)
interface ClientEarningsExpensesCardProps {
  totalEarnings: number;
  totalExpenses: number;
}

const ClientEarningsExpensesCard: React.FC<ClientEarningsExpensesCardProps> = ({
  totalEarnings,
  totalExpenses,
}) => (
  <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
    <h3 className="mb-5 text-sm font-medium text-gray-500">
      Earnings & Expenses
    </h3>

    <div className="mb-5 flex items-start gap-3">
      <Gift className="mt-1 h-5 w-5 text-gray-400" />
      <div>
        <p className="flex items-center text-sm text-gray-500">
          Earnings to date (Refunds/Gifts)
          <Info className="ml-1.5 h-3.5 w-3.5 text-gray-400" />
        </p>
        <p className="text-2xl font-semibold text-green-600">
          +₦{totalEarnings.toLocaleString()}
        </p>
      </div>
    </div>

    <div className="flex items-start gap-3">
      <TrendingDown className="mt-1 h-5 w-5 text-gray-400" />
      <div>
        <p className="flex items-center text-sm text-gray-500">
          Expenses to date
          <Info className="ml-1.5 h-3.5 w-3.5 text-gray-400" />
        </p>
        <p className="text-2xl font-semibold text-gray-800">
          ₦{totalExpenses.toLocaleString()}
        </p>
      </div>
    </div>
  </div>
);

interface Transaction {
  id: string;
  date: string;
  activity: string;
  description: string;
  orderId: string;
  amount: number;
}

interface TransactionTableProps {
  transactions: Transaction[];
}

const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
}) => (
  <div className="overflow-x-auto">
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th
            scope="col"
            className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
          >
            Date
          </th>
          <th
            scope="col"
            className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
          >
            Activity
          </th>
          <th
            scope="col"
            className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
          >
            Description
          </th>
          <th
            scope="col"
            className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
          >
            Order
          </th>
          <th
            scope="col"
            className="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase"
          >
            Amount
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200 bg-white">
        {transactions.length > 0 ? (
          transactions.map((tx) => (
            <tr key={tx.id}>
              <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
                {tx.date}
              </td>
              <td className="px-6 py-4 text-sm font-medium whitespace-nowrap">
                {tx.activity === "Transfer" && (
                  <span className="text-blue-600">{tx.activity}</span>
                )}
                {tx.activity === "Sale" && (
                  <span className="text-green-600">{tx.activity}</span>
                )}
                {tx.activity === "Withdrawal" && (
                  <span className="text-gray-700">{tx.activity}</span>
                )}
                {tx.activity === "Expense" && (
                  <span className="text-red-600">{tx.activity}</span>
                )}
                {!["Transfer", "Sale", "Withdrawal", "Expense"].includes(
                  tx.activity,
                ) && <span className="text-gray-700">{tx.activity}</span>}
              </td>
              <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-800">
                {tx.description}
              </td>
              <td className="px-6 py-4 text-sm font-medium whitespace-nowrap text-pink-600 hover:underline">
                <a href="#">{tx.orderId}</a>
              </td>
              <td className="px-6 py-4 text-right text-sm font-semibold whitespace-nowrap">
                <span
                  className={tx.amount > 0 ? "text-green-600" : "text-gray-900"}
                >
                  {tx.amount > 0
                    ? `+₦${tx.amount.toLocaleString()}`
                    : `₦${tx.amount.toLocaleString()}`}
                </span>
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td
              colSpan={5}
              className="px-6 py-4 text-center text-sm text-gray-500"
            >
              No transactions found.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
);

const WalletPage = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <WalletPageContent />
    </Suspense>
  );
};

export default WalletPage;
