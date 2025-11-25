"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Header from "@/app/_components/home/Header";
import Footer from "@/app/_components/home/Footer";
import { CreatePostButton } from "@/app/_components/posts/CreatePostButton";
import { CreatePostModal } from "@/app/_components/posts/CreatePostModal";
import { EventChatButton } from "@/app/_components/event/EventChatButton";

export default function MainLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const isProfilePage =
    pathname.startsWith("/c/") || pathname.startsWith("/v/");

  return (
    <>
      {!isProfilePage && <Header />}
      <main>{children}</main>
      {!isProfilePage && <Footer />}
      <EventChatButton />
      <CreatePostButton />
      <CreatePostModal />
    </>
  );
}
