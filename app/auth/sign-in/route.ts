import { NextResponse } from "next/server";

import { hasSupabaseEnv } from "@/lib/supabase/config";
import { createRouteHandlerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);

  if (!hasSupabaseEnv()) {
    return NextResponse.redirect(new URL("/auth/login", url.origin));
  }

  const supabase = await createRouteHandlerSupabaseClient();
  const next = url.searchParams.get("next") ?? "/portfolio";
  const callbackUrl = new URL("/auth/callback", url.origin);
  callbackUrl.searchParams.set("next", next);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: callbackUrl.toString(),
      queryParams: {
        access_type: "offline",
        prompt: "select_account",
      },
    },
  });

  if (error || !data.url) {
    return NextResponse.redirect(new URL("/auth/login", url.origin));
  }

  return NextResponse.redirect(data.url);
}

