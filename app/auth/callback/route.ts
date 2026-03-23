import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

import { getSupabaseConfig, hasSupabaseEnv } from "@/lib/supabase/config";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/portfolio-v2";

  if (!hasSupabaseEnv() || !code) {
    return NextResponse.redirect(new URL("/auth/login", url.origin));
  }

  const response = NextResponse.next();
  const { url: supabaseUrl, anonKey } = getSupabaseConfig();
  const supabase = createServerClient(supabaseUrl, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });
  await supabase.auth.exchangeCodeForSession(code);

  const redirectResponse = NextResponse.redirect(new URL(next, url.origin));
  response.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie);
  });

  return redirectResponse;
}
