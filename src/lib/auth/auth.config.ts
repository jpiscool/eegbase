import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe auth config — no Node.js-only imports (pg, bcryptjs).
 * Used by middleware. Providers are added in config.ts.
 */
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isAuthPage = nextUrl.pathname.startsWith("/login");
      const isPublicPage =
        nextUrl.pathname.startsWith("/share/") ||
        nextUrl.pathname.startsWith("/checkin/");

      if (isPublicPage) return true;
      if (!isLoggedIn && !isAuthPage) return false;
      if (isLoggedIn && isAuthPage) {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
        token.clinicId = (user as { clinicId?: string }).clinicId;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      (session.user as { role?: string }).role = token.role as string;
      (session.user as { clinicId?: string }).clinicId = token.clinicId as string;
      return session;
    },
  },
  providers: [], // populated in config.ts
};
