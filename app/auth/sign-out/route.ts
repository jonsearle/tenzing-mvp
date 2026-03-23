import { NextResponse } from "next/server";

import { REVIEWER_BYPASS_COOKIE } from "@/lib/auth/reviewer-bypass";
import { createRouteHandlerSupabaseClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/config";

export async function POST(request: Request) {
  const url = new URL(request.url);

  if (hasSupabaseEnv()) {
    const supabase = await createRouteHandlerSupabaseClient();
    await supabase.auth.signOut();
  }

  const response = NextResponse.redirect(new URL("/auth/login", url.origin), {
    status: 303,
  });

  response.cookies.delete(REVIEWER_BYPASS_COOKIE);

  return response;
}
