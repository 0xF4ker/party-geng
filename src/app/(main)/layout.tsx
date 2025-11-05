"use client";

import React from "react";
import Header from "@/app/_components/home/Header";
import Footer from "@/app/_components/home/Footer";

export default function MainLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
    </>
  );
}
