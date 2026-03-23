import { describe, expect, it } from "vitest";

import {
  REVIEWER_BYPASS_COOKIE,
  createReviewerBypassUser,
  getReviewerBypassCookieValue,
  hasReviewerBypassCookie,
} from "@/lib/auth/reviewer-bypass";

describe("reviewer bypass auth", () => {
  it("recognizes the reviewer bypass cookie", () => {
    const cookies = {
      get(name: string) {
        if (name === REVIEWER_BYPASS_COOKIE) {
          return { value: getReviewerBypassCookieValue() };
        }

        return undefined;
      },
    };

    expect(hasReviewerBypassCookie(cookies)).toBe(true);
  });

  it("does not enable bypass for other cookie values", () => {
    const cookies = {
      get() {
        return { value: "nope" };
      },
    };

    expect(hasReviewerBypassCookie(cookies)).toBe(false);
  });

  it("builds a stable reviewer user", () => {
    expect(createReviewerBypassUser()).toMatchObject({
      id: "reviewer-bypass",
      email: "reviewer@tenzing.local",
      role: "authenticated",
    });
  });
});
