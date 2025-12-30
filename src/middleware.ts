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
  "/forum",
  "/partygeng-business",
  "/partygeng-pro",
];

// 2. Routes that match loosely
const PUBLIC_PREFIXES = [
  "/c/",
  "/v/",
  "/post/",
  "/categories",
  "/quote",
  "/api",
  "/lottiefiles",
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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Safe cast for user role
  const userRole = (
    user?.user_metadata?.role as string | undefined
  )?.toUpperCase();
  const path = request.nextUrl.pathname;

  // --- 3. HELPER: REDIRECTS ---
  const redirectTo = (url: string) => {
    return NextResponse.redirect(new URL(url, request.url));
  };

  // --- 4. PUBLIC ACCESS CHECK ---
  const isPublic =
    PUBLIC_ROUTES.includes(path) ||
    PUBLIC_PREFIXES.some((prefix) => path.startsWith(prefix));

  // --- 5. LOGGED OUT LOGIC ---
  if (!user) {
    // If it is a public route (including /api/trpc/...), allow it.
    // TRPC will handle the specific 'protectedProcedure' checks internally.
    if (isPublic) {
      return response;
    }
    // Otherwise, redirect to login (e.g. attempting to visit /dashboard while logged out)
    return redirectTo("/login");
  }

  // --- 6. AUTHENTICATED ACCESS CHECKS ---

  // A. PREVENT AUTH PAGES FOR LOGGED IN USERS
  if (path === "/login" || path === "/join") {
    if (userRole === ROLES.VENDOR) return redirectTo("/dashboard");
    if (userRole === ROLES.CLIENT) return redirectTo("/manage_events");
    if (ROLES.ADMIN_GROUP.includes(userRole ?? "")) return redirectTo("/admin");
    return redirectTo("/");
  }

  // B. ROLE BASED ACCESS CONTROL (RBAC)

  // === ADMIN ROUTES ===
  if (path.startsWith("/admin")) {
    if (!ROLES.ADMIN_GROUP.includes(userRole ?? "")) {
      return redirectTo("/");
    }

    if (userRole === "ADMIN") {
      return response;
    }

    const universalPaths = ["/admin/users", "/admin/vendors", "/admin/audit"];

    if (path === "/admin" || universalPaths.some((p) => path.startsWith(p))) {
      return response;
    }

    const supportAllowed = [
      "/admin/orders",
      "/admin/events",
      "/admin/kyc",
      "/admin/reports",
    ];

    const financeAllowed = ["/admin/finance"];

    if (userRole === "SUPPORT") {
      if (supportAllowed.some((p) => path.startsWith(p))) {
        return response;
      }
    }

    if (userRole === "FINANCE") {
      if (financeAllowed.some((p) => path.startsWith(p))) {
        return response;
      }
    }

    return redirectTo("/admin");
  }

  // === VENDOR ROUTES ===
  const vendorRoutes = ["/dashboard"];
  if (vendorRoutes.some((route) => path.startsWith(route))) {
    if (userRole !== ROLES.VENDOR) {
      return redirectTo("/manage_events");
    }
  }

  // === CLIENT ROUTES ===
  const clientRoutes = ["/manage_events", "/isave", "/wishlist"];
  if (clientRoutes.some((route) => path.startsWith(route))) {
    if (userRole !== ROLES.CLIENT) {
      return redirectTo("/dashboard");
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * * NOTE: We intentionally INCLUDE /api routes in the matcher so the middleware
     * runs (refreshing the session cookie), but we exclude them from redirects
     * via PUBLIC_PREFIXES logic above.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
