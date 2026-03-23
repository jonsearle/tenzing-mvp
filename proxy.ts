import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getAuthRedirectPath, isProtectedPath } from "@/lib/auth/protection";
import { hasReviewerBypassCookie } from "@/lib/auth/reviewer-bypass";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  if (hasReviewerBypassCookie(request.cookies)) {
    return NextResponse.next();
  }

  if (!hasSupabaseEnv()) {
    const redirect = new URL(getAuthRedirectPath(pathname), request.url);
    return NextResponse.redirect(redirect);
  }

  const { response, user } = await updateSession(request);

  if (!user) {
    const redirect = new URL(getAuthRedirectPath(pathname), request.url);
    return NextResponse.redirect(redirect);
  }

  return response;
}

export const config = {
  matcher: [
    "/portfolio/:path*",
    "/portfolio-v2/:path*",
    "/queue/:path*",
    "/queue-v2/:path*",
    "/accounts/:path*",
    "/accounts-v2/:path*",
  ],
};
