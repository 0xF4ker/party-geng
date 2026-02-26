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
  "/auth", // <-- ADDED: Crucial for /auth/confirm to process the email token
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
    if (isPublic) {
      return response;
    }
    return redirectTo("/login");
  }

  // --- 6. AUTHENTICATED ACCESS CHECKS ---

  // A. PREVENT AUTH PAGES FOR LOGGED IN USERS
  if (path === "/login" || path === "/join") {
    if (userRole === ROLES.VENDOR) return redirectTo("/vendor/dashboard");
    if (userRole === ROLES.CLIENT) return redirectTo("/dashboard");
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
  const vendorRoutes = ["/vendor/dashboard"]; // Updated to match your new routing
  if (vendorRoutes.some((route) => path.startsWith(route))) {
    if (userRole !== ROLES.VENDOR) {
      return redirectTo("/dashboard");
    }
  }

  // === CLIENT ROUTES ===
  const clientRoutes = ["/dashboard", "/isave", "/wishlist"]; // Updated to match your new routing
  if (clientRoutes.some((route) => path.startsWith(route))) {
    if (userRole !== ROLES.CLIENT) {
      return redirectTo("/vendor/dashboard");
    }
  }

  // === ONBOARDING ROUTE ===
  // We explicitly allow /onboarding to pass through without redirects
  // Your /onboarding page component should handle redirecting the user away
  // if they have already synced their profile to Prisma.
  if (path === "/onboarding") {
    return response;
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
