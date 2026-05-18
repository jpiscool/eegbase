// ── Edge auth middleware ────────────────────────────────────────────────────
// Single gate for every clinic-scoped (PHI-bearing) route. Eliminates the
// `clinicId ?? ""` crash class that bit /sessions/live earlier: by the
// time a request reaches a protected page, the user is guaranteed to have
// a valid session — pages can deref `session.user.clinicId` without
// nullish-coalescing to an empty string that crashes a uuid cast.
//
// Strategy: ALLOWLIST the public surfaces (marketing, /demo, /register,
// auth pages, token-gated client portal, blog, conditions library), and
// DENY everything else by default. Safer than per-page checks because
// adding a new auth-protected route requires zero middleware change.

import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth/auth.config";

const { auth } = NextAuth(authConfig);

// Marketing + content pages that anyone can visit. Order-insensitive;
// each entry is checked as a prefix match against the pathname.
const PUBLIC_PREFIXES = [
  "/",                       // marketing landing — handled separately below for exact match
  "/demo",
  "/conditions",
  "/calculators",
  "/glossary",
  "/blog",
  "/case-studies",
  "/community",
  "/clinic-finder",
  "/clinicians",
  "/devices",
  "/developers",
  "/downloads",
  "/docs",
  "/faq",
  "/integrations",
  "/mendi",
  "/mendi-sdk",
  "/office-hours",
  "/onboarding",             // first-run educational pages
  "/partners",
  "/patients",
  "/pricing",
  "/privacy",
  "/resources",
  "/researchers",
  "/security",
  "/status",
  "/supervise",
  "/team",
  "/terms",
  "/trust-center",
  "/vs",
  "/enterprise",
  "/investors",
  "/careers",
  "/brand-assets",
  "/contact",
  "/es", "/fr",              // i18n landing pages
  // Auth surfaces
  "/login",
  "/register",
  "/signup",
  "/forgot-password",
  "/reset-password",
  // Token-gated public surfaces
  "/share",
  "/checkin",
  "/portal",
  // Temporary design-review surface — no PHI
  "/palettes",
  // API routes handle auth per-endpoint
  "/api",
  // Next.js internals + static
  "/_next",
  "/favicon.ico",
  "/sitemap.xml",
  "/robots.txt",
];

function isPublicPath(pathname: string): boolean {
  // Marketing root is an exact match (don't allow every "/x" path through).
  if (pathname === "/") return true;
  for (const prefix of PUBLIC_PREFIXES) {
    if (prefix === "/") continue;
    if (pathname === prefix || pathname.startsWith(prefix + "/")) return true;
  }
  return false;
}

export default auth((req) => {
  const { pathname, search } = req.nextUrl;
  if (isPublicPath(pathname)) return;
  // Authenticated → let through.
  if (req.auth?.user) return;
  // Unauth → kick to /login with ?next= so they return here on success.
  const loginUrl = new URL("/login", req.nextUrl);
  loginUrl.searchParams.set("next", pathname + (search ?? ""));
  return Response.redirect(loginUrl);
});

// Run on everything except static asset paths to keep edge invocations
// minimal (Vercel charges per-invocation).
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
