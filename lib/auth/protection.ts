const PROTECTED_PREFIXES = ["/portfolio", "/queue", "/accounts"] as const;

export function isProtectedPath(pathname: string) {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function getAuthRedirectPath(pathname: string) {
  const target = pathname && pathname !== "/" ? pathname : "/portfolio";
  return `/auth/login?next=${encodeURIComponent(target)}`;
}

