import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { AdminSidebar } from "@/app/_components/admin/AdminSidebar";
import { AdminMobileNav } from "@/app/_components/admin/AdminMobileNav";
import { AdminHeader } from "@/app/_components/admin/AdminHeader";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const role = user.user_metadata?.role as string;
  const allowedRoles = ["ADMIN", "SUPPORT", "FINANCE"];

  if (!allowedRoles.includes(role)) {
    redirect("/");
  }

  return (
    // Outer container: Full height, white background (matches sidebar)
    <div className="flex min-h-screen bg-white">
      {/* 1. Desktop Sidebar (Fixed Left) */}
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 md:block">
        <AdminSidebar role={role} />
      </aside>

      {/* 2. Main Content Wrapper */}
      {/* The background here is WHITE to match the sidebar, allowing the curve effect below */}
      <div className="flex flex-1 flex-col bg-white md:pl-64">
        {/* 3. The "Content Card" Area */}
        {/* We apply bg-gray-50 and a large top-left radius to create the "curve" */}
        <div className="flex min-h-screen flex-col rounded-tl-[2.5rem] border-t border-l border-gray-100/50 bg-gray-50/80 shadow-inner">
          {/* Header sits INSIDE this curved area */}
          <AdminHeader />

          <main className="flex-1 p-6 pb-24 md:pb-10 lg:p-10">
            <div className="animate-in fade-in slide-in-from-bottom-4 mx-auto max-w-7xl duration-500">
              {children}
            </div>
          </main>
        </div>
      </div>

      {/* 4. Mobile Bottom Nav (Fixed Bottom) */}
      <AdminMobileNav role={role} />
    </div>
  );
}
