import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

// --- CONFIGURATION ---

// 1. Routes accessible to everyone (Guests + Logged in)
const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/join",
  "/trending",
  "/terms-of-service",
  "/privacy-policy",
  "/help-and-support",
  "/frequently-asked-questions",
  "/forum", // Assuming forum is public read
  "/partygeng-business",
  "/partygeng-pro",
];

// 2. Routes that match loosely (e.g. /c/user123, /categories/music)
// We allow these by default, though page-level logic might handle specific data privacy
const PUBLIC_PREFIXES = [
  "/c/",
  "/v/",
  "/post/",
  "/categories",
  "/quote", // Often accessed via email link without auth initially
];

// 3. Role Definitions
const ROLES = {
  ADMIN_GROUP: ["ADMIN", "SUPPORT", "FINANCE"],
  VENDOR: "VENDOR",
  CLIENT: "CLIENT",
};

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // --- 1. SETUP SUPABASE ---
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // --- 2. GET USER & ROLE ---
  // getUser() is safer than getSession() in middleware as it validates the token
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userRole = (user?.user_metadata?.role as string)?.toUpperCase();
  const path = request.nextUrl.pathname;

  // --- 3. HELPER: REDIRECTS ---
  const redirectTo = (url: string) => {
    return NextResponse.redirect(new URL(url, request.url));
  };

  // --- 4. PUBLIC ACCESS CHECK ---
  // If the path is public, let them pass immediately (avoids unnecessary logic)
  const isPublic =
    PUBLIC_ROUTES.includes(path) ||
    PUBLIC_PREFIXES.some((prefix) => path.startsWith(prefix));

  if (!user) {
    // If not logged in and trying to access protected route -> Login
    if (!isPublic) {
      return redirectTo("/login");
    }
    // If guest on public route -> Allow
    return response;
  }

  // --- 5. AUTHENTICATED ACCESS CHECKS ---

  // A. PREVENT AUTH PAGES FOR LOGGED IN USERS
  // If user is already logged in, they shouldn't see /login or /join
  if (path === "/login" || path === "/join") {
    if (userRole === ROLES.VENDOR) return redirectTo("/dashboard");
    if (userRole === ROLES.CLIENT) return redirectTo("/manage_events");
    if (ROLES.ADMIN_GROUP.includes(userRole)) return redirectTo("/admin");
    return redirectTo("/");
  }

  // B. SUSPENSION CHECK
  // (Optional: If you want to enforce Ban at the edge level.
  // However, usually we let the BanProvider handle UI so they can see "Why" they are banned.
  // If you strictly want to block all navigation for banned users, uncomment below.)

  /*
  const status = user.user_metadata?.status; // Assuming status is synced to metadata
  if ((status === 'BANNED' || status === 'SUSPENDED') && !path.startsWith('/help-and-support')) {
     // You might want a specific /suspended page instead of BanProvider logic
     // return redirectTo('/suspended'); 
  }
  */

  // --- 6. ROLE BASED ACCESS CONTROL (RBAC) ---

  // === ADMIN ROUTES ===
  if (path.startsWith("/admin")) {
    // 1. Global Gate: Must be part of the Admin Group to enter /admin at all
    if (!ROLES.ADMIN_GROUP.includes(userRole)) {
      return redirectTo("/");
    }

    // 2. Super Admin: "ADMIN" role has unrestricted access to everything
    if (userRole === "ADMIN") {
      return response;
    }

    // 3. Universal Paths: Accessible by ALL admin roles (Support & Finance included)
    const universalPaths = ["/admin/users", "/admin/vendors", "/admin/audit"];

    // Allow access if it's the dashboard OR one of the universal pages
    if (path === "/admin" || universalPaths.some((p) => path.startsWith(p))) {
      return response;
    }

    // 4. Role-Specific Whitelists (Exclusive additions)
    const supportAllowed = [
      "/admin/orders",
      "/admin/events",
      "/admin/kyc",
      "/admin/reports",
    ];

    const financeAllowed = ["/admin/finance"];

    // 5. Check SUPPORT Access
    if (userRole === "SUPPORT") {
      if (supportAllowed.some((p) => path.startsWith(p))) {
        return response;
      }
    }

    // 6. Check FINANCE Access
    if (userRole === "FINANCE") {
      if (financeAllowed.some((p) => path.startsWith(p))) {
        return response;
      }
    }

    // 7. Default Deny (Fallback)
    // If they try to access a page they don't have permission for (e.g., Finance trying /admin/settings),
    // redirect them to the main admin dashboard.
    return redirectTo("/admin");
  }

  // === VENDOR ROUTES ===
  // Paths strictly for vendors
  const vendorRoutes = ["/dashboard"];
  if (vendorRoutes.some((route) => path.startsWith(route))) {
    if (userRole !== ROLES.VENDOR) {
      return redirectTo("/manage_events"); // Redirect clients back to their safe space
    }
  }

  // === CLIENT ROUTES ===
  // Paths strictly for clients
  const clientRoutes = ["/manage_events", "/event/"];
  // Note: /event/[id] might be viewable by vendors if invited, but creation is client only.
  // We'll stricter check /manage_events

  if (clientRoutes.some((route) => path.startsWith(route))) {
    if (userRole !== ROLES.CLIENT) {
      return redirectTo("/dashboard"); // Redirect vendors back to their safe space
    }
  }

  // === SHARED ROUTES ===
  // Routes like /orders/[id], /settings, /wallet are usually shared but logic handles data isolation.
  // We allow authenticated access to these.

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api (API routes - generally protected by TRPC, but good to check)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
