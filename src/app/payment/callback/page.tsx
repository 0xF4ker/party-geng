"use client";

import React, { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/trpc/react";
import { useUiStore } from "@/stores/ui";
import { Loader2, CheckCircle2, XCircle, Wallet, ArrowLeft } from "lucide-react";
import Link from "next/link";

function PaymentCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { headerHeight } = useUiStore();
  const reference = searchParams.get("reference");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [details, setDetails] = useState<{
    type: "ticket" | "topup";
    guestName?: string;
    eventTitle?: string;
    amount?: number;
    newBalance?: number;
  } | null>(null);

  const verifyWalletTopUp = api.payment.verifyPayment.useMutation();
  const verifyTicket = api.payment.verifyTicketPayment.useMutation();
  
  // Guard ref to prevent double execution in React Strict Mode
  const verifiedRef = useRef(false);

  useEffect(() => {
    if (!reference || verifiedRef.current) return;
    verifiedRef.current = true;

    const performVerification = async () => {
      try {
        if (reference.startsWith("ticket_")) {
          // Verify ticket purchase
          const result = await verifyTicket.mutateAsync({ reference });
          setStatus("success");
          setDetails({
            type: "ticket",
            guestName: result.guestName,
            eventTitle: result.eventTitle,
          });
        } else {
          // Verify wallet topup
          const result = await verifyWalletTopUp.mutateAsync({ reference });
          setStatus("success");
          setDetails({
            type: "topup",
            amount: result.amount,
            newBalance: result.newBalance,
          });
        }
      } catch (err: any) {
        setStatus("error");
        setErrorMessage(err.message || "Failed to verify transaction payment.");
      }
    };

    void performVerification();
  }, [reference]);

  if (!reference) {
    return (
      <div
        className="flex min-h-screen flex-col items-center justify-center bg-gray-50 text-gray-500"
        style={{ paddingTop: headerHeight }}
      >
        <div className="text-center space-y-4">
          <XCircle className="mx-auto h-12 w-12 text-red-500" />
          <h2 className="text-xl font-bold">Invalid Payment Reference</h2>
          <p className="text-sm">No transaction reference was provided in the URL.</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-gray-50 px-4"
      style={{ paddingTop: headerHeight }}
    >
      <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-8 shadow-xl text-center space-y-6">
        {status === "loading" && (
          <div className="py-12 space-y-4">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-pink-600" />
            <h2 className="text-xl font-bold text-gray-900">Verifying Payment</h2>
            <p className="text-sm text-gray-500 max-w-xs mx-auto">
              Please do not refresh the page while we confirm your payment with Paystack.
            </p>
          </div>
        )}

        {status === "success" && details && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-green-600">
              <CheckCircle2 className="h-10 w-10" />
            </div>

            {details.type === "ticket" ? (
              /* Ticket RSVP success details */
              <div className="space-y-4">
                <div>
                  <h2 className="text-2xl font-black text-gray-900">Admission Confirmed!</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Your RSVP is active. We look forward to seeing you at the event.
                  </p>
                </div>
                
                <div className="rounded-xl bg-pink-50/50 border border-pink-100 p-4 text-left space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-400 uppercase font-bold">Event</span>
                    <span className="font-semibold text-pink-700">Ticket Admission</span>
                  </div>
                  <p className="font-bold text-gray-900 text-sm">{details.eventTitle}</p>
                  <div className="border-t border-pink-100 pt-2 flex justify-between items-center text-xs">
                    <span className="text-gray-400">Guest Name</span>
                    <span className="font-bold text-gray-800">{details.guestName}</span>
                  </div>
                </div>

                <Link
                  href="/"
                  className="flex w-full items-center justify-center rounded-xl bg-pink-600 hover:bg-pink-700 py-3 text-sm font-bold text-white transition"
                >
                  Discover More Events
                </Link>
              </div>
            ) : (
              /* Wallet top-up success details */
              <div className="space-y-4">
                <div>
                  <h2 className="text-2xl font-black text-gray-900">Top-Up Successful!</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Your wallet balance has been successfully funded.
                  </p>
                </div>

                <div className="rounded-xl bg-gray-50 border border-gray-100 p-4 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-400 font-bold uppercase">Transaction Type</span>
                    <span className="font-semibold text-gray-700">Wallet Credit</span>
                  </div>
                  <div className="border-t border-gray-100 pt-2 flex justify-between items-center">
                    <span className="text-sm text-gray-500">Credited Amount</span>
                    <span className="font-black text-gray-900">
                      ₦{details.amount?.toLocaleString()}
                    </span>
                  </div>
                  <div className="border-t border-gray-100 pt-2 flex justify-between items-center">
                    <span className="text-sm text-gray-500">New Balance</span>
                    <span className="font-black text-pink-600">
                      ₦{details.newBalance?.toLocaleString()}
                    </span>
                  </div>
                </div>

                <Link
                  href="/wallet"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 py-3 text-sm font-bold text-white transition"
                >
                  <Wallet className="h-4 w-4" />
                  Go to Wallet
                </Link>
              </div>
            )}
          </div>
        )}

        {status === "error" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-600">
              <XCircle className="h-10 w-10" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black text-gray-900">Verification Failed</h2>
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl p-3 mt-2">
                {errorMessage}
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-4">
              <button
                onClick={() => {
                  setStatus("loading");
                  setErrorMessage("");
                  verifiedRef.current = false;
                  window.location.reload();
                }}
                className="w-full rounded-xl bg-slate-900 hover:bg-slate-800 py-3 text-sm font-bold text-white transition"
              >
                Retry Verification
              </button>
              <Link
                href="/"
                className="w-full text-center border border-gray-200 hover:bg-gray-50 rounded-xl py-3 text-sm font-semibold text-gray-600 transition"
              >
                Back to Home
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PaymentCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-gray-50">
          <Loader2 className="h-12 w-12 animate-spin text-pink-600" />
        </div>
      }
    >
      <PaymentCallback />
    </Suspense>
  );
}
