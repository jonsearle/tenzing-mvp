import { NextResponse } from "next/server";

import { createRouteHandlerSupabaseClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/config";

export async function POST(request: Request) {
  const url = new URL(request.url);

  if (hasSupabaseEnv()) {
    const supabase = await createRouteHandlerSupabaseClient();
    await supabase.auth.signOut();
  }

  return NextResponse.redirect(new URL("/auth/login", url.origin), {
    status: 303,
  });
}

