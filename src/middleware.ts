import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

// --- CONFIGURATION ---
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

const PUBLIC_PREFIXES = [
  "/c/",
  "/v/",
  "/post/",
  "/categories",
  "/quote",
  "/api",
  "/lottiefiles",
  "/invitation",
];

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
          cookiesToSet.forEach(({ name, value }) =>
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

  const userRole = (
    user?.user_metadata?.role as string | undefined
  )?.toUpperCase();
  const path = request.nextUrl.pathname;

  const redirectTo = (url: string) => {
    return NextResponse.redirect(new URL(url, request.url));
  };

  const isPublic =
    PUBLIC_ROUTES.includes(path) ||
    PUBLIC_PREFIXES.some((prefix) => path.startsWith(prefix));

  // --- 3. LOGGED OUT LOGIC ---
  if (!user) {
    if (isPublic) {
      return response;
    }
    // If a logged-out user tries to go to /onboarding, they get sent here.
    return redirectTo("/login");
  }

  // --- 4. AUTHENTICATED ACCESS CHECKS ---

  // A. PREVENT AUTH PAGES FOR LOGGED IN USERS
  if (path === "/login" || path === "/join") {
    if (userRole === ROLES.VENDOR) return redirectTo("/vendor/dashboard");
    if (userRole === ROLES.CLIENT) return redirectTo("/dashboard");
    if (ROLES.ADMIN_GROUP.includes(userRole ?? "")) return redirectTo("/admin");
    return redirectTo("/");
  }

  // B. ALLOW ONBOARDING
  // If they are logged in and hit /onboarding, let them through.
  // The Onboarding page itself will kick them out if they already have a Prisma profile.
  if (path === "/onboarding") {
    return response;
  }

  // C. ROLE BASED ACCESS CONTROL (RBAC)
  if (path.startsWith("/admin")) {
    if (!ROLES.ADMIN_GROUP.includes(userRole ?? "")) return redirectTo("/");
    if (userRole === "ADMIN") return response;

    const universalPaths = ["/admin/users", "/admin/vendors", "/admin/audit"];
    if (path === "/admin" || universalPaths.some((p) => path.startsWith(p)))
      return response;

    const supportAllowed = [
      "/admin/orders",
      "/admin/events",
      "/admin/kyc",
      "/admin/reports",
    ];
    const financeAllowed = ["/admin/finance"];

    if (
      userRole === "SUPPORT" &&
      supportAllowed.some((p) => path.startsWith(p))
    )
      return response;
    if (
      userRole === "FINANCE" &&
      financeAllowed.some((p) => path.startsWith(p))
    )
      return response;

    return redirectTo("/admin");
  }

  const vendorRoutes = ["/vendor/dashboard"];
  if (
    vendorRoutes.some((route) => path.startsWith(route)) &&
    userRole !== ROLES.VENDOR
  ) {
    return redirectTo("/dashboard");
  }

  const clientRoutes = ["/dashboard", "/isave", "/wishlist"];
  if (
    clientRoutes.some((route) => path.startsWith(route)) &&
    userRole !== ROLES.CLIENT
  ) {
    return redirectTo("/vendor/dashboard");
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
