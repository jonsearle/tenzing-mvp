import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import { getSupabaseConfig } from "@/lib/supabase/config";

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();
  const { url, anonKey } = getSupabaseConfig();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
        });
      },
    },
  });
}

export async function createRouteHandlerSupabaseClient() {
  return createServerSupabaseClient();
}

