import type { User } from "@supabase/supabase-js";

export const REVIEWER_BYPASS_COOKIE = "tenzing-reviewer-bypass";
const REVIEWER_BYPASS_VALUE = "enabled";

type CookieReader = {
  get(name: string): { value?: string } | undefined;
};

export function hasReviewerBypassCookie(cookies: CookieReader) {
  return cookies.get(REVIEWER_BYPASS_COOKIE)?.value === REVIEWER_BYPASS_VALUE;
}

export function getReviewerBypassCookieValue() {
  return REVIEWER_BYPASS_VALUE;
}

export function createReviewerBypassUser(): User {
  return {
    id: "reviewer-bypass",
    aud: "authenticated",
    role: "authenticated",
    email: "reviewer@tenzing.local",
    email_confirmed_at: new Date(0).toISOString(),
    phone: "",
    confirmed_at: new Date(0).toISOString(),
    last_sign_in_at: new Date(0).toISOString(),
    app_metadata: {
      provider: "reviewer-bypass",
      providers: ["reviewer-bypass"],
    },
    user_metadata: {
      full_name: "Reviewer",
    },
    identities: [],
    created_at: new Date(0).toISOString(),
    updated_at: new Date(0).toISOString(),
    is_anonymous: false,
  };
}
