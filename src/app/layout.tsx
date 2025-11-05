import "@/styles/globals.css";

// import { type Metadata } from "next";
// import { Geist } from "next/font/google";

import { TRPCReactProvider } from "@/trpc/react";
// import Header from "./_components/home/Header";
// import Footer from "./_components/home/Footer";

import { AuthProvider } from "@/providers/auth-provider";

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <TRPCReactProvider>
          {/* <AuthProvider> */}
          {/* <Header /> */}
          {children}
          {/* <Footer /> */}
          {/* </AuthProvider> */}
        </TRPCReactProvider>
      </body>
    </html>
  );
}
