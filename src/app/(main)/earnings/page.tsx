"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  DollarSign,
  ChevronDown,
  Info,
  CalendarDays,
  ArrowDownUp,
  Banknote,
  CreditCard,
  TrendingUp, // For Earnings
  TrendingDown, // For Expenses
  Gift, // For Client Earnings
  Hourglass, // For Clearing
  Briefcase, // For Active Gigs
} from "lucide-react";

// Mock cn function for demonstration
const cn = (...inputs: (string | boolean | undefined | null)[]) => {
  return inputs.filter(Boolean).join(" ");
};

// --- Mock Data ---
const vendorData = {
  available: 150000,
  clearing: 80000,
  active: 250000,
};

const clientData = {
  available: 20000,
  earnings: 5000, // from refunds/gifts
  expenses: 320000,
};

const transactions = [
  {
    id: "tx-1", // Add unique ID
    date: "Oct 28, 2025",
    activity: "Sale",
    description: "Wedding DJ services for Chioma E.",
    orderId: "ch-1234",
    amount: 250000,
  },
  {
    id: "tx-2", // Add unique ID
    date: "Oct 26, 2025",
    activity: "Withdrawal",
    description: "Payout to GTBank",
    orderId: "wd-5678",
    amount: -50000,
  },
  {
    id: "tx-3", // Add unique ID
    date: "Oct 22, 2025",
    activity: "Expense",
    description: "Service Fee for Order #ch-1234",
    orderId: "ch-1234",
    amount: -25000,
  },
];
// --- End Mock Data ---

// --- Main Page Component ---
const EarningsPage = () => {
  const [userType, setUserType] = useState("vendor"); // 'vendor' or 'client'
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="min-h-screen bg-gray-50 pt-[122px] text-gray-900 lg:pt-[127px]">
      <div className="container mx-auto px-4 py-8 sm:px-8">
        <h1 className="mb-6 text-3xl font-bold">Earnings</h1>

        {/* "Our Twist" - Toggle to show conditional logic */}
        <div className="mb-6 rounded-lg border border-purple-200 bg-purple-50 p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <span className="font-semibold text-purple-800">Demo:</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setUserType("vendor")}
                className={cn(
                  "rounded-md px-4 py-2 text-sm font-medium transition-all",
                  userType === "vendor"
                    ? "bg-pink-600 text-white shadow"
                    : "bg-white text-gray-700 hover:bg-gray-100",
                )}
              >
                View as Vendor
              </button>
              <button
                onClick={() => setUserType("client")}
                className={cn(
                  "rounded-md px-4 py-2 text-sm font-medium transition-all",
                  userType === "client"
                    ? "bg-pink-600 text-white shadow"
                    : "bg-white text-gray-700 hover:bg-gray-100",
                )}
              >
                View as Client
              </button>
            </div>
            <p className="text-sm text-purple-700">
              {userType === "vendor"
                ? "Showing earnings cards for a Vendor."
                : "Showing earnings/expense cards for a Client."}
            </p>
          </div>
        </div>

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
                data={userType === "vendor" ? vendorData : clientData}
              />

              {/* Card 2: Conditional */}
              {userType === "vendor" ? (
                <FuturePaymentsCard data={vendorData} />
              ) : (
                <ClientEarningsExpensesCard data={clientData} />
              )}

              {/* Card 3: Empty or other info */}
              {/* You can add a third card here if needed, e.g., "Taxes" or "Earnings to Date" for vendors */}
            </div>

            {/* --- Transaction History --- */}
            <div className="mt-12 rounded-lg border border-gray-200 bg-white shadow-sm">
              {/* Filters */}
              <div className="flex flex-col gap-4 border-b border-gray-200 p-4 sm:flex-row">
                <FilterDropdown title="Date range" icon={CalendarDays} />
                <FilterDropdown title="Activity" icon={ArrowDownUp} />
              </div>
              {/* Table */}
              <TransactionTable transactions={transactions} />
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
      </div>
    </div>
  );
};

// --- Sub-Components ---

const TabButton = ({ title, isActive, onClick }) => (
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

const FilterDropdown = ({ title, icon: Icon }) => (
  <button className="flex w-full items-center justify-between gap-2 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-gray-400 hover:bg-gray-50 sm:w-auto">
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-gray-500" />
      {title}
    </div>
    <ChevronDown className="h-4 w-4" />
  </button>
);

// Card 1: Available Funds (Common)
const AvailableFundsCard = ({ userType, data }) => (
  <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
    <h3 className="mb-3 text-sm font-medium text-gray-500">Available funds</h3>
    <p className="mb-1 text-sm text-gray-500">Balance available for use</p>
    <p className="mb-5 text-4xl font-bold text-gray-900">
      ₦{data.available.toLocaleString()}
    </p>
    {userType === "vendor" && (
      <button className="w-full rounded-md bg-pink-600 py-2.5 font-semibold text-white transition-colors hover:bg-pink-700">
        Withdraw Funds
      </button>
    )}
    {userType === "client" && (
      <p className="text-xs text-gray-400">
        This balance can be used for future purchases or withdrawn.
      </p>
    )}
  </div>
);

// Card 2: Vendor View
const FuturePaymentsCard = ({ data }) => (
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
          ₦{data.clearing.toLocaleString()}
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
          ₦{data.active.toLocaleString()}
        </p>
      </div>
    </div>
  </div>
);

// Card 2: Client View
const ClientEarningsExpensesCard = ({ data }) => (
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
          +₦{data.earnings.toLocaleString()}
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
          ₦{data.expenses.toLocaleString()}
        </p>
      </div>
    </div>
  </div>
);

const TransactionTable = ({ transactions }) => (
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

export default EarningsPage;
