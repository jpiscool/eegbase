"use server";

// Password-reset flow. Stateless — the reset link carries a signed
// HMAC token keyed to the clinician's id + email + a server-side
// secret. No DB table needed (revocation is implicit via the 60-minute
// expiry). The sync sign/verify helpers live in @/lib/reset-token
// because "use server" files must export only async functions.

import { db } from "@/lib/db";
import { clinicians } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { headers } from "next/headers";
import { sendEmail, passwordResetEmail } from "@/lib/email";
import { signResetToken, verifyResetToken } from "@/lib/reset-token";
import { checkRate, clientIpFromHeaders } from "@/lib/rate-limit";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Always returns `ok` to defeat account-enumeration. Whether the email
 * is on file or not, the user sees the same "check your inbox" screen.
 */
export async function requestPasswordReset(formData: FormData): Promise<{ ok: true }> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return { ok: true };
  // Two-axis rate limit: per-IP defeats scrapers, per-email defeats
  // a targeted reset-spam attack against one account. Both return
  // ok to preserve the enumeration-defence — caller can't distinguish
  // throttled vs unrecognized email.
  const h = await headers();
  const ip = clientIpFromHeaders(h);
  const ipRate = checkRate("forgot-password-ip", ip, { max: 10, windowMs: 60 * 60 * 1000 });
  const emailRate = checkRate("forgot-password-email", email, { max: 3, windowMs: 60 * 60 * 1000 });
  if (!ipRate.ok || !emailRate.ok) return { ok: true };

  const [user] = await db
    .select({ id: clinicians.id, name: clinicians.name, email: clinicians.email })
    .from(clinicians)
    .where(eq(clinicians.email, email))
    .limit(1);
  if (!user) return { ok: true };

  const token = signResetToken(user.id, user.email);
  const origin = process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "https://eegbase.com";
  const resetUrl = `${origin}/reset-password?token=${encodeURIComponent(token)}`;
  const tpl = passwordResetEmail(user.name ?? "", resetUrl);
  void sendEmail({ to: email, ...tpl }).catch(() => {});

  return { ok: true };
}

/**
 * Consume a reset token + set a new password. Returns an error string
 * if the token is invalid or expired, otherwise updates passwordHash.
 */
export async function resetPasswordWithToken(token: string, newPassword: string): Promise<{ error?: string }> {
  if (newPassword.length < 8) return { error: "Password must be at least 8 characters." };
  const claims = verifyResetToken(token);
  if (!claims) return { error: "This reset link is invalid or expired. Request a new one." };

  const [user] = await db
    .select({ id: clinicians.id, email: clinicians.email })
    .from(clinicians)
    .where(eq(clinicians.id, claims.sub))
    .limit(1);
  if (!user || user.email !== claims.email) {
    return { error: "Account not found." };
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await db.update(clinicians).set({ passwordHash }).where(eq(clinicians.id, user.id));
  return {};
}
