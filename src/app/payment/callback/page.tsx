"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
// import type { TRPCClientError } from "@trpc/client";
import { toast } from "sonner";
// import type { AppRouter } from "@/server/api/root";

function PaymentCallback() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"verifying" | "success" | "failed">(
    "verifying",
  );
  const [message, setMessage] = useState("Verifying your payment...");

  const { mutate: verifyPayment } = api.payment.verifyPayment.useMutation({
    onSuccess: (data) => {
      // If a quoteId is returned, it means funds were added specifically for a quote
      if (data.quoteId) {
        // Attempt to pay for the quote immediately
        payForQuote({ quoteId: data.quoteId });
        setMessage("Funds added. Attempting to finalize quote payment...");
      } else {
        // Standard wallet top-up
        setStatus("success");
        setMessage(
          `Payment successful! ₦${data.amount.toLocaleString()} has been added to your wallet.`,
        );
        setTimeout(() => {
          router.push("/earnings");
        }, 3000);
      }
    },
    onError: (error) => {
      setStatus("failed");
      setMessage(
        error.message || "Payment verification failed. Please contact support.",
      );
    },
  });

  const { mutate: payForQuote } = api.payment.payForQuote.useMutation({
    onSuccess: () => {
      setStatus("success");
      setMessage(
        "Funds added and quote paid successfully! Redirecting to chat...",
      );
      setTimeout(() => {
        router.push(`/inbox?conversation=${searchParams.get("conversation")}`); // Assuming conversationId is also passed in URL
      }, 3000);
    },
    onError: (error) => {
      setStatus("failed");
      // This is a critical error, as funds were just added but quote payment failed.
      // User should be directed to earnings to check their balance.
      if (error.data?.code === "CONFLICT") {
        setMessage(
          "Funds were added, but quote payment failed due to insufficient funds (unexpected error). Please check your wallet.",
        );
      } else {
        setMessage(
          error.message ||
            "An unexpected error occurred after adding funds. Quote payment failed.",
        );
      }
      toast.error(message); // Show toast with more context
      setTimeout(() => {
        router.push("/earnings");
      }, 5000);
    },
  });

  useEffect(() => {
    const reference = searchParams.get("reference");

    if (!reference) {
      setStatus("failed");
      setMessage("Invalid payment reference");
      return;
    }

    // Verify the payment
    verifyPayment({ reference });
  }, [searchParams, verifyPayment]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
        <div className="flex flex-col items-center text-center">
          {status === "verifying" && (
            <>
              <Loader2 className="h-16 w-16 animate-spin text-pink-600" />
              <h2 className="mt-4 text-2xl font-bold text-gray-900">
                Verifying Payment
              </h2>
              <p className="mt-2 text-gray-600">{message}</p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="rounded-full bg-green-100 p-4">
                <CheckCircle className="h-16 w-16 text-green-600" />
              </div>
              <h2 className="mt-4 text-2xl font-bold text-gray-900">
                Payment Successful!
              </h2>
              <p className="mt-2 text-gray-600">{message}</p>
              <p className="mt-4 text-sm text-gray-500">Redirecting...</p>
            </>
          )}

          {status === "failed" && (
            <>
              <div className="rounded-full bg-red-100 p-4">
                <XCircle className="h-16 w-16 text-red-600" />
              </div>
              <h2 className="mt-4 text-2xl font-bold text-gray-900">
                Payment Failed
              </h2>
              <p className="mt-2 text-gray-600">{message}</p>
              <button
                onClick={() => router.push("/earnings")}
                className="mt-6 rounded-md bg-pink-600 px-6 py-2 font-semibold text-white hover:bg-pink-700"
              >
                Return to Earnings
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PaymentCallbackPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PaymentCallback />
    </Suspense>
  );
}
