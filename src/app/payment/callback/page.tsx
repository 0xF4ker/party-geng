"use client";

import { useEffect, useState, Suspense, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
// import type { TRPCClientError } from "@trpc/client";
// import { toast } from "sonner";
// import type { AppRouter } from "@/server/api/root";

function PaymentCallback() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialStatus = useMemo(() => {
    return searchParams.has("reference") ? "verifying" : "failed";
  }, [searchParams]);

  const initialMessage = useMemo(() => {
    return searchParams.has("reference")
      ? "Verifying your payment..."
      : "Invalid payment reference";
  }, [searchParams]);

  const [status, setStatus] = useState<"verifying" | "success" | "failed">(
    initialStatus,
  );
  const [message, setMessage] = useState(initialMessage);

  const { mutate: verifyPayment } = api.payment.verifyPayment.useMutation({
    onSuccess: (data) => {
      setStatus("success");
      setMessage(
        `Payment successful! ₦${data.amount.toLocaleString()} has been added to your wallet.`,
      );

      // If a quoteId is returned, redirect back to the quote
      if (data.quoteId) {
        setTimeout(() => {
          router.push(`/quote/${data.quoteId}`);
        }, 3000);
      } else {
        setTimeout(() => {
          router.push("/wallet");
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

  useEffect(() => {
    const reference = searchParams.get("reference");

    if (reference && status === "verifying") {
      // Verify the payment
      verifyPayment({ reference });
    }
  }, [searchParams, verifyPayment, status]);

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
                onClick={() => router.push("/wallet")}
                className="mt-6 rounded-md bg-pink-600 px-6 py-2 font-semibold text-white hover:bg-pink-700"
              >
                Return to Wallet
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
