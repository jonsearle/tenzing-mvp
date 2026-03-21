import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getAuthRedirectPath, isProtectedPath } from "@/lib/auth/protection";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (!isProtectedPath(pathname)) {
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
  matcher: ["/portfolio/:path*", "/queue/:path*", "/accounts/:path*"],
};

