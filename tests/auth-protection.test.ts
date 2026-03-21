import { getAuthRedirectPath, isProtectedPath } from "@/lib/auth/protection";

describe("route protection helpers", () => {
  it("marks portfolio, queue, and account routes as protected", () => {
    expect(isProtectedPath("/portfolio")).toBe(true);
    expect(isProtectedPath("/queue/risk")).toBe(true);
    expect(isProtectedPath("/accounts/ACC-001")).toBe(true);
  });

  it("leaves public routes unprotected", () => {
    expect(isProtectedPath("/")).toBe(false);
    expect(isProtectedPath("/auth/login")).toBe(false);
  });

  it("builds a login redirect that preserves the intended destination", () => {
    expect(getAuthRedirectPath("/accounts/ACC-001")).toBe(
      "/auth/login?next=%2Faccounts%2FACC-001",
    );
  });
});

