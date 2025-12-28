import "@/styles/globals.css";

// import { type Metadata } from "next";
// import { Geist } from "next/font/google";

import { TRPCReactProvider } from "@/trpc/react";
// import Header from "./_components/home/Header";
// import Footer from "./_components/home/Footer";

import { AuthProvider } from "@/providers/auth-provider";
import { Toaster } from "@/components/ui/sonner";
import { type Metadata } from "next";
import { BanProvider } from "@/providers/ban-provider";

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
            <BanProvider>{children}</BanProvider>
          </AuthProvider>
          <Toaster />
        </TRPCReactProvider>
      </body>
    </html>
  );
}
