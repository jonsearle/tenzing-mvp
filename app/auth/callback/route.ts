import { NextResponse } from "next/server";

import { createRouteHandlerSupabaseClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/config";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/portfolio";

  if (!hasSupabaseEnv() || !code) {
    return NextResponse.redirect(new URL("/auth/login", url.origin));
  }

  const supabase = await createRouteHandlerSupabaseClient();
  await supabase.auth.exchangeCodeForSession(code);

  return NextResponse.redirect(new URL(next, url.origin));
}

