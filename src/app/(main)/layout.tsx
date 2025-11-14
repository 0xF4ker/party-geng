"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Header from "@/app/_components/home/Header";
import Footer from "@/app/_components/home/Footer";

export default function MainLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const isProfilePage = pathname.startsWith("/c/");

  return (
    <>
      {!isProfilePage && <Header />}
      <main>{children}</main>
      {!isProfilePage && <Footer />}
    </>
  );
}
