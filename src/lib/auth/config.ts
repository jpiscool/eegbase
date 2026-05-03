import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import { clinicians } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { authConfig } from "./auth.config";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const [clinician] = await db
          .select()
          .from(clinicians)
          .where(eq(clinicians.email, credentials.email as string))
          .limit(1);

        if (!clinician?.passwordHash) return null;

        const valid = await bcrypt.compare(
          credentials.password as string,
          clinician.passwordHash
        );
        if (!valid) return null;

        return {
          id: clinician.id,
          name: clinician.name,
          email: clinician.email,
          role: clinician.role,
          clinicId: clinician.clinicId,
        };
      },
    }),
  ],
});
