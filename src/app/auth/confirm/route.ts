// src/app/auth/confirm/route.ts
import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server"; // Adjust if your server client path is different

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/"; // Default redirect after confirmation

  if (token_hash && type) {
    const supabase = await createClient();

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });

    if (!error) {
      // NOTE: Because you sync your Supabase users to your Prisma DB
      // via the `createUser` TRPC route, you might want to redirect
      // first-time verified users to an `/onboarding` page here to fire that TRPC route.
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = next;
      redirectUrl.searchParams.delete("token_hash");
      redirectUrl.searchParams.delete("type");

      return NextResponse.redirect(redirectUrl);
    }
  }

  // If verification fails or link is expired, send them to an error page
  const errorUrl = request.nextUrl.clone();
  errorUrl.pathname = "/login"; // or an explicit /auth-error page
  errorUrl.searchParams.set("error", "Invalid or expired confirmation link");
  return NextResponse.redirect(errorUrl);
}
