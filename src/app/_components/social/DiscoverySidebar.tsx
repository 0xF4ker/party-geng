"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  TrendingUp,
  Users,
  Store,
  Calendar,
  Image,
  PlusCircle,
  Bookmark,
} from "lucide-react";
import { useCreatePostModal } from "@/stores/createPostModal";

interface DiscoverySidebarProps {
  posts: Array<{ caption: string | null }>;
}

export default function DiscoverySidebar({ posts }: DiscoverySidebarProps) {
  const { onOpen } = useCreatePostModal();

  const trendingHashtags = useMemo(() => {
    const counts = new Map<string, number>();

    for (const post of posts) {
      if (!post.caption) continue;
      const tags = post.caption.match(/#[\w\u0080-\uFFFF]+/g);
      if (!tags) continue;
      for (const tag of tags) {
        const normalized = tag.toLowerCase();
        counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
      }
    }

    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([tag, count]) => ({ tag, count }));
  }, [posts]);

  return (
    <div className="w-full space-y-6">
      {/* ── Trending Topics (Hashed out for now) ── */}
      {/*
      <section className="rounded-2xl border border-[var(--l-border)] bg-white p-5 shadow-sm">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-[var(--l-text)]">
          <TrendingUp className="h-4 w-4 text-[var(--l-brand-pink)]" />
          Trending Topics
        </h3>

        {trendingHashtags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {trendingHashtags.map(({ tag, count }) => (
              <span
                key={tag}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-pink-50 px-3 py-1.5 text-sm font-medium text-pink-600 transition-colors hover:bg-pink-100"
              >
                {tag}
                <span className="rounded-full bg-pink-200/60 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-pink-700">
                  {count}
                </span>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[var(--l-text-muted)]">
            No trending topics yet — be the first to start one!
          </p>
        )}
      </section>

      <div className="h-px bg-gray-100" />
      */}

      {/* ── Community Stats ── */}
      <section className="rounded-2xl border border-[var(--l-border)] bg-white p-5 shadow-sm">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-[var(--l-text)]">
          <Users className="h-4 w-4 text-[var(--l-brand-purple)]" />
          Community
        </h3>

        <div className="grid grid-cols-3 gap-3">
          {[
            {
              icon: Store,
              value: "50+",
              label: "Active Vendors",
              color: "bg-purple-100 text-purple-600",
            },
            {
              icon: Calendar,
              value: "25+",
              label: "Events This Month",
              color: "bg-pink-100 text-pink-600",
            },
            {
              icon: Image,
              value: "100+",
              label: "Posts Today",
              color: "bg-amber-100 text-amber-600",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col items-center gap-1.5 text-center"
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full ${stat.color}`}
              >
                <stat.icon className="h-5 w-5" />
              </div>
              <span className="text-lg font-bold text-[var(--l-text)]">
                {stat.value}
              </span>
              <span className="text-[11px] leading-tight text-[var(--l-text-muted)]">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      <div className="h-px bg-gray-100" />

      {/* ── Quick Links ── */}
      <section className="rounded-2xl border border-[var(--l-border)] bg-white p-5 shadow-sm">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-[var(--l-text)]">
          Explore
        </h3>

        <nav className="space-y-1">
          <Link
            href="/categories"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--l-text)] transition-colors hover:bg-gray-50"
          >
            <Store className="h-4 w-4 text-[var(--l-text-muted)]" />
            Browse Vendors
          </Link>

          <button
            type="button"
            onClick={() => onOpen()}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--l-text)] transition-colors hover:bg-gray-50"
          >
            <PlusCircle className="h-4 w-4 text-[var(--l-text-muted)]" />
            Create a Post
          </button>

          <Link
            href="/trending?tab=saved"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--l-text)] transition-colors hover:bg-gray-50"
          >
            <Bookmark className="h-4 w-4 text-[var(--l-text-muted)]" />
            My Saved Posts
          </Link>
        </nav>
      </section>

      <div className="h-px bg-gray-100" />

      {/* ── Footer ── */}
      <footer className="px-2 text-center">
        <p className="text-xs text-[var(--l-text-muted)]">
          © 2024 PartyGeng
        </p>
        <div className="mt-1.5 flex items-center justify-center gap-2 text-[11px] text-[var(--l-text-muted)]">
          <span className="cursor-pointer hover:text-[var(--l-text)]">
            About
          </span>
          <span>·</span>
          <span className="cursor-pointer hover:text-[var(--l-text)]">
            Privacy
          </span>
          <span>·</span>
          <span className="cursor-pointer hover:text-[var(--l-text)]">
            Terms
          </span>
        </div>
      </footer>
    </div>
  );
}
