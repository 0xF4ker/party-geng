import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/join",
  "/join/coordinator",
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
  "/co/",
  "/post/",
  "/categories",
  "/coordinators",
  "/events",
  "/payment",
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
  const path = request.nextUrl.pathname;
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });
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
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userRole = (
    user?.user_metadata?.role as string | undefined
  )?.toUpperCase();
  console.log(`[Middleware] Path: ${path}, Search: ${request.nextUrl.search}, User: ${user?.id}, Role: ${userRole}`);
  const redirectTo = (url: string) => {
    console.log(`[Middleware Redirect] Redirecting to ${url} from ${request.nextUrl.pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(new URL(url, request.url));
  };
  const isPublic =
    PUBLIC_ROUTES.includes(path) ||
    PUBLIC_PREFIXES.some((prefix) => path.startsWith(prefix));
  if (!user) {
    if (isPublic) {
      return response;
    }
    return redirectTo("/login");
  }
  if (path === "/login" || path === "/join" || path === "/join/coordinator") {
    if (userRole === ROLES.VENDOR) return redirectTo("/dashboard");
    if (ROLES.ADMIN_GROUP.includes(userRole ?? "")) return redirectTo("/admin");
    // Coordinators and clients both go to /trending
    return redirectTo("/trending");
  }
  if (path === "/onboarding") {
    return response;
  }
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
  if (userRole === "COORDINATOR") {
    // Routes coordinators cannot access
    const blockedForCoordinator = ["/dashboard", "/isave", "/wishlist", "/manage_events", "/manage_orders"];
    if (blockedForCoordinator.some((p) => path.startsWith(p))) {
      return redirectTo("/coordinator/dashboard");
    }
    // Everything else (event pages, inbox, trending, coordinator/dashboard, settings) is allowed
    return response;
  }

  const vendorRoutes = ["/dashboard"];
  if (
    vendorRoutes.some((route) => path.startsWith(route)) &&
    userRole !== ROLES.VENDOR
  ) {
    return redirectTo("/trending");
  }
  // Only CLIENT role is restricted to client-only routes; vendors/coordinators can browse /trending
  const clientOnlyRoutes = ["/isave", "/wishlist", "/manage_events"];
  if (
    clientOnlyRoutes.some((route) => path.startsWith(route)) &&
    userRole !== ROLES.CLIENT
  ) {
    return redirectTo("/dashboard");
  }
  return response;
}
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
