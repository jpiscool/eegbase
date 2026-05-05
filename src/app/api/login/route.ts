import { db } from "@/lib/db";
import { clinicians } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { encode } from "@auth/core/jwt";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    const [c] = await db
      .select()
      .from(clinicians)
      .where(eq(clinicians.email, email))
      .limit(1);

    if (!c?.passwordHash) {
      return Response.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, c.passwordHash);
    if (!valid) {
      return Response.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const secret = process.env.NEXTAUTH_SECRET!;
    const isProd = process.env.NODE_ENV === "production";
    const cookieName = isProd
      ? "__Secure-authjs.session-token"
      : "authjs.session-token";

    const now = Math.floor(Date.now() / 1000);
    const token = await encode({
      token: {
        sub: c.id,
        name: c.name,
        email: c.email,
        picture: null,
        id: c.id,
        role: c.role,
        clinicId: c.clinicId,
        iat: now,
        exp: now + 30 * 24 * 60 * 60,
        jti: crypto.randomUUID(),
      },
      secret,
      salt: cookieName,
    });

    const cookie = [
      `${cookieName}=${token}`,
      "Path=/",
      "HttpOnly",
      "SameSite=Lax",
      `Max-Age=${30 * 24 * 60 * 60}`,
      ...(isProd ? ["Secure"] : []),
    ].join("; ");

    return new Response(JSON.stringify({ ok: true }), {
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": cookie,
      },
    });
  } catch (e) {
    console.error("[/api/login] error:", e);
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
