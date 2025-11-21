"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  ChevronDown,
  Info,
  CalendarDays,
  ArrowDownUp,
  TrendingDown, // For Expenses
  Gift, // For Client Earnings
  Hourglass, // For Clearing
  Briefcase, // For Active Gigs
} from "lucide-react";
import { api } from "@/trpc/react";
import { useAuthStore } from "@/stores/auth";
import { AddFundsModal } from "@/app/_components/payments/AddFundsModal";
import { WithdrawModal } from "@/app/_components/payments/WithdrawModal";

// Mock cn function for demonstration
const cn = (...inputs: (string | boolean | undefined | null)[]) => {
  return inputs.filter(Boolean).join(" ");
};

const EarningsPageContent = () => {
  const { profile } = useAuthStore();
  const userType = profile?.role === "VENDOR" ? "vendor" : "client";
  const [activeTab, setActiveTab] = useState("overview");
  const [showAddFundsModal, setShowAddFundsModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  const searchParams = useSearchParams();
  const initialAmount = searchParams.get('amount');
  const quoteId = searchParams.get('quoteId');

  useEffect(() => {
    if (searchParams.get('modal') === 'addFunds') {
      setShowAddFundsModal(true);
    }
  }, [searchParams]);

  // Fetch wallet data
  const { data: wallet, isLoading: walletLoading, refetch: refetchWallet } = api.payment.getWallet.useQuery();
  const { data: transactionsData, isLoading: transactionsLoading, refetch: refetchTransactions } = api.payment.getTransactions.useQuery({
    limit: 20,
    offset: 0,
  });

  // Calculate balances from wallet data
  const availableBalance = wallet?.availableBalance ?? 0;
  const clearingBalance = wallet?.clearingBalance ?? 0;
  const activeOrderBalance = wallet?.activeOrderBalance ?? 0;
  const totalExpenses = wallet?.totalExpenses ?? 0;
  const totalEarnings = wallet?.totalEarnings ?? 0;

  // Format transactions for display
  const formattedTransactions = transactionsData?.map(tx => ({
    id: tx.id,
    date: new Date(tx.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    activity: tx.type === 'PAYMENT' ? 'Payment' : tx.type === 'PAYOUT' ? 'Withdrawal' : tx.type === 'SERVICE_FEE' ? 'Fee' : tx.type === 'REFUND' ? 'Refund' : tx.type,
    description: tx.description,
    orderId: tx.order?.id ?? '-',
    amount: tx.amount,
  })) ?? [];

  if (walletLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-[122px] text-gray-900 lg:pt-[127px]">
        <div className="container mx-auto px-4 py-8 sm:px-8">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-pink-600 border-r-transparent"></div>
              <p className="mt-4 text-gray-600">Loading earnings...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-[122px] text-gray-900 lg:pt-[127px]">
      <div className="container mx-auto px-4 py-8 sm:px-8">
        <h1 className="mb-6 text-3xl font-bold">Earnings</h1>

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
            {/* --- Cards --- */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* Card 1: Available Funds (COMMON) */}
              <AvailableFundsCard
                userType={userType}
                availableBalance={availableBalance}
                onAddFunds={() => setShowAddFundsModal(true)}
                onWithdraw={() => setShowWithdrawModal(true)}
              />

              {/* Card 2: Conditional */}
              {userType === "vendor" ? (
                <FuturePaymentsCard 
                  clearingBalance={clearingBalance}
                  activeOrderBalance={activeOrderBalance}
                />
              ) : (
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
                    <p className="mt-2 text-sm text-gray-600">Loading transactions...</p>
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
  userType: string;
  availableBalance: number;
  onAddFunds: () => void;
  onWithdraw: () => void;
}

const AvailableFundsCard: React.FC<AvailableFundsCardProps> = ({
  userType,
  availableBalance,
  onAddFunds,
  onWithdraw,
}) => (
  <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
    <h3 className="mb-3 text-sm font-medium text-gray-500">Available funds</h3>
    <p className="mb-1 text-sm text-gray-500">Balance available for use</p>
    <p className="mb-5 text-4xl font-bold text-gray-900">
      ₦{availableBalance.toLocaleString()}
    </p>
    {userType === "vendor" ? (
      <button 
        onClick={onWithdraw}
        className="w-full rounded-md bg-pink-600 py-2.5 font-semibold text-white transition-colors hover:bg-pink-700"
      >
        Withdraw Funds
      </button>
    ) : (
      <button 
        onClick={onAddFunds}
        className="w-full rounded-md bg-pink-600 py-2.5 font-semibold text-white transition-colors hover:bg-pink-700"
      >
        Add Funds
      </button>
    )}
  </div>
);

// Card 2: Vendor View
interface FuturePaymentsCardProps {
  clearingBalance: number;
  activeOrderBalance: number;
}

const FuturePaymentsCard: React.FC<FuturePaymentsCardProps> = ({ 
  clearingBalance,
  activeOrderBalance,
}) => (
  <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
    <h3 className="mb-5 text-sm font-medium text-gray-500">Future payments</h3>

    <div className="mb-5 flex items-start gap-3">
      <Hourglass className="mt-1 h-5 w-5 text-gray-400" />
      <div>
        <p className="flex items-center text-sm text-gray-500">
          Payments being cleared
          <Info className="ml-1.5 h-3.5 w-3.5 text-gray-400" />
        </p>
        <p className="text-2xl font-semibold text-gray-800">
          ₦{clearingBalance.toLocaleString()}
        </p>
      </div>
    </div>

    <div className="flex items-start gap-3">
      <Briefcase className="mt-1 h-5 w-5 text-gray-400" />
      <div>
        <p className="flex items-center text-sm text-gray-500">
          Payments for active orders
          <Info className="ml-1.5 h-3.5 w-3.5 text-gray-400" />
        </p>
        <p className="text-2xl font-semibold text-gray-800">
          ₦{activeOrderBalance.toLocaleString()}
        </p>
      </div>
    </div>
  </div>
);

// Card 2: Client View
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
                {tx.activity === "Sale" && (
                  <span className="text-green-600">{tx.activity}</span>
                )}
                {tx.activity === "Withdrawal" && (
                  <span className="text-gray-700">{tx.activity}</span>
                )}
                {tx.activity === "Expense" && (
                  <span className="text-red-600">{tx.activity}</span>
                )}
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
          <tr>{/* ... existing code ... */}</tr>
        )}
      </tbody>
    </table>
  </div>
);


const EarningsPage = () => {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <EarningsPageContent />
        </Suspense>
    )
}

export default EarningsPage;
