// ── Password-reset token sign / verify ──────────────────────────────────────
// Stateless reset tokens — signed JWT-style payload keyed to the
// clinician's id + email + an exp claim, HMAC'd with AUTH_SECRET.
// Kept outside the "use server" action file because server-action
// files require every export to be async; sync helpers must live
// in plain modules.

import crypto from "crypto";

const RESET_TTL_SECONDS = 60 * 60; // 1 hour

function getSecret(): string {
  const s = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET is not configured");
  return s;
}

function base64url(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64urlDecode(s: string): Buffer {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  return Buffer.from(s, "base64");
}

export interface ResetClaims {
  sub: string;     // clinician id
  email: string;
  iat: number;
  exp: number;
}

export function signResetToken(sub: string, email: string, ttlSeconds: number = RESET_TTL_SECONDS): string {
  const now = Math.floor(Date.now() / 1000);
  const claims: ResetClaims = { sub, email, iat: now, exp: now + ttlSeconds };
  const payload = base64url(Buffer.from(JSON.stringify(claims)));
  const sig = base64url(crypto.createHmac("sha256", getSecret()).update(payload).digest());
  return `${payload}.${sig}`;
}

export function verifyResetToken(token: string): ResetClaims | null {
  try {
    const [payload, sig] = token.split(".");
    if (!payload || !sig) return null;
    const expected = base64url(crypto.createHmac("sha256", getSecret()).update(payload).digest());
    if (sig.length !== expected.length) return null;
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
    const claims = JSON.parse(base64urlDecode(payload).toString("utf8")) as ResetClaims;
    if (claims.exp < Math.floor(Date.now() / 1000)) return null;
    return claims;
  } catch {
    return null;
  }
}
