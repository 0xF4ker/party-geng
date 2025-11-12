"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

export default function PaymentCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"verifying" | "success" | "failed">("verifying");
  const [message, setMessage] = useState("Verifying your payment...");

  const verifyPayment = api.payment.verifyPayment.useMutation({
    onSuccess: (data) => {
      setStatus("success");
      setMessage(`Payment successful! ₦${data.amount.toLocaleString()} has been added to your wallet.`);
      
      // Redirect to earnings page after 3 seconds
      setTimeout(() => {
        router.push("/earnings");
      }, 3000);
    },
    onError: (error) => {
      setStatus("failed");
      setMessage(error.message || "Payment verification failed. Please contact support.");
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
    verifyPayment.mutate({ reference });
  }, [searchParams]);

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
              <p className="mt-4 text-sm text-gray-500">
                Redirecting to earnings page...
              </p>
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
