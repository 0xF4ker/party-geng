import "@/styles/globals.css";
import { TRPCReactProvider } from "@/trpc/react";
import { AuthProvider } from "@/providers/auth-provider";
import { Toaster } from "@/components/ui/sonner";
import { type Metadata } from "next";
import { BanProvider } from "@/providers/ban-provider";
import { KybProvider } from "@/providers/kyb-provider";
import { GlobalLoader } from "./_components/ui/global-loader";
import { SubscriptionProvider } from "@/providers/subscription-provider";
export const metadata: Metadata = {
  title: "PartyGeng",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <TRPCReactProvider>
          <AuthProvider>
            <GlobalLoader />
            <BanProvider>
              <KybProvider>
                <SubscriptionProvider>{children}</SubscriptionProvider>
              </KybProvider>
            </BanProvider>
          </AuthProvider>
          <Toaster />
        </TRPCReactProvider>
      </body>
    </html>
  );
}
