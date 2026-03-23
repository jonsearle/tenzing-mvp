const PROTECTED_PREFIXES = [
  "/portfolio",
  "/portfolio-v2",
  "/queue",
  "/queue-v2",
  "/accounts",
  "/accounts-v2",
] as const;

export function isProtectedPath(pathname: string) {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function getAuthRedirectPath(pathname: string) {
  const target = pathname && pathname !== "/" ? pathname : "/portfolio-v2";
  return `/auth/login?next=${encodeURIComponent(target)}`;
}
