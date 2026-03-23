import { NextResponse } from "next/server";

import {
  REVIEWER_BYPASS_COOKIE,
  getReviewerBypassCookieValue,
} from "@/lib/auth/reviewer-bypass";

export async function POST(request: Request) {
  const url = new URL(request.url);
  const response = NextResponse.redirect(new URL("/portfolio-v2", url.origin), {
    status: 303,
  });

  response.cookies.set(REVIEWER_BYPASS_COOKIE, getReviewerBypassCookieValue(), {
    httpOnly: true,
    sameSite: "lax",
    secure: url.protocol === "https:",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  return response;
}
