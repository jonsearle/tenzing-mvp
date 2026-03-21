import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";

import { getAuthRedirectPath } from "@/lib/auth/protection";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function getOptionalUser() {
  if (!hasSupabaseEnv()) {
    return null;
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

export async function requireUser(nextPath = "/portfolio"): Promise<User> {
  const user = await getOptionalUser();

  if (!user) {
    redirect(getAuthRedirectPath(nextPath));
  }

  return user;
}

