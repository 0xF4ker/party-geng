import "@/styles/globals.css";
import Header from "@/app/_components/home/Header";

// import { type Metadata } from "next";
// import { Geist } from "next/font/google";

export default function InboxLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <Header />
      {children}
    </>
  );
}
