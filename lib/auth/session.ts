import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import type { User } from "@supabase/supabase-js";

import {
  createReviewerBypassUser,
  hasReviewerBypassCookie,
} from "@/lib/auth/reviewer-bypass";
import { getAuthRedirectPath } from "@/lib/auth/protection";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function getOptionalUser() {
  const cookieStore = await cookies();

  if (hasReviewerBypassCookie(cookieStore)) {
    return createReviewerBypassUser();
  }

  if (!hasSupabaseEnv()) {
    return null;
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

export async function requireUser(nextPath = "/portfolio-v2"): Promise<User> {
  const user = await getOptionalUser();

  if (!user) {
    redirect(getAuthRedirectPath(nextPath));
  }

  return user;
}
