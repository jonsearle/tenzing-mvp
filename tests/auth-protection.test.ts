import { getAuthRedirectPath, isProtectedPath } from "@/lib/auth/protection";

describe("route protection helpers", () => {
  it("marks legacy and v2 portfolio, queue, and account routes as protected", () => {
    expect(isProtectedPath("/portfolio")).toBe(true);
    expect(isProtectedPath("/portfolio-v2")).toBe(true);
    expect(isProtectedPath("/queue/risk")).toBe(true);
    expect(isProtectedPath("/queue-v2/risk")).toBe(true);
    expect(isProtectedPath("/accounts/ACC-001")).toBe(true);
    expect(isProtectedPath("/accounts-v2/ACC-001")).toBe(true);
  });

  it("leaves public routes unprotected", () => {
    expect(isProtectedPath("/")).toBe(false);
    expect(isProtectedPath("/auth/login")).toBe(false);
  });

  it("builds a login redirect that preserves the intended destination", () => {
    expect(getAuthRedirectPath("/accounts/ACC-001")).toBe(
      "/auth/login?next=%2Faccounts%2FACC-001",
    );
    expect(getAuthRedirectPath("/")).toBe(
      "/auth/login?next=%2Fportfolio-v2",
    );
  });
});
